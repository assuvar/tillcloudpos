import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, Table2 } from 'lucide-react';
import api from './services/api';
import { useAuth } from './context/AuthContext';
import { FRONTEND_PERMISSIONS } from './permissions';

interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
  categoryName: string;
}

interface KitchenOrder {
  id: string;
  billId: string;
  kotNumber: number;
  orderType: string;
  tableNumber: string | null;
  orderNumber: number;
  sentAt: string;
  status: string;
  items: KitchenOrderItem[];
}

export default function KitchenDisplay() {
  const { user, logout, hasPermission } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canViewKitchen = hasPermission(FRONTEND_PERMISSIONS.KITCHEN_VIEW);

  const loadOrders = async () => {
    try {
      setError(null);
      const response = await api.get('/kitchen/orders', {
        params: { t: Date.now() },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || 'Failed to load kitchen orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    const intervalId = window.setInterval(() => {
      void loadOrders();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!canViewKitchen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] px-4 text-white">
        <div className="max-w-lg rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
          <div className="text-lg font-black">Kitchen access is disabled for this role.</div>
          <p className="mt-2 text-sm text-rose-100/80">Enable kitchen:view in role permissions to use the kitchen display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Kitchen Display</h1>
            <p className="mt-1 text-slate-300">Terminal: {user?.fullName || 'Kitchen'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadOrders()}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-700 px-5 text-sm font-bold hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => {
                void logout();
              }}
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-bold hover:bg-slate-800"
            >
              Unpair
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">Loading kitchen orders...</div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-300">
            No active kitchen orders.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-xl shadow-black/20">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#5dc7ec]">KOT #{order.kotNumber}</div>
                    <div className="mt-1 text-2xl font-black">Order #{String(order.orderNumber).padStart(3, '0')}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Read only
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3 text-sm text-slate-300">
                  <Table2 size={16} />
                  <span>
                    {order.orderType === 'DINE_IN'
                      ? `Table ${order.tableNumber || '—'}`
                      : order.orderType.replace('_', ' ')}
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
                  <Clock3 size={14} />
                  <span>{new Date(order.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-white">{item.quantity}x {item.name}</div>
                        <div className="text-xs text-slate-400">{item.categoryName}</div>
                      </div>
                      <div className="text-right text-sm font-black text-[#5dc7ec]">${item.lineTotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-emerald-300">
                  <CheckCircle2 size={14} strokeWidth={3} />
                  {order.status}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
