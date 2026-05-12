import { useState, useEffect } from "react";
import { Search, Phone, Mail, Calendar, MapPin, Award } from "lucide-react";
import { getCustomers, getCustomerDetails, CustomerData, CustomerStats } from "./services/customerService";
import { formatDate } from "./utils/dateUtils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ todayCustomers: 0, todayVisitors: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [search, setSearch] = useState("");
  
  // Filters
  const [period, setPeriod] = useState("all");
  const [customerType, setCustomerType] = useState("all");

  // Loyalty
  const [pointsChange, setPointsChange] = useState("");
  const [reason, setReason] = useState("Manual Adjustment");

  useEffect(() => {
    fetchCustomers();
  }, [period, customerType]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers({
        period,
        customerType: customerType === 'all' ? '' : customerType,
      });
      setCustomers(data.customers);
      setStats(data.stats);
      if (data.customers.length > 0 && !selectedCustomer) {
        handleSelectCustomer(data.customers[0]);
      }
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const handleSelectCustomer = async (customer: CustomerData) => {
    setSelectedCustomer(customer);
    try {
      const details = await getCustomerDetails(customer.id);
      setCustomerDetails(details);
    } catch (error) {
      console.error("Error fetching customer details", error);
    }
  };

  const handleAdjustPoints = async () => {
    // Disabled as requested ("Coming Soon")
    return;
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-[#f8fafc] shadow-sm lg:-m-8 lg:h-[calc(100vh-140px)] lg:flex-row">
      {/* Left Sidebar: Customer List */}
      <div className="flex flex-col border-r border-slate-100 bg-white lg:w-[400px]">
        <div className="p-5 sm:p-8 space-y-4">
          <h2 className="mb-2 text-2xl font-black text-[#0c1424] sm:text-[28px]">
            Customers
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
              <p className="text-[10px] font-black uppercase text-blue-400">New Customers Today</p>
              <p className="text-2xl font-black text-blue-900">{stats.todayCustomers}</p>
            </div>
            <div className="flex-1 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-[10px] font-black uppercase text-emerald-500">Visitors Today</p>
              <p className="text-2xl font-black text-emerald-900">{stats.todayVisitors}</p>
            </div>
          </div>
          <div className="relative group">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name or phone number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-6 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-100 focus:outline-none transition-all text-[13px] font-medium"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              className="h-8 px-3 rounded-xl bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border border-transparent focus:border-slate-200"
            >
              <option value="all">All Time</option>
              <option value="monthly">This Month</option>
            </select>
            <select 
              value={customerType} 
              onChange={e => setCustomerType(e.target.value)}
              className="h-8 px-3 rounded-xl bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border border-transparent focus:border-slate-200"
            >
              <option value="all">All Types</option>
              <option value="DELIVERY">Delivery Only</option>
              <option value="PICKUP">Pickup Only</option>
              <option value="DINE_IN">Dine-In Only</option>
              <option value="IN_STORE">In-Store Only</option>
            </select>
          </div>
        </div>

        <div className="max-h-[36vh] overflow-y-auto lg:max-h-none lg:flex-1">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="text-left py-4 px-8">Name</th>
                <th className="text-left py-4 px-4 whitespace-nowrap">Stats</th>
                <th className="text-right py-4 px-8">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`group cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? "bg-slate-50/80" : "hover:bg-slate-50/40"}`}
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#0c1424] flex items-center justify-center text-[13px] font-black text-white">
                        {customer.name?.substring(0,2).toUpperCase() || "??"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-[#0c1424]">
                          {customer.name || "Unknown"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {customer.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                        {customer.totalVisits} Visits
                      </span>
                      <span className="text-[12px] font-black text-[#0c1424]">
                        ${(customer.totalSpentCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <button className="h-8 px-4 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest group-hover:bg-[#0c1424] group-hover:text-white transition-all">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 text-sm font-bold">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Pane: Customer Details */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-8 lg:p-10">
        {selectedCustomer && customerDetails ? (
          <div className="mx-auto max-w-[1000px] space-y-8">
            {/* Header Card */}
            <div className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              
              {/* Sleek Delivery Address Display Alert right at the top */}
              {customerDetails.address && (
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-100/50 p-4 relative z-10 animate-fadeIn flex items-start gap-3">
                  <div className="p-2 bg-blue-100/80 rounded-xl text-blue-600 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Verified Delivery Address</p>
                    <p className="text-[13px] font-extrabold text-blue-900 mt-1">{customerDetails.address}</p>
                  </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:gap-8">
                <div className="h-24 w-24 rounded-[28px] bg-[#0c1424] flex items-center justify-center text-[32px] font-black text-white shadow-xl shadow-black/10">
                  {selectedCustomer.name?.substring(0,2).toUpperCase() || "??"}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-[32px] font-black text-[#0c1424] tracking-tight">
                        {selectedCustomer.name || "Unknown"}
                      </h1>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone size={14} />
                        <span className="text-[13px] font-bold">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail size={14} />
                          <span className="text-[13px] font-bold">
                            {selectedCustomer.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[13px] font-bold">
                    <Calendar size={14} />
                    Joined: {formatDate(selectedCustomer.memberSince)}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-gradient-to-bl from-blue-50 to-transparent opacity-50 blur-3xl transition-opacity group-hover:opacity-80" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="bg-[#0c1424] rounded-[24px] p-8 text-white shadow-xl shadow-black/10 flex flex-col justify-between h-40">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5dc7ec]">
                  Total Visits
                </span>
                <span className="text-[44px] font-black leading-none">{customerDetails.totalVisits}</span>
              </div>
              <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total Spent
                </span>
                <div>
                  <span className="text-[32px] font-black text-[#0c1424] leading-none">
                    ${(customerDetails.totalSpentCents / 100).toFixed(2)}
                  </span>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">
                    Avg. ${(customerDetails.totalVisits ? (customerDetails.totalSpentCents / 100 / customerDetails.totalVisits) : 0).toFixed(2)}/visit
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Points Balance
                </span>
                <span className="text-[32px] font-black text-[#5dc7ec] leading-none">
                  {customerDetails.loyaltyPoints}
                </span>
              </div>
              <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Last Visit
                </span>
                <div>
                  <p className="text-[14px] font-black text-[#0c1424] mt-1 leading-tight">
                    {customerDetails.lastVisitAt ? formatDate(customerDetails.lastVisitAt) : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Tables */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Purchase History
                  </h3>
                </div>
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden text-[13px] max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="text-left py-4 px-6">Order Details</th>
                        <th className="text-left py-4 px-4">Dishes Ordered</th>
                        <th className="text-left py-4 px-4">Paid Through</th>
                        <th className="text-right py-4 px-6">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {customerDetails.purchaseHistory?.map((row: any) => {
                        // Compile paid through payment methods
                        const payMethods = row.payments?.map((p: any) => p.method).filter(Boolean) || [];
                        if (payMethods.length === 0 && row.deliveryPaymentMethod) {
                          payMethods.push(row.deliveryPaymentMethod.replace(/_/g, ' '));
                        }
                        const paidThroughStr = payMethods.length > 0 ? payMethods.join(', ') : 'CASH';

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-colors align-top">
                            <td className="py-4 px-6">
                              <div className="font-extrabold text-[#0c1424]">
                                #{row.orderNumber}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                {formatDate(row.createdAt)}
                              </div>
                              <span className={`inline-flex text-[9px] font-bold uppercase tracking-wider mt-2 px-2 py-0.5 rounded-md border ${
                                row.orderType === 'DELIVERY'
                                  ? 'bg-blue-50 border-blue-100 text-blue-600'
                                  : row.orderType === 'PICKUP'
                                    ? 'bg-amber-50 border-amber-100 text-amber-600'
                                    : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}>
                                {row.orderType?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                {row.items?.map((item: any) => (
                                  <div key={item.id} className="text-xs font-bold text-slate-700">
                                    {item.itemName} <span className="text-slate-400 font-semibold">x{item.quantity}</span>
                                  </div>
                                ))}
                                {(!row.items || row.items.length === 0) && (
                                  <span className="text-slate-400 italic text-xs font-medium">No dishes listed</span>
                                )}
                              </div>
                              {row.orderType === 'DELIVERY' && row.deliveryAddress && (
                                <div className="mt-3 text-[10px] font-bold text-blue-500 max-w-[200px] leading-tight bg-blue-50/40 p-2 rounded-xl border border-blue-100/30">
                                  <span className="uppercase text-[8px] font-black block text-blue-400 mb-0.5">Delivery To:</span>
                                  {row.deliveryAddress}
                                  {row.deliverySuburb ? `, ${row.deliverySuburb}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-50 border border-slate-200/50 text-slate-600 uppercase">
                                {paidThroughStr}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-[#0c1424]">
                              ${(row.totalCents / 100).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      {(!customerDetails.purchaseHistory || customerDetails.purchaseHistory.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-8 px-6 text-center text-slate-400 font-bold">No purchase history</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Loyalty Activity
                  </h3>
                </div>
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden text-[13px] max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="text-left py-4 px-6">Date</th>
                        <th className="text-left py-4 px-4">Action</th>
                        <th className="text-right py-4 px-6">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {customerDetails.loyaltyActivity?.map((row: any) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-400">
                            {formatDate(row.createdAt)}
                          </td>
                          <td className="py-4 px-4 font-bold text-[#0c1424]">
                            {row.type}
                          </td>
                          <td className={`py-4 px-6 text-right font-black ${row.pointsDelta > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {row.pointsDelta > 0 ? `+${row.pointsDelta}` : row.pointsDelta}
                          </td>
                        </tr>
                      ))}
                      {(!customerDetails.loyaltyActivity || customerDetails.loyaltyActivity.length === 0) && (
                        <tr>
                          <td colSpan={3} className="py-4 px-6 text-center text-slate-400 font-bold">No loyalty activity</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Adjust Points */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
              <div className="col-span-1 space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
                  Adjust Loyalty Points
                </h3>
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col gap-6 relative overflow-hidden">
                  
                  {/* Coming Soon overlay/badge requested by USER */}
                  <div className="absolute top-4 right-4 bg-amber-50 text-amber-600 text-[9px] font-black px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1">
                    <Award size={10} />
                    Coming Soon
                  </div>

                  <div className="space-y-6 opacity-60 pointer-events-none">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Points Change
                        </label>
                        <div className="h-12 rounded-xl bg-slate-50 flex items-center px-4">
                          <input
                            type="number"
                            placeholder="+ / - 100"
                            value={pointsChange}
                            onChange={(e) => setPointsChange(e.target.value)}
                            className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                            disabled
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Reason
                        </label>
                        <div className="h-12 rounded-xl bg-slate-50 flex items-center justify-between px-4">
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleAdjustPoints}
                      className="w-full h-12 rounded-full bg-[#5dc7ec] text-[#0c1424] text-[11px] font-bold uppercase tracking-widest transition-all cursor-not-allowed"
                      disabled
                    >
                      Submit Adjustment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 font-bold">Select a customer to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
