import { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Package, 
  PieChart, 
  LayoutGrid, 
  TrendingUp, 
  ChevronDown, 
  Download, 
  Filter, 
  ArrowUpRight, 
  Wallet, 
  Clock, 
  ChevronRight,
  Star
} from 'lucide-react';

/* --- Sub-Components --- */

const DailySalesReport = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-[0.2em] mb-1">Operational Insights</span>
          <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Daily Sales Report</h2>
       </div>
       <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2">
             <Calendar size={14} /> Last 30 Days
          </button>
          <button className="h-11 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10">
             <Filter size={14} /> Apply Filters
          </button>
       </div>
    </div>

    {/* Filters Row */}
    <div className="flex gap-4">
       {['Date Range', 'Order Type', 'Terminal'].map((label, idx) => (
         <div key={idx} className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-between px-5 cursor-pointer">
               <span className="text-[13px] font-bold text-[#0c1424]">{idx === 0 ? 'Last 7 Days' : idx === 1 ? 'All Types' : 'All Terminals'}</span>
               <ChevronDown size={14} className="text-slate-400" />
            </div>
         </div>
       ))}
       <div className="flex items-end">
          <button className="h-12 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest">Apply Filters</button>
       </div>
    </div>

    {/* Chart and Summary */}
   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
       <div className="col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-10">
             <div>
                <h3 className="text-lg font-black text-[#0c1424]">Revenue Trends</h3>
                <p className="text-[13px] text-slate-400 font-medium">Performance over the selected period</p>
             </div>
             <div className="text-[32px] font-black text-[#0c1424] tracking-tighter">$42,910.00</div>
          </div>
          
          {/* Mock Chart Area */}
          <div className="h-48 flex items-end justify-between relative mt-12 px-4">
             <svg className="absolute bottom-0 left-0 w-full h-[120px]" viewBox="0 0 1000 120" preserveAspectRatio="none">
                <path d="M0,100 C150,110 250,20 400,80 C550,120 750,0 1000,100 L1000,120 L0,120 Z" fill="url(#gradient)" opacity="0.1" />
                <path d="M0,100 C150,110 250,20 400,80 C550,120 750,0 1000,100" fill="none" stroke="#5dc7ec" strokeWidth="4" strokeLinecap="round" />
                <defs>
                   <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5dc7ec" />
                      <stop offset="100%" stopColor="#fff" />
                   </linearGradient>
                </defs>
             </svg>
             {[1,2,3,4,5,6,7].map(i => (
               <div key={i} className="h-full w-1 flex flex-col justify-end items-center gap-2">
                  {i === 3 && <div className="h-3 w-3 rounded-full bg-[#0c1424] ring-4 ring-white shadow-lg shadow-black/20" />}
                  {i === 7 && <div className="h-3 w-3 rounded-full bg-[#5dc7ec] ring-4 ring-white shadow-lg shadow-[#5dc7ec]/20" />}
               </div>
             ))}
          </div>
       </div>

       <div className="bg-[#0c1424] rounded-[32px] p-8 text-white shadow-xl shadow-black/10 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-[#5dc7ec] mb-6">
               <PieChart size={20} />
            </div>
            <h3 className="text-xl font-black mb-3">Insight Summary</h3>
            <p className="text-blue-100/60 text-[14px] leading-relaxed font-medium">
               Dine-in revenue is the primary growth driver this week, contributing to 64% of total sales.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/5 pt-8 sm:grid-cols-2">
             <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Bill</span>
                <div className="text-[20px] font-black mt-1">$42.50</div>
             </div>
             <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Cat</span>
                <div className="text-[20px] font-black mt-1">Mains</div>
             </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#5dc7ec]/5 rounded-full blur-3xl" />
       </div>
    </div>

    {/* Daily Breakdown Table */}
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
       <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#0c1424]">Daily Sales Breakdown</h3>
          <div className="flex gap-2">
             <button className="h-10 px-6 rounded-xl bg-slate-50 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2">
                <Download size={14} /> Export CSV
             </button>
             <button className="h-10 px-6 rounded-xl bg-blue-50 text-[#5dc7ec] text-[11px] font-black uppercase tracking-widest hover:bg-blue-100 flex items-center gap-2">
                <FileText size={14} /> Download Report
             </button>
          </div>
       </div>
       <table className="w-full">
          <thead>
             <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left py-4 px-10">Date</th>
                <th className="text-center py-4 px-4">Bills</th>
                <th className="text-center py-4 px-4">Revenue (AUD)</th>
                <th className="text-center py-4 px-4">Avg Bill Value</th>
                <th className="text-center py-4 px-4">Dine In</th>
                <th className="text-center py-4 px-4">Takeaway</th>
                <th className="text-right py-4 px-10">Delivery</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {[
               { date: '12 May 2024', bills: 142, revenue: '$6,240.50', avg: '$43.95', dine: '$3,920.00', take: '$1,120.50', deli: '$1,200.00' },
               { date: '11 May 2024', bills: 128, revenue: '$5,810.00', avg: '$45.39', dine: '$3,100.00', take: '$1,450.00', deli: '$1,260.00' },
               { date: '10 May 2024', bills: 165, revenue: '$7,422.00', avg: '$44.98', dine: '$4,822.00', take: '$1,600.00', deli: '$1,000.00' },
             ].map((row, i) => (
               <tr key={i} className="hover:bg-slate-50/40 transition-colors text-[13px]">
                  <td className="py-5 px-10 font-bold text-slate-500">{row.date}</td>
                  <td className="py-5 px-4 text-center font-black text-[#0c1424]">{row.bills}</td>
                  <td className="py-5 px-4 text-center font-black text-[#0c1424]">{row.revenue}</td>
                  <td className="py-5 px-4 text-center font-bold text-slate-400">{row.avg}</td>
                  <td className="py-5 px-4 text-center font-bold text-[#0c1424]">{row.dine}</td>
                  <td className="py-5 px-4 text-center font-bold text-[#0c1424]">{row.take}</td>
                  <td className="py-5 px-10 text-right font-bold text-[#0c1424]">{row.deli}</td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  </div>
);

const MonthlySalesReport = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-[0.2em] mb-1">Operational Insights</span>
          <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Monthly Sales Report</h2>
       </div>
       <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2">
             <Calendar size={14} /> Last 3 months
          </button>
          <button className="h-11 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10">
             <Filter size={14} /> Apply Filters
          </button>
       </div>
    </div>

    {/* Filters Row */}
    <div className="flex gap-4">
       {['Yearly Selector', 'Order Type', 'Terminal'].map((label, idx) => (
         <div key={idx} className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-between px-5 cursor-pointer">
               <span className="text-[13px] font-bold text-[#0c1424]">{idx === 0 ? '2024 (Current)' : idx === 1 ? 'All Channels' : 'All Registers'}</span>
               <ChevronDown size={14} className="text-slate-400" />
            </div>
         </div>
       ))}
       <div className="flex items-end">
          <button className="h-12 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
             <Download size={14} /> Download CSV
          </button>
       </div>
    </div>

    {/* Main Stats Grid */}
   <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
       <div className="col-span-1 bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-44 relative group">
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-white transition-all">
             <Wallet size={20} />
          </div>
          <div>
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Annual Revenue</span>
            <div className="text-[32px] font-black text-[#0c1424] mt-2">$842,500<span className="text-[12px] text-slate-300 ml-1">AUD</span></div>
          </div>
       </div>

       <div className="col-span-1 bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-44 relative group">
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
             <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div className="absolute top-8 right-8 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-black text-emerald-500 uppercase tracking-widest">Stable</div>
          <div>
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Avg Monthly Sales</span>
            <div className="text-[32px] font-black text-[#0c1424] mt-2">$70,208<span className="text-[12px] text-slate-300 ml-1">AUD</span></div>
          </div>
       </div>

       <div className="col-span-2 bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/20 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
             <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#5dc7ec]">
                <Calendar size={20} />
             </div>
             <div className="px-3 py-1 bg-[#5dc7ec] rounded-full text-[9px] font-black text-[#0c1424] uppercase tracking-widest flex items-center gap-1">
                <Star size={10} fill="currentColor" /> Peak Month
             </div>
          </div>
          <div className="flex items-end justify-between">
             <div>
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-none">Best Performing Month</span>
                <div className="text-[44px] font-black tracking-tight mt-1">December <span className="text-[16px] text-[#5dc7ec] ml-2">$94.2k</span></div>
             </div>
             <div className="h-32 w-32 relative opacity-20 group-hover:opacity-40 transition-opacity">
                <Star size={128} className="text-white absolute -right-6 -bottom-6 rotate-12" />
             </div>
          </div>
       </div>
    </div>

    {/* Bar Chart Section */}
   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
       <div className="col-span-2 bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-12">
             <div>
                <h3 className="text-xl font-black text-[#0c1424]">Revenue Trendline</h3>
                <p className="text-[13px] text-slate-400 font-medium">Visualizing gross revenue flow across fiscal 2024</p>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full bg-[#5dc7ec]" />
                   <span className="text-[11px] font-black uppercase text-slate-400">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full bg-slate-100" />
                   <span className="text-[11px] font-black uppercase text-slate-300 whitespace-nowrap">Last Year</span>
                </div>
             </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-4">
             {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG'].map((m, i) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-4 group">
                   <div className="w-full flex justify-center items-end h-[240px] relative">
                      <div className="absolute w-[60%] bg-slate-50 rounded-t-xl group-hover:bg-slate-100 transition-all" style={{ height: '70%', right: '5%' }} />
                      <div className={`w-[60%] rounded-t-xl transition-all z-10 ${m === 'JUN' ? 'bg-[#0c1424] shadow-2xl' : 'bg-[#e0f7ff]'}`} style={{ height: m === 'JUN' ? '90%' : `${50 + (i*5)}%`, left: '5%' }} />
                   </div>
                   <span className={`text-[10px] font-black tracking-widest ${m === 'JUN' ? 'text-[#0c1424]' : 'text-slate-400'}`}>{m}</span>
                </div>
             ))}
          </div>
       </div>

       <div className="bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/10 flex flex-col">
          <h3 className="text-lg font-black leading-tight mb-2">Order Distribution</h3>
          <p className="text-slate-500 text-[13px] font-medium leading-relaxed mb-10">Channel breakdown for current month</p>
          
          <div className="space-y-10 flex-1">
             {[
               { label: 'Dine In', val: '58%', color: '#5dc7ec' },
               { label: 'Takeaway', val: '24%', color: '#fff' },
               { label: 'Delivery', val: '18%', color: '#slate-700' },
             ].map((item, i) => (
               <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                     <span className="text-[13px] font-black">{item.label}</span>
                     <span className="text-[13px] font-black text-[#5dc7ec]">{item.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-current rounded-full" style={{ width: item.val, color: item.color }} />
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Platform</span>
             <div className="flex flex-col items-end">
                <span className="text-[14px] font-black">UberEats</span>
                <span className="text-[12px] font-bold text-[#5dc7ec]">(12.4k)</span>
             </div>
          </div>
       </div>
    </div>
  </div>
);

const CategorySalesReport = () => (
   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-[0.2em] mb-1">Operational Insights</span>
          <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Category-wise Sales Report</h2>
       </div>
       <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2">
             <Calendar size={14} /> Last 30 Days
          </button>
          <button className="h-11 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10">
             <Filter size={14} /> Apply Filters
          </button>
       </div>
    </div>

   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
       <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-[340px] relative">
          <div className="flex items-center gap-3">
             <TrendingUp size={20} className="text-[#5dc7ec]" />
             <span className="text-[12px] font-black uppercase text-slate-400 tracking-widest">Total Performance</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gross Revenue</span>
            <div className="text-[44px] font-black text-[#0c1424] leading-none">$42,850.20</div>
            <div className="mt-8 pt-8 border-t border-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Items Sold</span>
               <div className="text-[24px] font-black text-[#0c1424]">2,481 <span className="text-[14px] text-slate-400 ml-1 font-bold lowercase italic">units</span></div>
            </div>
          </div>
          <button className="mt-8 text-[11px] font-black text-[#5dc7ec] uppercase tracking-[0.2em] flex items-center gap-2">
             View Detailed Log <ChevronRight size={14} />
          </button>
       </div>

       <div className="col-span-2 bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/20 flex items-center justify-center relative overflow-hidden group">
          <div className="flex-1 flex flex-col justify-center gap-2">
             <h3 className="text-xl font-black mb-10">Revenue Contribution</h3>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-y-8 sm:gap-x-12">
                {[
                  { label: 'Mains', val: '45%', color: '#5dc7ec' },
                  { label: 'Starters', val: '25%', color: '#fff' },
                  { label: 'Drinks', val: '20%', color: '#slate-700' },
                  { label: 'Desserts', val: '10%', color: '#slate-800' },
                ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                         <span className="text-[18px] font-black">{item.val}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          <div className="relative flex h-[220px] w-[220px] items-center justify-center sm:h-[300px] sm:w-[300px]">
             {/* Simple Doughnut Representation */}
             <div className="w-full h-full rounded-full border-[28px] border-[#1e293b]" />
             <div className="absolute w-full h-full rounded-full border-[28px] border-transparent border-t-[#5dc7ec] border-r-[#5dc7ec]/80 rotate-[30deg]" />
             <div className="absolute w-full h-full rounded-full border-[28px] border-transparent border-b-white/40 -rotate-[120deg]" />
             <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Cat.</span>
                <span className="text-[24px] font-black">Mains</span>
             </div>
          </div>
       </div>
    </div>

    {/* Categorical Breakdown Table */}
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
       <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#0c1424]">Categorical Breakdown</h3>
          <button className="h-10 px-6 rounded-xl bg-slate-50 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2">
             <Download size={14} /> Export PDF
          </button>
       </div>
       <table className="w-full">
          <thead>
             <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left py-4 px-10">Category Name</th>
                <th className="text-center py-4 px-4">Total Items Sold</th>
                <th className="text-center py-4 px-4">Total Revenue (AUD)</th>
                <th className="text-right py-4 px-10">% Contribution</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {[
               { name: 'Mains', icon: '#5dc7ec', sold: '1,116 items', revenue: '$19,282.59', pct: '45.0%' },
               { name: 'Starters', icon: '#e2e8f0', sold: '620 items', revenue: '$10,712.55', pct: '25.0%' },
               { name: 'Drinks', icon: '#0c1424', sold: '496 items', revenue: '$8,570.04', pct: '20.0%' },
             ].map((row, i) => (
               <tr key={i} className="hover:bg-slate-50/40 transition-colors text-[13px]">
                  <td className="py-6 px-10 font-bold text-slate-500">
                     <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: row.icon }} />
                        <span className="font-black text-[#0c1424]">{row.name}</span>
                     </div>
                  </td>
                  <td className="py-6 px-4 text-center font-bold text-slate-400">{row.sold}</td>
                  <td className="py-6 px-4 text-center font-black text-[#0c1424]">{row.revenue}</td>
                  <td className="py-6 px-10">
                     <div className="flex items-center justify-end gap-4">
                        <span className="font-black text-[#0c1424]">{row.pct}</span>
                        <div className="w-24 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                           <div className="h-full bg-current rounded-full" style={{ width: row.pct, color: row.icon }} />
                        </div>
                     </div>
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  </div>
);

const InventoryStockReport = () => (
   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-[0.2em] mb-1">Stock Intelligence</span>
          <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Inventory Stock Report</h2>
       </div>
       <div className="flex items-end gap-6">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
             <div className="h-10 px-4 rounded-xl bg-white border border-slate-100 flex items-center justify-between gap-6 cursor-pointer">
                <span className="text-[12px] font-bold text-slate-600">All Categories</span>
                <ChevronDown size={14} className="text-slate-400" />
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Status</label>
             <div className="h-10 px-4 rounded-xl bg-white border border-slate-100 flex items-center justify-between gap-6 cursor-pointer">
                <span className="text-[12px] font-bold text-slate-600">All Status</span>
                <ChevronDown size={14} className="text-slate-400" />
             </div>
          </div>
          <button className="h-10 px-6 rounded-xl bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
             <Filter size={14} /> Apply
          </button>
       </div>
    </div>

    {/* Metric Cards */}
   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
       {[
         { label: 'Total Stock Value', val: '$1,248,500.00', icon: LayoutGrid, color: '#0c1424' },
         { label: 'Low Stock Alerts', val: '12 Items', icon: Clock, color: '#f59e0b' },
         { label: 'Out of Stock', val: '04 Items', icon: TrendingUp, color: '#ef4444' }
       ].map((item, i) => (
         <div key={i} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
            <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${item.color}10`, color: item.color }}>
               {/* Fixed missing trendingUp icon usage by referencingTrendingUp from React-lucide */}
               {i === 2 ? <TrendingUp size={28} /> : i === 1 ? <Clock size={28} /> : <LayoutGrid size={28} />}
            </div>
            <div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{item.label}</span>
               <div className="text-[28px] font-black text-[#0c1424] leading-none">{item.val}</div>
            </div>
         </div>
       ))}
    </div>

    {/* Bottom Grid: Order Dist and Stock Table */}
    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-3 bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/10 flex flex-col h-full h-[600px]">
          <h3 className="text-lg font-black leading-tight mb-2">Order Distribution</h3>
          <p className="text-slate-500 text-[13px] font-medium leading-relaxed mb-10">Channel breakdown for current month</p>
          
          <div className="space-y-10 flex-1">
             {[
               { label: 'Dine In', val: '58%', color: '#5dc7ec' },
               { label: 'Takeaway', val: '24%', color: '#fff' },
               { label: 'Delivery', val: '18%', color: '#slate-700' },
             ].map((item, i) => (
               <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                     <span className="text-[13px] font-black">{item.label}</span>
                     <span className="text-[13px] font-black text-[#5dc7ec]">{item.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-current rounded-full" style={{ width: item.val, color: item.color }} />
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Platform</span>
             <div className="flex flex-col items-end">
                <span className="text-[14px] font-black">UberEats</span>
                <span className="text-[12px] font-bold text-[#5dc7ec]">(12.4k)</span>
             </div>
          </div>
       </div>

       <div className="col-span-9 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <table className="w-full">
            <thead>
               <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="text-left py-4 px-10">Item Name</th>
                  <th className="text-center py-4 px-4">Category</th>
                  <th className="text-center py-4 px-4">Current Stock</th>
                  <th className="text-center py-4 px-4">Status</th>
                  <th className="text-right py-4 px-10">Replenished</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {[
                 { name: 'Premium Wagyu Burger', cat: 'Mains', stock: '45 Units', status: 'Optimal', repl: '2h ago', color: 'emerald' },
                 { name: 'Truffle Arancini', cat: 'Starters', stock: '128 Units', status: 'Optimal', repl: 'Yesterday', color: 'emerald' },
                 { name: 'Fresh Lime Soda', cat: 'Drinks', stock: '32 Units', status: 'Optimal', repl: '5h ago', color: 'emerald' },
                 { name: 'Wild Mushroom Risotto', cat: 'Mains', stock: '08 Units', status: 'Low Stock', repl: '3 days ago', color: 'amber' },
                 { name: 'Dark Chocolate Fondant', cat: 'Desserts', stock: '00 Units', status: 'Out of Stock', repl: 'Not set', color: 'rose' },
               ].map((row, i) => (
                 <tr key={i} className="hover:bg-slate-50/40 transition-colors text-[13px]">
                    <td className="py-6 px-10">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                             <Package size={18} />
                          </div>
                          <span className="font-black text-[#0c1424]">{row.name}</span>
                       </div>
                    </td>
                    <td className="py-6 px-4 text-center font-bold">
                       <span className="px-3 py-1 rounded-full bg-blue-50 text-[10px] font-black text-[#5dc7ec] uppercase">{row.cat}</span>
                    </td>
                    <td className={`py-6 px-4 text-center font-black ${row.color === 'rose' ? 'text-rose-500' : row.color === 'amber' ? 'text-amber-500' : 'text-[#0c1424]'}`}>{row.stock}</td>
                    <td className="py-6 px-4">
                       <div className="flex justify-center">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase text-${row.color}-500 border-${row.color}-100 bg-${row.color}-50 flex items-center gap-1.5`}>
                             <div className={`h-1.5 w-1.5 rounded-full bg-${row.color}-500`} />
                             {row.status}
                          </span>
                       </div>
                    </td>
                    <td className="py-6 px-10 text-right font-bold text-slate-400">{row.repl}</td>
                 </tr>
               ))}
            </tbody>
          </table>
       </div>
    </div>
   </div>
);

const PaymentMethodSummary = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Reports {'>'} Payment Method Summary</span>
          <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Payment Method Summary</h2>
          <p className="text-[13px] text-slate-400 font-medium mt-2">Real-time breakdown of transaction volumes by provider.</p>
       </div>
       <div className="flex items-end gap-3">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Timeframe</label>
             <div className="h-10 px-4 rounded-xl bg-white border border-slate-100 flex items-center justify-between gap-6 cursor-pointer">
                <span className="text-[12px] font-bold text-slate-600">Today, Oct 24</span>
             </div>
          </div>
          <button className="h-10 px-6 rounded-xl bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10">
             <Calendar size={14} /> Change Range
          </button>
       </div>
    </div>

    {/* Metric Cards Grid */}
   <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
       <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
          <div className="flex justify-between items-start">
             <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-white transition-all duration-300">
                <FileText size={24} />
             </div>
             <div className="text-emerald-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                +12.4% <ArrowUpRight size={14} />
             </div>
          </div>
          <div>
             <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Total Transactions</span>
             <div className="text-[40px] font-black text-[#0c1424] tracking-tighter mt-1">1,284</div>
          </div>
          <div className="absolute bottom-0 left-10 right-10 h-1 bg-slate-50 rounded-full overflow-hidden">
             <div className="h-full bg-slate-200 w-[60%]" />
          </div>
       </div>

       <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-48 relative group">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
             <Wallet size={24} />
          </div>
          <div className="absolute top-8 right-10 px-3 py-1 bg-slate-50 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest">Stable</div>
          <div>
             <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest text-[#0c1424]">Cash Total</span>
             <div className="text-[40px] font-black text-[#0c1424] tracking-tighter mt-1">$4,120.50</div>
          </div>
       </div>

       <div className="bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/10 flex flex-col justify-between h-48 relative overflow-hidden group">
          <div className="flex justify-between items-start">
             <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#5dc7ec]">
                <LayoutGrid size={24} />
             </div>
             <div className="px-3 py-1 bg-[#5dc7ec]/20 rounded-xl text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest">High Growth</div>
          </div>
          <div>
             <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">UPI/Digital Total</span>
             <div className="text-[40px] font-black tracking-tighter mt-1">$5,892.00</div>
          </div>
       </div>

       <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
          <div className="flex justify-between items-start">
             <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <PieChart size={24} />
             </div>
             <div className="text-emerald-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                +6.2% <ArrowUpRight size={14} />
             </div>
          </div>
          <div>
             <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Card Total (Tyro)</span>
             <div className="text-[40px] font-black text-[#0c1424] tracking-tighter mt-1">$18,450.25</div>
          </div>
          <div className="absolute bottom-0 left-10 right-10 h-1 bg-slate-50 rounded-full overflow-hidden">
             <div className="h-full bg-[#5dc7ec] w-[80%]" />
          </div>
       </div>
    </div>

    {/* Payment Breakdown Table */}
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
       <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#0c1424]">Payment Breakdown</h3>
          <div className="flex gap-2">
             <button className="h-10 px-6 rounded-xl bg-slate-50 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2">
                <Download size={14} /> Export PDF
             </button>
             <button className="h-10 px-6 rounded-xl bg-slate-50 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2">
                <Filter size={14} /> Filter
             </button>
          </div>
       </div>
       <table className="w-full">
          <thead>
             <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left py-4 px-10">Payment Method</th>
                <th className="text-left py-4 px-4">Provider</th>
                <th className="text-center py-4 px-4">Txn Count</th>
                <th className="text-center py-4 px-4">Total (AUD)</th>
                <th className="text-right py-4 px-10">% of Total</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {[
               { method: 'Cash', prov: 'Internal Vault', count: 342, total: '$4,120.50', pct: '14.5%', icon: Wallet },
               { method: 'Tyro Card', prov: 'Tyro EFTPOS', count: 721, total: '$18,450.25', pct: '64.8%', icon: PieChart },
               { method: 'Apple Pay', prov: 'Stripe / Apple', count: 118, total: '$3,240.10', pct: '11.4%', icon: TrendingUp },
             ].map((row, i) => (
               <tr key={i} className="hover:bg-slate-50/40 transition-colors text-[13px]">
                  <td className="py-6 px-10">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                           <row.icon size={18} />
                        </div>
                        <span className="font-black text-[#0c1424]">{row.method}</span>
                     </div>
                  </td>
                  <td className="py-6 px-4 font-bold text-slate-500">{row.prov}</td>
                  <td className="py-6 px-4 text-center font-black text-[#0c1424]">{row.count}</td>
                  <td className="py-6 px-4 text-center font-black text-[#0c1424]">{row.total}</td>
                  <td className="py-6 px-10">
                     <div className="flex items-center justify-end gap-6 text-right">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${row.pct === '64.8%' ? 'bg-[#0c1424]' : 'bg-slate-200'}`} style={{ width: row.pct }} />
                        </div>
                        <span className="w-10 font-black text-[#0c1424] text-[11px]">{row.pct}</span>
                     </div>
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  </div>
)

const ItemWiseSalesReport = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admin {' > '} Reports {' > '} Sales Report</span>
        <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Item-wise Sales Report</h2>
      </div>
      <div className="flex gap-3">
        <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2">
          <Calendar size={14} /> Last 30 Days
        </button>
        <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2">
          <LayoutGrid size={14} /> Category: All
        </button>
        <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2">
          <Filter size={14} /> Sort: Quantity
        </button>
        <button className="h-11 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-black/10">
          <Download size={14} /> Export PDF
        </button>
      </div>
    </div>

    {/* Metric Cards */}
   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      {/* Top Selling */}
      <div className="bg-[#0c1424] rounded-[32px] p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden group h-56 flex flex-col justify-between">
        <div className="relative z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">Top Selling Item</span>
          <h3 className="text-[28px] font-black leading-tight">Premium Wagyu Burger</h3>
          <p className="text-[#5dc7ec] text-[16px] font-bold mt-1">1,248 orders sold</p>
        </div>
        <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Contribution to Revenue</span>
          <span className="text-[14px] font-black">28.4%</span>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp size={80} />
        </div>
      </div>

      {/* Lowest Selling */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm h-56 flex flex-col justify-between group">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-6">Lowest Selling Item</span>
          <h3 className="text-[24px] font-black text-[#0c1424]">Fresh Lime Soda</h3>
          <p className="text-rose-500 text-[16px] font-bold mt-1">84 units sold</p>
        </div>
        <div className="flex items-center gap-3 text-amber-500 bg-amber-50 rounded-2xl px-4 py-3">
          <Clock size={16} />
          <span className="text-[11px] font-black uppercase tracking-widest">Consider seasonal promotion</span>
        </div>
      </div>

      {/* Avg Items Per Order */}
      <div className="bg-blue-50 rounded-[32px] p-8 border border-blue-100 h-56 flex flex-col justify-between relative overflow-hidden group">
        <div>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-6">Avg Items Per Order</span>
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] font-black text-[#0c1424] leading-none">3.4</span>
          </div>
          <p className="text-blue-500 text-[14px] font-bold mt-4 flex items-center gap-1">
            <ArrowUpRight size={16} /> 12% from last month
          </p>
        </div>
        <div className="absolute right-8 bottom-8 text-blue-200/50">
          <Package size={48} />
        </div>
      </div>
    </div>

    {/* Detailed Breakdown Table */}
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-[#0c1424]">Detailed Breakdown</h3>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <div className="h-3 w-3 rounded-full bg-[#5dc7ec]" />
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">High Margin ({'>'}30%)</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="h-3 w-3 rounded-full bg-rose-200" />
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Low Margin ({'<'}10%)</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="text-left py-4 px-10">Item Name</th>
              <th className="text-left py-4 px-4">Category</th>
              <th className="text-center py-4 px-4">Quantity Sold</th>
              <th className="text-center py-4 px-4">Revenue (AUD)</th>
              <th className="text-center py-4 px-4">COGS</th>
              <th className="text-center py-4 px-4">Margin (%)</th>
              <th className="text-right py-4 px-10">% Total Rev</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              { name: 'Premium Wagyu Burger', cat: 'Mains', qty: '1,248', rev: '$43,680', cogs: '$15,600', margin: '64.2%', pct: '28.4%', status: 'high' },
              { name: 'Truffle Arancini', cat: 'Starters', qty: '850', rev: '$15,300', cogs: '$4,250', margin: '72.2%', pct: '9.9%', status: 'high' },
              { name: 'Wild Mushroom Risotto', cat: 'Mains', qty: '540', rev: '$17,280', cogs: '$5,940', margin: '65.6%', pct: '11.2%', status: 'high' },
              { name: 'Fresh Lime Soda', cat: 'Drinks', qty: '2,105', rev: '$14,735', cogs: '$13,500', margin: '8.4%', pct: '9.5%', status: 'low' },
              { name: 'Dark Chocolate Fondant', cat: 'Desserts', qty: '320', rev: '$5,120', cogs: '$1,280', margin: '75.0%', pct: '3.3%', status: 'high' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/40 transition-colors text-[13px]">
                <td className="py-6 px-10 font-black text-[#0c1424]">{row.name}</td>
                <td className="py-6 px-4 font-bold text-slate-400">{row.cat}</td>
                <td className="py-6 px-4 text-center font-black text-[#0c1424]">{row.qty}</td>
                <td className="py-6 px-4 text-center font-black text-[#0c1424]">{row.rev}</td>
                <td className="py-6 px-4 text-center font-bold text-slate-400">{row.cogs}</td>
                <td className="py-6 px-4">
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black ${row.status === 'high' ? 'bg-blue-50 text-[#5dc7ec]' : 'bg-rose-50 text-rose-500'}`}>
                      {row.margin}
                    </span>
                  </div>
                </td>
                <td className="py-6 px-10 text-right font-black text-[#0c1424]">{row.pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* --- Main Reports Module --- */

type ReportType = 'daily' | 'monthly' | 'item' | 'category' | 'payment' | 'inventory';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');

  const navItems = [
    { id: 'daily', label: 'Daily Sales Report', icon: FileText, group: 'SALES REPORTS' },
    { id: 'monthly', label: 'Monthly Sales Report', icon: Calendar, group: 'SALES REPORTS' },
    { id: 'item', label: 'Item-wise Sales Report', icon: LayoutGrid, group: 'SALES REPORTS' },
    { id: 'category', label: 'Category-wise Sales Report', icon: PieChart, group: 'SALES REPORTS' },
    { id: 'payment', label: 'Payment Method Summary', icon: Wallet, group: 'FINANCIALS' },
    { id: 'inventory', label: 'Inventory Stock Report', icon: Package, group: 'FINANCIALS' },
  ];

  return (
   <div className="flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-[#f8fafc] shadow-sm lg:-m-8 lg:h-[calc(100vh-140px)] lg:flex-row">
       {/* Sidebar sub-nav */}
      <div className="flex flex-col border-r border-slate-100 bg-white pt-6 lg:w-[300px] lg:pt-10">
          <div className="px-8 flex flex-col gap-10">
             {['SALES REPORTS', 'FINANCIALS'].map(group => (
               <div key={group} className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4">{group}</h3>
                  <div className="space-y-1">
                    {navItems.filter(item => item.group === group).map(item => (
                       <button
                        key={item.id}
                        onClick={() => setActiveReport(item.id as ReportType)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeReport === item.id ? 'bg-blue-50 text-[#5dc7ec] shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-[#0c1424]'}`}
                       >
                          <item.icon size={18} strokeWidth={activeReport === item.id ? 2.5 : 2} />
                          <span className="text-[13px] font-bold text-left">{item.label}</span>
                       </button>
                    ))}
                  </div>
               </div>
             ))}
          </div>
       </div>

       {/* Sub-view Content */}
       <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-8 lg:p-12">
          <div className="mx-auto max-w-[1200px]">
             {activeReport === 'daily' && <DailySalesReport />}
             {activeReport === 'monthly' && <MonthlySalesReport />}
             {activeReport === 'category' && <CategorySalesReport />}
             {activeReport === 'inventory' && <InventoryStockReport />}
             {activeReport === 'payment' && <PaymentMethodSummary />}
             {activeReport === 'item' && <ItemWiseSalesReport />}
          </div>
       </div>
    </div>
  );
}
