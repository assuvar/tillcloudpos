import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, HelpCircle, ChefHat, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FRONTEND_PERMISSIONS, getPosExitRoute } from '../permissions';

interface PosLayoutProps {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
}

const navItems = [
  { label: 'Orders', icon: LayoutGrid, path: '/pos/order-entry', permission: FRONTEND_PERMISSIONS.BILLING_VIEW_OPEN },
  { label: 'Kitchen', icon: ChefHat, path: '/kitchen', permission: FRONTEND_PERMISSIONS.KITCHEN_VIEW },
  { label: 'Menu', icon: Utensils, path: '/pos/menu', permission: FRONTEND_PERMISSIONS.MENU_HIDE_SHOW_ITEMS },
] as const;

const PosLayout: React.FC<PosLayoutProps> = ({ children, className = 'bg-[#f8fafc]', mainClassName = 'pb-24' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, user } = useAuth();

  const handleNavClick = (item: (typeof navItems)[number]) => {
    navigate(item.path);
  };

  const activePath = location.pathname;

  return (
    <div className={`flex h-screen w-full flex-col font-sans selection:bg-sky-100 overflow-hidden ${className}`}>
      <main className={`flex-1 overflow-y-auto ${mainClassName}`}>{children}</main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-t border-white/5 bg-[#0c1424] px-4 sm:px-8 text-white shadow-2xl">
        <nav className="flex h-full items-center gap-4 sm:gap-10">
          {navItems.map((item) => {
            const isActive = activePath === item.path;

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`group relative flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-[#5dc7ec]' : 'text-slate-400 hover:text-white'}`}
              >
                <item.icon size={22} className={isActive ? 'text-[#5dc7ec]' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                {isActive ? <div className="absolute -bottom-4 h-1 w-8 rounded-full bg-[#5dc7ec]" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="flex h-full items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">Cashier</span>
            <span className="text-xs font-bold text-slate-300">{user?.fullName || 'Staff'}</span>
          </div>
          <button
            onClick={() => navigate(getPosExitRoute(user?.role))}
            className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 sm:px-6 text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
          >
            Exit POS
          </button>
          <HelpCircle size={20} className="text-white/20 hover:text-white transition-colors cursor-pointer" />
        </div>
      </footer>
    </div>
  );
};

export default PosLayout;
