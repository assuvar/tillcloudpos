import React, { useState, useEffect } from "react";
import { usePosCart } from "../context/PosCartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { formatDate } from "../utils/dateUtils";
import {
  Search,
  CheckCircle2,
  Trash2,
  Printer,
  Clock,
  User as UserIcon,
  AlertTriangle,
  X,
  History,
  AlertCircle,
} from "lucide-react";

export const RecentOrdersPanel: React.FC = () => {
  const { loadOpenBills, restaurant } = usePosCart();
  const { user } = useAuth();

  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "VOIDED">("ALL");
  
  // Date range & order type query filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterOrderType, setFilterOrderType] = useState<string>("ALL");

  // Void modal state
  const [selectedOrderForVoid, setSelectedOrderForVoid] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  
  // Receipt modal state
  const [selectedReceiptBill, setSelectedReceiptBill] = useState<any | null>(null);

  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const loadRecentBills = async () => {
    setIsLoading(true);
    try {
      let url = "/bills?limit=150";
      if (startDate) {
        url += `&startDate=${startDate}T00:00:00`;
      }
      if (endDate) {
        url += `&endDate=${endDate}T23:59:59`;
      }
      if (filterOrderType && filterOrderType !== "ALL") {
        url += `&orderType=${filterOrderType}`;
      }
      const res = await api.get(url);
      const payload = Array.isArray(res.data) ? res.data : [];
      setRecentBills(payload);
    } catch (err) {
      console.error("Failed to load recent bills:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Set dates preset range helper
  const setPreset = (preset: "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM") => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (preset === "TODAY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "YESTERDAY") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().split("T")[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "THIS_WEEK") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
      setStartDate(startOfWeekStr);
      setEndDate(todayStr);
    } else if (preset === "THIS_MONTH") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
      setStartDate(startOfMonthStr);
      setEndDate(todayStr);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  // Pre-initialize filters range on mount for Admin/Manager
  useEffect(() => {
    if (isAdminOrManager) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];
      setStartDate(startOfMonthStr);
      setEndDate(todayStr);
    }
  }, [user]);

  useEffect(() => {
    void loadRecentBills();
  }, [startDate, endDate, filterOrderType]);

  const handlePrintReceipt = async (billId: string) => {
    try {
      // In a real flow, this triggers backend print or local preview.
      // We will fetch the single bill details and show the print preview modal.
      const res = await api.get(`/bills/${billId}`);
      setSelectedReceiptBill(res.data);
    } catch (err) {
      console.error("Failed to load bill receipt details:", err);
    }
  };

  const initiateVoidOrder = (bill: any) => {
    setSelectedOrderForVoid(bill);
    setVoidReason("");
    setVoidError(null);
  };

  const submitVoidOrder = async () => {
    if (!selectedOrderForVoid) return;
    if (voidReason.trim().length < 4) {
      setVoidError("Please specify a descriptive reason (minimum 4 characters)");
      return;
    }

    setIsVoiding(true);
    setVoidError(null);

    try {
      await api.delete(`/orders/${selectedOrderForVoid.id}`, {
        data: { reason: voidReason.trim() },
      });
      setSelectedOrderForVoid(null);
      await loadRecentBills();
      await loadOpenBills();
    } catch (err: any) {
      console.error("Failed to void order:", err);
      setVoidError(err?.response?.data?.message || err?.message || "Failed to void order");
    } finally {
      setIsVoiding(false);
    }
  };

  // Filter bills
  const filteredBills = recentBills.filter((bill) => {
    // Filter by tab status
    if (activeTab === "PAID" && bill.status !== "PAID" && bill.status !== "CLOSED") return false;
    if (activeTab === "VOIDED" && bill.status !== "VOIDED") return false;

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const orderNumStr = String(bill.orderNumber);
    const custName = (bill.customerName || bill.pickupName || bill.deliveryName || "").toLowerCase();
    const custPhone = (bill.customerPhone || bill.pickupPhone || bill.deliveryPhone || "").toLowerCase();
    const tableNum = (bill.tableNumber || "").toLowerCase();

    return (
      orderNumStr.includes(query) ||
      custName.includes(query) ||
      custPhone.includes(query) ||
      tableNum.includes(query)
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 p-6 select-none animate-fadeIn">
      {/* Panel Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-[1000] text-[#0c1424] tracking-tight">History & Recent Orders</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Historical overview of completed sales settlements, print requests, and void audit trails</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search Order#, customer details, tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0c1424] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tabs List */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "ALL"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            All History ({recentBills.length})
          </button>
          <button
            onClick={() => setActiveTab("PAID")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "PAID"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            Settled / Paid
          </button>
          <button
            onClick={() => setActiveTab("VOIDED")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "VOIDED"
                ? "bg-[#0c1424] text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            Voided / Cancelled
          </button>
        </div>
      </div>

      {/* History Controls Bar (Access Controlled) */}
      {isAdminOrManager ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 mb-6 shadow-sm flex flex-col gap-5 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Preset Month / Date Ranges</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Today", value: "TODAY" },
                { label: "Yesterday", value: "YESTERDAY" },
                { label: "This Week", value: "THIS_WEEK" },
                { label: "This Month (Whole Month)", value: "THIS_MONTH" },
                { label: "Clear Dates", value: "CUSTOM" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value as any)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#0c1424] transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#0c1424] transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Order Type</label>
              <select
                value={filterOrderType}
                onChange={(e) => setFilterOrderType(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#0c1424] transition-all cursor-pointer shadow-sm min-w-[130px]"
              >
                <option value="ALL">All Types</option>
                <option value="DINE_IN">Dine-In</option>
                <option value="IN_STORE">In-Store</option>
                <option value="PICKUP">Pickup</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100/50 border border-slate-200/40 rounded-3xl p-4 mb-6 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
          <span>🔒 History filtering options are restricted to Admins and Managers.</span>
        </div>
      )}

      {/* Main Data Container */}
      <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0c1424]"></div>
            <span className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Syncing historical logs...</span>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <History className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
            <h3 className="text-sm font-bold text-slate-600">No matching archives found</h3>
            <p className="text-xs text-slate-400 mt-1">Verify filters or perform some transactions first</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Metadata</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Void Audit</th>
                  <th className="p-4 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBills.map((bill) => {
                  const createdDate = new Date(bill.createdAt);
                  const isVoided = bill.status === "VOIDED";

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Order Ref */}
                      <td className="p-4 pl-6">
                        <div className="text-sm font-black text-[#0c1424]">
                          Order #{bill.orderNumber}
                        </div>
                        <span className="inline-flex text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200/40 rounded-md">
                          {bill.orderType.replace("_", " ")}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Clock size={13} className="text-slate-400" />
                          <span>{formatDate(bill.createdAt)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">
                          {createdDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Customer / Table */}
                      <td className="p-4">
                        {bill.customerName || bill.pickupName || bill.deliveryName ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <UserIcon size={13} className="text-slate-400" />
                            <span className="truncate max-w-[150px]">
                              {bill.customerName || bill.pickupName || bill.deliveryName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold italic">Anonymous</span>
                        )}
                        {(bill.customerPhone || bill.pickupPhone || bill.deliveryPhone) && (
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            {bill.customerPhone || bill.pickupPhone || bill.deliveryPhone}
                          </div>
                        )}
                        {bill.deliveryAddress && (
                          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-1 max-w-[200px] truncate" title={bill.deliveryAddress}>
                            📍 {bill.deliveryAddress}
                          </div>
                        )}
                        {bill.tableNumber && (
                          <span className="text-[10px] text-[#0c1424] font-black uppercase tracking-wider block mt-1">
                            Table: {bill.tableNumber}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-4">
                        <div className="text-sm font-black text-[#0c1424]">
                          ${(bill.totalAmount ?? 0).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          {bill.items?.length || 0} items
                        </span>
                      </td>

                      {/* Status / Void Info */}
                      <td className="p-4 max-w-xs">
                        {isVoided ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-rose-50 border border-rose-100 text-rose-600 animate-pulse uppercase">
                              <AlertCircle size={11} />
                              Voided / Cancelled
                            </span>
                            {bill.voidReason && (
                              <p className="text-[10px] font-bold text-rose-500/80 leading-tight mt-1 bg-rose-50/20 border border-rose-100/10 p-2 rounded-xl italic">
                                "{bill.voidReason}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase">
                            <CheckCircle2 size={11} />
                            Settled / Paid
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintReceipt(bill.id)}
                            className="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-[#0c1424] hover:bg-slate-100 rounded-xl transition-all"
                            title="View / Reprint Thermal Receipt"
                          >
                            <Printer size={15} />
                          </button>

                          {!isVoided && isAdminOrManager && (
                            <button
                              onClick={() => initiateVoidOrder(bill)}
                              className="flex h-9 w-9 items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all"
                              title="Void settled transaction"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Thermal Invoice Print Preview Template Drawer/Modal Overlay */}
      {selectedReceiptBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-white">Invoice Receipt</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Order #{selectedReceiptBill.orderNumber} Archive</p>
              </div>
              <button
                onClick={() => setSelectedReceiptBill(null)}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Receipt Preview */}
            <div className="flex-1 overflow-y-auto bg-white border border-slate-200 p-5 rounded-2xl font-mono text-[11px] text-slate-800 leading-relaxed shadow-inner">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                <h4 className="text-xs font-bold uppercase">{restaurant?.name || "TILLCLOUD POS"}</h4>
                <p className="text-[9px] text-slate-400 mt-0.5">{restaurant?.streetAddress || "Primary Outlet Address"}</p>
                <p className="text-[9px] text-slate-400">{restaurant?.phone || "Phone context"}</p>
              </div>

              <div className="space-y-1 mb-3 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>ORDER TYPE:</span>
                  <span className="font-bold">{selectedReceiptBill.orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{formatDate(selectedReceiptBill.createdAt)}</span>
                </div>
                {selectedReceiptBill.tableNumber && (
                  <div className="flex justify-between">
                    <span>TABLE:</span>
                    <span className="font-bold">{selectedReceiptBill.tableNumber}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-3 pb-3 border-b border-dashed border-slate-300">
                {selectedReceiptBill.items?.map((item: any) => (
                  <div key={item.id}>
                    <div className="flex justify-between">
                      <span className="font-bold">{item.name || item.itemName} x{item.quantity}</span>
                      <span>${(item.lineTotal ?? 0).toFixed(2)}</span>
                    </div>
                    {item.notes && <span className="text-[9px] text-slate-400 italic block pl-2">*{item.notes}</span>}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-1 text-right font-bold">
                <div className="flex justify-between text-slate-400">
                  <span>SUBTOTAL:</span>
                  <span>${(selectedReceiptBill.subtotalAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TAX AMOUNT:</span>
                  <span>${(selectedReceiptBill.taxAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-xs border-t border-dashed border-slate-300 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>${(selectedReceiptBill.totalAmount ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-[9px] text-slate-400 border-t border-dashed border-slate-300 pt-3">
                *** THANK YOU FOR YOUR VISIT ***
              </div>
            </div>

            <button
              onClick={() => {
                alert("Triggered local invoice printer interface");
                setSelectedReceiptBill(null);
              }}
              className="mt-4 w-full h-11 bg-white hover:bg-slate-50 text-[#0c1424] text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2"
            >
              <Printer size={14} />
              Print Invoice Receipt
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Void Confirmation Overlay Modal */}
      {selectedOrderForVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 transform scale-100 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0c1424]">Void Settled Sale</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mandatory Audit Trial Log Requirement</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForVoid(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 leading-relaxed mb-4">
                You are about to VOID/DELETE <span className="text-slate-900 font-extrabold">Order #{selectedOrderForVoid.orderNumber}</span>. This will reverse the transaction settlement from metrics reports. This action is irreversible.
              </div>

              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Mandatory Reason for Deletion
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Specify precise reason for audit logs (e.g. Returned payment, Entry mistake, Card decline...)"
                rows={3}
                className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-all"
              />
              {voidError && (
                <div className="text-[11px] font-bold text-rose-500 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {voidError}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedOrderForVoid(null)}
                disabled={isVoiding}
                className="h-11 px-5 text-slate-500 hover:bg-slate-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitVoidOrder}
                disabled={isVoiding || voidReason.trim().length < 4}
                className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isVoiding ? "Voiding..." : "Confirm Void"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
