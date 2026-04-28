import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import CustomerModal from './components/CustomerModal';
import LoyaltyModal from './components/LoyaltyModal';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';
import { FRONTEND_PERMISSIONS } from './permissions';
import api from './services/api';
import { ALLOWED_SERVICE_MODELS, type ServiceModel } from './serviceModels';

interface CustomerData {
  name: string;
  id: string;
  phone: string;
  loyaltyPoints: number;
}

type PosOrderType = ServiceModel;

const ORDER_TYPES: PosOrderType[] = ['DINE_IN', 'PICKUP', 'DELIVERY', 'IN_STORE'];

const getOrderTypeLabel = (value: PosOrderType) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

const isPosOrderType = (value: string): value is PosOrderType =>
  ALLOWED_SERVICE_MODELS.includes(value as PosOrderType);

export default function OrderEntryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const billId = searchParams.get('billId') || '';
  const orderTypeParam = searchParams.get('type') || '';
  const orderType: PosOrderType = ORDER_TYPES.includes(orderTypeParam as PosOrderType)
    ? (orderTypeParam as PosOrderType)
    : 'DINE_IN';
  const orderDetail = searchParams.get('detail') || '';
  const tableId = searchParams.get('tableId') || '';
  const tableNumberParam = searchParams.get('tableNumber') || '';

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const {
    categories,
    menuItems,
    billItems,
    billTotal,
    addItemToBill,
    removeItem,
    updateQuantity,
    sendToKitchen,
    isLoading,
    error,
    loadMenuItems,
    loadBill,
    activeBill,
    createBillSession,
    clearBill,
  } = usePosCart();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [enabledServiceModels, setEnabledServiceModels] = useState<PosOrderType[]>([
    ...ALLOWED_SERVICE_MODELS,
  ]);

  const canSendToKitchen = hasPermission(FRONTEND_PERMISSIONS.KITCHEN_SEND);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      return;
    }

    if (selectedCategoryId && !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id || '');
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    const loadRestaurantServiceModels = async () => {
      try {
        const response = await api.get('/restaurant');
        const models = Array.isArray(response.data?.serviceModels)
          ? response.data.serviceModels.filter(
              (value: string): value is PosOrderType => isPosOrderType(value),
            )
          : [];

        setEnabledServiceModels(models.length > 0 ? models : ['DINE_IN']);
      } catch {
        setEnabledServiceModels([...ALLOWED_SERVICE_MODELS]);
      }
    };

    void loadRestaurantServiceModels();
  }, []);

  const effectiveOrderType = enabledServiceModels.includes(orderType)
    ? orderType
    : enabledServiceModels[0] || 'DINE_IN';

  useEffect(() => {
    if (billId) {
      if (activeBill?.id !== billId) {
        void loadBill(billId);
      }
      return;
    }

    if (!activeBill && !isLoading && !isCreatingSession && (tableId || orderTypeParam)) {
      const startSession = async () => {
        setIsCreatingSession(true);
        try {
          await createBillSession(
            orderType, 
            tableId || null,
            orderDetail || tableNumberParam || null
          );
        } catch (err) {
          console.error("Failed to start session:", err);
        } finally {
          setIsCreatingSession(false);
        }
      };
      void startSession();
    }
  }, [billId, tableId, tableNumberParam, orderType, orderDetail, activeBill?.id, isLoading, isCreatingSession]);

  useEffect(() => {
    if (!activeBill && !isLoading && !billId && !tableId && !orderTypeParam && !isCreatingSession) {
      navigate('/pos');
    }
  }, [activeBill, isLoading, billId, tableId, orderTypeParam, isCreatingSession, navigate]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const visibleItems = useMemo(
    () => menuItems.filter((item) => !selectedCategoryId || item.categoryId === selectedCategoryId),
    [menuItems, selectedCategoryId],
  );

  const subtotal = billTotal;
  const discountedSubtotal = subtotal - loyaltyDiscount;
  const taxAmount = discountedSubtotal * 0.08;
  const totalDue = discountedSubtotal + taxAmount;

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3500);
  };

  const handleRetryLoad = async () => {
    await loadMenuItems();
  };

  const handleCustomerSelect = (c: CustomerData) => {
    setCustomer(c);
    setShowCustomerModal(false);

    if (c.loyaltyPoints > 0) {
      setShowLoyaltyModal(true);
    }
  };

  const handleApplyDiscount = (amount: number, pointsUsed: number) => {
    setLoyaltyDiscount(amount);
    setLoyaltyPointsUsed(pointsUsed);
    setShowLoyaltyModal(false);
  };

  const handleSkipLoyalty = () => {
    setLoyaltyDiscount(0);
    setLoyaltyPointsUsed(0);
    setShowLoyaltyModal(false);
  };

  const handleItemClick = async (item: any) => {
    if (!item.isActive || item.isOutOfStock || !activeBill) {
      return;
    }

    const added = await addItemToBill(item);
    if (!added) {
      showToast(error || 'Unable to add item to this bill');
      return;
    }

    showToast(`${item.name} added`);
  };

  const handleSendToKitchen = async (shouldNavigateToCheckout = true) => {
    if (billItems.length === 0 || isSendingToKitchen) {
      return;
    }

    try {
      setIsSendingToKitchen(true);
      const result = await sendToKitchen();
      if (result.success) {
        showToast('Order saved and sent to kitchen');
        if (shouldNavigateToCheckout) {
          navigate(`/checkout?billId=${result.billId || activeBill?.id || ''}`);
        } else {
          clearBill();
          navigate('/pos/tables');
        }
      } else {
        showToast(result.error || 'Failed to send to kitchen');
      }
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const handlePay = () => {
    navigate('/checkout', {
      state: {
        billId: activeBill?.id,
        billItems,
        billTotal: subtotal,
        loyaltyDiscount,
        loyaltyPointsUsed,
        customer,
        taxAmount,
        totalDue,
        orderType: effectiveOrderType,
        tableDetail: orderDetail,
      },
    });
  };

  const detailLabel = useMemo(() => {
    const type = activeBill?.orderType || effectiveOrderType;
    if (type === 'DINE_IN') return 'Table';
    if (type === 'PICKUP') return 'Pickup';
    if (type === 'DELIVERY') return 'Delivery';
    return 'Ref';
  }, [activeBill?.orderType, effectiveOrderType]);

  const detailValue = useMemo(() => {
    if (activeBill) {
      return activeBill.tableNumber || activeBill.pickupName || activeBill.deliveryName || '';
    }
    return orderDetail || tableNumberParam || '';
  }, [activeBill, orderDetail, tableNumberParam]);


  return (
    <div className="flex h-full flex-col">
      <main className="flex min-h-0 flex-1 gap-6 overflow-hidden pt-2">
        <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  clearBill();
                  navigate('/pos');
                }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100"
                title="Close Order"
              >
                <X size={24} />
              </button>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[#0c1424]">{selectedCategory?.name || 'Menu'}</h3>
                <p className="text-sm font-medium text-slate-400">{visibleItems.length} items available</p>
              </div>
            </div>
            {error ? (
              <button
                type="button"
                onClick={() => void handleRetryLoad()}
                className="rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600"
              >
                Retry load
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-[32px] border border-slate-100 bg-white">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-[#0c1424]" />
                <p className="mt-4 text-sm font-bold text-slate-500">Loading live menu data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 rounded-[32px] border border-rose-100 bg-rose-50 p-8">
              <div className="max-w-md">
                <div className="text-sm font-black uppercase tracking-widest text-rose-600">Menu unavailable</div>
                <p className="mt-3 text-sm text-rose-700">{error}</p>
                <button
                  type="button"
                  onClick={() => void handleRetryLoad()}
                  className="mt-6 rounded-2xl bg-[#0c1424] px-5 py-3 text-xs font-black uppercase tracking-widest text-white"
                >
                  Reload menu
                </button>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto pr-1 pb-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.length === 0 ? (
                <div className="col-span-full rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center">
                  <ShoppingBag size={48} className="mx-auto text-slate-300" />
                  <p className="mt-4 text-lg font-black text-[#0c1424]">No items available</p>
                  <p className="mt-2 text-sm text-slate-500">Add items in the Admin Dashboard and refresh to see them here.</p>
                </div>
              ) : (
                visibleItems.map((item) => {
                  const unavailable = !item.isActive || item.isOutOfStock;

                  return (
                    <button
                      key={item.id}
                      onClick={() => void handleItemClick(item)}
                      disabled={unavailable}
                      className={`group relative overflow-hidden rounded-[32px] border p-6 text-left transition-all ${unavailable ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60 grayscale' : 'border-slate-100 bg-white hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5'}`}
                    >
                      {item.image ? (
                        <div className="absolute inset-x-0 top-0 h-24">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-90" />
                        </div>
                      ) : null}

                      <div className={`z-10 flex h-48 flex-col justify-between ${item.image ? 'pt-12' : ''}`}>
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.categoryName}</span>
                          {!unavailable ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 opacity-0 transition-all group-hover:opacity-100">
                              <Plus size={16} />
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <h4 className="mb-1 text-lg font-black text-[#0c1424] leading-tight">{item.name}</h4>
                          <p className="line-clamp-2 text-xs font-bold text-slate-400">{item.description}</p>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                          <div className="text-xl font-black text-sky-600">{formatCurrency(item.price)}</div>
                          <div className="text-[10px] font-black uppercase text-slate-400">Live menu</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </section>

        <aside className="custom-scrollbar min-h-0 w-48 shrink-0 overflow-y-auto rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 px-1 text-lg font-black tracking-tight text-[#0c1424]">Categories</h3>
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-500">
              No items available.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`flex w-full flex-col items-center gap-1 rounded-2xl p-4 transition-all ${selectedCategoryId === category.id ? 'border border-sky-100 bg-[#f0f9ff] text-[#0c1424]' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <div className="text-center text-xs font-black uppercase tracking-widest leading-none">{category.name}</div>
                  <div className="text-[10px] font-bold text-[#5dc7ec]">{category.items.length} ITEMS</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <aside className="custom-scrollbar min-h-0 flex w-[450px] shrink-0 flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-50 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-black capitalize text-[#0c1424]">
                  {getOrderTypeLabel(effectiveOrderType)}
                  {detailValue ? ` • ${detailLabel} ${detailValue}` : ''}
                </h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Order #{activeBill?.orderNumber?.toString().padStart(3, '0') || '---'}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="text-xs font-bold text-slate-400">{customer?.name || user?.fullName || 'Cashier'}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${activeBill?.status === 'KOT_SENT' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-500'}`}>
                <CheckCircle2 size={12} strokeWidth={3} />
                {activeBill?.status === 'KOT_SENT' ? 'KOT Sent' : 'Draft'}
              </div>
            </div>

            {customer ? (
              <div className="flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0c1424] font-black text-white text-sm">
                  {customer.name.split(' ').map((value) => value[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-[#0c1424]">{customer.name}</div>
                  <div className="text-xs font-bold text-slate-400">{customer.phone}</div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCustomerModal(true)} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0c1424] font-black text-white text-xs uppercase tracking-widest shadow-xl shadow-black/15 transition-all active:scale-95 hover:bg-black">
                <Plus size={18} />
                Add Customer
              </button>
            )}
          </div>

          <div className="custom-scrollbar flex-1 min-h-0 space-y-4 overflow-y-auto p-6">
            {billItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-20">
                <ShoppingBag size={42} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0c1424]">Bag is Empty</p>
              </div>
            ) : (
              <>
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-transparent px-2 py-1.5 transition-colors hover:border-slate-100 hover:bg-slate-50/60">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-[#0c1424]">{item.quantity} × {item.name}</span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-400">{item.categoryName}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-black text-[#0c1424] transition-colors duration-200">{formatCurrency(item.lineTotal)}</div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => void updateQuantity(item.id, 'decrease')}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-black text-slate-600 shadow-sm transition-all duration-150 active:scale-95 hover:bg-slate-50"
                          aria-label={`Decrease ${item.name}`}
                        >
                          –
                        </button>
                        <button
                          onClick={() => void updateQuantity(item.id, 'increase')}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-[#0c1424] text-base font-black text-white shadow-sm transition-all duration-150 active:scale-95 hover:bg-black"
                          aria-label={`Increase ${item.name}`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => void removeItem(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-500 shadow-sm transition-all duration-150 active:scale-95 hover:bg-rose-50"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {loyaltyDiscount > 0 ? (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-50 bg-[#f0fdf4] px-5 py-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="text-sm font-black uppercase tracking-wider">Loyalty Reward (10%)</span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">-{formatCurrency(loyaltyDiscount)}</span>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-6">
            <div className="mb-10 space-y-4">
              <div className="flex items-center justify-between px-1 text-sm font-bold text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {loyaltyDiscount > 0 ? (
                <div className="flex items-center justify-between px-1 text-sm font-bold text-emerald-500">
                  <span>Loyalty Discount</span>
                  <span>-{formatCurrency(loyaltyDiscount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between px-1 text-sm font-bold text-slate-500">
                <span>Tax (8%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="mt-4 flex items-end justify-between px-1">
                <div>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-400">Total Due</span>
                  <span className="text-4xl font-[950] tracking-tight text-[#0c1424]">{formatCurrency(totalDue)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button className="flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[#dcf0ff] px-3 font-black text-[11px] uppercase tracking-widest text-blue-700 transition-all active:scale-95 hover:bg-blue-200">
                <Send size={18} />
                Split Bill
              </button>
              <button onClick={handlePay} className="flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[#0c1424] px-3 font-black text-[11px] uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all active:scale-95 hover:bg-black disabled:opacity-40" disabled={billItems.length === 0}>
                <CreditCard size={18} />
                Pay
              </button>
            </div>

            <button
              onClick={() => void handleSendToKitchen(true)}
              disabled={billItems.length === 0 || isSendingToKitchen || !canSendToKitchen}
              className="mt-3 flex h-12 w-full items-center justify-center gap-3 rounded-[22px] bg-[#4adeff] px-3 font-black text-[11px] uppercase tracking-widest text-[#0c1424] shadow-xl shadow-sky-400/20 transition-all active:scale-95 hover:brightness-95 disabled:opacity-40"
            >
              {isSendingToKitchen ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={3} />}
              Save & Checkout
            </button>

            <button
              onClick={() => void handleSendToKitchen(false)}
              disabled={billItems.length === 0 || isSendingToKitchen || !canSendToKitchen}
              className="mt-3 flex h-12 w-full items-center justify-center gap-3 rounded-[22px] border-2 border-slate-100 bg-white px-3 font-black text-[11px] uppercase tracking-widest text-[#0c1424] transition-all active:scale-95 hover:bg-slate-50 disabled:opacity-40"
            >
              {isSendingToKitchen ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} strokeWidth={3} />}
              Save & Return to Tables
            </button>
          </div>
        </aside>
      </main>

      {toastMessage ? (
        <div className="fixed left-1/2 top-28 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/5 bg-[#0c1424] px-6 py-4 text-white shadow-2xl shadow-black/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
          </div>
          <span className="whitespace-nowrap text-sm font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-white/40 transition-colors hover:text-white">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showCustomerModal ? (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onSelect={handleCustomerSelect}
        />
      ) : null}

      {showLoyaltyModal && customer ? (
        <LoyaltyModal
          customer={customer}
          onApplyDiscount={handleApplyDiscount}
          onSkip={handleSkipLoyalty}
          onClose={() => setShowLoyaltyModal(false)}
        />
      ) : null}
    </div>
  );
}
