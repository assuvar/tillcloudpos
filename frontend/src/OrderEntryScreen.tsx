import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Bell, 
  HelpCircle, 
  LogOut, 
  Plus, 
  ShoppingBag, 
  LayoutGrid, 
  UtensilsCrossed,
  Info,
  CheckCircle2,
  Users,
  CreditCard,
  Split,
  Send
} from 'lucide-react';
import { usePosCart } from './context/PosCartContext';
import CustomerModal from './components/CustomerModal';

export default function OrderEntryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'dining';
  const detail = searchParams.get('detail') || '';
  
  const { menuItems, billItems, billTotal, addItemToBill, removeItem } = usePosCart();
  const [selectedCategory, setSelectedCategory] = useState('Mains');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customer, setCustomer] = useState<{name: string, id: string} | null>(null);

  const categories = ['Starters', 'Mains', 'Desserts', 'Breakfast', 'Dinner', 'Lunch', 'Snacks'];

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);

  const handleItemClick = (item: any) => {
    if (!item.isActive || item.stock === 0) return;
    addItemToBill(item);
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter text-[#0b1b3d]">TILLCLOUD</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="text-sm font-bold text-slate-400">Order Entry</div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500">
            Station 01 — Main Terminal
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-[#0c1424] text-white flex items-center justify-center">
                <Users size={18} />
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

      {/* Main Content (3 Columns) */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6 min-h-0 pt-24 pb-24">
        
        {/* Column 1: Menu Grid (Left) */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-1 pb-4 custom-scrollbar">
            {menuItems.filter(i => i.category === selectedCategory || selectedCategory === 'Mains').map((item) => {
              const outOfStock = item.stock === 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={outOfStock}
                  className={`group bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm text-left transition-all hover:shadow-xl hover:-translate-y-1 ${outOfStock ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  <div className="h-44 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {outOfStock && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c1424] text-[#5dc7ec] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-8 ring-white/10">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="text-xl font-black text-[#0c1424] leading-tight flex-1">{item.name}</h4>
                       <button className="text-slate-300 hover:text-[#0c1424] transition-colors"><Info size={20} /></button>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mb-4">{item.description || '4 pcs'}</p>
                    <div className="text-2xl font-black text-[#0c1424]">{formatCurrency(item.price)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Column 2: Categories (Narrow Middle) */}
        <aside className="w-48 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 overflow-y-auto shrink-0 custom-scrollbar min-h-0">
          <h3 className="text-lg font-black text-[#0c1424] mb-6 px-1 tracking-tight">Categories</h3>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${selectedCategory === cat ? 'bg-[#f0f9ff] text-[#0c1424] border border-sky-100' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <div className="text-xs font-black uppercase tracking-widest leading-none">{cat}</div>
                <div className="text-[10px] font-bold text-[#5dc7ec]">22 ITEMS</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Column 3: Bill Panel (Right) */}
        <aside className="w-[450px] bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden shrink-0 min-h-0">
          <div className="p-8 border-b border-slate-50">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#0c1424] flex items-center gap-3 capitalize">
                  {type.replace('-', ' ')} • {type === 'dining' ? `Table ${detail || '5'}` : detail || 'Walk-in'}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-slate-400">Order #042</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-xs font-bold text-slate-400">{customer?.name || 'Guest User'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <CheckCircle2 size={12} strokeWidth={3} />
                KOT Sent
              </div>
            </div>

            <button 
              onClick={() => setShowCustomerModal(true)}
              className="w-full h-14 bg-[#0c1424] text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-black/15 hover:bg-black transition-all active:scale-95"
            >
              <Plus size={18} />
              Add Customer
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {billItems.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="font-black text-sm uppercase tracking-widest">Bag is Empty</p>
               </div>
            ) : (
              billItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <span className="text-lg font-black text-[#0c1424]">{item.quantity} × {item.name}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-400 mt-1">
                       {item.name.includes('Salmon') ? 'No lemon, extra butter' : 'Medium Rare, peppercorn sauce'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#0c1424]">{formatCurrency(item.price * item.quantity)}</div>
                    <button onClick={() => removeItem(item.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-100">
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 px-1">
                <span>Subtotal</span>
                <span>$118.00</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 px-1">
                <span>Tax (8%)</span>
                <span>$9.44</span>
              </div>
              <div className="flex justify-between items-end mt-4 px-1">
                <div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Due</span>
                  <span className="text-4xl font-[950] text-[#0c1424] tracking-tight">$115.64</span>
                </div>
                <div className="bg-[#0c1424] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Ready to pay
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="h-16 rounded-[24px] bg-[#dcf0ff] text-blue-700 flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-widest hover:bg-blue-200 transition-all">
                <Split size={18} />
                Split Bill
              </button>
              <button 
                className="h-16 rounded-[24px] bg-[#0c1424] text-white flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10"
                onClick={() => navigate('/Checkout', { state: { billItems, billTotal } })}
              >
                <CreditCard size={18} />
                Pay
              </button>
            </div>
            
            <button className="w-full h-16 mt-4 rounded-[24px] bg-[#4adeff] text-[#0c1424] flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest shadow-xl shadow-sky-400/20 hover:brightness-95 transition-all">
              <Send size={18} strokeWidth={3} />
              Save & Send to Kitchen
            </button>
          </div>
        </aside>
      </main>

      {/* Footer Nav */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-[#0c1424] flex items-center justify-between px-8 text-white z-30 shrink-0">
        <nav className="flex items-center gap-8 h-full">
           <button onClick={() => navigate('/pos')} className="flex flex-col items-center gap-1 group">
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

      {showCustomerModal && (
        <CustomerModal 
          onClose={() => setShowCustomerModal(false)} 
          onSelect={(c) => {
            setCustomer(c);
            setShowCustomerModal(false);
          }}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
