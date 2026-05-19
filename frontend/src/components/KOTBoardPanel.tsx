import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  ChefHat,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatDuration } from "../utils/dateUtils";

export const KOTBoardPanel: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadKOTOrders = async () => {
    try {
      const res = await api.get("/kitchen/orders");
      const payload = Array.isArray(res.data) ? res.data : [];
      // Filter out completed/bumped ones so we only show pending kitchen items
      const pending = payload.filter(
        (o: any) => o.status !== "COMPLETED" && o.status !== "BUMPED"
      );
      setOrders(pending);
    } catch (err) {
      console.error("Failed to load KOT items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadKOTOrders();
    // Refresh automatically every 7 seconds
    const interval = setInterval(() => {
      void loadKOTOrders();
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const getTimerMinutes = (sentAt: string) => {
    const elapsedMs = Date.now() - new Date(sentAt).getTime();
    if (elapsedMs < 60000) return "Just now";
    return `${formatDuration(elapsedMs, 'ms')} ago`;
  };

  const getKOTTimerColor = (sentAt: string) => {
    const elapsedMs = Date.now() - new Date(sentAt).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins >= 10) {
      return "bg-rose-50 border border-rose-200 text-rose-600 font-extrabold animate-pulse px-2 py-0.5 rounded-lg";
    } else if (elapsedMins >= 5) {
      return "bg-amber-50 border border-amber-200 text-amber-600 font-extrabold px-2 py-0.5 rounded-lg";
    }
    return "bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-lg";
  };

  // Filters and queries
  const filteredOrders = orders.filter((o) => {
    // Filter status tab
    if (activeFilter === "PENDING" && o.status !== "SENT") return false;
    if (activeFilter === "PREPARING" && o.status !== "PREPARING") return false;
    if (activeFilter === "READY" && o.status !== "READY") return false;

    // Filter search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const orderNumStr = String(o.orderNumber || "");
    const kotNumStr = String(o.kotNumber || "");
    const tableNum = (o.tableNumber || "").toLowerCase();

    return (
      orderNumStr.includes(query) ||
      kotNumStr.includes(query) ||
      tableNum.includes(query)
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 p-6 select-none animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-[1000] text-[#0c1424] tracking-tight flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-slate-800" />
            Kitchen Order Tickets (KOT)
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Real-time dispatcher queue to start preparation and bump items directly from POS</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadKOTOrders}
            className="flex h-10 w-10 items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 shadow-sm hover:shadow"
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
          
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Order#, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0c1424] transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-2xl self-start mb-6">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeFilter === "ALL"
              ? "bg-[#0c1424] text-white shadow"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          All Active ({orders.length})
        </button>
        <button
          onClick={() => setActiveFilter("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeFilter === "PENDING"
              ? "bg-[#0c1424] text-white shadow"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Queue
        </button>
        <button
          onClick={() => setActiveFilter("PREPARING")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeFilter === "PREPARING"
              ? "bg-[#0c1424] text-white shadow"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Preparing
        </button>
        <button
          onClick={() => setActiveFilter("READY")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeFilter === "READY"
              ? "bg-[#0c1424] text-white shadow"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Ready
        </button>
      </div>

      {/* Main Grid content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0c1424]"></div>
            <span className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Syncing queue board...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white border border-dashed border-slate-200 rounded-3xl p-12">
            <ChefHat className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Kitchen queues are complete</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">New kitchen orders will show up here instantly when sent to KOT</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredOrders.map((kot) => {
              const status = kot.status;

              return (
                <div
                  key={kot.id}
                  className={`flex flex-col bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
                    status === "READY"
                      ? "border-emerald-200 bg-emerald-50/10"
                      : status === "PREPARING"
                        ? "border-amber-200 bg-amber-50/10"
                        : "border-slate-100"
                  }`}
                >
                  {/* Top Ref metadata */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <div className="text-base font-black text-[#0c1424]">
                        KOT #{kot.kotNumber}
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block mt-0.5">
                        Order #{kot.orderNumber}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[11px] ${getKOTTimerColor(kot.sentAt)}`}>
                      <Clock size={12} />
                      {getTimerMinutes(kot.sentAt)}
                    </span>
                  </div>

                  {/* KOT items details list */}
                  <div className="flex-1 space-y-2.5 mb-4 max-h-48 overflow-y-auto pr-1">
                    {kot.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-xs text-slate-800">
                        <span className="font-extrabold">
                          {item.name || item.itemName} <span className="text-slate-400 ml-1">x{item.quantity}</span>
                        </span>
                        {item.notes && (
                          <span className="text-[10px] text-amber-600 bg-amber-50/50 border border-amber-100/50 px-1.5 py-0.5 rounded-md italic max-w-[100px] truncate">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Read-Only Status Indicators */}
                  <div className="border-t border-slate-100 pt-3">
                    {status === "READY" ? (
                      <span className="text-emerald-600 bg-emerald-50/80 border border-emerald-100 px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider block text-center w-full animate-pulse">
                        ✨ Ready to Serve!
                      </span>
                    ) : (
                      <span className="text-amber-600 bg-amber-50/80 border border-amber-100 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider block text-center w-full">
                        🍳 Cooking in Kitchen...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
