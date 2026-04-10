import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Minus,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { usePosCart } from './context/PosCartContext';

export default function PosTerminal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { menuItems, billItems, totalItems, billTotal, addItemToBill, removeItem, updateQuantity, sendToKitchen, isLoading, error } = usePosCart();
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => ['All', ...Array.from(new Set(menuItems.map((item) => item.category)))], [menuItems]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = !normalizedSearch || [item.name, item.description, item.category].some((field) => field.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2200);
  };

  const handleItemClick = (itemId: string) => {
    const item = menuItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    const added = addItemToBill(item);
    if (!added) {
      showToast(item.isActive ? 'Item is unavailable' : 'Item is inactive');
      return;
    }

    showToast(`${item.name} added to bill`);
  };

  const handleSaveAndSend = async () => {
    const result = await sendToKitchen(billItems);
    if (!result.success) {
      showToast('Add items before sending to kitchen');
      return;
    }

    showToast('Order sent to kitchen');
  };

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        from: location.pathname,
        billItems,
        totalItems,
        billTotal,
      },
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="mx-auto max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-[28px] bg-[#0c1424] px-6 py-5 text-white shadow-2xl shadow-black/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#5dc7ec]">POS Terminal</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{user?.businessName || 'Restaurant'} ordering station</h1>
              <p className="mt-1 text-sm text-slate-300">Signed in as {user?.fullName || 'Cashier'}.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  void logout();
                }}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/90 hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.8fr]">
          <section className="rounded-[32px] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#0c1424]">Menu Items</h2>
                <p className="mt-1 text-sm text-slate-500">Tap an active item to add it to the bill. Inactive and out-of-stock items are blocked.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search menu items"
                    className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-sky-300 focus:bg-white"
                  />
                </div>
                <button className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm">
                  <Clock3 size={16} />
                  Table A1
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${selectedCategory === category ? 'bg-[#0c1424] text-white shadow-lg shadow-black/10' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {category}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50/60 p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#0c1424] border-opacity-30" />
                <p className="mt-4 text-sm font-bold text-slate-500">Loading menu items...</p>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-[24px] border border-rose-100 bg-rose-50 p-6">
                <div className="text-sm font-bold text-rose-700">⚠️ Error loading menu items</div>
                <p className="mt-2 text-sm text-rose-600">{error}</p>
                <button
                  type="button"
                  onClick={() => {/* Reload menu items */}}
                  className="mt-4 px-4 py-2 rounded-lg bg-rose-100 text-rose-700 font-bold text-sm hover:bg-rose-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => {
                const unavailable = !item.isActive || item.stock === 0 || item.isOutOfStock;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    disabled={unavailable}
                    className={`group overflow-hidden rounded-[26px] border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${unavailable ? 'cursor-not-allowed border-slate-100 opacity-55' : 'border-slate-100 hover:border-sky-200'}`}
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                      <div className="absolute left-4 top-4 flex gap-2">
                        {!item.isActive && <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">Inactive</span>}
                        {item.stock === 0 || item.isOutOfStock ? <span className="rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">Out of stock</span> : null}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">{item.category}</div>
                          <div className="mt-1 text-lg font-black leading-tight">{item.name}</div>
                        </div>
                        <div className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-black backdrop-blur-sm">{formatCurrency(item.price)}</div>
                      </div>
                    </div>

                    <div className="space-y-3 p-5">
                      <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Stock {item.stock}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${unavailable ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                          {unavailable ? 'Blocked' : 'Add to bill'}
                          {!unavailable && <Plus size={12} />}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>            )}          </section>

          <aside className="rounded-[32px] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#0c1424]">Bill Panel</h2>
                <p className="mt-1 text-sm text-slate-500">Real-time bill totals and action controls.</p>
              </div>
              <div className="rounded-2xl bg-[#f0f9ff] px-4 py-3 text-right">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Items</div>
                <div className="text-2xl font-black text-[#0c1424]">{totalItems}</div>
              </div>
            </div>

            <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
              {billItems.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                  <ShoppingBag className="h-10 w-10 text-slate-300" />
                  <div className="mt-4 text-lg font-black text-[#0c1424]">Bill is empty</div>
                  <p className="mt-2 max-w-[240px] text-sm text-slate-500">Select menu items to start building the current order.</p>
                </div>
              ) : (
                billItems.map((item) => (
                  <article key={item.id} className="rounded-[22px] border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[15px] font-black text-[#0c1424]">{item.name}</div>
                        <div className="mt-1 text-xs font-bold text-slate-500">{formatCurrency(item.price)} each</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-rose-500"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 'decrease')}
                          className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus size={16} />
                        </button>
                        <div className="min-w-12 px-3 text-center text-sm font-black text-[#0c1424]">{item.quantity}</div>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 'increase')}
                          className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Line total</div>
                        <div className="text-lg font-black text-[#0c1424]">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-6 rounded-[26px] bg-[#0c1424] p-5 text-white shadow-xl shadow-black/10">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Subtotal</span>
                <span className="font-black text-white">{formatCurrency(billTotal)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                <span>Service charges</span>
                <span className="font-black text-white">Included</span>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">Bill Total</div>
                  <div className="text-3xl font-black tracking-tight">{formatCurrency(billTotal)}</div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#5dc7ec]">
                  <BadgePercent size={14} />
                  GST ready
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSaveAndSend}
                disabled={billItems.length === 0}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-black uppercase tracking-[0.14em] text-[#0c1424] shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles size={16} />
                Save & Send
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={billItems.length === 0}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#0c1424] text-sm font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-black/15 transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Checkout
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
              <span>Live updates active</span>
              <span className="inline-flex items-center gap-2 text-emerald-600"><CheckCircle2 size={14} /> {location.pathname}</span>
            </div>
          </aside>
        </div>
      </div>

      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0c1424] px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-black/20">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
