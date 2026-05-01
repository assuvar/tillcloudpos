import React from "react";
import { Bell, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePosCart } from "../context/PosCartContext";

const POSTopBar: React.FC = () => {
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
        <h1 className="text-xl font-[1000] tracking-tighter text-[#0c1424]">
          TILLCLOUD
        </h1>
      </div>

      <div className="flex items-center justify-center">
        <div className="rounded-full bg-slate-50 px-6 py-2">
          <span className="text-sm font-bold text-slate-500">
            Station 01 — Main Terminal
          </span>
        </div>
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
