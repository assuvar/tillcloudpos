import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Table2, ChefHat, Play, Check, Printer } from "lucide-react";
import api from "./services/api";
import { useAuth } from "./context/AuthContext";
import { FRONTEND_PERMISSIONS } from "./permissions";
import UnifiedLayout from "./components/UnifiedLayout";
import PrintPreviewModal from "./components/PrintPreviewModal";

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
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewKot, setPreviewKot] = useState<any | null>(null);

  const canViewKitchen = hasPermission(FRONTEND_PERMISSIONS.KITCHEN_VIEW);

  const [kotSettings, setKotSettings] = useState<any>(null);

  const loadData = async () => {
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        api.get("/kitchen/orders", { params: { t: Date.now() } }),
        api.get("/settings/kot").catch(() => null) // Failsafe
      ]);
      
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      if (settingsRes && settingsRes.data) {
        setKotSettings(settingsRes.data);
      }
    } catch (loadError: any) {
      setError(
        loadError?.response?.data?.message || "Failed to load kitchen data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingId(orderId);
      await api.post(`/kitchen/orders/${orderId}/status`, { status });
      await loadData();
    } catch (err: any) {
      console.error("Failed to update status", err);
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData();
    }, 10000); // 10 seconds polling

    return () => window.clearInterval(intervalId);
  }, []);

  if (!canViewKitchen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#141414] px-4 text-white rounded-[40px]">
        <div className="max-w-lg rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
          <div className="text-lg font-black">
            Kitchen access is disabled for this role.
          </div>
          <p className="mt-2 text-sm text-rose-100/80">
            Enable kitchen:view in role permissions to use the kitchen display.
          </p>
        </div>
      </div>
    );
  }

  // Grouping orders by type
  const orderGroups = {
    "DINE_IN": orders.filter(o => o.orderType === "DINE_IN"),
    "PICKUP": orders.filter(o => o.orderType === "PICKUP"),
    "DELIVERY": orders.filter(o => o.orderType === "DELIVERY"),
    "IN_STORE": orders.filter(o => o.orderType === "IN_STORE"),
  };

  const getTimer = (sentAt: string) => {
    const start = new Date(sentAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => void loadData(), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <UnifiedLayout currentView="kitchen">
      <div className="min-h-[80vh] bg-[#0c0c0c] p-5 text-white sm:p-8 rounded-[40px] shadow-2xl">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <ChefHat size={24} />
                 </div>
                 <h1 className="text-3xl font-[1000] tracking-tighter">
                   Kitchen Dashboard
                 </h1>
              </div>
              <p className="mt-2 text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] ml-1">
                Real-time Order Processing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void loadData()}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                {isLoading ? "Syncing..." : "Sync Orders"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100 mb-8">
              {error}
            </div>
          ) : null}

          {orders.length === 0 && !isLoading ? (
            <div className="rounded-[40px] border border-white/5 bg-white/[0.02] p-20 text-center flex flex-col items-center gap-6">
               <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-slate-700">
                  <ChefHat size={40} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-300">All caught up!</h3>
                  <p className="text-slate-500 text-sm font-medium">No active kitchen orders at the moment.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-12">
               {Object.entries(orderGroups).map(([type, groupOrders]) => groupOrders.length > 0 && (
                 <section key={type} className="space-y-6">
                    <div className="flex items-center gap-4">
                       <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500">{type.replace("_", " ")}</h2>
                       <div className="h-px flex-1 bg-white/5"></div>
                       <span className="text-[10px] font-black text-[#5dc7ec] bg-[#5dc7ec]/10 px-2 py-0.5 rounded-md">{groupOrders.length}</span>
                    </div>
                    
                    {kotSettings?.mode === 'PRINT' ? (
                      <div className="bg-white/[0.03] rounded-3xl border border-white/10 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              <th className="p-6 font-bold">KOT #</th>
                              <th className="p-6 font-bold">Order #</th>
                              <th className="p-6 font-bold">Type</th>
                              <th className="p-6 font-bold">Status</th>
                              <th className="p-6 font-bold">Timer</th>
                              <th className="p-6 text-right font-bold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupOrders.map(order => (
                              <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                <td className="p-6 font-black text-[#5dc7ec]">#{order.kotNumber}</td>
                                <td className="p-6 font-bold text-slate-300">#{String(order.orderNumber).padStart(3, '0')}</td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <Table2 size={14} />
                                    {order.orderType === "DINE_IN" ? `Table ${order.tableNumber || "—"}` : "Self Service"}
                                  </div>
                                </td>
                                <td className="p-6">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400' :
                                    order.status === 'PREPARING' ? 'bg-orange-500/10 text-orange-400' :
                                    'bg-white/5 text-slate-400'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                    <Clock3 size={14} /> {getTimer(order.sentAt)}
                                  </div>
                                </td>
                                <td className="p-6 text-right">
                                  <button
                                    onClick={() => setPreviewKot({
                                      kotNumber: order.kotNumber,
                                      orderNumber: order.orderNumber,
                                      tableNumber: order.tableNumber,
                                      orderType: order.orderType,
                                      customerName: "-",
                                      createdAt: order.sentAt,
                                      items: order.items
                                    })}
                                    className="h-10 px-4 rounded-xl bg-[#0c1424] border border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                                  >
                                    View Slip
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {groupOrders.map((order) => (
                          <article
                            key={order.id}
                            className={`rounded-[32px] border transition-all duration-300 flex flex-col overflow-hidden ${
                              order.status === 'READY' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 
                              order.status === 'PREPARING' ? 'border-orange-500/30 bg-orange-500/[0.02]' : 
                              'border-white/10 bg-white/[0.03]'
                            }`}
                          >
                            <div className="p-6 pb-4">
                              <div className="mb-4 flex items-start justify-between">
                                <div>
                                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                                    order.status === 'READY' ? 'text-emerald-400' : 
                                    order.status === 'PREPARING' ? 'text-orange-400' : 
                                    'text-[#5dc7ec]'
                                  }`}>
                                    KOT #{order.kotNumber}
                                  </div>
                                  <div className="text-2xl font-[1000] tracking-tighter">
                                    #{String(order.orderNumber).padStart(3, "0")}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-black text-slate-300">
                                    <Clock3 size={12} className={order.status === 'SENT' ? 'text-rose-500 animate-pulse' : 'text-slate-500'} />
                                    <span>{getTimer(order.sentAt)}</span>
                                  </div>
                                  {(kotSettings?.mode === 'BOTH' || kotSettings?.mode === 'PRINT') && (
                                    <button 
                                      onClick={() => setPreviewKot({
                                        kotNumber: order.kotNumber,
                                        orderNumber: order.orderNumber,
                                        tableNumber: order.tableNumber,
                                        orderType: order.orderType,
                                        customerName: "-",
                                        createdAt: order.sentAt,
                                        items: order.items
                                      })}
                                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white hover:text-black transition-colors" title="Print Slip"
                                    >
                                      <Printer size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="mb-6 flex items-center gap-3 text-sm font-bold text-slate-400">
                                <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
                                   <Table2 size={16} />
                                </div>
                                <span>
                                  {order.orderType === "DINE_IN"
                                    ? `Table ${order.tableNumber || "—"}`
                                    : "Self Service"}
                                </span>
                              </div>

                              <div className="space-y-4 pt-4 border-t border-white/5">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-4">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-[11px] font-black">
                                      {item.quantity}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-[14px] font-bold text-slate-200">
                                        {item.name}
                                      </div>
                                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">
                                        {item.categoryName}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-auto p-4 flex gap-2">
                              {order.status === 'SENT' && (
                                <button
                                  onClick={() => updateStatus(order.id, 'PREPARING')}
                                  disabled={updatingId === order.id}
                                  className="flex-1 h-12 rounded-2xl bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                                >
                                  <Play size={14} fill="currentColor" /> Accept
                                </button>
                              )}
                              {order.status === 'PREPARING' && (
                                <button
                                  onClick={() => updateStatus(order.id, 'READY')}
                                  disabled={updatingId === order.id}
                                  className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                                >
                                  <Check size={16} strokeWidth={3} /> Mark Ready
                                </button>
                              )}
                              {order.status === 'READY' && (
                                <button
                                  onClick={() => updateStatus(order.id, 'COMPLETED')}
                                  disabled={updatingId === order.id}
                                  className="flex-1 h-12 rounded-2xl bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                                >
                                  <CheckCircle2 size={16} /> Complete
                                </button>
                              )}
                              {(order.status === 'COMPLETED' || order.status === 'BUMPED') && (
                                <div className="flex-1 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  Processed
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                 </section>
               ))}
            </div>
          )}
        </div>
      </div>
      
      {previewKot && (
        <PrintPreviewModal 
          kotSettings={kotSettings} 
          kot={previewKot} 
          onClose={() => setPreviewKot(null)} 
        />
      )}
    </UnifiedLayout>
  );
}
