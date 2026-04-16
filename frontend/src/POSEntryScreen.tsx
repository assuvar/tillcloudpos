import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Plus,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react';
import NewBillModal from './components/NewBillModal';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';
import { FRONTEND_PERMISSIONS } from './permissions';

export default function POSEntryScreen() {
  const navigate = useNavigate();
  const { user, logout, hasModuleAccess, hasPermission } = useAuth();
  const { openBills, loadOpenBills, isLoading, error } = usePosCart();
  const [showNewBillModal, setShowNewBillModal] = useState(false);

  const canAccessBilling = hasModuleAccess('BILLING');
  const canCreateBill = hasPermission(FRONTEND_PERMISSIONS.BILLING_CREATE);
  const canAccessMenu = hasModuleAccess('MENU');

  useEffect(() => {
    void loadOpenBills();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white px-8">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter text-[#0b1b3d]">TILLCLOUD</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="text-sm font-bold text-slate-400">POS Home</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">
            Station 01 — Main Terminal
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c1424] text-white">
              <LayoutGrid size={18} />
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

      <main className="flex-1 overflow-y-auto p-12 pt-24">
        <div className="mx-auto max-w-[1400px]">
          {canAccessBilling ? (
            <>
              <div className="mb-12 flex items-center justify-between">
                <h1 className="text-5xl font-black tracking-tight text-[#0c1424]">Open Bills</h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void loadOpenBills()}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => setShowNewBillModal(true)}
                    disabled={!canCreateBill}
                    className="group flex h-16 items-center gap-4 rounded-2xl bg-[#0c1424] px-10 text-white shadow-2xl shadow-black/20 transition-all hover:bg-black active:scale-95 disabled:opacity-50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5dc7ec] text-[#0c1424] transition-transform group-hover:rotate-90">
                      <Plus size={18} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black uppercase tracking-wider">New Bill</span>
                  </button>
                </div>
              </div>

              <div className="mb-20 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c1424] text-[#5dc7ec]">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">Bills Today</div>
                    <div className="text-3xl font-black text-[#0c1424]">{openBills.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c1424] text-[#5dc7ec]">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">Live Open Bills</div>
                    <div className="text-3xl font-black text-[#0c1424]">{openBills.filter((bill) => bill.status !== 'PAID').length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c1424] text-[#5dc7ec]">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">KOT Sent</div>
                    <div className="text-3xl font-black text-[#0c1424]">{openBills.filter((bill) => bill.status === 'KOT_SENT').length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c1424] text-[#5dc7ec]">
                    <Clock3 size={24} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">Revenue Today</div>
                    <div className="text-3xl font-black text-[#0c1424]">
                      {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(
                        openBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-[#0c1424]" />
                  <p className="mt-4 text-sm font-bold text-slate-500">Loading live bills...</p>
                </div>
              ) : error ? (
                <div className="rounded-[32px] border border-rose-100 bg-rose-50 px-6 py-5 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : openBills.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                  <ShoppingBag size={52} className="mx-auto text-slate-300" />
                  <h3 className="mt-4 text-2xl font-black text-[#0c1424]">No open bills yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Create a dine-in bill to start the POS flow.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {openBills.map((bill) => {
                    const isKotSent = bill.status === 'KOT_SENT';
                    const timeLabel = bill.kotSentAt
                      ? `${Math.max(1, Math.round((Date.now() - new Date(bill.kotSentAt).getTime()) / 60000))} mins`
                      : 'Open';

                    return (
                      <button
                        key={bill.id}
                        onClick={() => {
                          if (isKotSent) {
                            navigate(`/checkout?billId=${bill.id}`);
                            return;
                          }

                          navigate(`/pos/order-entry?billId=${bill.id}`);
                        }}
                        className="rounded-[32px] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="mb-6 flex items-start justify-between">
                          <span className="text-2xl font-black text-[#0c1424]">#{bill.orderNumber.toString().padStart(3, '0')}</span>
                          <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${isKotSent ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                            {isKotSent ? 'KOT SENT' : 'OPEN'}
                          </span>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-xl font-black leading-tight text-[#0c1424]">{bill.tableNumber ? `Table ${bill.tableNumber}` : `Bill ${bill.orderNumber}`}</h4>
                          <p className="mt-1 text-sm font-medium text-slate-400">{bill.itemCount} items</p>
                        </div>

                        <div className="mb-4 flex items-end justify-between">
                          <div className="text-3xl font-black text-[#0c1424]">
                            {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(bill.totalAmount)}
                          </div>
                          <div className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                            <Clock3 size={12} />
                            {timeLabel}
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-wider ${isKotSent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {isKotSent ? <CheckCircle2 size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
                          {isKotSent ? 'Ready for payment' : 'Open order'}
                          <ArrowRight size={14} className="ml-auto" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] font-semibold text-amber-800">
              Billing module is disabled for your role.
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-30 flex h-20 items-center justify-between bg-[#0c1424] px-8 text-white">
        <nav className="flex h-full items-center gap-8">
          <button className="group relative flex flex-col items-center gap-1">
            <ShoppingBag size={20} className="text-[#5dc7ec]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5dc7ec]">Orders</span>
            <div className="absolute bottom-0 h-0.5 w-6 bg-[#5dc7ec]" />
          </button>
          <button className="flex flex-col items-center gap-1 opacity-40 transition-opacity hover:opacity-100">
            <LayoutGrid size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Tables</span>
          </button>
          {canAccessMenu ? (
            <button className="flex flex-col items-center gap-1 opacity-40 transition-opacity hover:opacity-100">
              <UtensilsCrossed size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
            </button>
          ) : null}
        </nav>

        <div className="flex h-full items-center gap-6">
          <button className="h-12 rounded-full border border-white/10 bg-white/5 px-8 text-xs font-black uppercase tracking-widest hover:bg-white/10">
            Switch User
          </button>
          <HelpCircle size={20} className="text-white/40" />
        </div>
      </footer>

      {showNewBillModal ? <NewBillModal onClose={() => setShowNewBillModal(false)} /> : null}
    </div>
  );
}
