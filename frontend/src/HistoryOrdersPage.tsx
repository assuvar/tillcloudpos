import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  User,
  Phone,
  Tag,
  Clock,
  ClipboardList,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
} from "lucide-react";
import api from "./services/api";
import { formatDate } from "./utils/dateUtils";

export default function HistoryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Get current month's start date and today's date
  const getStartOfCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  };

  // Filters state
  const [startDate, setStartDate] = useState(getStartOfCurrentMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [orderType, setOrderType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate, orderType, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/bills", {
        params: {
          startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
          endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
          orderType: orderType === "ALL" ? undefined : orderType,
          status: status === "ALL" ? "ALL" : status, // "ALL" query param will be handled correctly by backend
          search: search.trim() || undefined,
        },
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setOrders(data);
      if (data.length > 0) {
        // Find if already selected order exists in new data, else select first
        const matched = data.find((o) => o.id === selectedOrder?.id);
        setSelectedOrder(matched || data[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error fetching history orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "PAID":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <CheckCircle size={10} />
            Paid
          </span>
        );
      case "VOIDED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 rounded-full border border-rose-100">
            <AlertOctagon size={10} />
            Voided
          </span>
        );
      case "OPEN":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 rounded-full border border-amber-100">
            <Clock size={10} />
            Open
          </span>
        );
      case "KOT_SENT":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <ClipboardList size={10} />
            KOT Sent
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 rounded-full border border-slate-100">
            <HelpCircle size={10} />
            {statusStr}
          </span>
        );
    }
  };

  const getOrderTypeBadge = (typeStr: string) => {
    switch (typeStr) {
      case "DINE_IN":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600 rounded-md">
            Dine In
          </span>
        );
      case "PICKUP":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 rounded-md">
            Pickup
          </span>
        );
      case "DELIVERY":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-sky-600 rounded-md">
            Delivery
          </span>
        );
      case "IN_STORE":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-teal-50 text-teal-600 rounded-md">
            In-Store
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-500 rounded-md">
            {typeStr}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 p-6 select-none animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-[1000] text-[#0c1424] tracking-tight">
            History Orders
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Audit logs & past receipts tracker
          </p>
        </div>

        {/* Date Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-100 rounded-xl text-xs font-bold text-[#0c1424] focus:outline-none focus:border-[#0c1424]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-100 rounded-xl text-xs font-bold text-[#0c1424] focus:outline-none focus:border-[#0c1424]"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order #, customer name, phone or delivery address..."
            className="w-full pl-11 pr-4 h-11 bg-slate-50 hover:bg-slate-100/70 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          />
        </form>

        {/* Filters Select Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Filter size={12} className="text-slate-400" />
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Order Types</option>
              <option value="DINE_IN">Dine-In Only</option>
              <option value="PICKUP">Pickup Only</option>
              <option value="DELIVERY">Delivery Only</option>
              <option value="IN_STORE">In-Store Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Tag size={12} className="text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="VOIDED">Voided</option>
              <option value="OPEN">Open</option>
              <option value="KOT_SENT">KOT Sent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Dual-Panel View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left List Panel: takes 5 columns */}
        <div className="lg:col-span-5 bg-white rounded-[28px] border border-slate-100 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Orders Found: {orders.length}
            </span>
            {loading && (
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider animate-pulse">
                Reloading...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
                <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400">
                  <ClipboardList size={32} />
                </div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No Orders Match</h4>
                <p className="text-[11px] text-slate-400 font-bold max-w-xs mt-1">
                  Adjust date filters, order type filters, or text search criteria.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all group ${
                    selectedOrder?.id === order.id
                      ? "bg-slate-900 text-white shadow-md shadow-slate-950/15"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black tracking-tight ${selectedOrder?.id === order.id ? 'text-white' : 'text-[#0c1424]'}`}>
                        Order #{order.orderNumber}
                      </span>
                      {getOrderTypeBadge(order.orderType)}
                    </div>

                    <div className={`text-[10px] font-semibold ${selectedOrder?.id === order.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {formatDate(order.createdAt)}
                    </div>

                    {order.customerName && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                        <User size={10} className="opacity-60" />
                        <span className="truncate max-w-[150px]">{order.customerName}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-1 flex flex-col items-end">
                    <div className={`text-xs font-black ${selectedOrder?.id === order.id ? 'text-white' : 'text-[#0c1424]'}`}>
                      ${(order.totalAmount ?? 0).toFixed(2)}
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Details Panel: takes 7 columns */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-slate-100 shadow-sm flex flex-col min-h-0 overflow-hidden">
          {selectedOrder ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-[#0c1424] text-white rounded-xl">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#0c1424]">
                        Order Details #{selectedOrder.orderNumber}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Created: {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getOrderTypeBadge(selectedOrder.orderType)}
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              {/* Detail Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer Contact & Address (Core Focus) */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/50 pb-1.5">
                    Customer Info & Delivery Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 font-semibold">
                        <User size={13} className="text-slate-400" />
                        <span>Name: <strong className="text-slate-800">{selectedOrder.customerName || "Walk-In Customer"}</strong></span>
                      </div>
                      {selectedOrder.customerPhone && (
                        <div className="flex items-center gap-2 text-slate-600 font-semibold">
                          <Phone size={13} className="text-slate-400" />
                          <span>Phone: <strong className="text-slate-800">{selectedOrder.customerPhone}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {selectedOrder.deliveryAddress ? (
                        <div className="flex items-start gap-2 text-slate-600 font-semibold">
                          <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span>Address:</span>
                            <p className="text-slate-800 font-bold mt-0.5 leading-normal bg-white border border-slate-100 p-2 rounded-xl mt-1">
                              {selectedOrder.deliveryAddress}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 font-semibold italic">
                          <MapPin size={13} className="text-slate-300" />
                          <span>No physical address provided</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Summary list */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Dishes / Items Ordered
                  </h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Item Description</th>
                          <th className="py-3 px-4 text-center">Qty</th>
                          <th className="py-3 px-4 text-right">Unit Price</th>
                          <th className="py-3 px-4 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item: any) => (
                            <tr key={item.id} className="font-semibold text-slate-700">
                              <td className="py-3.5 px-4">
                                <div>{item.name}</div>
                                {item.notes && (
                                  <div className="text-[10px] text-rose-500 font-medium italic mt-0.5">
                                    Note: {item.notes}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-500">x{item.quantity}</td>
                              <td className="py-3.5 px-4 text-right text-slate-500">${(item.price ?? 0).toFixed(2)}</td>
                              <td className="py-3.5 px-4 text-right text-slate-900 font-bold">${(item.lineTotal ?? 0).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                              No items in this order
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Breakdown Card */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(selectedOrder.subtotalAmount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({selectedOrder.taxRate || 0}%)</span>
                    <span>${(selectedOrder.taxAmount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2.5 text-sm font-black text-[#0c1424]">
                    <span>Total Amount</span>
                    <span className="text-base">${(selectedOrder.totalAmount ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-300">
                <ClipboardList size={36} />
              </div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Select an Order</h4>
              <p className="text-[11px] text-slate-400 font-bold max-w-xs mt-1">
                Select any history order from the list on the left to see its comprehensive receipt and item breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
