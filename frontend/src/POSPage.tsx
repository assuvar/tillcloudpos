import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  Clock3,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Minus,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';

export default function POSPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    menuItems, 
    billItems, 
    totalItems, 
    billTotal, 
    addItemToBill, 
    removeItem, 
    updateQuantity, 
    sendToKitchen, 
    isLoading 
  } = usePosCart();
  
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => ['All', ...Array.from(new Set(menuItems.map((item) => item.category)))], [menuItems]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = !normalizedSearch || 
        [item.name, item.description, item.category].some((field) => field.toLowerCase().includes(normalizedSearch));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2200);
  };

  const handleItemClick = (itemId: string) => {
    const item = menuItems.find((entry) => entry.id === itemId);
    if (!item || !item.isActive || item.stock === 0 || item.isOutOfStock) {
      showToast(item?.isActive ? 'Item out of stock' : 'Item is inactive');
      return;
    }
    addItemToBill(item);
    showToast(`${item.name} added`);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);

  const handleLogout = async () => {
    await logout();
    navigate('/pos-login');
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* POS Header */}
      <header className="h-20 bg-[#0c1424] text-white flex items-center justify-between px-6 shrink-0 z-20 shadow-xl">
        <div className="flex items-center gap-8">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5dc7ec]">TillCloud POS</div>
            <div className="text-xl font-black">{user?.businessName || 'Restaurant'}</div>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <Clock3 size={16} className="text-[#5dc7ec]" />
                <span className="text-sm font-bold">Session: Front Counter</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-slate-400">Cashier</span>
            <span className="text-sm font-black">{user?.fullName || 'John Doe'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 transition-all text-white/70 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main 3-Column Content */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Left Column: Categories & Search (25%) */}
        <aside className="w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex-1 flex flex-col">
            <h2 className="text-lg font-black text-[#0c1424] mb-4">Explore Menu</h2>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find an item..."
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#f8fafc] border-none focus:ring-2 focus:ring-sky-500/20 text-sm font-bold"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full h-14 px-5 rounded-2xl flex items-center justify-between text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-[#0c1424] text-white shadow-lg' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                  {cat}
                  {selectedCategory === cat && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Column: Menu Grid (50%) */}
        <section className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 min-h-full">
            <div className="flex items-center justify-between mb-8">
               <div>
                 <h2 className="text-2xl font-black text-[#0c1424]">{selectedCategory}</h2>
                 <p className="text-sm font-medium text-slate-400">Total {visibleItems.length} items available</p>
               </div>
            </div>

            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-12 w-12 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin" />
                  <p className="mt-4 font-bold text-slate-400">Loading Menu...</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map((item) => {
                  const unavailable = !item.isActive || item.stock === 0 || item.isOutOfStock;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      disabled={unavailable}
                      className={`group relative h-48 rounded-[32px] overflow-hidden border transition-all text-left flex flex-col p-6 ${unavailable ? 'bg-slate-50 border-slate-100 opacity-60 grayscale cursor-not-allowed' : 'bg-white border-slate-100 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1'}`}
                    >
                      <div className="z-10 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.category}</span>
                          {!unavailable && <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Plus size={16} /></div>}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-[#0c1424] leading-tight mb-1">{item.name}</h4>
                          <p className="text-xs font-bold text-slate-400 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                           <div className="text-xl font-black text-sky-600">{formatCurrency(item.price)}</div>
                           <div className="text-[10px] font-black text-slate-400 uppercase">Stock: {item.stock}</div>
                        </div>
                      </div>
                      
                      {/* Decorative background image mask */}
                      <div className="absolute right-0 bottom-0 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
                        <ShoppingBag size={96} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Cart & Summary (25%) */}
        <aside className="w-[400px] flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-[#0c1424]">Current Bill</h2>
              <div className="h-8 w-8 rounded-full bg-[#f0f9ff] flex items-center justify-center text-sky-600 font-black text-xs">{totalItems}</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {billItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 grayscale opacity-20">
                  <ShoppingBag size={64} className="mb-4" />
                  <p className="font-bold text-sm">Your bill is empty</p>
                </div>
              ) : (
                billItems.map((item) => (
                  <div key={item.id} className="bg-[#f8fafc]/50 border border-slate-50 p-4 rounded-[24px] flex flex-col gap-4">
                    <div className="flex justify-between">
                       <span className="font-black text-sm text-[#0c1424]">{item.name}</span>
                       <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-full p-1 shadow-sm">
                          <button onClick={() => updateQuantity(item.id, 'decrease')} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-50"><Minus size={14}/></button>
                          <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 'increase')} className="h-8 w-8 rounded-full flex items-center justify-center bg-[#0c1424] text-white"><Plus size={14}/></button>
                       </div>
                       <div className="text-right">
                          <span className="text-xs font-bold text-slate-400 block tracking-tighter">Total</span>
                          <span className="font-black text-sm">{formatCurrency(item.price * item.quantity)}</span>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                     <span>Subtotal</span>
                     <span>{formatCurrency(billTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                     <span>Service Charges</span>
                     <span className="text-emerald-500">FREE</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#f0f9ff] p-5 rounded-3xl">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Total Bill</span>
                        <span className="text-3xl font-black text-[#0c1424]">{formatCurrency(billTotal)}</span>
                     </div>
                     <BadgePercent size={32} className="text-sky-100 rotate-12" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => sendToKitchen(billItems)}
                    disabled={billItems.length === 0}
                    className="h-16 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    Kitchen
                  </button>
                  <button 
                    onClick={() => navigate('/checkout', { state: { billItems, billTotal } })}
                    disabled={billItems.length === 0}
                    className="h-16 rounded-2xl bg-[#0c1424] text-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-black transition-all disabled:opacity-50"
                  >
                    Checkout
                    <ArrowRight size={16} />
                  </button>
               </div>
            </div>
          </div>
        </aside>

      </main>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0c1424] text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl z-50 animate-bounce-in">
           {toastMessage}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes bounce-in {
          0% { transform: translate(-50%, 100px) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}
