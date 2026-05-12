import React, { useState, useEffect } from "react";
import {
  Bell,
  HelpCircle,
  LogOut,
  ClipboardList,
  LayoutGrid,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePosCart } from "../context/PosCartContext";
import Clock from "./Clock";

interface POSTopBarProps {
  activeView?: "orders" | "tables" | "menu";
  onViewChange?: (view: "orders" | "tables" | "menu") => void;
}

const POSTopBar: React.FC<POSTopBarProps> = () => {
  const { user, setMode, logout } = useAuth();
  const {
    clearBill,
    activeSubView,
    setActiveSubView,
    setIsLandingScreen,
    billItems,
    activeBill,
  } = usePosCart();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleExit = () => {
    clearBill();

    if (user?.role === "CASHIER") {
      void logout();
      navigate("/login");
      return;
    }

    setMode("dashboard");
    navigate("/dashboard", { state: { currentView: "home" } });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  const handleNewOrderClick = () => {
    const hasUnsavedItems = billItems && billItems.length > 0;
    const isNotPaid = activeBill && activeBill.status !== "PAID" && activeBill.status !== "CLOSED" && activeBill.status !== "VOIDED";

    // Only prompt with unsaved warning if user is actively in the cart/menu view editing an order
    if (activeSubView === "menu" && hasUnsavedItems && isNotPaid) {
      setShowUnsavedWarning(true);
    } else {
      clearBill();
      setIsLandingScreen(true);
      setActiveSubView("menu");
      navigate("/pos");
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedWarning(false);
    clearBill();
    setIsLandingScreen(true);
    setActiveSubView("menu");
    navigate("/pos");
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveSubView("menu");
              navigate("/pos");
            }}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity text-left"
          >
            <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain flex-shrink-0" />
            <h1 className="text-[17px] font-[1000] tracking-tight text-[#0c1424] leading-none">
              TillCloud POS
            </h1>
          </button>

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

          {/* Premium Highlighted + NEW ORDER Button */}
          <button
            onClick={handleNewOrderClick}
            className="flex items-center gap-1.5 h-10 px-5 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-wider shadow-lg shadow-black/5 hover:scale-[1.02] hover:bg-[#142038] transition-all cursor-pointer"
            title="Start a fresh POS session"
          >
            + New Order
          </button>
        </div>

        {/* Central Segmented Control for POS Screen Navigation */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-2xl select-none">
          <button
            onClick={() => setActiveSubView("live-orders")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubView === "live-orders"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <ClipboardList size={15} strokeWidth={activeSubView === "live-orders" ? 2.5 : 2} />
            Live Orders
          </button>

          <button
            onClick={() => setActiveSubView("recent-orders")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubView === "recent-orders"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <CheckCircle2 size={15} strokeWidth={activeSubView === "recent-orders" ? 2.5 : 2} />
            Recent Orders
          </button>

          <button
            onClick={() => setActiveSubView("tables")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubView === "tables"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <LayoutGrid size={15} strokeWidth={activeSubView === "tables" ? 2.5 : 2} />
            Tables
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            Fullscreen
          </button>
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

      {/* Unsaved Order Confirmation Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
            onClick={() => setShowUnsavedWarning(false)}
          />
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl max-w-md w-full relative z-[151] animate-in fade-in zoom-in-95 duration-250">
            <h3 className="text-[19px] font-[1000] text-[#0c1424]">Unsaved Order in Progress</h3>
            <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed">
              You are currently editing an active order. If you start a new order, your current unsaved progress will be discarded.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="flex-1 h-12 rounded-xl border border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/15 cursor-pointer"
              >
                Discard & Start New
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POSTopBar;
