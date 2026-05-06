import React from "react";
import { Bell, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePosCart } from "../context/PosCartContext";
import { useOutlets } from "../context/OutletContext";
import Clock from "./Clock";

const POSTopBar: React.FC = () => {
  const { user, setMode, logout } = useAuth();
  const { clearBill } = usePosCart();
  const { activeOutlet, availableOutlets, switchOutlet } = useOutlets();
  const navigate = useNavigate();

  const handleExit = () => {
    clearBill();

    // If the user is a Cashier, they don't have dashboard access.
    // Exit for them should probably mean logging out or going to a safe place.
    if (user?.role === "CASHIER") {
      void logout();
      navigate("/login");
      return;
    }

    setMode("dashboard");
    navigate("/dashboard", { state: { currentView: "home" } });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="flex items-center gap-2.5 text-2xl font-[1000] tracking-tighter text-[#0c1424]">
          <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain" />
          TILLCLOUD
        </h1>
      </div>

      <div className="flex items-center gap-6 justify-center">
        {/* Interactive Premium Outlet Switcher */}
        {availableOutlets.length > 0 && (
          <div className="relative group">
            <select
              value={activeOutlet?.id || ""}
              onChange={(e) => switchOutlet(e.target.value)}
              className="h-10 px-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0c1424] cursor-pointer transition-all appearance-none pr-8"
            >
              {availableOutlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (#{o.outletNumber})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        )}
        <div className="h-6 w-[1px] bg-slate-100 hidden sm:block"></div>
        <Clock />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-100 bg-slate-50">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=0c1424&color=5dc7ec`}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-sm font-black text-[#0c1424]">
            {user?.role === "CASHIER" ? "Cashier" : user?.role || "User"} #
            {user?.id.slice(-2) || "42"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-[#0c1424] transition-colors relative">
            <Bell size={20} />
            <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-rose-500 border border-white"></div>
          </button>
          <button className="text-slate-400 hover:text-[#0c1424] transition-colors">
            <HelpCircle size={20} />
          </button>
          <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>
          <button
            onClick={handleExit}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
            title="Exit POS"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default POSTopBar;
