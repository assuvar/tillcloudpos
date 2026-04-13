import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Banknote, 
  CreditCard, 
  Split,
  Wifi,
  ShoppingBag,
  LayoutGrid,
  UtensilsCrossed,
  HelpCircle,
  Users,
  Bell,
  LogOut
} from 'lucide-react';
import { BillItem, usePosCart } from './context/PosCartContext';
import CashPaymentModal from './components/CashPaymentModal';
import api from './services/api';

type CheckoutLocationState = {
  billItems?: BillItem[];
  billTotal?: number;
  orderId?: string;
  loyaltyDiscount?: number;
  loyaltyPointsUsed?: number;
  customer?: { name: string; id: string; phone: string; loyaltyPoints: number } | null;
  taxAmount?: number;
  totalDue?: number;
  orderType?: string;
  tableDetail?: string;
};

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { billItems: liveBillItems, billTotal: liveBillTotal, clearBill, sendToKitchen } = usePosCart();

  const locationState = (location.state || {}) as CheckoutLocationState;

  const billItems = locationState.billItems && locationState.billItems.length > 0 ? locationState.billItems : liveBillItems;
  const subtotal = locationState.billTotal ?? liveBillTotal;
  const loyaltyDiscount = locationState.loyaltyDiscount ?? 0;
  const customer = locationState.customer ?? null;
  const orderType = locationState.orderType || 'dining';
  const tableDetail = locationState.tableDetail || '5';

  const TAX_RATE = 0.08;
  const discountedSubtotal = subtotal - loyaltyDiscount;
  const taxAmount = locationState.taxAmount ?? (discountedSubtotal * TAX_RATE);
  const totalDue = locationState.totalDue ?? (discountedSubtotal + taxAmount);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'eftpos' | 'split'>('eftpos');
  const [showCashModal, setShowCashModal] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  // Category mapping for bill items
  const getCategoryLabel = (itemName: string): string => {
    if (itemName.toLowerCase().includes('salmon') || itemName.toLowerCase().includes('ribeye') || itemName.toLowerCase().includes('steak')) return 'MAINS';
    if (itemName.toLowerCase().includes('water') || itemName.toLowerCase().includes('juice') || itemName.toLowerCase().includes('coffee')) return 'DRINKS';
    if (itemName.toLowerCase().includes('arancini') || itemName.toLowerCase().includes('bruschetta') || itemName.toLowerCase().includes('calamari')) return 'STARTERS';
    if (itemName.toLowerCase().includes('cake') || itemName.toLowerCase().includes('dessert') || itemName.toLowerCase().includes('gelato')) return 'DESSERTS';
    return 'SIGNATURE';
  };

  const handleReadyForPayment = () => {
    if (selectedPaymentMethod === 'cash') {
      setShowCashModal(true);
    } else {
      // For EFTPOS, just show the cash modal as the final screen too (per design)
      setShowCashModal(true);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      setIsCompletingOrder(true);

      let orderId = locationState.orderId;
      if (!orderId) {
        const result = await sendToKitchen(billItems);
        if (!result.success || !result.orderId) {
          throw new Error(result.error || 'Failed to create order before payment');
        }
        orderId = result.orderId;
      }

      await api.post(`/orders/${orderId}/complete`, {
        paymentMethod: selectedPaymentMethod,
      });

      setShowCashModal(false);
      clearBill();
      navigate('/pos');
    } catch (err) {
      console.error('Payment completion failed:', err);
    } finally {
      setIsCompletingOrder(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter text-[#0b1b3d]">TILLCLOUD</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="text-sm font-bold text-slate-400">Order Entry</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500">
            Station 01 — Main Terminal
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-[#0c1424] text-white flex items-center justify-center">
                <Users size={18} />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Cashier</span>
                <span className="text-sm font-black text-[#0c1424]">Cashier #42</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
              <Bell size={20} />
            </button>
            <button className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
              <HelpCircle size={20} />
            </button>
            <button 
              onClick={() => navigate('/pos-login')}
              className="h-10 w-10 rounded-xl hover:bg-rose-50 flex items-center justify-center text-rose-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-24 pb-24 px-8 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest">
                  {orderType === 'dining' ? 'DINE IN' : orderType.toUpperCase().replace('-', ' ')}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  {orderType === 'dining' ? `Table ${tableDetail || '5'}` : tableDetail || 'Walk-in'}
                </span>
              </div>
              <h1 className="text-4xl font-black text-[#0c1424] tracking-tight">Order #042</h1>
              {customer && (
                <div className="text-xs font-bold text-slate-400 mt-1">{customer.name} • {customer.phone}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cashier</div>
              <div className="text-xl font-black text-[#0c1424]">Alex M.</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* Left: Bill Summary */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col">
              <h2 className="text-xl font-black text-[#0c1424] mb-8">Bill Summary</h2>

              <div className="flex-1 space-y-6 mb-10">
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-11 w-11 rounded-full bg-[#f0f9ff] border border-sky-100 flex items-center justify-center text-[15px] font-black text-[#0c1424]">
                        {item.quantity}
                      </div>
                      <div>
                        <div className="text-[15px] font-black text-[#0c1424]">{item.name}</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{getCategoryLabel(item.name)}</div>
                      </div>
                    </div>
                    <div className="text-[15px] font-black text-[#0c1424]">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-8 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-500 px-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-[#5dc7ec] px-1">
                    <span>Loyalty Discount</span>
                    <span>-{formatCurrency(loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold text-slate-500 px-1">
                  <span>GST (8%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Card */}
            <div className="flex flex-col gap-6">
              {/* Amount Due - Dark Card */}
              <div className="bg-[#0c1424] rounded-[32px] p-10 text-white flex flex-col items-center justify-center shadow-2xl shadow-black/20 min-h-[280px]">
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Amount Due</div>
                <div className="text-6xl font-black tracking-tight mb-8">{formatCurrency(totalDue)}</div>
                <button 
                  onClick={handleReadyForPayment}
                  className="px-10 py-3.5 rounded-xl border-2 border-[#5dc7ec]/30 text-[#5dc7ec] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#5dc7ec]/10 transition-all"
                >
                  Ready for Payment
                </button>
              </div>

              {/* Contactless Info Card */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Wifi size={22} className="text-slate-400" />
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-[#0c1424] mb-1">Contactless Enabled</h4>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">
                    Support for Apple Pay, Google Pay, and major chip cards via Tyro Terminal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Nav with Payment Methods */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30 shrink-0">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="h-20 flex items-center justify-between">
            {/* Left: Navigation + Payment Methods */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBack}
                className="h-14 px-8 rounded-2xl border-2 border-slate-100 flex items-center gap-3 font-black text-[13px] text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-[13px] uppercase tracking-widest transition-all ${
                  selectedPaymentMethod === 'cash'
                    ? 'bg-[#0c1424] text-white shadow-lg'
                    : 'bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Banknote size={18} />
                Cash
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('eftpos')}
                className={`h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-[13px] uppercase tracking-widest transition-all ${
                  selectedPaymentMethod === 'eftpos'
                    ? 'bg-[#0c1424] text-white shadow-lg'
                    : 'bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <CreditCard size={18} />
                EFTPOS
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('split')}
                className={`h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-[13px] uppercase tracking-widest transition-all ${
                  selectedPaymentMethod === 'split'
                    ? 'bg-[#0c1424] text-white shadow-lg'
                    : 'bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Split size={18} />
                Split Bill
              </button>
            </div>

            {/* Right: Bottom Nav */}
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <button onClick={() => navigate('/pos')} className="flex flex-col items-center gap-1">
                  <ShoppingBag size={18} className="text-[#5dc7ec]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#5dc7ec]">Orders</span>
                </button>
                <button className="flex flex-col items-center gap-1 opacity-30">
                  <LayoutGrid size={18} className="text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tables</span>
                </button>
                <button className="flex flex-col items-center gap-1 opacity-30">
                  <UtensilsCrossed size={18} className="text-slate-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Menu</span>
                </button>
              </nav>
              <button className="h-10 px-6 rounded-full bg-[#0c1424] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                Switch User
              </button>
              <HelpCircle size={18} className="text-slate-300" />
            </div>
          </div>
        </div>
      </footer>

      {/* Cash Payment Modal */}
      {showCashModal && (
        <CashPaymentModal
          amountDue={totalDue}
          onComplete={() => {
            if (!isCompletingOrder) {
              void handlePaymentComplete();
            }
          }}
          onCancel={() => setShowCashModal(false)}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}