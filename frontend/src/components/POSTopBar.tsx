import React, { useState, useEffect } from "react";
import {
  LogOut,
  ClipboardList,
  LayoutGrid,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { usePosCart } from "../context/PosCartContext";
import OperationalModals from "./OperationalModals";

interface POSTopBarProps {
  activeView?: "orders" | "tables" | "menu";
  onViewChange?: (view: "orders" | "tables" | "menu") => void;
}

const POSTopBar: React.FC<POSTopBarProps> = () => {
  const { setMode, logout, activeAttendance, clockOut } = useAuth();
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
  const [showExitModal, setShowExitModal] = useState(false);
  const [manualClockOutOpen, setManualClockOutOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleExitClick = () => {
    const isDraft =
      activeBill &&
      (activeBill.status === "CREATED" || activeBill.status === "OPEN");
    const hasItems = billItems && billItems.length > 0;

    if (isDraft && hasItems) {
      setShowUnsavedWarning(true);
    } else {
      setShowExitModal(true);
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedWarning(false);
    if (activeBill?.id) {
      api
        .delete(`/orders/${activeBill.id}`, {
          data: { reason: "Discarded unsaved draft" },
        })
        .catch(console.error);
    }
    clearBill();
    setIsLandingScreen(true);
    setActiveSubView("menu");
    setShowExitModal(true);
  };

  const handleReturnToDashboard = () => {
    setShowExitModal(false);
    clearBill();
    setMode("dashboard");
    navigate("/dashboard", { state: { currentView: "home" } });
  };

  const handleClockOutAndExit = async () => {
    setShowExitModal(false);
    clearBill();
    try {
      if (activeAttendance) {
        await clockOut();
      }
      void logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to clock out and exit:", err);
      void logout();
      navigate("/login");
    }
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

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-8 shadow-sm">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveSubView("menu");
              navigate("/pos");
            }}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity text-left cursor-pointer"
          >
            <img
              src="/logo.png"
              alt="TillCloud Logo"
              className="w-8 h-8 object-contain flex-shrink-0"
            />
          </button>
        </div>

        {/* Central Segmented Control: POS Screen Navigation */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-2xl select-none">
          <button
            onClick={() => {
              setIsLandingScreen(true);
              setActiveSubView("live-orders");
              navigate("/pos");
            }}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "live-orders"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <ClipboardList
              size={15}
              strokeWidth={activeSubView === "live-orders" ? 2.5 : 2}
            />
            Live Orders
          </button>

          <button
            onClick={() => {
              setIsLandingScreen(true);
              setActiveSubView("tables");
              navigate("/pos");
            }}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === "tables"
                ? "bg-[#0c1424] text-white shadow-md shadow-black/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <LayoutGrid
              size={15}
              strokeWidth={activeSubView === "tables" ? 2.5 : 2}
            />
            Tables
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            Fullscreen
          </button>
        </div>

        {/* Right Side: Exit Action Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-rose-500 hover:bg-rose-50 text-[12px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            title="Exit POS"
          >
            <LogOut size={16} />
            Exit
          </button>
        </div>
      </header>

      {/* Exit POS Options Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
            onClick={() => setShowExitModal(false)}
          />
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl max-w-md w-full relative z-[151] animate-in fade-in zoom-in-95 duration-250">
            <h3 className="text-[19px] font-[1000] text-[#0c1424] text-center">
              Leave POS Session
            </h3>
            <p className="text-[13px] text-slate-500 font-semibold mt-2 text-center leading-relaxed">
              Choose what you want to do.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleReturnToDashboard}
                className="w-full h-12 rounded-xl bg-slate-100 text-[#0c1424] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer shadow-sm"
              >
                Return to Dashboard
              </button>
              <button
                onClick={handleClockOutAndExit}
                className="w-full h-12 rounded-xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/15 cursor-pointer"
              >
                Clock Out & Exit
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full h-12 rounded-xl border border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Order Confirmation Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
            onClick={() => setShowUnsavedWarning(false)}
          />
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl max-w-md w-full relative z-[151] animate-in fade-in zoom-in-95 duration-250">
            <h3 className="text-[19px] font-[1000] text-[#0c1424]">
              Unsaved Order in Progress
            </h3>
            <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed">
              You are currently editing an active order. If you leave, your
              current unsaved progress will be discarded.
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

      {/* Operational Modals Guard Layer */}
      <OperationalModals
        forceClockOutOpen={manualClockOutOpen}
        onClockOutClose={() => setManualClockOutOpen(false)}
      />
    </>
  );
};

export default POSTopBar;
