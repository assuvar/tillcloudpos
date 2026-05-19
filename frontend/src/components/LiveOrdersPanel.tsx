import React, { useState, useEffect } from "react";
import { usePosCart } from "../context/PosCartContext";
import {
  Clock as ClockIcon,
  User as UserIcon,
  Phone,
  MapPin,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Search,
  ClipboardList,
  ChefHat,
} from "lucide-react";
import { KOTBoardPanel } from "./KOTBoardPanel";
import { useNavigate } from "react-router-dom";
import { formatDuration } from "../utils/dateUtils";

// Hook to trigger safe force re-render on interval so that live elapsed timers increment
function useTicker(intervalMs = 15000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}

export const LiveOrdersPanel: React.FC<{ initialSubTab?: "bills" | "kot" }> = ({ initialSubTab = "bills" }) => {
  const { openBills, loadOpenBills, loadBill, setActiveSubView, restaurant } = usePosCart();
  useTicker(10000); // Live tick every 10 seconds to keep waiting timers 100% active
  const navigate = useNavigate();

  const [currentSubTab, setCurrentSubTab] = useState<"bills" | "kot">(initialSubTab);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    void loadOpenBills();

    const interval = setInterval(() => {
      void loadOpenBills();
    }, 5000); // 5s interval for live, real-time sync of active dishes & totals

    return () => clearInterval(interval);
  }, []);

  // Helper to determine elapsed time and corresponding threshold color
  const getTimerStats = (orderType: string, createdAtStr: string) => {
    const createdTime = new Date(createdAtStr).getTime();
    const elapsedMs = Date.now() - createdTime;
    const elapsedMins = Math.floor(elapsedMs / 60000);

    let textClass = "text-emerald-600";
    let bgClass = "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30";
    let pulseClass = "";
    let label = "Normal";

    if (orderType === "DINE_IN") {
      if (elapsedMins >= 30) {
        textClass = "text-rose-600 dark:text-rose-400";
        bgClass = "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30";
        pulseClass = "animate-pulse";
        label = "Critical (30m+)";
      } else if (elapsedMins >= 15) {
        textClass = "text-amber-600 dark:text-amber-400";
        bgClass = "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30";
        label = "Delayed (15m+)";
      } else {
        label = "Fresh";
      }
    } else if (orderType === "IN_STORE") {
      if (elapsedMins >= 20) {
        textClass = "text-rose-600 dark:text-rose-400";
        bgClass = "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30";
        pulseClass = "animate-pulse";
        label = "Critical (20m+)";
      } else if (elapsedMins >= 10) {
        textClass = "text-amber-600 dark:text-amber-400";
        bgClass = "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30";
        label = "Delayed (10m+)";
      } else {
        label = "Fresh";
      }
    } else if (orderType === "DELIVERY") {
      if (elapsedMins >= 45) {
        textClass = "text-rose-600 dark:text-rose-400";
        bgClass = "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30";
        pulseClass = "animate-pulse";
        label = "Critical (45m+)";
      } else if (elapsedMins >= 20) {
        textClass = "text-amber-600 dark:text-amber-400";
        bgClass = "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30";
        label = "Delayed (20m+)";
      } else {
        label = "Fresh";
      }
    } else {
      // PICKUP
      if (elapsedMins >= 30) {
        textClass = "text-rose-600 dark:text-rose-400";
        bgClass = "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30";
        pulseClass = "animate-pulse";
        label = "Critical (30m+)";
      } else if (elapsedMins >= 15) {
        textClass = "text-amber-600 dark:text-amber-400";
        bgClass = "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30";
        label = "Delayed (15m+)";
      } else {
        label = "Fresh";
      }
    }

    return {
      elapsedMins,
      textClass,
      bgClass,
      pulseClass,
      label,
    };
  };

  // Helper to format elapsed time text nicely
  const formatElapsed = (mins: number) => {
    if (mins < 1) return "Just now";
    return `${formatDuration(mins, 'mins')} ago`;
  };

  // Filter service models that are enabled on this restaurant profile
  const enabledModels = restaurant?.serviceModels || ["DINE_IN", "IN_STORE", "DELIVERY", "PICKUP"];

  const liveBills = openBills.filter((bill) => {
    if (
      bill.status === "COMPLETED" ||
      bill.status === "CLOSED" ||
      bill.status === "PAID" ||
      bill.status === "CANCELLED" ||
      bill.status === "VOIDED"
    ) {
      return false;
    }
    return true;
  });

  // Filter bills by search and tab
  const filteredBills = liveBills.filter((bill) => {

    const isMatchingTab =
      activeTab === "ALL" || bill.orderType === activeTab;

    if (!isMatchingTab) return false;

    if (searchQuery.trim() === "") return true;

    const query = searchQuery.toLowerCase();
    const orderNumStr = String(bill.orderNumber);
    const custName = (bill.customerName || "").toLowerCase();
    const custPhone = (bill.customerPhone || "").toLowerCase();
    const tableNum = (bill.tableNumber || "").toLowerCase();

    return (
      orderNumStr.includes(query) ||
      custName.includes(query) ||
      custPhone.includes(query) ||
      tableNum.includes(query)
    );
  });

  const handleResumeOrder = async (billId: string) => {
    try {
      await loadBill(billId);
      setActiveSubView("menu");
    } catch (err) {
      console.error("Failed to resume order:", err);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 p-6 select-none animate-fadeIn">
      {/* Toast Notif */}


      {/* Sub-navigation Tabs: Live Bills | Live KOT */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setCurrentSubTab("bills")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 px-1 ${
            currentSubTab === "bills"
              ? "border-[#0c1424] text-[#0c1424]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <ClipboardList size={14} />
          Live Bills
        </button>
        <button
          onClick={() => setCurrentSubTab("kot")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 px-1 ${
            currentSubTab === "kot"
              ? "border-[#0c1424] text-[#0c1424]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <ChefHat size={14} />
          Live KOT
        </button>
      </div>

      {currentSubTab === "kot" ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <KOTBoardPanel />
        </div>
      ) : (
        <>
          {/* Panel Header & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-[1000] text-[#0c1424] tracking-tight">Active Live Workspace</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Real-time status bumping, queue elapsed timers, and active bills</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search Order#, Name, Phone, Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0c1424] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tabs list matching only active settings */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-200/50 p-1 rounded-2xl self-start mb-6">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "ALL"
              ? "bg-[#0c1424] text-white shadow"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          All Orders ({liveBills.length})
        </button>

        {enabledModels.includes("DINE_IN") && (
          <button
            onClick={() => setActiveTab("DINE_IN")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "DINE_IN"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            Dine-In
          </button>
        )}

        {enabledModels.includes("IN_STORE") && (
          <button
            onClick={() => setActiveTab("IN_STORE")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "IN_STORE"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            In-Store
          </button>
        )}

        {enabledModels.includes("DELIVERY") && (
          <button
            onClick={() => setActiveTab("DELIVERY")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "DELIVERY"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            Delivery
          </button>
        )}

        {enabledModels.includes("PICKUP") && (
          <button
            onClick={() => setActiveTab("PICKUP")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "PICKUP"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            Pickup
          </button>
        )}
      </div>

      {/* Grid of live cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white border border-dashed border-slate-200 rounded-3xl p-12">
            <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1 mb-4 animate-bounce" />
            <h3 className="text-sm font-bold text-slate-700">No active live orders found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Either select another filter tab, search query, or create a brand new POS checkout order</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBills.map((bill) => {
              const timer = getTimerStats(bill.orderType, bill.createdAt);

              return (
                <div
                  key={bill.id}
                  className={`flex flex-col bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${timer.bgClass} ${timer.pulseClass}`}
                >
                  {/* Top order metadata */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        Order #{bill.orderNumber}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-900/40 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/50 mt-1">
                        {bill.orderType === "DINE_IN" && <UtensilsCrossed size={11} className="text-amber-500" />}
                        {bill.orderType === "IN_STORE" && <ShoppingBag size={11} className="text-emerald-500" />}
                        {bill.orderType === "DELIVERY" && <Truck size={11} className="text-sky-500" />}
                        {bill.orderType === "PICKUP" && <ShoppingBag size={11} className="text-indigo-500" />}
                        {bill.orderType.replace("_", " ")}
                      </span>
                    </div>

                    {/* Wait indicator badge */}
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-[900] ${timer.textClass}`}>
                        <ClockIcon size={12} />
                        {formatElapsed(timer.elapsedMins)}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {timer.label}
                      </span>
                    </div>
                  </div>

                  {/* Customer details info */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 flex-1 mb-4">
                    {/* Dine-In specific details */}
                    {bill.orderType === "DINE_IN" && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <UtensilsCrossed size={14} className="text-slate-400" />
                        <span>Table: {bill.tableNumber || "Unassigned"}</span>
                      </div>
                    )}

                    {/* Standard contact details */}
                    {(bill.customerName || bill.pickupName || bill.deliveryName) && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <UserIcon size={14} className="text-slate-400" />
                        <span className="truncate">
                          {bill.customerName || bill.pickupName || bill.deliveryName}
                        </span>
                      </div>
                    )}

                    {(bill.customerPhone || bill.pickupPhone || bill.deliveryPhone) && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Phone size={14} className="text-slate-400" />
                        <span>{bill.customerPhone || bill.pickupPhone || bill.deliveryPhone}</span>
                      </div>
                    )}

                    {bill.deliveryAddress && (
                      <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-500 leading-tight">
                        <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{bill.deliveryAddress}</span>
                      </div>
                    )}

                    {/* Ordered Items List */}
                    {bill.items && bill.items.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 max-h-32 overflow-y-auto pr-0.5">
                        {bill.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                            <span className="truncate pr-2">
                              {item.name} <span className="text-slate-400 font-medium">x{item.quantity}</span>
                            </span>
                            <span className="text-slate-500 text-[11px] font-bold">${(item.lineTotal ?? 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Items count summary */}
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-3 flex justify-between items-center bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                      <span>{bill.items?.length || 0} Dishes</span>
                      <span className="text-[12px] text-[#0c1424] font-black">Total: ${(bill.totalAmount ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResumeOrder(bill.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-slate-100 hover:bg-slate-200 text-[#0c1424] text-xs font-[1000] uppercase tracking-wider rounded-xl transition-all"
                        title="View and edit order items"
                      >
                        View/Edit
                      </button>
                      <button
                        onClick={() => navigate(`/checkout?billId=${bill.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#0c1424] hover:bg-black text-white text-xs font-[1000] uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-black/5"
                        title="Go directly to checkout and payment"
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
