import React from "react";
import { Bell, HelpCircle, LogOut, ClipboardList, LayoutGrid, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePosCart } from "../context/PosCartContext";
import Clock from "./Clock";

interface POSTopBarProps {
  activeView?: "orders" | "tables" | "menu";
  onViewChange?: (view: "orders" | "tables" | "menu") => void;
}

const POSTopBar: React.FC<POSTopBarProps> = ({ activeView, onViewChange }) => {
  const { user, setMode, logout } = useAuth();
  const { clearBill } = usePosCart();
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
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain flex-shrink-0" />
          <h1 className="text-[17px] font-[1000] tracking-tight text-[#0c1424] leading-none">
            TillCloud POS
          </h1>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

        {/* Compact Combined Restaurant & Timer Badge next to POS name */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm select-none">
          <div className="flex flex-col border-r border-slate-200 pr-3">
            <span className="text-[11px] font-[900] text-slate-700 uppercase tracking-wider leading-none">
              {user?.businessName || "Restaurant"}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
              {user?.role || "STAFF"}
              {user?.fullName ? (
                <span className="normal-case tracking-normal font-semibold text-slate-500"> · {user.fullName}</span>
              ) : null}
            </span>
          </div>
          <Clock />
        </div>
      </div>

      {/* Central Segmented Control for POS Screen Navigation */}
      {onViewChange && (
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-2xl select-none">
          <button
            onClick={() => onViewChange("orders")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeView === "orders"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <ClipboardList size={15} strokeWidth={activeView === "orders" ? 2.5 : 2} />
            Orders
          </button>

          <button
            onClick={() => onViewChange("tables")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeView === "tables"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <LayoutGrid size={15} strokeWidth={activeView === "tables" ? 2.5 : 2} />
            Tables
          </button>

          <button
            onClick={() => onViewChange("menu")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeView === "menu"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <UtensilsCrossed size={15} strokeWidth={activeView === "menu" ? 2.5 : 2} />
            Menu
          </button>
        </div>
      )}

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
