import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
} from 'lucide-react';
import CashPaymentModal from './components/CashPaymentModal';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';
import PosLayout from './components/PosLayout';

type CheckoutLocationState = {
  billId?: string;
  billItems?: Array<{ id: string; name: string; price: number; quantity: number; lineTotal?: number; categoryName?: string }>;
  billTotal?: number;
  customer?: { name: string; id: string; phone: string; loyaltyPoints: number } | null;
  taxAmount?: number;
  totalDue?: number;
  orderType?: string;
  tableDetail?: string;
};

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { activeBill, loadBill, processCashPayment, clearBill } = usePosCart();

  const locationState = (location.state || {}) as CheckoutLocationState;
  const billId = searchParams.get('billId') || locationState.billId || activeBill?.id || '';
  const [showCashModal, setShowCashModal] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  useEffect(() => {
    if (billId && !activeBill) {
      void loadBill(billId);
    }
  }, [billId, activeBill?.id]);

  const billItems = useMemo(
    () => activeBill?.items || locationState.billItems || [],
    [activeBill?.items, locationState.billItems],
  );
  
  const subtotal = activeBill?.totalAmount ?? locationState.billTotal ?? 0;
  const taxAmount = locationState.taxAmount ?? 0;
  const totalDue = subtotal;
  const customer = locationState.customer ?? null;

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePaymentComplete = async (cashTendered: number) => {
    try {
      setIsCompletingOrder(true);
      const result = await processCashPayment(totalDue, cashTendered);

      if (!result.success || !result.bill) {
        throw new Error(result.error || 'Failed to complete payment');
      }

      clearBill();
      navigate('/receipt', {
        state: {
          bill: result.bill,
          payment: result.payment,
          customer,
          cashierName: user?.fullName || 'Cashier',
        },
        replace: true,
      });
    } catch (error) {
      console.error('Payment completion failed:', error);
    } finally {
      setIsCompletingOrder(false);
      setShowCashModal(false);
    }
  };

  return (
    <PosLayout>
      <main className="flex-1 overflow-y-auto px-8 pb-24 pt-2">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
                  {activeBill?.orderType?.replace(/_/g, ' ') || 'Order'}
                </span>
                {activeBill?.tableNumber && (
                   <span className="text-sm font-bold text-slate-400">
                     Table {activeBill.tableNumber}
                   </span>
                )}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[#0c1424]">
                Order #{activeBill?.orderNumber?.toString().padStart(3, '0') || '---'}
              </h1>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Status</div>
              <div className="text-lg font-black text-[#0c1424]">{activeBill?.status || 'OPEN'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
            <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="mb-8 text-xl font-black text-[#0c1424]">Bill Summary</h2>
              <div className="space-y-4">
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-100 bg-[#f0f9ff] text-[15px] font-black text-[#0c1424]">
                        {item.quantity}
                      </div>
                      <div>
                        <div className="text-[15px] font-black text-[#0c1424]">{item.name}</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 uppercase">{item.categoryName || 'ITEM'}</div>
                      </div>
                    </div>
                    <div className="text-[15px] font-black text-[#0c1424]">{formatCurrency(item.lineTotal ?? item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="rounded-3xl bg-[#f0f9ff] p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-sky-400">Total Due</div>
                  <div className="mt-1 text-4xl font-black tracking-tight text-[#0c1424]">{formatCurrency(totalDue)}</div>
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-6">
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[32px] bg-[#0c1424] p-10 text-white shadow-2xl shadow-black/20 text-center">
                <div className="mb-4 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Cash Settlement</div>
                <div className="mb-8 text-center text-6xl font-black tracking-tight">{formatCurrency(totalDue)}</div>
                <button
                  onClick={() => setShowCashModal(true)}
                  disabled={billItems.length === 0 || isCompletingOrder}
                  className="w-full rounded-xl border-2 border-[#5dc7ec]/30 px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#5dc7ec] transition-all hover:bg-[#5dc7ec]/10 disabled:opacity-40"
                >
                  {isCompletingOrder ? 'Proccessing...' : 'Accept Cash Payment'}
                </button>
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm group cursor-pointer hover:shadow-md transition-all" onClick={handleBack}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50">
                    <ArrowLeft size={22} className="text-slate-400 group-hover:text-[#0c1424] group-hover:-translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-[15px] font-black text-[#0c1424]">Need to change?</h4>
                    <p className="text-xs font-medium leading-relaxed text-slate-400">
                      You can go back to the order screen to add or remove items before final settlement.
                    </p>
                    <div className="mt-3 text-[11px] font-black underline uppercase tracking-widest text-[#0c1424]">Go Back to Order</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {showCashModal ? (
          <CashPaymentModal
            amountDue={totalDue}
            onComplete={(cashTendered) => {
              void handlePaymentComplete(cashTendered);
            }}
            onCancel={() => setShowCashModal(false)}
          />
        ) : null}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </PosLayout>
  );
}
