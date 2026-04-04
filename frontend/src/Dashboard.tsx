import {
  Bell,
  BookOpen,
  CircleCheck,
  ClipboardList,
  Home,
  LayoutGrid,
  LogOut,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

function StatCard({ title, value, tag }: { title: string; value: string; tag: string }) {
  return (
    <div className="rounded-[12px] bg-white border border-slate-200 p-4">
      <div className="text-[10px] text-slate-400 font-semibold">{tag}</div>
      <div className="mt-4 text-[32px] font-bold text-[#0f172a] leading-none">{value}</div>
      <div className="mt-2 text-[13px] text-slate-500">{title}</div>
    </div>
  );
}

function QuickAction({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      className="w-full rounded-[12px] bg-white border border-slate-200 p-4 text-left flex items-center gap-3 hover:border-[#9adff6] transition"
    >
      <span className="h-9 w-9 rounded-lg bg-[#f1f6fc] inline-flex items-center justify-center text-slate-700">{icon}</span>
      <span>
        <div className="text-[14px] font-bold text-[#111827]">{title}</div>
        <div className="text-[11px] text-slate-500">{subtitle}</div>
      </span>
    </button>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const restaurantName = user?.email?.split('@')[0] || "Your Bistro"; // Fallback if name not in user object
  return (
    <div className="min-h-screen w-full bg-[#eef3f9] text-slate-900">
      <div className="min-h-screen w-full grid grid-cols-[84px_minmax(0,1fr)] gap-4 p-3 sm:p-4 lg:p-5">
        <aside className="sticky top-3 sm:top-4 lg:top-5 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-2.5rem)] rounded-[20px] bg-[#07142a] text-white py-4 px-2 flex flex-col items-center gap-5 shadow-[0_20px_60px_rgba(7,20,42,0.25)]">
          <div className="h-9 w-9 rounded-lg bg-[#0f2749] border border-[#3cc5f2]/30 flex items-center justify-center text-[#5cc7eb]">☁</div>
          {[Home, LayoutGrid, ShoppingCart, ClipboardList, Receipt, BookOpen, Settings].map((Icon, i) => (
            <button
              key={i}
              type="button"
              className={`h-10 w-10 rounded-xl inline-flex items-center justify-center ${
                i === 0 ? "bg-[#12335e] text-[#5cc7eb]" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
          <button 
            type="button" 
            onClick={handleLogout}
            className="mt-auto h-10 w-10 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </aside>

        <main className="min-w-0 w-full pr-0 sm:pr-1 lg:pr-2">
          <header className="h-14 sm:h-16 rounded-[18px] bg-white border border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="font-bold text-[#0f172a] uppercase tracking-wide">{user?.fullName || 'Admin'} | {restaurantName}</div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex h-10 w-[230px] rounded-full border border-slate-200 bg-[#f8fafc] px-3 items-center text-slate-400 text-[12px]">
                <Search size={13} className="mr-2" /> Search orders, menu...
              </div>
              <button type="button" className="h-9 w-9 rounded-full bg-[#f8fafc] border border-slate-200 inline-flex items-center justify-center text-slate-500">
                <Bell size={13} />
              </button>
              <div className="h-9 w-9 rounded-full bg-[#1f4d7e]" />
            </div>
          </header>

          <section className="mt-4 rounded-[22px] bg-gradient-to-r from-[#06132c] via-[#0f2848] to-[#164268] text-white p-5 sm:p-6 flex flex-wrap gap-4 items-center justify-between shadow-[0_20px_60px_rgba(8,22,46,0.12)]">
            <div>
              <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight">Welcome to TillCloud, {user?.fullName || 'User'}!</h1>
              <p className="text-[13px] text-blue-100/80 mt-1">Your account is active and ready for operations at {restaurantName}.</p>
            </div>
            <div className="rounded-[12px] border border-white/10 bg-black/20 px-3 py-2 text-[11px] min-w-[220px]">
              <div className="text-blue-200">Your POS URL</div>
              <div className="flex items-center gap-2 mt-1">
                <span>pos.tillcloud.com/oceanblue</span>
                <button type="button" className="h-6 px-2 rounded bg-[#4cc7f0] text-[#052743] font-bold text-[10px]">
                  Copy
                </button>
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard tag="Today" value="0" title="Total Bills" />
            <StatCard tag="Real-time" value="$0.00" title="Total Revenue" />
            <StatCard tag="Live" value="0" title="Active Orders" />
            <StatCard tag="Alert" value="0" title="Low Stock Items" />
          </section>

          <section className="mt-4 grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_250px] gap-3 items-start">
            <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold">Setup Guide</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dbf4ff] text-[#0b78a0] font-semibold">100% Done</span>
              </div>
              <div className="mt-3 space-y-2 text-[12px] text-slate-700">
                {[
                  "Business Profile",
                  "Tax Setup",
                  "Menu Creation",
                  "Staff & Terminals",
                  "Payment Integration",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CircleCheck size={14} className="text-[#38c68c]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-4 h-10 w-full rounded-full bg-[#07142a] text-white text-[12px] font-semibold">
                Launch Terminal
              </button>
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-bold">Sales Overview</h2>
                  <div className="text-[11px] text-slate-500">Last 7 days performance</div>
                </div>
                <div className="rounded-full bg-[#f4f8fc] p-1 text-[11px]">
                  <button type="button" className="px-3 py-1 rounded-full bg-white border border-slate-200">Daily</button>
                  <button type="button" className="px-3 py-1">Weekly</button>
                </div>
              </div>

              <div className="mt-8 rounded-[16px] bg-[#f7fafd] border border-slate-200 h-[280px] flex items-center justify-center text-center">
                <div>
                  <div className="h-16 w-16 rounded-[12px] bg-white border border-slate-200 mx-auto mb-3" />
                  <div className="text-[18px] font-bold text-slate-700">No Sales Data Yet</div>
                  <div className="text-[12px] text-slate-500 mt-1">Your sales data will appear here once you start taking orders.</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-semibold text-slate-500 mb-2 px-1">QUICK ACTIONS</h3>
              <div className="space-y-3">
                <QuickAction title="Open POS" subtitle="Launch your POS terminal" icon={<LayoutGrid size={15} />} />
                <QuickAction title="Add Menu Items" subtitle="Expand your catalogue" icon={<ClipboardList size={15} />} />
                <QuickAction title="Invite Staff" subtitle="Build your billing team" icon={<UserPlus size={15} />} />
              </div>

              <div className="mt-3 rounded-[12px] bg-gradient-to-br from-[#d5e0ec] to-[#bccad8] h-[170px] shadow-[0_10px_25px_rgba(15,23,42,0.06)]" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
