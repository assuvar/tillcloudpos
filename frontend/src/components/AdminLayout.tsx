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
  ShoppingBag,
  LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_VIEWS } from '../dashboardNavigation';
import { FRONTEND_PERMISSIONS } from '../permissions';

function SidebarIcon({
  icon: Icon,
  active = false,
  label,
  onClick,
}: {
  icon: LucideIcon;
  active?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
        active
          ? 'bg-[#1e293b] text-[#5dc7ec] shadow-lg shadow-black/20'
          : 'text-slate-400 hover:text-white hover:bg-[#1e293b]/50'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      {label ? <span className="sr-only">{label}</span> : null}
    </button>
  );
}

const VIEW_ICONS: Record<string, LucideIcon> = {
  home: Home,
  pos: ShoppingBag,
  menu: Utensils,
  staff: Users,
  inventory: Package,
  customers: User,
  reports: BarChart3,
  settings: Settings,
};

const VIEW_PERMISSION: Record<string, string | null> = {
  home: null,
  pos: FRONTEND_PERMISSIONS.BILLING_VIEW_OPEN,
  menu: FRONTEND_PERMISSIONS.MENU_HIDE_SHOW_ITEMS,
  staff: FRONTEND_PERMISSIONS.STAFF_VIEW,
  inventory: FRONTEND_PERMISSIONS.INVENTORY_VIEW_STOCK,
  customers: FRONTEND_PERMISSIONS.CUSTOMERS_VIEW_PROFILES,
  reports: FRONTEND_PERMISSIONS.REPORTS_VIEW,
  settings: FRONTEND_PERMISSIONS.SETTINGS_VIEW,
};

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentView = 'home', onViewChange }) => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = () => {
    void logout();
    navigate('/login');
  };

  const handleViewClick = (viewId: string) => {
    const permission = VIEW_PERMISSION[viewId] || null;
    if (permission && !hasPermission(permission)) {
      window.alert('Access not provided for this module');
      return;
    }

    if (viewId === 'pos') {
      navigate('/pos/order-entry');
      return;
    }

    onViewChange?.(viewId);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[14px] text-slate-900">
      <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 flex-row items-center justify-around border-t border-white/10 bg-[#0c1424] px-4 py-2 lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[84px] lg:flex-col lg:items-center lg:justify-start lg:py-8">
        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0c1424] text-[#5dc7ec] shadow-xl shadow-black/40 ring-1 ring-white/10 lg:mb-12 lg:flex">
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
            />
          ))}
        </nav>

        <div className="mt-auto hidden flex-col items-center gap-6 lg:flex">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#5dc7ec] transition-all">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=0c1424&color=5dc7ec`}
              alt="Avatar"
            />
          </div>
          <SidebarIcon icon={LogOut} label="Logout" onClick={handleLogout} />
        </div>
      </aside>

      <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 lg:ml-0 lg:pl-[100px] lg:pr-8 xl:pl-[108px] lg:py-8">
        <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-[#0c1424]">{user?.businessName || 'Ocean Blue Bistro'}</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase text-[#0c1424]">Admin</span>
          </div>

          <div className="group relative mx-auto w-full max-w-[400px] flex-1">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0c1424] transition-colors"
            />
            <input
              type="text"
              placeholder="Search orders, menu, staff..."
              className="w-full h-10 pl-11 pr-6 rounded-xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0c1424]/5 transition-all text-[13px]"
            />
          </div>

          <div className="flex items-center gap-4 self-end lg:self-auto">
            <button className="text-slate-400 hover:text-[#0c1424] transition-colors">
              <Bell size={18} />
            </button>
            <button className="text-slate-400 hover:text-[#0c1424] transition-colors">
              <HelpCircle size={18} />
            </button>
            <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden shadow-sm">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=f3f4f6&color=0c1424`}
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

export default AdminLayout;
