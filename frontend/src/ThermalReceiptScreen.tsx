import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PosLayout from './components/PosLayout';

type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal?: number;
};

type ReceiptBill = {
  id?: string;
  orderNumber?: number;
  tableNumber?: string;
  orderType?: string;
  totalAmount?: number;
  taxAmount?: number;
  items?: ReceiptItem[];
  createdAt?: string;
};

type ReceiptPayment = {
  method?: string;
  paidAmount?: number;
  amount?: number;
  changeAmount?: number;
};

type ReceiptState = {
  bill?: ReceiptBill;
  payment?: ReceiptPayment;
  cashierName?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(Number(value || 0));

const formatOrderType = (value?: string) => {
  if (!value) return 'DINE IN';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ThermalReceiptScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ReceiptState;

  const bill = state.bill;
  const payment = state.payment;
  const hasBill = Boolean(bill && Array.isArray(bill.items));

  const receiptDate = useMemo(
    () => (bill?.createdAt ? new Date(bill.createdAt) : new Date()),
    [bill?.createdAt],
  );

  const subtotal = useMemo(() => {
    if (!bill?.items || bill.items.length === 0) {
      return 0;
    }

    return bill.items.reduce((acc, item) => {
      const line = Number(item.lineTotal ?? item.price * item.quantity);
      return acc + line;
    }, 0);
  }, [bill?.items]);

  const tax = Number(bill?.taxAmount || 0);
  const total = Number(bill?.totalAmount || subtotal + tax);
  const paidAmount = Number(payment?.paidAmount ?? payment?.amount ?? total);
  const changeAmount = Number(payment?.changeAmount ?? Math.max(paidAmount - total, 0));

  return (
    <PosLayout>
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
              onClick={() => navigate('/pos')}
              className="flex h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
            >
              Order List
            </button>
            <button
              onClick={() => navigate('/pos/order-entry', { replace: true })}
              className="flex h-12 items-center gap-2 rounded-2xl bg-[#5dc7ec] px-8 text-[11px] font-black uppercase tracking-widest text-[#0c1424] shadow-xl shadow-[#5dc7ec]/20 transition-all hover:bg-white"
            >
              New Transaction
            </button>
          </div>

          <div className="receipt-shell mx-auto w-[320px] rounded-[32px] border border-slate-200 bg-white p-8 font-mono text-[11px] leading-[1.5] shadow-2xl shadow-black/5 print:rounded-none print:border-0 print:shadow-none">
            {!hasBill ? (
              <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                Receipt data not available
              </div>
            ) : (
              <div>
                <div className="text-center">
                  <div className="text-lg font-[950] uppercase tracking-tighter text-[#0c1424]">TillCloud</div>
                  <div className="mt-1 text-[10px] font-medium text-slate-500">{receiptDate.toLocaleString('en-AU')}</div>
                </div>

                <div className="my-6 border-t border-dashed border-slate-200" />

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Order No</span>
                    <span className="font-black text-[#0c1424]">#{String(bill?.orderNumber ?? 0).padStart(4, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Table</span>
                    <span className="font-black text-[#0c1424]">{bill?.tableNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Type</span>
                    <span className="font-black text-[#0c1424]">{formatOrderType(bill?.orderType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Cashier</span>
                    <span className="font-black text-[#0c1424]">{state.cashierName || 'Cashier'}</span>
                  </div>
                </div>

                <div className="my-6 border-t border-dashed border-slate-200" />

                <div className="space-y-4">
                  {(bill?.items || []).map((item) => {
                    const unitPrice = Number(item.price ?? 0);
                    const lineTotal = Number(item.lineTotal ?? unitPrice * Number(item.quantity ?? 0));

                    return (
                      <div key={item.id}>
                        <div className="font-black text-[#0c1424] uppercase tracking-wide">{item.name}</div>
                        <div className="mt-1 flex justify-between text-slate-500 font-bold">
                          <span>
                            {item.quantity} x {formatCurrency(unitPrice)}
                          </span>
                          <span className="text-[#0c1424]">{formatCurrency(lineTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="my-6 border-t border-dashed border-slate-200" />

                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-[950] text-[#0c1424]">
                    <span>TOTAL</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="my-6 border-t border-dashed border-slate-200" />

                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Method</span>
                    <span className="uppercase">{payment?.method === 'CARD' ? 'Card' : 'Cash'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Amount Paid</span>
                    <span className="text-[#0c1424]">{formatCurrency(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Change</span>
                    <span className="text-[#0c1424]">{formatCurrency(changeAmount)}</span>
                  </div>
                </div>

                <div className="my-8 text-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c1424]">Thank You</div>
                  <div className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Please Visit Again</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PosLayout>
  );
}
