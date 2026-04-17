import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ReceiptLocationState = {
  bill?: {
    id: string;
    orderNumber: number;
    orderType?: string;
    tableNumber?: string | null;
    subtotalAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    paidAt?: string | null;
    createdAt?: string;
    items?: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      lineTotal?: number;
    }>;
  };
  payment?: {
    id?: string;
    method?: string;
    amount?: number;
    cashReceived?: number;
    change?: number;
  };
  customer?: { name: string } | null;
  cashierName?: string;
  discountAmount?: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(Number(value || 0));

const formatOrderType = (orderType?: string) => {
  if (!orderType) return 'Dine-in';

  const normalized = orderType.replaceAll('_', ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function ThermalReceiptScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ReceiptLocationState;

  const bill = state.bill;
  const payment = state.payment;

  const subtotal = Number(bill?.subtotalAmount ?? bill?.totalAmount ?? 0);
  const tax = Number(bill?.taxAmount ?? 0);
  const discount = Number(state.discountAmount ?? 0);
  const total = Number(bill?.totalAmount ?? subtotal + tax - discount);

  const taxRate = useMemo(() => {
    if (subtotal <= 0 || tax <= 0) return 0;
    return Number(((tax / subtotal) * 100).toFixed(2));
  }, [subtotal, tax]);

  const paidAmount = Number(payment?.cashReceived ?? payment?.amount ?? total);
  const changeAmount = Number(payment?.change ?? Math.max(paidAmount - total, 0));

  const receiptDate = useMemo(() => {
    const source = bill?.paidAt || bill?.createdAt;
    return source ? new Date(source) : new Date();
  }, [bill?.createdAt, bill?.paidAt]);

  const hasBill = Boolean(bill?.id);
  const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'TILLCLOUD RESTAURANT';
  const restaurantAddress = import.meta.env.VITE_RESTAURANT_ADDRESS || '';

  return (
    <>
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
            background: #fff;
          }

          .receipt-page {
            padding: 0 !important;
            background: #fff !important;
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

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="receipt-page min-h-screen bg-slate-100 px-4 py-8 text-black print:bg-white print:p-0">
        <div className="mx-auto w-full max-w-5xl">
          <div className="no-print mb-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-md bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
            >
              Print Receipt
            </button>
            <button
              onClick={() => navigate('/pos')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-800"
            >
              Back to POS Home
            </button>
            <button
              onClick={() => navigate('/pos/order-entry', { replace: true })}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-800"
            >
              New Bill
            </button>
          </div>

          <div className="receipt-shell mx-auto w-[300px] border border-slate-300 bg-white p-4 text-[12px] leading-[1.35] shadow-sm">
            {!hasBill ? (
              <div className="py-6 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                Receipt data not available
              </div>
            ) : (
              <div className="font-mono">
                <div className="text-center">
                  <div className="text-sm font-bold uppercase tracking-wide">{restaurantName}</div>
                  {restaurantAddress ? <div className="mt-1 text-[11px]">{restaurantAddress}</div> : null}
                  <div className="mt-1 text-[11px]">{receiptDate.toLocaleString('en-AU')}</div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Order No</span>
                    <span className="font-bold">#{String(bill?.orderNumber ?? 0).padStart(4, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table</span>
                    <span>{bill?.tableNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Type</span>
                    <span>{formatOrderType(bill?.orderType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier</span>
                    <span>{state.cashierName || 'Cashier'}</span>
                  </div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-2">
                  {(bill?.items || []).map((item) => {
                    const unitPrice = Number(item.price ?? 0);
                    const lineTotal = Number(item.lineTotal ?? unitPrice * Number(item.quantity ?? 0));

                    return (
                      <div key={item.id} className="text-[11px]">
                        <div className="font-semibold">{item.name}</div>
                        <div className="mt-0.5 flex justify-between">
                          <span>
                            {item.quantity} x {formatCurrency(unitPrice)}
                          </span>
                          <span>{formatCurrency(lineTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax{taxRate > 0 ? ` (${taxRate}%)` : ''}</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Payment</span>
                    <span>{payment?.method === 'CARD' ? 'Card' : 'Cash'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid</span>
                    <span>{formatCurrency(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span>{formatCurrency(changeAmount)}</span>
                  </div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="pt-1 text-center text-[11px]">
                  <div>Thank you for dining with us</div>
                  <div className="mt-1">Please visit again</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
