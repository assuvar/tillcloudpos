import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UnifiedLayout from "./components/UnifiedLayout";
import api from "./services/api";
import ReceiptTemplate, { 
  ReceiptBill, 
  ReceiptPayment, 
  BillSettings 
} from "./components/ReceiptTemplate";

type ReceiptState = {
  bill?: ReceiptBill;
  payment?: ReceiptPayment;
  cashierName?: string;
};

export default function ThermalReceiptScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ReceiptState;

  const bill = state.bill;
  const payment = state.payment;
  const hasBill = Boolean(bill && Array.isArray(bill.items));
  const [billSettings, setBillSettings] = useState<BillSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/settings/bill");
        setBillSettings(response.data);
      } catch (error) {
        console.error("Failed to load bill settings", error);
      }
    };
    void loadSettings();
  }, []);

  return (
    <UnifiedLayout fullScreen={true} currentView="orders">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          body {
            margin: 0;
            background: #fff !important;
          }

          .receipt-page {
            padding: 0 !important;
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
          }

          .receipt-shell,
          .receipt-shell * {
            visibility: visible;
          }

          .receipt-shell {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            max-width: 80mm !important;
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 2mm !important;
          }

          .no-print,
          footer {
            display: none !important;
          }
        }
      `}</style>

      <div className="receipt-page min-h-screen bg-slate-100 px-4 py-8 text-black print:bg-white print:p-0">
        <div className="mx-auto w-full max-w-5xl">
          <div className="no-print mb-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => window.print()}
              className="flex h-12 items-center gap-2 rounded-2xl bg-[#0c1424] px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:bg-black"
            >
              Print Receipt
            </button>
            <button
              onClick={() => navigate("/pos")}
              className="flex h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
            >
              Order List
            </button>
            <button
              onClick={() => navigate("/pos/order-entry", { replace: true })}
              className="flex h-12 items-center gap-2 rounded-2xl bg-[#5dc7ec] px-8 text-[11px] font-black uppercase tracking-widest text-[#0c1424] shadow-xl shadow-[#5dc7ec]/20 transition-all hover:bg-white"
            >
              New Transaction
            </button>
          </div>

          <div className="receipt-shell mx-auto w-[320px] rounded-[32px] border border-slate-200 bg-white p-8 font-mono text-[11px] leading-[1.5] shadow-2xl shadow-black/5 print:rounded-none print:border-0 print:shadow-none">
            {!hasBill ? (
              <div className="py-12 px-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                Receipt data not available
              </div>
            ) : (
              <ReceiptTemplate 
                billSettings={billSettings} 
                bill={bill} 
                payment={payment} 
                cashierName={state.cashierName} 
              />
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}
