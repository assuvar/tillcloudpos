import { useState } from 'react';
import { 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronRight
} from 'lucide-react';

const CUSTOMERS = [
  { id: 'SM', name: 'Sarah Miller', phone: '+61 4XX XXX 892', visits: 42, spent: '$1,240.50' },
  { id: 'JD', name: 'James Davidson', phone: '+61 4XX XXX 104', visits: 12, spent: '$450.00' },
  { id: 'LK', name: 'Linda Kim', phone: '+61 4XX XXX 557', visits: 8, spent: '$212.80' },
  { id: 'BT', name: 'Ben Thompson', phone: '+61 4XX XXX 332', visits: 38, spent: '$3,105.20' },
];

const PURCHASE_HISTORY = [
  { date: '14 Nov', items: 'Flat White, Avo Toast', total: '$22.50' },
  { date: '12 Nov', items: 'Long Black, Pastry', total: '$14.00' },
  { date: '08 Nov', items: 'Lunch Platter, 2x Soda', total: '$48.50' },
];

const LOYALTY_ACTIVITY = [
  { date: '14 Nov', action: 'Earned (Transaction)', points: '+22', type: 'earn' },
  { date: '12 Nov', action: 'Earned (Transaction)', points: '+14', type: 'earn' },
  { date: '05 Nov', action: 'Redeemed Reward', points: '-250', type: 'redeem' },
];

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(CUSTOMERS[0]);

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-[#f8fafc] shadow-sm lg:-m-8 lg:h-[calc(100vh-140px)] lg:flex-row">
      {/* Left Sidebar: Customer List */}
      <div className="flex flex-col border-r border-slate-100 bg-white lg:w-[400px]">
        <div className="p-5 sm:p-8">
          <h2 className="mb-6 text-2xl font-black text-[#0c1424] sm:text-[28px]">Customers</h2>
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone number"
              className="w-full h-12 pl-12 pr-6 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-100 focus:outline-none transition-all text-[13px] font-medium"
            />
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
              {CUSTOMERS.map((customer) => (
                <tr 
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`group cursor-pointer transition-colors ${selectedCustomer.id === customer.id ? 'bg-slate-50/80' : 'hover:bg-slate-50/40'}`}
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#0c1424] flex items-center justify-center text-[13px] font-black text-white">
                        {customer.id}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-[#0c1424]">{customer.name}</span>
                        <span className="text-[11px] font-bold text-slate-400">{customer.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{customer.visits} Visits</span>
                      <span className="text-[12px] font-black text-[#0c1424]">{customer.spent}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <button className="h-8 px-4 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-[#0c1424] hover:text-white transition-all">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Pane: Customer Details */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-[1000px] space-y-8">
          {/* Header Card */}
          <div className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:gap-8">
              <div className="h-24 w-24 rounded-[28px] bg-[#0c1424] flex items-center justify-center text-[32px] font-black text-white shadow-xl shadow-black/10">
                {selectedCustomer.id}
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-[32px] font-black text-[#0c1424] tracking-tight">{selectedCustomer.name}</h1>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest">Platinum Member</span>
                  </div>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone size={14} />
                      <span className="text-[13px] font-bold">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail size={14} />
                      <span className="text-[13px] font-bold">s.miller@example.com</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[13px] font-bold">
                  <Calendar size={14} />
                  Joined: Oct 12, 2022 (2 years ago)
                </div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-gradient-to-bl from-blue-50 to-transparent opacity-50 blur-3xl transition-opacity group-hover:opacity-80" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-[#0c1424] rounded-[24px] p-8 text-white shadow-xl shadow-black/10 flex flex-col justify-between h-40">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5dc7ec]">Total Visits</span>
              <span className="text-[44px] font-black leading-none">42</span>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Spent</span>
              <div>
                <span className="text-[32px] font-black text-[#0c1424] leading-none">$1,240</span>
                <p className="text-[11px] font-bold text-slate-400 mt-1">Avg. $29.50/visit</p>
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Points Balance</span>
              <span className="text-[32px] font-black text-[#5dc7ec] leading-none">840</span>
            </div>
            <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Visit</span>
              <div>
                <span className="text-[18px] font-black text-[#0c1424] leading-none">2 days ago</span>
                <p className="text-[11px] font-bold text-slate-400 mt-1">Nov 14, 2024</p>
              </div>
            </div>
          </div>

          {/* Activity Tables */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Purchase History</h3>
                <button className="text-[11px] font-black text-[#5dc7ec] uppercase tracking-widest">See All</button>
              </div>
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden text-[13px]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="text-left py-4 px-6">Date</th>
                      <th className="text-left py-4 px-4">Items</th>
                      <th className="text-right py-4 px-6">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {PURCHASE_HISTORY.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-400">{row.date}</td>
                        <td className="py-4 px-4 font-bold text-[#0c1424]">{row.items}</td>
                        <td className="py-4 px-6 text-right font-black text-[#0c1424]">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loyalty Activity</h3>
                <button className="text-[11px] font-black text-[#5dc7ec] uppercase tracking-widest">Export</button>
              </div>
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden text-[13px]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="text-left py-4 px-6">Date</th>
                      <th className="text-left py-4 px-4">Action</th>
                      <th className="text-right py-4 px-6">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {LOYALTY_ACTIVITY.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-400">{row.date}</td>
                        <td className="py-4 px-4 font-bold text-[#0c1424]">{row.action}</td>
                        <td className={`py-4 px-6 text-right font-black ${row.type === 'earn' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Notes and Adjust Points */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            {/* Private Notes */}
            <div className="col-span-2 space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Private Notes</h3>
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
                <div className="bg-[#f0f9ff]/50 rounded-2xl p-6 text-[13px] font-medium text-[#0c1424] leading-relaxed relative">
                   Prefers almond milk. Always sits by the window. VIP referral from regional manager.
                   <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#5dc7ec]" />
                </div>
                <div className="flex justify-end">
                   <button className="h-10 px-8 rounded-full bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all">
                      Save Note
                   </button>
                </div>
              </div>
            </div>

            {/* Adjust Loyalty Points */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Adjust Loyalty Points</h3>
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points Change</label>
                     <div className="h-12 rounded-xl bg-slate-50 flex items-center px-4">
                       <input type="text" placeholder="+ / - 100" className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason Code</label>
                     <div className="h-12 rounded-xl bg-slate-50 flex items-center justify-between px-4 cursor-pointer">
                        <span className="text-[13px] font-bold text-[#0c1424]">001</span>
                        <ChevronRight size={14} className="text-slate-400 rotate-90" />
                     </div>
                   </div>
                </div>
                <button className="w-full h-12 rounded-full bg-[#5dc7ec] text-[#0c1424] text-[11px] font-bold uppercase tracking-widest hover:bg-[#4bb6da] transition-all shadow-lg shadow-[#5dc7ec]/20">
                   Submit Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
