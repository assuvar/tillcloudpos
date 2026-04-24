import {
  Cloud,
  Home,
  Utensils,
  Users,
  Package,
  User,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  LayoutGrid,
  LucideIcon,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_VIEWS } from '../dashboardNavigation';
import { FRONTEND_PERMISSIONS } from '../permissions';

function SidebarIcon({
  icon: Icon,
  active = false,
  label,
  onClick,
  hasAccess = true,
}: {
  icon: LucideIcon;
  active?: boolean;
  label?: string;
  onClick?: () => void;
  hasAccess?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
        active
          ? 'bg-[#1e293b] text-[#5dc7ec] shadow-lg shadow-black/20'
          : hasAccess 
            ? 'text-slate-400 hover:text-white hover:bg-[#1e293b]/50'
            : 'text-slate-600 opacity-50 grayscale'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      {!hasAccess && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white border-2 border-[#0c1424]">
          <ShieldAlert size={8} strokeWidth={3} />
        </div>
      )}
      {label ? <span className="sr-only">{label}</span> : null}
    </button>
  );
}

const VIEW_ICONS: Record<string, LucideIcon> = {
  home: Home,
  orders: LayoutGrid,
  menu: Utensils,
  staff: Users,
  inventory: Package,
  customers: User,
  reports: BarChart3,
  settings: Settings,
};

const VIEW_PERMISSION: Record<string, string | null> = {
  home: FRONTEND_PERMISSIONS.DASHBOARD_VIEW,
  orders: FRONTEND_PERMISSIONS.BILLING_VIEW_OPEN,
  menu: FRONTEND_PERMISSIONS.MENU_HIDE_SHOW_ITEMS,
  staff: FRONTEND_PERMISSIONS.STAFF_VIEW,
  inventory: FRONTEND_PERMISSIONS.INVENTORY_VIEW_STOCK,
  customers: FRONTEND_PERMISSIONS.CUSTOMERS_VIEW_PROFILES,
  reports: FRONTEND_PERMISSIONS.REPORTS_VIEW,
  settings: FRONTEND_PERMISSIONS.SETTINGS_VIEW,
};

interface UnifiedLayoutProps {
  children: React.ReactNode;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children, currentView = 'home', onViewChange }) => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [accessDeniedLabel, setAccessDeniedLabel] = useState<string | null>(null);
  const isCashier = user?.role === 'CASHIER';

  const handleLogout = () => {
    void logout();
    navigate('/login');
  };

  const handleViewClick = (viewId: string) => {
    const permission = VIEW_PERMISSION[viewId] || null;
    const bypassPermission = isCashier && viewId === 'home';

    if (!bypassPermission && permission && !hasPermission(permission)) {
      setAccessDeniedLabel(DASHBOARD_VIEWS.find(v => v.id === viewId)?.label || viewId);
      setTimeout(() => setAccessDeniedLabel(null), 3000);
      return;
    }

    if (viewId === 'orders') {
      if (onViewChange) onViewChange('orders');
      navigate('/pos');
      return;
    }

    if (onViewChange) {
      onViewChange(viewId);
    } else {
      navigate('/dashboard', { state: { currentView: viewId } });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[14px] text-slate-900">
      {/* Access Denied Toast */}
      {accessDeniedLabel && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400">
            <ShieldAlert size={18} />
            <span className="font-bold text-sm">Access not provided for {accessDeniedLabel}</span>
          </div>
        </div>
      )}

      <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 flex-row items-center justify-around border-t border-white/10 bg-[#0c1424] px-4 py-2 lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[84px] lg:flex-col lg:items-center lg:justify-start lg:py-8">
        <div 
          onClick={() => handleViewClick('home')}
          className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0c1424] text-[#5dc7ec] shadow-xl shadow-black/40 ring-1 ring-white/10 lg:mb-12 lg:flex cursor-pointer hover:scale-105 transition-transform"
        >
          <Cloud size={24} strokeWidth={2.5} />
        </div>

        <nav className="flex flex-row gap-2 lg:flex-col lg:gap-6">
          {DASHBOARD_VIEWS.map((view) => (
            <SidebarIcon
              key={view.id}
              icon={VIEW_ICONS[view.id] || Home}
              active={currentView === view.id}
              label={view.label}
              onClick={() => handleViewClick(view.id)}
              hasAccess={
                (isCashier && view.id === 'home') ||
                !VIEW_PERMISSION[view.id] ||
                hasPermission(VIEW_PERMISSION[view.id]!)
              }
            />
          ))}
        </nav>

        <div className="mt-auto hidden flex-col items-center gap-6 lg:flex">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#5dc7ec] transition-all">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0c1424&color=5dc7ec`}
              alt="Avatar"
            />
          </div>
          <SidebarIcon icon={LogOut} label="Logout" onClick={handleLogout} />
        </div>
      </aside>

      <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 lg:ml-0 lg:pl-[100px] lg:pr-8 xl:pl-[108px] lg:py-8">
        <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-[#0c1424]">{user?.businessName || 'TillCloud POS'}</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase text-[#0c1424]">{user?.role || 'User'}</span>
          </div>

          <div className="group relative mx-auto w-full max-w-[400px] flex-1">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0c1424] transition-colors"
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-11 pr-6 rounded-xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0c1424]/5 transition-all text-[13px]"
            />
          </div>

          <div className="flex items-center gap-4 self-end lg:self-auto">
            <button className="text-slate-400 hover:text-[#0c1424] transition-colors relative">
              <Bell size={18} />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 border border-white"></div>
            </button>
            <button className="text-slate-400 hover:text-[#0c1424] transition-colors">
              <HelpCircle size={18} />
            </button>
            <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden shadow-sm">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=f3f4f6&color=0c1424`}
                alt="Avatar"
              />
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default UnifiedLayout;
