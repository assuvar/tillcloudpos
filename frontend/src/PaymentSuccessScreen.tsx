import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ReceiptText, ArrowRight, Home, Copy, Check } from 'lucide-react';

export default function PaymentSuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedId, setCopiedId] = useState(false);
  const state = location.state as {
    bill?: { id: string; orderNumber: number; totalAmount: number; tableNumber?: string | null };
    payment?: { amount?: number; cashReceived?: number; change?: number };
    customer?: { name: string } | null;
  } | null;

  const bill = state?.bill;
  const payment = state?.payment;

  const truncateBillId = (id: string, prefixLen: number = 10, suffixLen: number = 6) => {
    if (id.length <= prefixLen + suffixLen + 3) return id;
    const prefix = id.substring(0, prefixLen);
    const suffix = id.substring(id.length - suffixLen);
    return `${prefix}…${suffix}`;
  };

  const handleCopyBillId = async () => {
    if (bill?.id) {
      try {
        await navigator.clipboard.writeText(bill.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } catch (err) {
        console.error('Failed to copy Bill ID:', err);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-slate-900">
      <div className="w-full max-w-2xl rounded-[40px] border border-slate-100 bg-white p-10 shadow-2xl shadow-black/10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={44} strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500">Payment Complete</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0c1424]">Bill settled successfully</h1>
          <p className="mt-3 text-sm text-slate-500">
            {bill ? `Order #${String(bill.orderNumber).padStart(3, '0')} has been marked as paid.` : 'The bill has been marked as paid.'}
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-[28px] bg-slate-50 p-6 sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bill ID</div>
            <div className="mt-1 flex items-center gap-2">
              <div 
                className="text-sm font-black text-[#0c1424] cursor-help" 
                title={bill?.id || '—'}
              >
                {truncateBillId(bill?.id || '—')}
              </div>
              {bill?.id && (
                <button
                  onClick={handleCopyBillId}
                  className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 hover:text-[#0c1424]"
                  title="Copy full Bill ID"
                >
                  {copiedId ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</div>
            <div className="mt-1 text-sm font-black text-[#0c1424]">${(payment?.amount ?? bill?.totalAmount ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Change</div>
            <div className="mt-1 text-sm font-black text-[#0c1424]">${(payment?.change ?? 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/pos')}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0c1424] text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:bg-black"
          >
            <Home size={18} />
            Back to POS Home
          </button>
          <button
            onClick={() => navigate('/pos/order-entry', { replace: true })}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50"
          >
            <ReceiptText size={18} />
            New Bill
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
