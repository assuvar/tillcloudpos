import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ServiceModeModal from './components/ServiceModeModal';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';
import { FRONTEND_PERMISSIONS } from './permissions';

export default function POSEntryScreen() {
  const navigate = useNavigate();
  const { hasModuleAccess, hasPermission } = useAuth();
  const { openBills, activeBill, loadOpenBills, closeOrder, isLoading, error } = usePosCart();
  const [showNewBillModal, setShowNewBillModal] = useState(false);

  useEffect(() => {
    void loadOpenBills();
  }, []);

  // POS flow state fix: Automatically redirect to Order Entry if a bill is already active
  useEffect(() => {
    if (activeBill?.id) {
       navigate(`/pos/order-entry?billId=${activeBill.id}`);
    }
  }, [activeBill?.id, navigate]);

  const canAccessBilling = hasModuleAccess('BILLING');
  const canCreateBill = hasPermission(FRONTEND_PERMISSIONS.BILLING_CREATE);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(value);

  const getOrderTypeTag = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return { label: 'DINE IN', classes: 'bg-blue-600 text-white' };
      case 'DELIVERY':
        return { label: 'DELIVERY', classes: 'bg-green-100 text-green-600' };
      case 'PICKUP':
        return { label: 'PICKUP', classes: 'bg-purple-100 text-purple-600' };
      case 'IN_STORE':
        return { label: 'COUNTER', classes: 'bg-yellow-100 text-yellow-600' };
      default:
        return { label: type.replace('_', ' '), classes: 'bg-slate-100 text-slate-600' };
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'CREATED': return { label: 'CREATED', classes: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'IN_PROGRESS': return { label: 'IN PROGRESS', classes: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'BILLING': return { label: 'BILLING', classes: 'bg-sky-50 text-sky-600 border-sky-100' };
      case 'COMPLETED': return { label: 'PAID', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      default: return { label: status, classes: 'bg-slate-50 text-slate-400 border-slate-100' };
    }
  };

  return (
    <div className="h-full overflow-y-auto px-12 py-10 pb-16 custom-scrollbar bg-[#f8fafc]">
      {canAccessBilling ? (
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex items-center justify-between">
            <h1 className="text-[40px] font-black tracking-tight text-[#0c1424]">Open Bills</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => void loadOpenBills()}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setShowNewBillModal(true)}
                disabled={!canCreateBill}
                className="flex h-[60px] items-center gap-3 rounded-[20px] bg-[#0c1424] px-8 text-white shadow-xl shadow-black/10 transition-all hover:bg-black active:scale-95 disabled:opacity-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5dc7ec] text-[#0c1424]">
                  <Plus size={20} strokeWidth={3} />
                </div>
                <span className="text-lg font-[900] tracking-tight">New Bill</span>
              </button>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="mb-12 flex gap-4">
            <div className="flex min-w-[180px] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-[#0c1424]">
                <ShoppingBag size={22} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bills Today</div>
                <div className="text-2xl font-black text-[#0c1424]">
                  {openBills.filter(b => b.status !== 'CLOSED').length}
                </div>
              </div>
            </div>

            <div className="flex min-w-[200px] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-[#0c1424]">
                <Wallet size={22} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue Today</div>
                <div className="text-2xl font-black text-[#0c1424]">
                  {formatCurrency(openBills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0))}
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#0c1424]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-6 text-rose-700">
              {error}
            </div>
          ) : openBills.filter(b => b.status !== 'CLOSED').length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-white text-center text-slate-400">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-bold">No bills yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {openBills.filter(b => b.status !== 'CLOSED').map((bill) => {
                const typeTag = getOrderTypeTag(bill.orderType);
                const statusTag = getStatusDisplay(bill.status);

                const handleCloseOrder = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to close order #${bill.orderNumber}?`)) {
                    await closeOrder(bill.id);
                  }
                };

                return (
                  <div
                    key={bill.id}
                    onClick={() => navigate(`/pos/order-entry?billId=${bill.id}`)}
                    className="group flex flex-col rounded-[28px] border border-slate-100 bg-white p-7 text-left shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <span className="text-2xl font-black text-[#0c1424]">#{bill.orderNumber.toString().padStart(3, '0')}</span>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-[9px] font-black tracking-widest ${typeTag.classes}`}>
                          {typeTag.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest border ${statusTag.classes}`}>
                          {statusTag.label}
                        </span>
                      </div>
                    </div>

                    <div className="mb-8 flex-1">
                      <h4 className="text-xl font-black text-[#0c1424] leading-tight">
                        {bill.orderType === 'DINE_IN' && bill.table 
                          ? `Table ${bill.table.name} (${bill.table.floor})`
                          : bill.customerName || 'Walk-in Order'}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-slate-400">{bill.itemCount} items</p>
                    </div>

                    <div className="mb-6 space-y-1 border-t border-slate-50 pt-4">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Total</span>
                        <span className="text-[#0c1424]">{formatCurrency(bill.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                        <span>Paid</span>
                        <span>{formatCurrency(bill.paidAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-black text-rose-500 uppercase tracking-wider">
                        <span>Balance</span>
                        <span>{formatCurrency(bill.remainingAmount || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={handleCloseOrder}
                        className="flex-1 rounded-xl bg-slate-50 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        Close Order
                      </button>
                      <div className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        Details →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-amber-800 text-center">
          Billing module is disabled for your role.
        </div>
      )}

      {showNewBillModal && (
        <ServiceModeModal 
          onClose={() => {
            setShowNewBillModal(false);
          }} 
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
