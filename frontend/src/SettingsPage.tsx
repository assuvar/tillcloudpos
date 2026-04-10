import { useEffect, useState } from 'react';
import { 
  Building2, 
  Receipt, 
  Wallet, 
  Star, 
  MessageSquare, 
  Monitor, 
  Upload,
  Phone,
  Mail,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Plus,
  Zap,
  Info,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  Bell
} from 'lucide-react';

/* --- Sub-Components --- */

const RestaurantProfile = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Restaurant Profile</h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">Manage your business details and branding for receipts and customer interactions.</p>
    </div>

   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      {/* Branding */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Edit3 size={18} className="text-[#5dc7ec]" />
          <h3 className="text-[16px] font-black text-[#0c1424]">Branding</h3>
        </div>
        <div className="flex flex-col items-center gap-6">
           <div className="h-32 w-32 rounded-[24px] bg-[#f8fafc] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-300">
                 <Upload size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Logo</span>
           </div>
           <div className="space-y-2 text-center">
              <h4 className="text-[13px] font-black text-[#0c1424]">Business Logo</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                 This logo will appear on your digital receipts, POS login screen, and customer portal. Recommended size: 512x512px.
              </p>
           </div>
           <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">PNG / JPG</span>
              <span className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">Max 5MB</span>
           </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="col-span-2 space-y-8">
        <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-[#5dc7ec]" />
            <h3 className="text-[16px] font-black text-[#0c1424]">Business Info</h3>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Name <span className="text-rose-500">*</span></label>
                <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                   <input type="text" defaultValue="The Azure Bistro" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                </div>
                <p className="text-[10px] italic text-slate-400 ml-1">Shown on receipts and POS login screen</p>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ABN</label>
                <div className="h-14 rounded-2xl bg-slate-50 border border-slate-100 px-6 flex items-center">
                   <input type="text" placeholder="XX XXX XXX XXX" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                </div>
                <p className="text-[10px] italic text-slate-400 ml-1">Required on receipts over $82.50</p>
             </div>
             <div className="col-span-2 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                <div className="h-28 rounded-[24px] bg-slate-50 border border-slate-100 p-6">
                   <textarea 
                     defaultValue="122 Harbor Way, Sydney NSW 2000, Australia" 
                     className="bg-transparent w-full h-full text-[14px] font-bold text-[#0c1424] outline-none resize-none"
                   />
                </div>
                <p className="text-[10px] italic text-slate-400 ml-1">Displayed on receipt footer</p>
             </div>
          </div>
        </div>
      </div>
    </div>

   <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
       {/* Communication */}
       <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#5dc7ec]">
                <MessageSquare size={16} />
             </div>
             <h3 className="text-[16px] font-black text-[#0c1424]">Communication</h3>
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center gap-4">
                   <Phone size={14} className="text-[#0c1424]" />
                   <input type="text" defaultValue="+61 2 9876 5432" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center gap-4">
                   <Mail size={14} className="text-[#0c1424]" />
                   <input type="text" defaultValue="manager@azurebistro.com.au" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                </div>
             </div>
          </div>
       </div>

       {/* Localization */}
       <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Zap size={16} />
             </div>
             <h3 className="text-[16px] font-black text-[#0c1424]">Localization</h3>
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Timezone</label>
                <div className="h-14 rounded-2xl bg-slate-50 border border-slate-100 px-6 flex items-center justify-between">
                   <span className="text-[14px] font-bold text-[#0c1424]">(GMT+10:00) Sydney, Melbourne, Canberra</span>
                   <ChevronDown size={14} className="text-slate-400" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                   <span className="text-[14px] font-black text-[#0c1424]">AUD ($)</span>
                </div>
             </div>
          </div>
       </div>
    </div>

    {/* Customer Experience */}
    <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-8">
       <div className="flex items-center gap-3">
          <Star size={18} className="text-[#5dc7ec]" />
          <h3 className="text-[16px] font-black text-[#0c1424]">Customer Experience</h3>
       </div>
       <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Thank-You Message</label>
          <div className="h-28 rounded-[24px] bg-[#f0f7ff] border border-transparent p-6">
             <textarea 
               defaultValue="Thank you for dining at The Azure Bistro. We hope you enjoyed your meal and look forward to welcoming you back soon!" 
               className="bg-transparent w-full h-full text-[14px] font-bold text-[#0c1424] outline-none resize-none leading-relaxed"
             />
          </div>
          <p className="text-[10px] italic text-slate-400 ml-1">Printed at the bottom of every receipt</p>
       </div>
    </div>
  </div>
);

const TerminalManagement = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Terminal Management</h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">Assign hardware, monitor transaction volume, and manage POS terminal accessibility across your venue.</p>
    </div>

    <div className="flex justify-end">
       <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-[11px] font-black uppercase text-[#0c1424] shadow-sm">
             <LayoutGrid size={14} /> Grid View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase text-slate-400">
             <List size={14} /> List View
          </button>
       </div>
    </div>

    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
       <table className="w-full">
          <thead>
             <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left py-4 px-10">Name</th>
                <th className="text-left py-4 px-4">Device Label</th>
                <th className="text-center py-4 px-4">Status</th>
                <th className="text-center py-4 px-4">Bills Today</th>
                <th className="text-right py-4 px-10">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {[
               { name: 'Main Bar 01', label: 'HW-A920-7712', status: 'Online', bills: 142, icon: Monitor },
               { name: 'Patio Express', label: 'HW-A920-8843', status: 'Online', bills: 89, icon: Monitor },
               { name: 'Kitchen Display 1', label: 'HW-KDS-0012', status: 'Idle', bills: '--', icon: Monitor },
             ].map((row, i) => (
               <tr key={i} className="hover:bg-slate-50/40 transition-colors text-[13px]">
                  <td className="py-6 px-10">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#5dc7ec] flex items-center justify-center">
                           <row.icon size={18} />
                        </div>
                        <span className="font-black text-[#0c1424] text-[15px]">{row.name}</span>
                     </div>
                  </td>
                  <td className="py-6 px-4 font-bold text-slate-400">{row.label}</td>
                  <td className="py-6 px-4">
                     <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${row.status === 'Online' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                           <div className={`h-1.5 w-1.5 rounded-full ${row.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                           {row.status}
                        </span>
                     </div>
                  </td>
                  <td className="py-6 px-4 text-center font-black text-[#0c1424]">{row.bills}</td>
                  <td className="py-6 px-10">
                     <div className="flex justify-end items-center gap-3">
                        <button className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                           <Edit3 size={16} />
                        </button>
                        <button className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-rose-300 hover:bg-rose-50 transition-colors">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>

    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-8 bg-blue-50/50 rounded-[32px] p-10 border border-blue-50 space-y-8">
          <h3 className="text-xl font-black text-[#0c1424]">Provision New Terminal</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Name</label>
                <div className="h-14 rounded-2xl bg-white border border-slate-100 px-6 flex items-center">
                   <input type="text" placeholder="e.g. Roof Terrace 01" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Label / ID</label>
                <div className="h-14 rounded-2xl bg-white border border-slate-100 px-6 flex items-center">
                   <input type="text" placeholder="e.g. HW-XXXX-XXXX" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                </div>
             </div>
          </div>
          <div className="flex justify-end items-center gap-4">
             <button onClick={() => window.dispatchEvent(new CustomEvent('switchSetting', { detail: 'tax' }))} className="h-12 px-8 text-[11px] font-black uppercase tracking-widest text-[#5dc7ec] bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors">Confirm Configuration</button>
             <button className="h-12 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0c1424] transition-colors">Discard</button>
             <button className="h-12 px-10 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-black/10">Add Terminal</button>
          </div>
       </div>

       <div className="col-span-4 bg-[#0c1424] rounded-[32px] p-8 text-white shadow-xl shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-[#5dc7ec]/20 flex items-center justify-center text-[#5dc7ec] mb-6">
                <LayoutGrid size={20} />
            </div>
            <h3 className="text-lg font-black mb-3">License Usage</h3>
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
               Your current plan includes 5 active terminals. You are using 3/5 available slots.
            </p>
          </div>
          <div className="space-y-4">
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#5dc7ec]" style={{ width: '60%' }} />
             </div>
             <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-500">60% Capacity</span>
                <span className="text-[#5dc7ec] cursor-pointer">Upgrade Plan</span>
             </div>
          </div>
       </div>
    </div>
  </div>
);

const TaxConfiguration = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Tax Configuration</h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">Control how GST is applied to your prices and receipts.</p>
    </div>

    <div className="grid grid-cols-12 gap-12">
       <div className="col-span-12 lg:col-span-8 space-y-12">
          <div className="space-y-6">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Select Tax Mode</h3>
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {[
                  { id: 'inc', label: 'GST Included', desc: 'The price already includes GST.', active: true, tag: 'Most Common', example: 'Example: $11.00 total -> GST $1.00' },
                  { id: 'top', label: 'GST Added on Top', desc: 'GST is added at checkout.', active: false, example: 'Example: $10.00 + $1.00 GST = $11.00' },
                  { id: 'no', label: 'No Tax', desc: 'No GST applied.', active: false, example: 'GST is zeroed out for all items.' },
                ].map((mode, i) => (
                   <div key={mode.id} className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer relative flex flex-col gap-6 ${mode.active ? 'border-[#5dc7ec] bg-white' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start">
                         <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${mode.active ? 'bg-blue-50 text-[#5dc7ec]' : 'text-slate-300 bg-white shadow-sm'}`}>
                            {i === 0 ? <CheckCircle2 size={20} /> : i === 1 ? <Plus size={20} /> : <Trash2 size={20} />}
                         </div>
                         {mode.tag && <span className="px-3 py-1 bg-[#0c1424] rounded-lg text-[9px] font-black text-white uppercase tracking-widest">{mode.tag}</span>}
                      </div>
                      <div>
                         <h4 className="text-[16px] font-black text-[#0c1424] mb-2">{mode.label}</h4>
                         <p className="text-[12px] text-slate-500 leading-relaxed">{mode.desc}</p>
                      </div>
                      <div className="mt-auto bg-slate-50 rounded-2xl p-6 text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest leading-relaxed">
                         {mode.example}
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Tax Rate (%)</h3>
             <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                   <div className="h-14 rounded-2xl bg-white border border-slate-100 px-6 flex items-center justify-between">
                      <input type="text" defaultValue="10" className="bg-transparent w-32 text-[20px] font-black text-[#0c1424] outline-none" />
                      <span className="text-[18px] font-black text-[#0c1424]">%</span>
                   </div>
                   <p className="text-[12px] text-slate-400 font-medium ml-1">Standard domestic GST rate is usually 10%.</p>
                </div>
             </div>
          </div>

          <div className="bg-[#f0f9ff] rounded-[32px] border border-blue-100 p-8 flex gap-6">
             <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#5dc7ec] flex-shrink-0">
                <Info size={20} />
             </div>
             <div className="space-y-4 flex-1">
                <div className="space-y-2">
                   <h4 className="text-[14px] font-black text-[#0c1424]">Important Compliance Warning</h4>
                   <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                      Tax regulations vary by jurisdiction. Please ensure your tax rates and modes comply with local legislation. 
                   </p>
                </div>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('switchSetting', { detail: 'payment' }))}
                  className="h-11 px-6 bg-[#0c1424] text-white rounded-xl text-[11px] font-black uppercase tracking-widest"
                >
                  Configure Payment Methods
                </button>
             </div>
          </div>
       </div>

       <div className="col-span-12 lg:col-span-4 space-y-8">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Live Receipt Preview</h3>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden flex flex-col p-8">
             <div className="flex flex-col items-center gap-2 mb-8">
                <h4 className="text-[15px] font-black text-[#0c1424] uppercase tracking-widest">TillCloud Store #42</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sydney, NSW 2000</span>
             </div>
             
             <div className="space-y-6 pt-6 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-center">
                   <span className="text-[13px] font-bold text-slate-400">Cloud Coffee Medium</span>
                   <span className="text-[13px] font-black text-[#0c1424]">$11.00</span>
                </div>
             </div>

             <div className="mt-20 space-y-4 pt-6 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-center text-[12px] font-bold text-slate-400">
                   <span>Subtotal</span>
                   <span>$10.00</span>
                </div>
                <div className="flex justify-between items-center text-[12px] font-bold text-slate-400">
                   <span>GST (10%)</span>
                   <span>$1.00</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                   <span className="text-[16px] font-black text-[#0c1424]">Total</span>
                   <span className="text-[18px] font-black text-[#5dc7ec]">$11.00</span>
                </div>
             </div>

             <div className="mt-12 flex flex-col items-center gap-6">
                <div className="w-full h-12 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                   <div className="w-[80%] h-full flex gap-1 items-center px-4">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="h-full bg-slate-400" style={{ width: i % 3 === 0 ? '4px' : '2px', opacity: 0.5 }} />
                      ))}
                   </div>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Thank you for your business</span>
             </div>
          </div>

          <div className="bg-[#0c1424] rounded-[32px] p-8 text-white">
             <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                The receipt preview updates in real-time as you switch between modes and adjust rates.
             </p>
          </div>
       </div>
    </div>
  </div>
);

const PaymentMethods = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Payment Methods</h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">Configure how your customers pay at checkout.</p>
    </div>

    <div className="space-y-8">
       {/* Cash */}
       <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Wallet size={24} />
             </div>
             <div>
                <h3 className="text-[16px] font-black text-[#0c1424]">Cash</h3>
                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Always Active</span>
             </div>
          </div>
          <div className="h-8 w-14 bg-[#0c1424] rounded-full relative p-1 cursor-pointer">
             <div className="h-6 w-6 bg-white rounded-full absolute right-1" />
          </div>
       </div>

       {/* Tyro */}
       <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                   <Monitor size={24} />
                </div>
                <div>
                   <h3 className="text-[16px] font-black text-[#0c1424]">Tyro EFTPOS</h3>
                   <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Not Connected</span>
                </div>
             </div>
             <button className="h-12 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-xl shadow-black/10">Connect Tyro</button>
          </div>

          <div className="space-y-6 pt-10 border-t border-slate-50">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Integration Details</h4>
             <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tyro Merchant ID</label>
                   <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                      <input type="text" placeholder="e.g. 1234567" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tyro Terminal ID</label>
                   <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                      <input type="text" placeholder="e.g. T12345" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
                   </div>
                </div>
             </div>
             <div className="flex justify-end gap-4 pt-4">
                <button className="h-12 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0c1424] transition-colors">Cancel</button>
                <button className="h-12 px-10 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest">Connect Terminal</button>
             </div>
          </div>
       </div>

       {/* Methods via Tyro */}
       <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Methods via Tyro</h4>
             <span className="px-3 py-1 bg-blue-50 text-[#5dc7ec] text-[9px] font-black uppercase tracking-widest rounded-lg">Enabled when connected</span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
             {[
               { id: 'card', label: 'Card Payments', icon: LayoutGrid },
               { id: 'tap', label: 'Tap to Pay', icon: Zap },
               { id: 'apple', label: 'Apple Pay', icon: Receipt },
               { id: 'google', label: 'Google Pay', icon: 'GOOGLE' },
             ].map((method) => (
               <div key={method.id} className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 group cursor-not-allowed opacity-50">
                  <div className="h-10 w-10 mb-4 flex items-center justify-center text-slate-300">
                     {method.icon === 'GOOGLE' ? <span className="font-black text-lg">GOOGLE</span> : <method.icon size={24} />}
                  </div>
                  <h5 className="text-[13px] font-black text-[#0c1424]">{method.label}</h5>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Enabled via Tyro</span>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#5dc7ec]">
                <Zap size={24} />
             </div>
             <div>
                <h3 className="text-[16px] font-black text-[#0c1424]">Split Payment</h3>
                <p className="text-[12px] text-slate-400 font-medium">Allow customers to split payments across multiple methods (e.g. part cash, part card) for a single order.</p>
             </div>
          </div>
          <div className="h-8 w-14 bg-[#0c1424] rounded-full relative p-1 cursor-pointer">
             <div className="h-6 w-6 bg-white rounded-full absolute right-1" />
          </div>
       </div>

       <div className="bg-[#0c1424] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 max-w-[400px] space-y-4">
             <h3 className="text-[28px] font-black tracking-tight">Seamless Checkout</h3>
             <p className="text-slate-400 text-[14px] leading-relaxed font-medium">
                Integrating Tyro reduces manual entry errors and speeds up your service by up to 30%.
             </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 p-12">
             <Monitor size={180} />
          </div>
          <div className="absolute top-1/2 right-12 -translate-y-1/2 space-y-4 animate-in slide-in-from-right-8 duration-700">
             <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#5dc7ec] shadow-2xl">
                <Wallet size={20} />
             </div>
          </div>
       </div>
    </div>
  </div>
);

const LoyaltyProgram = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">Loyalty Program</h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">Reward your customers and encourage repeat visits.</p>
    </div>

    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <h3 className="text-[16px] font-black text-[#0c1424]">Enable Loyalty Program</h3>
        <p className="text-[12px] text-slate-400 font-medium mt-1">Turning this off disables loyalty points on POS and customer receipts.</p>
      </div>
      <div className="h-8 w-14 bg-[#0c1424] rounded-full relative p-1 cursor-pointer">
         <div className="h-6 w-6 bg-white rounded-full absolute right-1" />
      </div>
    </div>

    <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-10">
       <h3 className="text-[16px] font-black text-[#0c1424]">Program Configuration</h3>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">POINTS EARNED PER DOLLAR SPENT</label>
             <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center gap-4">
                <span className="text-[14px] font-black text-slate-400">$</span>
                <input type="text" defaultValue="0.1" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
             </div>
             <p className="text-[10px] italic text-slate-400 ml-1">Example: 0.1 means 1 point for every $10 spent</p>
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">REDEMPTION UNIT (POINTS)</label>
             <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                <input type="text" defaultValue="50" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
             </div>
             <p className="text-[10px] italic text-slate-400 ml-1">Number of points required per redemption step</p>
          </div>
          <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">REDEMPTION VALUE (AUD)</label>
             <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center gap-4">
                <span className="text-[14px] font-black text-slate-400">$</span>
                <input type="text" defaultValue="5" className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none" />
             </div>
             <p className="text-[10px] italic text-slate-400 ml-1">Value of each redemption step</p>
          </div>
       </div>
    </div>

    <div className="bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/20 space-y-8">
       <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#5dc7ec]/20 flex items-center justify-center text-[#5dc7ec]">
             <CheckCircle2 size={16} />
          </div>
          <h3 className="text-[16px] font-black">Loyalty Preview</h3>
       </div>
       <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
          <h4 className="text-[20px] font-black text-[#5dc7ec] mb-2">Spend $100 = earn 10 points.</h4>
          <p className="text-[18px] font-black text-white/60">50 points = $5 discount.</p>
       </div>
    </div>
  </div>
);

const SMSCredits = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">SMS Credits</h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">Manage your SMS balance and track usage for digital receipts. Automatic top-ups and detailed logs help maintain seamless customer communication.</p>
    </div>

   <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
       <div className="bg-[#0c1424] rounded-[32px] p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
             <div className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest flex items-center gap-2">
                <div className="h-5 w-5 bg-[#5dc7ec]/20 rounded-md flex items-center justify-center">
                   <div className="h-2 w-2 rounded-full bg-[#5dc7ec]" />
                </div>
                Current Balance
             </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
               <span className="text-[56px] font-black leading-none">48</span>
               <span className="text-[16px] font-bold text-slate-400">Credits Remaining</span>
            </div>
            <p className="text-slate-500 text-[11px] font-medium mt-4">Each SMS receipt costs 1 credit (~$0.05 AUD). Your balance is low.</p>
          </div>
          <div className="flex gap-2 relative z-10 mt-6">
             <button className="h-10 px-6 rounded-full bg-[#5dc7ec] text-[#0c1424] text-[11px] font-black uppercase tracking-widest flex items-center gap-2">Auto-Top Up: Off</button>
             <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <Info size={16} />
             </button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5dc7ec]/5 rounded-full blur-3xl -mr-16 -mt-16" />
       </div>

       <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-48">
          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Last 30 Days Usage</span>
          <div>
             <div className="flex items-center justify-between">
                <span className="text-[40px] font-black text-[#0c1424]">1,240</span>
                <span className="text-rose-500 text-[14px] font-black flex items-center gap-1"><TrendingUp size={16} /> 12%</span>
             </div>
          </div>
          <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
             <div className="h-full bg-[#0c1424] w-[70%]" />
          </div>
       </div>

       <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-48">
          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Avg. Delivery Rate</span>
          <div>
             <div className="flex items-center justify-between">
                <span className="text-[40px] font-black text-[#0c1424]">99.8%</span>
                <span className="text-emerald-500 text-[11px] font-black uppercase tracking-widest border border-emerald-100 rounded-full px-3 py-1 flex items-center gap-1">
                   <CheckCircle2 size={12} /> Stable
                </span>
             </div>
          </div>
          <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 w-[99%]" />
          </div>
       </div>
    </div>

    <div className="bg-blue-50/50 rounded-[32px] p-8 border border-blue-50 flex items-center justify-between">
       <div className="flex items-center gap-6">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#5dc7ec]">
             <Bell size={24} />
          </div>
          <div className="flex flex-col">
             <h3 className="text-[15px] font-black text-[#0c1424]">Low Balance Alert</h3>
             <p className="text-[12px] text-slate-500 font-medium">Notify me when balance falls below 50 credits.</p>
          </div>
       </div>
       <div className="h-8 w-14 bg-[#5dc7ec] rounded-full relative p-1 cursor-pointer">
          <div className="h-6 w-6 bg-white rounded-full absolute right-1 shadow-sm" />
       </div>
    </div>

    <div className="space-y-8">
       <h3 className="text-[18px] font-black text-[#0c1424] px-2">Purchase Credits</h3>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {[
            { id: 'starter', label: 'Starter', credits: '100 Credits', price: '~$5 AUD', desc: 'Best for small cafes', icon: MessageSquare },
            { id: 'standard', label: 'Standard', credits: '500 Credits', price: '~$22 AUD', desc: 'Best for regular restaurants', icon: Zap, tag: 'Popular' },
            { id: 'pro', label: 'Pro', credits: '1000 Credits', price: '~$40 AUD', desc: 'Best for high-volume businesses', icon: LayoutGrid },
          ].map((pkg) => (
             <div key={pkg.id} className={`bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center relative group hover:border-[#5dc7ec] transition-all cursor-pointer ${pkg.tag ? 'ring-2 ring-[#5dc7ec]' : ''}`}>
                {pkg.tag && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5dc7ec] text-[#0c1424] text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Popular</div>}
                <div className={`h-16 w-16 rounded-[24px] mb-8 flex items-center justify-center text-[#5dc7ec] ${pkg.tag ? 'bg-[#5dc7ec]/10' : 'bg-slate-50 group-hover:bg-[#5dc7ec]/10'}`}>
                   <pkg.icon size={28} />
                </div>
                <h4 className="text-[15px] font-black text-slate-400 uppercase tracking-widest mb-1">{pkg.label}</h4>
                <div className="text-[28px] font-black text-[#0c1424] mb-1">{pkg.credits}</div>
                <span className="text-[12px] font-black text-slate-400">{pkg.price}</span>
                <p className="text-[11px] text-slate-400 font-medium mt-4 mb-10 max-w-[140px] leading-relaxed">{pkg.desc}</p>
                <button className={`w-full h-14 rounded-full border-2 text-[12px] font-black uppercase tracking-widest transition-all ${pkg.tag ? 'bg-[#5dc7ec] border-transparent text-[#0c1424]' : 'bg-white border-slate-100 text-[#0c1424] hover:border-[#0c1424]'}`}>Purchase Credits</button>
             </div>
          ))}
       </div>
    </div>
  </div>
);

/* --- Main Settings Module --- */

type SettingType = 'profile' | 'tax' | 'payment' | 'loyalty' | 'sms' | 'terminals';

export default function SettingsPage() {
  const [activeSetting, setActiveSetting] = useState<SettingType>('profile');

  // Handle cross-component navigation within settings
   useEffect(() => {
    const handleSwitch = (e: any) => setActiveSetting(e.detail);
    window.addEventListener('switchSetting', handleSwitch);
    return () => window.removeEventListener('switchSetting', handleSwitch);
   }, []);

  const navItems = [
    { id: 'profile', label: 'Restaurant profile', icon: Building2 },
    { id: 'tax', label: 'Tax Configuration', icon: Receipt },
    { id: 'payment', label: 'Payment methods', icon: Wallet },
    { id: 'loyalty', label: 'Loyalty Program', icon: Star },
    { id: 'sms', label: 'SMS Credits', icon: MessageSquare },
    { id: 'terminals', label: 'Terminals', icon: Monitor },
  ];

  return (
   <div className="flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-[#f8fafc] shadow-sm lg:-m-8 lg:h-[calc(100vh-140px)] lg:flex-row">
       {/* Sidebar sub-nav */}
      <div className="flex flex-col border-r border-slate-100 bg-white pt-6 lg:w-[300px] lg:pt-10">
          <div className="px-8 flex flex-col gap-10">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4">CONFIGURATION</h3>
                <div className="space-y-1">
                  {navItems.map(item => (
                     <button
                      key={item.id}
                      onClick={() => setActiveSetting(item.id as SettingType)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeSetting === item.id ? 'bg-blue-50 text-[#5dc7ec] shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-[#0c1424]'}`}
                     >
                        <item.icon size={18} strokeWidth={activeSetting === item.id ? 2.5 : 2} />
                        <span className="text-[13px] font-bold text-left">{item.label}</span>
                     </button>
                  ))}
                </div>
             </div>
          </div>
       </div>

       {/* Sub-view Content */}
       <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-8 lg:p-12">
          <div className="mx-auto max-w-[1200px]">
             {activeSetting === 'profile' && <RestaurantProfile />}
             {activeSetting === 'terminals' && <TerminalManagement />}
             {activeSetting === 'tax' && <TaxConfiguration />}
             {activeSetting === 'payment' && <PaymentMethods />}
             {activeSetting === 'loyalty' && <LoyaltyProgram />}
             {activeSetting === 'sms' && <SMSCredits />}
          </div>
       </div>
    </div>
  );
}
