
export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal?: number;
}

export interface ReceiptBill {
  id?: string;
  orderNumber?: number;
  tableNumber?: string;
  orderType?: string;
  totalAmount?: number;
  taxAmount?: number;
  items?: ReceiptItem[];
  pickupName?: string | null;
  deliveryName?: string | null;
  createdAt?: string | Date;
}

export interface ReceiptPayment {
  method?: string;
  paidAmount?: number;
  amount?: number;
  changeAmount?: number;
}

export interface BillSettings {
  logoUrl?: string;
  showLogo: boolean;
  restaurantName: string;
  address: string;
  gstNumber?: string;
  contactNumber?: string;
  footerText?: string;
  showQrCode: boolean;
  qrCodeData?: string;
  paperSize: string;
  fontSize: number;
  alignment: string;
}

interface ReceiptTemplateProps {
  billSettings?: BillSettings | null;
  bill?: ReceiptBill | null;
  payment?: ReceiptPayment | null;
  cashierName?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

export default function ReceiptTemplate({
  billSettings,
  bill,
  payment,
  cashierName,
}: ReceiptTemplateProps) {
  const receiptDate = bill?.createdAt ? new Date(bill.createdAt) : new Date();

  // Calculate totals if bill items exist
  let subtotal = 0;
  if (bill?.items && bill.items.length > 0) {
    subtotal = bill.items.reduce((acc, item) => {
      const line = Number(item.lineTotal ?? item.price * item.quantity);
      return acc + line;
    }, 0);
  }

  const tax = Number(bill?.taxAmount || 0);
  const total = bill?.totalAmount !== undefined ? Number(bill.totalAmount) : subtotal + tax;
  const paidAmount = Number(payment?.paidAmount ?? payment?.amount ?? total);
  const changeAmount = Number(
    payment?.changeAmount ?? Math.max(paidAmount - total, 0)
  );

  const getAlignmentClass = () => {
    switch (billSettings?.alignment) {
      case "CENTER":
        return "text-center";
      case "RIGHT":
        return "text-right";
      case "LEFT":
      default:
        return "text-left";
    }
  };

  const getWidthStyle = () => {
    if (billSettings?.paperSize === "58mm") return "200px";
    if (billSettings?.paperSize === "A4") return "210mm";
    return "320px"; // 80mm approx
  };

  return (
    <div
      className={`receipt-template bg-white text-black font-mono leading-[1.5] flex flex-col p-6 mx-auto ${getAlignmentClass()}`}
      style={{
        width: getWidthStyle(),
        fontSize: `${billSettings?.fontSize || 12}px`,
      }}
    >
      <div className="text-center mb-6">
        {billSettings?.showLogo && billSettings.logoUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={billSettings.logoUrl}
              alt="Logo"
              className="max-h-16 object-contain"
            />
          </div>
        )}
        <div className="text-lg font-[950] uppercase tracking-tighter text-[#0c1424]">
          {billSettings?.restaurantName || "TillCloud"}
        </div>
        {billSettings?.address && (
          <div className="text-[11px] text-slate-500 whitespace-pre-wrap mt-1 uppercase font-bold">
            {billSettings.address}
          </div>
        )}
        {billSettings?.contactNumber && (
          <div className="text-[11px] text-slate-500 mt-1 font-bold">
            PH: {billSettings.contactNumber}
          </div>
        )}
        {billSettings?.gstNumber && (
          <div className="text-[11px] text-slate-500 font-bold">
            ABN/GST: {billSettings.gstNumber}
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-slate-200 py-3 mb-3 text-[11px] font-bold">
        <div className="flex justify-between uppercase">
          <span>Date: {receiptDate.toLocaleDateString()}</span>
          <span>Time: {receiptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="flex justify-between uppercase mt-1">
          <span>Order: #{bill?.orderNumber || "000"}</span>
          <span>{bill?.orderType?.replace(/_/g, " ") || "DINE IN"}</span>
        </div>
        {bill?.tableNumber && (
          <div className="mt-1 uppercase">Table: {bill.tableNumber}</div>
        )}
        {cashierName && <div className="mt-1 uppercase">Served by: {cashierName}</div>}
      </div>

      <div className="border-b-2 border-dashed border-slate-200 pb-3 mb-3">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
          <span>Item</span>
          <span>Amount</span>
        </div>

        <div className="space-y-2">
          {bill?.items && bill.items.length > 0 ? (
            bill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[12px] font-bold">
                <div className="flex gap-2">
                  <span>{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span>
                  {formatCurrency(
                    Number(item.lineTotal ?? item.price * item.quantity)
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-4 italic text-xs">
              No items
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-4 text-[12px] font-bold">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-[16px] font-[900] mt-2 pt-2 border-t border-slate-200">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {payment && (
        <div className="border-t-2 border-dashed border-slate-200 pt-3 mb-6 text-[11px] font-bold space-y-1">
          <div className="flex justify-between">
            <span>Paid ({payment.method || "CASH"})</span>
            <span>{formatCurrency(paidAmount)}</span>
          </div>
          {changeAmount > 0 && (
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatCurrency(changeAmount)}</span>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-auto">
        {billSettings?.showQrCode && (
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 bg-slate-100 flex items-center justify-center border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold">QR CODE</span>
            </div>
          </div>
        )}
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-pre-wrap">
          {billSettings?.footerText || "Thank you for your visit!"}
        </div>
      </div>
    </div>
  );
}
