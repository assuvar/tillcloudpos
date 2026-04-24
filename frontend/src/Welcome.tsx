import { useState } from 'react';
import { ShoppingBag, Utensils, Users, Package, User, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FRONTEND_PERMISSIONS } from './permissions';

const NAV_ITEMS = [
  { id: 'pos', label: 'POS', icon: ShoppingBag, permission: FRONTEND_PERMISSIONS.BILLING_VIEW_OPEN },
  { id: 'menu', label: 'Menu', icon: Utensils, permission: FRONTEND_PERMISSIONS.MENU_HIDE_SHOW_ITEMS },
  { id: 'staff', label: 'Staff', icon: Users, permission: FRONTEND_PERMISSIONS.STAFF_VIEW },
  { id: 'inventory', label: 'Inventory', icon: Package, permission: FRONTEND_PERMISSIONS.INVENTORY_VIEW_STOCK },
  { id: 'customers', label: 'Customers', icon: User, permission: FRONTEND_PERMISSIONS.CUSTOMERS_VIEW_PROFILES },
  { id: 'reports', label: 'Reports', icon: BarChart3, permission: FRONTEND_PERMISSIONS.REPORTS_VIEW },
  { id: 'settings', label: 'Settings', icon: Settings, permission: FRONTEND_PERMISSIONS.SETTINGS_VIEW },
] as const;

export default function Welcome() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [accessDeniedLabel, setAccessDeniedLabel] = useState<string | null>(null);

  const handleNavigate = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.permission && !hasPermission(item.permission)) {
      setAccessDeniedLabel(item.label);
      setTimeout(() => setAccessDeniedLabel(null), 3000);
      return;
    }

    if (item.id === 'pos') {
      navigate('/pos/order-entry');
      return;
    }

    navigate('/dashboard', { state: { currentView: item.id } });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Access Denied Toast */}
      {accessDeniedLabel && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400">
            <Settings size={18} />
            <span className="font-bold text-sm">Access not provided for {accessDeniedLabel}</span>
          </div>
        </div>
      )}

      <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 flex-row items-center justify-around border-t border-white/10 bg-[#0c1424] px-4 py-2 lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[84px] lg:flex-col lg:items-center lg:justify-start lg:py-8">
        <nav className="flex flex-row gap-2 lg:flex-col lg:gap-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => handleNavigate(item)}
              className={`h-10 w-10 rounded-xl transition-all duration-200 flex items-center justify-center ${
                item.permission && !hasPermission(item.permission)
                  ? 'text-slate-600 opacity-50 cursor-not-allowed'
                  : 'text-slate-400 hover:bg-[#1e293b]/50 hover:text-white'
              }`}
            >
              <item.icon size={18} />
            </button>
          ))}
        </nav>
      </aside>

      <main className="mx-auto flex min-h-screen max-w-[980px] items-center justify-center px-6 pb-24 pt-6 lg:pl-[120px]">
        <div className="w-full rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-sm">
          <h1 className="text-4xl font-black tracking-tight text-[#0c1424]">Welcome to TillCloud POS</h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">Signed in as {user?.fullName || 'Cashier'}</p>
          
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm mx-auto">
             <button 
                onClick={() => navigate('/pos/order-entry')}
                className="col-span-2 h-14 rounded-2xl bg-[#0c1424] text-white font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-black/10"
             >
                <ShoppingBag size={20} />
                Open POS Terminal
             </button>
          </div>
        </div>
      </main>
    </div>
  );
}
