
export interface KotSettings {
  mode: 'DISPLAY' | 'PRINT' | 'BOTH';
  enablePrinting: boolean;
  showTableNumber: boolean;
  showCustomerName: boolean;
  showNotes: boolean;
  showOrderType: boolean;
}

export interface KotItem {
  id: string;
  name: string;
  quantity: number;
  categoryName?: string;
  notes?: string;
}

export interface KotData {
  id?: string;
  kotNumber?: number;
  orderNumber?: number;
  tableNumber?: string;
  orderType?: string;
  customerName?: string;
  items: KotItem[];
  createdAt?: string | Date;
}

interface KotSlipTemplateProps {
  kotSettings: KotSettings;
  kot: KotData;
}

export default function KotSlipTemplate({ kotSettings, kot }: KotSlipTemplateProps) {
  const kotDate = kot.createdAt ? new Date(kot.createdAt) : new Date();

  return (
    <div className="w-[280px] bg-white text-[#1a1a1a] p-6 font-mono text-[11px] shadow-2xl rounded-sm text-left">
      <div className="text-center font-bold text-[14px] mb-2 border-b-2 border-dashed border-slate-200 pb-2">
        KITCHEN TICKET #{kot.kotNumber || "000"}
      </div>
      <div className="flex justify-between mb-4 font-bold">
        <div>DATE: {kotDate.toLocaleDateString()}</div>
        <div>TIME: {kotDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      
      <div className="space-y-1 mb-4 text-[12px] uppercase">
        <div className="font-bold">ORDER #{kot.orderNumber || "000"}</div>
        {kotSettings.showTableNumber && kot.tableNumber && (
          <div className="font-bold">TABLE: {kot.tableNumber}</div>
        )}
        {kotSettings.showOrderType && kot.orderType && (
          <div>TYPE: {kot.orderType.replace(/_/g, " ")}</div>
        )}
        {kotSettings.showCustomerName && kot.customerName && (
          <div>CUSTOMER: {kot.customerName}</div>
        )}
      </div>

      <div className="border-t-2 border-b-2 border-black py-2 my-2 space-y-3">
        {kot.items.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex font-black text-[13px]">
              <span className="w-8">{item.quantity}x</span>
              <span className="flex-1">{item.name}</span>
            </div>
            {kotSettings.showNotes && item.notes && (
              <div className="text-[10px] italic text-slate-600 ml-8 uppercase font-bold mt-1">
                • {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mt-4 text-[9px] font-bold opacity-50 uppercase tracking-widest">
        -- END OF TICKET --
      </div>
    </div>
  );
}
