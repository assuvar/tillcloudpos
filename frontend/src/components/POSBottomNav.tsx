import React from "react";
import {
  LayoutGrid,
  UtensilsCrossed,
  ClipboardList,
  HelpCircle,
} from "lucide-react";

interface POSBottomNavProps {
  activeView: "orders" | "tables" | "menu";
  onViewChange: (view: "orders" | "tables" | "menu") => void;
}

const POSBottomNav: React.FC<POSBottomNavProps> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <footer className="h-20 bg-[#0c1424] px-8 text-white shrink-0 border-t border-white/5">
      <div className="flex h-full items-center justify-between">
        <nav className="flex gap-12">
          <button
            onClick={() => onViewChange("orders")}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              activeView === "orders"
                ? "text-[#5dc7ec]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ClipboardList
              size={22}
              strokeWidth={activeView === "orders" ? 2.5 : 2}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Orders
            </span>
          </button>

          <button
            onClick={() => onViewChange("tables")}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              activeView === "tables"
                ? "text-[#5dc7ec]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid
              size={22}
              strokeWidth={activeView === "tables" ? 2.5 : 2}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Tables
            </span>
          </button>

          <button
            onClick={() => onViewChange("menu")}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              activeView === "menu"
                ? "text-[#5dc7ec]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UtensilsCrossed
              size={22}
              strokeWidth={activeView === "menu" ? 2.5 : 2}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Menu
            </span>
          </button>
        </nav>

        <div className="flex items-center gap-6">
          <button className="flex h-11 items-center gap-3 rounded-full bg-slate-800/50 px-6 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            Switch User
          </button>
          <button className="text-slate-400 hover:text-white transition-colors">
            <HelpCircle size={22} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default POSBottomNav;
