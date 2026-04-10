import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  HelpCircle, 
  LogOut, 
  Plus, 
  ShoppingBag, 
  LayoutGrid, 
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import NewBillModal from './components/NewBillModal';

interface BillCardProps {
  id: string;
  type: 'DINE IN' | 'DELIVERY' | 'PICKUP';
  title: string;
  items: number;
  amount: string;
  time: string;
  kotSent: boolean;
  onClick: () => void;
}

const BillCard = ({ id, type, title, items, amount, time, kotSent, onClick }: BillCardProps) => (
  <button 
    onClick={onClick}
    className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-6">
      <span className="text-2xl font-black text-[#0c1424]">#{id}</span>
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
        type === 'DINE IN' ? 'bg-[#0c1424] text-[#5dc7ec]' : 
        type === 'DELIVERY' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
      }`}>
        {type}
      </span>
    </div>

    <div className="mb-8">
      <h4 className="text-xl font-black text-[#0c1424] leading-tight">{title}</h4>
      <p className="text-slate-400 font-medium text-sm mt-1">{items} items</p>
    </div>

    <div className="flex justify-between items-end mb-4">
      <div className="text-3xl font-black text-[#0c1424]">{amount}</div>
      <div className="text-xs font-bold text-slate-400 mb-1">{time} ago</div>
    </div>

    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider ${
      kotSent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
    }`}>
      {kotSent ? <CheckCircle2 size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
      KOT {kotSent ? 'Sent' : 'Not Sent'}
    </div>
  </button>
);

export default function POSEntryScreen() {
  const navigate = useNavigate();
  const [showNewBillModal, setShowNewBillModal] = useState(false);

  const mockBills: BillCardProps[] = [
    { id: '042', type: 'DINE IN', title: 'Table 5', items: 4, amount: '$64.50', time: '14 mins', kotSent: true, onClick: () => navigate('/pos/order-entry?type=dining') },
    { id: '045', type: 'DELIVERY', title: '12 Main St', items: 2, amount: '$32.00', time: '24 mins', kotSent: false, onClick: () => navigate('/pos/order-entry?type=delivery') },
    { id: '039', type: 'PICKUP', title: 'Sarah', items: 7, amount: '$112.10', time: '38 mins', kotSent: true, onClick: () => {} },
    { id: '048', type: 'DINE IN', title: 'Table 12', items: 3, amount: '$45.00', time: '2 mins', kotSent: false, onClick: () => {} },
    { id: '049', type: 'DINE IN', title: 'Table 2', items: 1, amount: '$14.50', time: 'Just now', kotSent: true, onClick: () => {} },
  ];

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter text-[#0b1b3d]">TILLCLOUD</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500">
            Station 01 — Main Terminal
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-[#0c1424] text-white flex items-center justify-center">
                <LayoutGrid size={18} />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Cashier</span>
                <span className="text-sm font-black text-[#0c1424]">Cashier #42</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
              <Bell size={20} />
            </button>
            <button className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
              <HelpCircle size={20} />
            </button>
            <button 
              onClick={() => navigate('/pos-login')}
              className="h-10 w-10 rounded-xl hover:bg-rose-50 flex items-center justify-center text-rose-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 relative min-h-0">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-5xl font-black text-[#0c1424] tracking-tight">Open Bills</h1>
            <button 
              onClick={() => setShowNewBillModal(true)}
              className="bg-[#0c1424] text-white h-16 px-10 rounded-2xl flex items-center gap-4 shadow-2xl shadow-black/20 hover:bg-black transition-all active:scale-95 group"
            >
              <div className="bg-[#5dc7ec] text-[#0c1424] h-7 w-7 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
                <Plus size={18} strokeWidth={3} />
              </div>
              <span className="text-lg font-black uppercase tracking-wider">New Bill</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-[#0c1424] flex items-center justify-center text-[#5dc7ec]">
                <ShoppingBag size={24} />
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bills Today</div>
                <div className="text-3xl font-black text-[#0c1424]">12</div>
              </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-[#0c1424] flex items-center justify-center text-[#5dc7ec]">
                <LayoutGrid size={24} />
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Revenue Today</div>
                <div className="text-3xl font-black text-[#0c1424]">$480.00</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockBills.map((bill) => (
              <BillCard key={bill.id} {...bill} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer Nav */}
      <footer className="h-20 bg-[#0c1424] flex items-center justify-between px-8 text-white relative z-30 shrink-0">
        <nav className="flex items-center gap-8 h-full">
           <button className="flex flex-col items-center gap-1 group">
              <ShoppingBag size={20} className="text-[#5dc7ec]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5dc7ec]">Orders</span>
              <div className="w-6 h-0.5 bg-[#5dc7ec] absolute bottom-0" />
           </button>
           <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <LayoutGrid size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tables</span>
           </button>
           <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <UtensilsCrossed size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
           </button>
        </nav>

        <div className="flex items-center gap-6 h-full">
           <button className="h-12 px-8 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10">
              Switch User
           </button>
           <HelpCircle size={20} className="text-white/40" />
        </div>
      </footer>

      {showNewBillModal && (
        <NewBillModal onClose={() => setShowNewBillModal(false)} />
      )}
    </div>
  );
}
