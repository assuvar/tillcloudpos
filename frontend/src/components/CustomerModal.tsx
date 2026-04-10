import { useState } from 'react';
import { 
  X, 
  UserPlus, 
  User, 
  Phone
} from 'lucide-react';

interface CustomerModalProps {
  onClose: () => void;
  onSelect: (customer: {name: string, id: string}) => void;
}

export default function CustomerModal({ onClose, onSelect }: CustomerModalProps) {
  const [searchTerm, setSearchTerm] = useState('9876543210');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-3xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-[#0c1424]">Search Customer</h2>
            <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
               <Phone size={20} />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter phone number or name"
              className="w-full h-20 pl-16 pr-6 rounded-[24px] bg-[#f0f7ff] border-none focus:ring-2 focus:ring-sky-500/20 text-xl font-bold placeholder:text-slate-300 transition-all"
            />
          </div>

          {/* Results Area */}
          <div className="min-h-[400px]">
            {searchTerm === '9876543210' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#f8fafc] rounded-[32px] p-6 flex items-center justify-between border border-slate-50 group hover:border-sky-100 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-[#0c1424] text-white flex items-center justify-center font-black text-xl">
                      SJ
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-[#0c1424]">Sarah Johnson</h4>
                      <p className="text-slate-400 font-bold text-sm">9874563210</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                       <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Loyalty</div>
                       <div className="text-sm font-black text-[#0c1424]">120 pts</div>
                    </div>
                    <button 
                      onClick={() => onSelect({name: 'Sarah Johnson', id: 'SJ001'})}
                      className="bg-white border-2 border-slate-100 h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-[#0c1424] hover:bg-[#0c1424] hover:text-white transition-all shadow-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
                 <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-100 p-12 text-center w-full relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                       <User size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-lg mb-10">No customer found with "{searchTerm}"</p>
                    
                    <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm text-left max-w-md mx-auto relative overflow-hidden">
                       <h5 className="text-sm font-black text-[#0c1424] uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Quick Create</h5>
                       <div className="space-y-4 relative z-10">
                          <input type="text" placeholder="Full Name" className="w-full h-14 px-6 rounded-2xl bg-[#f0f7ff] border-none text-sm font-bold placeholder:text-slate-300" />
                          <input type="text" placeholder="Phone" className="w-full h-14 px-6 rounded-2xl bg-[#f0f7ff] border-none text-sm font-bold placeholder:text-slate-300" />
                          <button className="w-full h-14 bg-[#4adeff] text-[#0c1424] rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-400/20 mt-4">
                             <UserPlus size={18} strokeWidth={3} />
                             Create New Customer
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 mt-12 bg-slate-50/50 p-2 rounded-[32px]">
             <button 
               onClick={onClose}
               className="flex-1 h-16 rounded-[28px] bg-white text-slate-700 font-black text-[13px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
             >
                Skip
             </button>
             <button 
               onClick={onClose}
               className="flex-[1.5] h-16 rounded-[28px] bg-[#0c1424] text-white font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-black transition-all"
             >
                Close
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
