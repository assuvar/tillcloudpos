import { X, Printer } from "lucide-react";
import KotSlipTemplate, { KotSettings, KotData } from "./KotSlipTemplate";

interface PrintPreviewModalProps {
  kotSettings: KotSettings;
  kot: KotData;
  onClose: () => void;
}

export default function PrintPreviewModal({ kotSettings, kot, onClose }: PrintPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-200">
        <div className="bg-white p-2 rounded-lg shadow-2xl relative">
          <div className="absolute -top-12 right-0 flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[11px] font-black uppercase tracking-widest text-[#0c1424] shadow-lg hover:bg-slate-50"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg hover:bg-rose-600"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
          
          <div className="print:m-0" id="print-area">
            <KotSlipTemplate kotSettings={kotSettings} kot={kot} />
          </div>
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
