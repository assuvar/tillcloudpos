import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  Bell,
  HelpCircle,
  LogOut,
  Users,
  Wifi,
} from 'lucide-react';
import CashPaymentModal from './components/CashPaymentModal';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';

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
  const { user, logout } = useAuth();
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
  const tableDetail = locationState.tableDetail || activeBill?.tableNumber || '5';

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
      navigate('/payment-success', {
        state: {
          bill: result.bill,
          payment: result.payment,
          customer,
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
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white px-8">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter text-[#0b1b3d]">TILLCLOUD</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="text-sm font-bold text-slate-400">Payment</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">
            Station 01 — Main Terminal
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c1424] text-white">
              <Users size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase leading-none text-slate-400">Cashier</span>
              <span className="text-sm font-black text-[#0c1424]">{user?.fullName || 'Cashier'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50">
              <Bell size={20} />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50">
              <HelpCircle size={20} />
            </button>
            <button onClick={() => void logout()} className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="custom-scrollbar flex-1 overflow-y-auto px-8 pb-24 pt-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
                  Dine In
                </span>
                <span className="text-sm font-bold text-slate-400">
                  Table {tableDetail || '5'}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[#0c1424]">
                Order #{activeBill?.orderNumber?.toString().padStart(3, '0') || '---'}
              </h1>
              <div className="mt-1 text-xs font-bold text-slate-400">
                {customer ? `${customer.name} • ${customer.phone}` : 'Cash payment settlement'}
              </div>
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
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.categoryName || 'ITEM'}</div>
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
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[32px] bg-[#0c1424] p-10 text-white shadow-2xl shadow-black/20">
                <div className="mb-4 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Cash Settlement</div>
                <div className="mb-8 text-center text-6xl font-black tracking-tight">{formatCurrency(totalDue)}</div>
                <button
                  onClick={() => setShowCashModal(true)}
                  disabled={billItems.length === 0}
                  className="rounded-xl border-2 border-[#5dc7ec]/30 px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#5dc7ec] transition-all hover:bg-[#5dc7ec]/10 disabled:opacity-40"
                >
                  {activeBill?.status === 'OPEN' ? 'Accept Cash (auto-send KOT)' : 'Accept Cash Payment'}
                </button>
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50">
                    <Wifi size={22} className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-[15px] font-black text-[#0c1424]">Contactless Ready</h4>
                    <p className="text-xs font-medium leading-relaxed text-slate-400">
                      This screen settles dine-in bills with cash. The bill must already be sent to kitchen before payment can complete.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-8">
          <button onClick={handleBack} className="flex h-14 items-center gap-3 rounded-2xl border-2 border-slate-100 px-8 text-[13px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50">
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={() => setShowCashModal(true)}
            disabled={billItems.length === 0}
            className="flex h-14 items-center gap-3 rounded-2xl bg-[#0c1424] px-8 text-[13px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/15 transition-all hover:bg-black disabled:opacity-40"
          >
            <Banknote size={18} />
            {isCompletingOrder ? 'Processing...' : 'Cash Payment'}
          </button>
        </div>
      </footer>

      {showCashModal ? (
        <CashPaymentModal
          amountDue={totalDue}
          onComplete={(cashTendered) => {
            void handlePaymentComplete(cashTendered);
          }}
          onCancel={() => setShowCashModal(false)}
        />
      ) : null}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
