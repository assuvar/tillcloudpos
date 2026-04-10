import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Cloud,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Home,
  LayoutGrid,
  Loader2,
  LogOut,
  MoreVertical,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  User,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import api from "./services/api";
import MenuManagement from "./MenuManagement";
import StaffManagementPage from "./StaffManagementPage";
import StockListPage from "./StockListPage";
import CustomersPage from "./CustomersPage";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  statusLabel?: string;
  statusType?: "success" | "warning" | "error" | "info";
}

function StatCard({
  title,
  value,
  icon,
  trend,
  statusLabel,
  statusType = "success",
}: StatCardProps) {
  const getStatusStyles = () => {
    switch (statusType) {
      case "success":
        return "bg-emerald-50 text-emerald-600";
      case "error":
        return "bg-rose-50 text-rose-600";
      case "warning":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-blue-50 text-blue-600";
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        {trend && (
          <div
            className={`px-2 py-1 rounded-full text-[11px] font-bold ${getStatusStyles()}`}
          >
            {trend}
          </div>
        )}
        {statusLabel && (
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyles()}`}
          >
            {statusLabel}
          </div>
        )}
      </div>
      <div>
        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="text-[28px] font-black text-[#0c1424] mt-1 tracking-tight">
          {value}
        </div>
      </div>
    </div>
  );
}

function SidebarIcon({
  icon: Icon,
  active = false,
  onClick,
}: {
  icon: any;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
        active
          ? "bg-[#1e293b] text-[#5dc7ec] shadow-lg shadow-black/20"
          : "text-slate-400 hover:text-white hover:bg-[#1e293b]/50"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    </button>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [terminalLaunched, setTerminalLaunched] = useState<boolean>(() => {
    return localStorage.getItem("terminalLaunched") === "true";
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'menu' | 'staff' | 'orders' | 'inventory' | 'customers' | 'analytics' | 'settings' | 'reports'>('home');
  const [realStaff, setRealStaff] = useState<any[]>([]);

  const fetchStaff = async () => {
    if (!user?.restaurantId) {
      return;
    }
    try {
      const response = await api.get(`/users/${user.restaurantId}`);
      setRealStaff(response.data);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  useEffect(() => {
    if (terminalLaunched) {
      void fetchStaff();
    }
  }, [terminalLaunched, user?.restaurantId]);

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert("You cannot remove yourself!");
      return;
    }
    
    if (!window.confirm("Are you sure you want to remove this user? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/users/user/${userId}`);
      setRealStaff(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to remove user. Please try again.");
    }
  };

  const handleLaunchTerminal = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setTerminalLaunched(true);
      localStorage.setItem("terminalLaunched", "true");
      setIsLaunching(false);
    }, 1500);
  };

  const handleLogout = () => {
    void logout();
    navigate("/login");
  };

  const salesData = [
    { day: "MON", value: 40 },
    { day: "TUE", value: 65 },
    { day: "WED", value: 90, active: true },
    { day: "THU", value: 60 },
    { day: "FRI", value: 75 },
    { day: "SAT", value: 55 },
    { day: "SUN", value: 80 },
  ];

  const staff = realStaff.length > 0 ? realStaff.map(u => ({
    id: u.id,
    name: u.fullName,
    role: u.role,
    station: u.role === 'KITCHEN' ? 'Kitchen' : u.role === 'CASHIER' ? 'Terminal 01' : 'Admin Portal',
    checkIn: new Date(u.createdAt).toLocaleDateString(),
    status: u.isActive ? "Active" : "Inactive",
  })) : [
    {
      id: "demo-1",
      name: "Courtney Henry",
      role: "Manager",
      station: "Front Desk",
      checkIn: "08:00 AM",
      status: "Active",
    },
    // ... more demo users if needed
  ];

  if (!terminalLaunched) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-[14px] text-slate-900">
        {/* Sidebar */}
        <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 flex-row items-center justify-around border-t border-white/10 bg-[#0c1424] px-4 py-2 lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[84px] lg:flex-col lg:items-center lg:justify-start lg:py-8">
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0c1424] text-[#5dc7ec] shadow-xl shadow-black/40 ring-1 ring-white/10 lg:mb-12 lg:flex">
            <Cloud size={24} strokeWidth={2.5} />
          </div>

          <nav className="flex flex-row gap-2 lg:flex-col lg:gap-6">
            <SidebarIcon icon={Home} active />
            <SidebarIcon icon={LayoutGrid} />
            <SidebarIcon icon={Utensils} />
            <SidebarIcon icon={Users} />
            <SidebarIcon icon={Package} />
            <SidebarIcon icon={User} />
            <SidebarIcon icon={BarChart3} />
            <SidebarIcon icon={Settings} />
          </nav>

          <div className="mt-auto hidden flex-col items-center gap-6 lg:flex">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#5dc7ec] transition-all">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "Admin")}&background=0c1424&color=5dc7ec`}
                alt="Avatar"
              />
            </div>
            <SidebarIcon icon={LogOut} onClick={handleLogout} />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 lg:ml-0 lg:pl-[100px] lg:pr-8 xl:pl-[108px] lg:py-8">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-[#0c1424]">
                {user?.businessName || "Ocean Blue Bistro"}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase text-[#0c1424]">
                Admin
              </span>
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
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "Admin")}&background=f3f4f6&color=0c1424`}
                  alt="Avatar"
                />
              </div>
            </div>
          </header>

          {/* Hero Banner */}
          <div className="relative mb-8 overflow-hidden rounded-[24px] bg-[#0c1424] p-6 text-white shadow-2xl shadow-black/10 sm:p-8 lg:p-10">
            <div className="relative z-10">
              <h1 className="mb-2 text-2xl font-black tracking-tight sm:text-3xl">
                Welcome to TillCloud, {user?.businessName || "Ocean Blue Bistro"}!
              </h1>
              <p className="text-slate-400 font-medium">
                Your account is active and ready for operations.
              </p>
            </div>

            {/* POS Link Card */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:mt-8 sm:flex-row sm:items-center sm:gap-4 lg:absolute lg:right-10 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#5dc7ec]">Your POS Link</span>
                <span className="text-sm font-bold text-slate-300">pos.tillcloud.com/{user?.businessName?.toLowerCase().replace(/\s+/g, '-')}</span>
              </div>
              <button className="bg-[#5dc7ec] text-[#0c1424] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white transition-colors duration-200 flex items-center gap-2">
                <Copy size={12} />
                Copy
              </button>
            </div>

            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-[#5dc7ec]/10 to-transparent blur-[100px] -z-0" />
          </div>

          {/* Setup Metric Cards (Horizontal Small) */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Bills</div>
                <div className="text-2xl font-black text-[#0c1424]">0</div>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-50 text-[9px] font-bold text-slate-400">Today</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Wallet size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Revenue</div>
                <div className="text-2xl font-black text-[#0c1424]">$0.00</div>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-50 text-[9px] font-bold text-slate-400">Real-time</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Orders</div>
                <div className="text-2xl font-black text-[#0c1424]">0</div>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-[#f0f9ff] text-[9px] font-bold text-[#5dc7ec]">Live</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Package size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Low Stock Items</div>
                <div className="text-2xl font-black text-[#0c1424]">0</div>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-50 text-[9px] font-bold text-rose-400">Alert</span>
            </div>
          </div>

          <div className="flex flex-col gap-8 xl:flex-row">
            {/* Setup Guide Card */}
            <div className="flex min-w-0 flex-col rounded-[32px] border border-slate-200 bg-gradient-to-b from-[#f8fafc] to-[#eef2ff] p-6 xl:w-1/4">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-[#0c1424]">Setup Guide</h3>
                <span className="px-3 py-1 rounded-full bg-[#0c1424] text-white text-[10px] font-black tracking-widest uppercase">100% Done</span>
              </div>

              <div className="space-y-5 flex-1">
                {[
                  "Business Profile",
                  "Tax Setup",
                  "Menu Creation",
                  "Staff & Terminals",
                  "Payment Integration",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[14px] font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-5 rounded-2xl bg-white/40 border border-white/60 text-center">
                <p className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Ready to start trading?</p>
                <button 
                  onClick={handleLaunchTerminal}
                  disabled={isLaunching}
                  className="w-full h-11 bg-[#0c1424] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-black/20 hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {isLaunching ? (
                    <Loader2 size={14} className="animate-spin text-[#5dc7ec]" />
                  ) : (
                    "Launch Terminal"
                  )}
                </button>
              </div>
            </div>

            {/* Sales Overview Empty State */}
            <div className="flex min-w-0 flex-1 flex-col rounded-[40px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:mb-10">
                <div>
                  <h3 className="text-lg font-black text-[#0c1424]">Sales Overview</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last 7 days performance</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400">Daily</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400">Weekly</span>

                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="relative mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-[#f0f9ff]/50 sm:h-48 sm:w-48">
                  <div className="h-32 w-32 bg-white rounded-[24px] shadow-xl shadow-blue-500/10 flex items-center justify-center relative rotate-6">
                     <BarChart3 className="text-[#5dc7ec]/30 h-12 w-12" />
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-50 flex items-center justify-center">
                       <Plus size={14} className="text-[#0c1424]" />
                     </div>
                  </div>
                  <div className="absolute top-2 right-2 h-12 w-12 bg-[#5dc7ec] rounded-full blur-[24px] opacity-20"></div>
                </div>
                <h4 className="text-lg font-black text-[#0c1424] mb-2">No Sales Data Yet</h4>
                <p className="text-[13px] text-slate-400 font-medium max-w-[320px] leading-relaxed">
                  Your sales data will appear here once you start taking orders. Connect your POS and make your first transaction.
                </p>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="flex min-w-0 flex-col gap-6 xl:w-1/4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Quick Actions</h3>
              
              {[
                { label: "Open POS", sub: "Launch your terminal", icon: Store, path: "/pos" },
                { label: "Add Menu Items", sub: "Expand your catalogue", icon: Utensils, path: "menu" },
                { label: "Invite Staff", sub: "Build your bistro team", icon: Users, path: "staff" },
              ].map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => action.path.startsWith('/') ? navigate(action.path) : setCurrentView(action.path as any)}
                  className="group flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md sm:gap-5 sm:p-6"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-white transition-colors duration-300">
                    <action.icon size={20} />
                  </div>
                  <div>
                    <div className="text-[15px] font-black text-[#0c1424] mb-1">{action.label}</div>
                    <div className="text-xs text-slate-400 font-medium">{action.sub}</div>
                  </div>
                </button>
              ))}

              <div 
                onClick={() => navigate('/pos')}
                className="mt-auto flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg shadow-blue-900/10 sm:h-40 relative group"
              >
                 <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500"></div>
                 <div className="text-[40px] font-black text-white/40 tracking-tighter mix-blend-overlay">POS</div>
                 <div className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#0c1424] shadow-lg">
                    <ExternalLink size={14} />
                 </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[14px] text-slate-900">
      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 flex-row items-center justify-around border-t border-white/10 bg-[#0c1424] px-4 py-2 lg:top-0 lg:bottom-0 lg:left-0 lg:right-auto lg:h-auto lg:w-[84px] lg:flex-col lg:items-center lg:justify-start lg:py-8">
        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0c1424] text-[#5dc7ec] shadow-xl shadow-black/40 ring-1 ring-white/10 lg:mb-12 lg:flex">
          <Cloud size={24} strokeWidth={2.5} />
        </div>

        <nav className="flex flex-row gap-2 lg:flex-col lg:gap-6">
          <SidebarIcon icon={Home} active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <SidebarIcon icon={LayoutGrid} active={currentView === 'orders'} onClick={() => setCurrentView('orders')} />
          <SidebarIcon icon={Utensils} active={currentView === 'menu'} onClick={() => setCurrentView('menu')} />
          <SidebarIcon icon={Users} active={currentView === 'staff'} onClick={() => setCurrentView('staff')} />
          <SidebarIcon icon={Package} active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />
          <SidebarIcon icon={User} active={currentView === 'customers'} onClick={() => setCurrentView('customers')} />
          <SidebarIcon icon={BarChart3} active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
          <SidebarIcon icon={Settings} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>

        <div className="mt-auto hidden flex-col items-center gap-6 lg:flex">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#5dc7ec] transition-all">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "Admin")}&background=0c1424&color=5dc7ec`}
              alt="Avatar"
            />
          </div>
          <SidebarIcon icon={LogOut} onClick={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 lg:ml-0 lg:pl-[100px] lg:pr-8 xl:pl-[108px] lg:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="group relative w-full max-w-[600px] flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0c1424] transition-colors"
            />
            <input
              type="text"
              placeholder="Search analytics, staff, or orders..."
              className="w-full h-12 pl-12 pr-6 rounded-2xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0c1424]/5 focus:border-[#0c1424]/20 transition-all text-[14px]"
            />
          </div>

          <div className="flex items-center gap-4 self-end lg:self-auto">
            <button className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#0c1424] transition-all relative">
              <Bell size={18} />
              <span className="absolute top-3.5 right-3.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {currentView === 'home' && (
          <>
            {/* Dash Title */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
              <div>
                <h1 className="text-[34px] font-black text-[#0c1424] leading-none tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                  Welcome back, {user?.fullName?.split(" ")[0] || "Alex"}. Here's
                  what's happening at{" "}
                  <span className="font-bold text-[#0c1424]">TILLCLOUD Central</span>{" "}
                  today.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="h-11 px-6 rounded-full bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
                  <FileText size={14} />
                  Export Report
                </button>
                <button className="h-11 px-6 rounded-full bg-[#0c1424] text-white text-[13px] font-bold shadow-xl shadow-black/20 hover:bg-black transition-all inline-flex items-center gap-2">
                  <span className="text-lg leading-none">+</span>
                  New Order
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Bills Today"
                value="84"
                icon={<FileText size={20} />}
                trend="+12%"
                statusType="success"
              />
              <StatCard
                title="Revenue Today"
                value="$2,450.00"
                icon={<Wallet size={20} />}
                trend="+8.4%"
                statusType="success"
              />
              <StatCard
                title="Active Orders"
                value="12"
                icon={<ShoppingBag size={20} />}
                statusLabel="Active"
                statusType="warning"
              />
              <StatCard
                title="Low Stock Alerts"
                value="3"
                icon={<ClipboardList size={20} />}
                statusLabel="Critical"
                statusType="error"
              />
            </div>

            {/* Middle Section: Chart and Peak Hour */}
            <div className="mb-8 flex flex-col gap-6 lg:flex-row">
              {/* Sales Activity */}
              <div className="relative min-w-0 w-full overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8 lg:w-2/3">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
                  <div>
                    <h3 className="text-lg font-black text-[#0c1424]">
                      Sales Activity
                    </h3>
                    <p className="text-[13px] text-slate-500 font-medium">
                      Revenue distribution over the selected period
                    </p>
                  </div>
                  <button className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[12px] font-bold text-slate-600 inline-flex items-center gap-2 hover:bg-slate-100 transition-colors">
                    Last 7 Days <ChevronDown size={14} />
                  </button>
                </div>

                <div className="flex h-[240px] min-w-0 items-end justify-between gap-2 px-1 sm:h-[280px] sm:gap-4 sm:px-2">
                  {salesData.map((item) => (
                    <div
                      key={item.day}
                      className="flex-1 flex flex-col items-center gap-4 group"
                    >
                      <div className="relative w-full flex justify-center items-end h-[220px]">
                        <div
                          className={`w-6 rounded-xl transition-all duration-500 cursor-pointer sm:w-[42px] ${
                            item.active
                              ? "bg-[#0c1424] shadow-[0_10px_30px_rgba(12,20,36,0.3)]"
                              : "bg-[#e2e8f0]/40 group-hover:bg-[#e2e8f0]"
                          }`}
                          style={{ height: `${item.value}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hour Card */}
              <div className="group relative flex min-w-0 w-full flex-col justify-between overflow-hidden rounded-[28px] bg-[#0c1424] p-6 text-white shadow-2xl shadow-black/20 sm:p-8 lg:w-1/3">
                <div className="absolute top-0 right-0 -z-10 h-[160px] w-[160px] rounded-full bg-[#5dc7ec]/10 blur-[80px] translate-x-1/2 -translate-y-1/2 sm:h-[200px] sm:w-[200px]" />
                <div className="absolute bottom-0 left-0 -z-10 h-[120px] w-[120px] rounded-full bg-indigo-500/10 blur-[60px] -translate-x-1/2 translate-y-1/2 sm:h-[150px] sm:w-[150px]" />

                <div>
                  <div className="mb-6 flex h-8 w-[120px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-[#5dc7ec]">
                    <span className="h-2 w-2 rounded-full bg-[#5dc7ec] animate-pulse" />
                    Smart Insight
                  </div>
                  <h3 className="text-2xl font-black mb-3">Peak Hour</h3>
                  <p className="text-blue-100/60 text-[14px] leading-relaxed font-medium">
                    Your store experiences maximum traffic during lunch hours.
                  </p>
                </div>

                <div className="mt-8">
                  <div className="text-[44px] font-black leading-none tracking-tight mb-2">
                    1 PM – 2 PM
                  </div>
                  <div className="flex items-center gap-2 text-[#5dc7ec] text-[13px] font-bold">
                    <BarChart3 size={14} className="rotate-90" />
                    23 bills generated
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Table */}
            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
                <div>
                  <h3 className="text-lg font-black text-[#0c1424]">Staff On Duty</h3>
                  <p className="text-[13px] text-slate-500 font-medium">
                    Currently logged-in team members
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-[#0c1424] transition-colors rounded-xl hover:bg-slate-50">
                    <Search size={18} />
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-[#0c1424] transition-colors rounded-xl hover:bg-slate-50">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                        Name
                      </th>
                      <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Role
                      </th>
                      <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Station
                      </th>
                      <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Check-in
                      </th>
                      <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-2">
                        Status
                      </th>
                      <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {staff.map((person, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-[13px] font-bold text-slate-600">
                              {person.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <span className="text-[14px] font-bold text-[#0c1424]">
                              {person.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 text-[13px] font-medium text-slate-500">
                          {person.role}
                        </td>
                        <td className="py-5 text-[13px] font-medium text-slate-500">
                          {person.station}
                        </td>
                        <td className="py-5 text-[13px] font-medium text-slate-500">
                          {person.checkIn}
                        </td>
                        <td className="py-5 text-right pr-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              person.status === "Active"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {person.status}
                          </span>
                        </td>
                        <td className="py-5 text-right pr-2">
                           <button
                             onClick={() => handleDeleteUser((person as any).id)}
                             className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                             title="Remove User"
                           >
                             <Trash2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {currentView === 'menu' && (
          <MenuManagement />
        )}

        {currentView === 'staff' && (
          <StaffManagementPage />
        )}

        {currentView === 'inventory' && (
          <StockListPage />
        )}

        {currentView === 'customers' && (
          <CustomersPage />
        )}

        {currentView === 'reports' && (
          <ReportsPage />
        )}
        {currentView === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}
