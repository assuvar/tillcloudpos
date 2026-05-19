import React, { useState, useEffect } from "react";
import {
  LogOut,
  ClipboardList,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
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
    isLandingScreen,
    setIsLandingScreen,
    billItems,
    activeBill,
  } = usePosCart();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showPosHeader, setShowPosHeader] = useState(() => localStorage.getItem("ui-pos-header") === "true");

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleStorageChange = () => {
      setShowPosHeader(localStorage.getItem("ui-pos-header") === "true");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("ui-pos-header-change", handleStorageChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("ui-pos-header-change", handleStorageChange);
    };
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
    // If we're already outside of an active order, just start a new one
    clearBill();
    setIsLandingScreen(true);
    setActiveSubView("menu");
    navigate("/pos");
  };

  const handleBackClick = () => {
    const isDraft = activeBill && (activeBill.status === "CREATED" || activeBill.status === "OPEN");
    const hasItems = billItems && billItems.length > 0;
    
    if (isDraft && hasItems) {
      setShowUnsavedWarning(true);
    } else {
      clearBill();
      setIsLandingScreen(true);
      setActiveSubView("menu");
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedWarning(false);
    if (activeBill?.id) {
       // Explicitly void the discarded draft so it doesn't linger on the dashboard
       api.delete(`/orders/${activeBill.id}`, { data: { reason: "Discarded unsaved draft" } }).catch(console.error);
    }
    clearBill();
    setIsLandingScreen(true);
    setActiveSubView("menu");
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
          </button>

          <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

          {/* Compact Combined Restaurant & Timer Badge next to POS name */}
          {showPosHeader && (
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
          )}

          {/* Premium Highlighted + NEW ORDER Button */}
          {(activeSubView === "live-orders" || activeSubView === "tables") && (
            <button
              onClick={handleNewOrderClick}
              className="flex items-center gap-1.5 h-10 px-5 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-wider shadow-lg shadow-black/5 hover:scale-[1.02] hover:bg-[#142038] transition-all cursor-pointer"
              title="Start a fresh POS session"
            >
              + New Order
            </button>
          )}

          {/* Back Button when inside an order (not on the landing/selection screen) */}
          {activeSubView === "menu" && !isLandingScreen && (
            <button
              onClick={handleBackClick}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-100 text-slate-600 text-[12px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
              title="Leave active order and go back"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              Back
            </button>
          )}
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
          </div>

          <div className="flex items-center gap-4">
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
              You are currently editing an active order. If you leave, your current unsaved progress will be discarded.
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
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POSTopBar;
