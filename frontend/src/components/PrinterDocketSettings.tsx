import { useEffect, useState } from "react";
import { 
  Printer, 
  Receipt, 
  ChefHat, 
  Plus, 
  Trash2, 
  Edit3, 
  Monitor, 
  Layout, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "../services/api";
import ReceiptTemplate from "./ReceiptTemplate";
import KotSlipTemplate from "./KotSlipTemplate";
interface PrinterSettings {
  id: string;
  name: string;
  type: 'THERMAL' | 'A4';
  interface: string;
  ipAddress?: string;
  port?: number;
  isBilling: boolean;
  isKitchen: boolean;
  paperSize: string;
  isActive: boolean;
}

interface KotSettings {
  mode: 'DISPLAY' | 'PRINT' | 'BOTH';
  enablePrinting: boolean;
  showTableNumber: boolean;
  showCustomerName: boolean;
  showNotes: boolean;
  showOrderType: boolean;
}

interface BillSettings {
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

export default function PrinterDocketSettings() {
  const [printers, setPrinters] = useState<PrinterSettings[]>([]);
  const [kotSettings, setKotSettings] = useState<KotSettings>({
    mode: 'BOTH',
    enablePrinting: true,
    showTableNumber: true,
    showCustomerName: true,
    showNotes: true,
    showOrderType: true
  });
  const [billSettings, setBillSettings] = useState<BillSettings>({
    showLogo: true,
    restaurantName: "",
    address: "",
    showQrCode: false,
    paperSize: "80mm",
    fontSize: 12,
    alignment: "LEFT"
  });

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadSettings = async () => {
    try {
      const [printersRes, kotRes, billRes] = await Promise.all([
        api.get("/settings/printers"),
        api.get("/settings/kot"),
        api.get("/settings/bill")
      ]);
      setPrinters(printersRes.data);
      setKotSettings(kotRes.data);
      setBillSettings(billRes.data);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSaveKotSettings = async () => {
    try {
      await api.put("/settings/kot", kotSettings);
      setMessage({ type: 'success', text: 'KOT settings updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update KOT settings' });
    }
  };

  const handleSaveBillSettings = async () => {
    try {
      await api.put("/settings/bill", billSettings);
      setMessage({ type: 'success', text: 'Bill settings updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update bill settings' });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col">
        <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
          Printer & Docket Settings
        </h2>
        <p className="text-[14px] text-slate-400 font-medium mt-2">
          Configure thermal printers, KOT display modes, and customize your billing slips.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Printer Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer size={20} className="text-[#5dc7ec]" />
            <h3 className="text-[18px] font-black text-[#0c1424]">Hardware Printers</h3>
          </div>
          <button className="h-10 px-4 rounded-full bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Add Printer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {printers.length === 0 ? (
            <div className="col-span-2 p-12 rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/30 flex flex-col items-center gap-4 text-center">
              <Printer size={40} className="text-slate-200" />
              <div>
                <p className="text-slate-400 font-bold">No printers configured yet</p>
                <p className="text-slate-300 text-xs mt-1">Add your first network or USB printer to get started.</p>
              </div>
            </div>
          ) : (
            printers.map(printer => (
              <div key={printer.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#5dc7ec] flex items-center justify-center">
                      <Printer size={18} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black text-[#0c1424]">{printer.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{printer.ipAddress || printer.interface}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {printer.isBilling && <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[9px] font-black uppercase">Billing</span>}
                    {printer.isKitchen && <span className="px-2 py-1 bg-orange-50 text-orange-500 rounded-lg text-[9px] font-black uppercase">Kitchen</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                      <span>{printer.type}</span>
                      <span>•</span>
                      <span>{printer.paperSize}</span>
                   </div>
                   <div className="flex gap-2">
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Edit3 size={16} /></button>
                      <button className="p-2 text-slate-300 hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* KOT System Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <ChefHat size={20} className="text-[#5dc7ec]" />
          <h3 className="text-[18px] font-black text-[#0c1424]">Kitchen Order Ticket (KOT) Settings</h3>
        </div>

        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Kitchen Workflow Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'DISPLAY', label: 'Display Only', icon: Monitor },
                  { id: 'PRINT', label: 'Print Only', icon: Printer },
                  { id: 'BOTH', label: 'Both', icon: Layout }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setKotSettings({ ...kotSettings, mode: mode.id as any })}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${kotSettings.mode === mode.id ? 'border-[#5dc7ec] bg-blue-50/30' : 'border-slate-50 bg-slate-50/20 hover:border-slate-100'}`}
                  >
                    <mode.icon size={20} className={kotSettings.mode === mode.id ? 'text-[#5dc7ec]' : 'text-slate-300'} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${kotSettings.mode === mode.id ? 'text-[#0c1424]' : 'text-slate-400'}`}>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Slip Options</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'showTableNumber', label: 'Table Number' },
                  { id: 'showCustomerName', label: 'Customer Name' },
                  { id: 'showNotes', label: 'Order Notes' },
                  { id: 'showOrderType', label: 'Order Type' }
                ].map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${kotSettings[opt.id as keyof KotSettings] ? 'bg-[#0c1424] border-[#0c1424]' : 'border-slate-200 group-hover:border-slate-300'}`}>
                      {kotSettings[opt.id as keyof KotSettings] && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={!!kotSettings[opt.id as keyof KotSettings]} 
                      onChange={(e) => setKotSettings({ ...kotSettings, [opt.id]: e.target.checked })}
                    />
                    <span className="text-[13px] font-bold text-[#0c1424]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSaveKotSettings}
              className="w-full h-12 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-black/10 mt-4"
            >
              Save KOT Configuration
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5dc7ec] to-blue-500"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 mt-2">KOT PREVIEW</span>
            
            <KotSlipTemplate 
              kotSettings={kotSettings}
              kot={{
                kotNumber: 124,
                orderNumber: 42,
                tableNumber: "GROUND-05",
                orderType: "DINE_IN",
                customerName: "John Doe",
                createdAt: new Date().toISOString(),
                items: [
                  { id: "1", name: "Classic Burger", quantity: 2, notes: "NO ONIONS, EXTRA CHEESE" },
                  { id: "2", name: "Truffle Fries", quantity: 1 }
                ]
              }}
            />
          </div>
        </div>
      </section>

      {/* Bill Customization */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Receipt size={20} className="text-[#5dc7ec]" />
          <h3 className="text-[18px] font-black text-[#0c1424]">Bill & Receipt Customization</h3>
        </div>

        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Restaurant Name</label>
                <input 
                  type="text" 
                  value={billSettings.restaurantName}
                  onChange={e => setBillSettings({ ...billSettings, restaurantName: e.target.value })}
                  className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 text-[13px] font-bold text-[#0c1424] focus:ring-2 focus:ring-[#5dc7ec]/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Number</label>
                <input 
                  type="text" 
                  value={billSettings.contactNumber}
                  onChange={e => setBillSettings({ ...billSettings, contactNumber: e.target.value })}
                  className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 text-[13px] font-bold text-[#0c1424] focus:ring-2 focus:ring-[#5dc7ec]/20 outline-none"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                <textarea 
                  value={billSettings.address}
                  onChange={e => setBillSettings({ ...billSettings, address: e.target.value })}
                  className="w-full h-20 rounded-xl bg-slate-50 border-none p-4 text-[13px] font-bold text-[#0c1424] focus:ring-2 focus:ring-[#5dc7ec]/20 outline-none resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Layout</label>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Paper Size</span>
                      <select 
                        value={billSettings.paperSize}
                        onChange={e => setBillSettings({ ...billSettings, paperSize: e.target.value })}
                        className="text-[11px] font-black uppercase bg-slate-50 border-none rounded-lg px-2 py-1 outline-none"
                      >
                        <option value="58mm">58mm</option>
                        <option value="80mm">80mm</option>
                        <option value="A4">A4 Paper</option>
                      </select>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Alignment</span>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setBillSettings({ ...billSettings, alignment: 'LEFT' })} className={`p-1.5 rounded ${billSettings.alignment === 'LEFT' ? 'bg-white shadow-sm text-[#5dc7ec]' : 'text-slate-400'}`}><AlignLeft size={14} /></button>
                        <button onClick={() => setBillSettings({ ...billSettings, alignment: 'CENTER' })} className={`p-1.5 rounded ${billSettings.alignment === 'CENTER' ? 'bg-white shadow-sm text-[#5dc7ec]' : 'text-slate-400'}`}><AlignCenter size={14} /></button>
                        <button onClick={() => setBillSettings({ ...billSettings, alignment: 'RIGHT' })} className={`p-1.5 rounded ${billSettings.alignment === 'RIGHT' ? 'bg-white shadow-sm text-[#5dc7ec]' : 'text-slate-400'}`}><AlignRight size={14} /></button>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Toggles</label>
                <div className="space-y-3">
                   <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-500">Show Logo</span>
                      <div onClick={() => setBillSettings({ ...billSettings, showLogo: !billSettings.showLogo })} className={`h-5 w-10 rounded-full relative transition-colors ${billSettings.showLogo ? 'bg-[#0c1424]' : 'bg-slate-200'}`}>
                        <div className={`h-3 w-3 bg-white rounded-full absolute top-1 transition-all ${billSettings.showLogo ? 'right-1' : 'left-1'}`} />
                      </div>
                   </label>
                   <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-500">QR Code</span>
                      <div onClick={() => setBillSettings({ ...billSettings, showQrCode: !billSettings.showQrCode })} className={`h-5 w-10 rounded-full relative transition-colors ${billSettings.showQrCode ? 'bg-[#0c1424]' : 'bg-slate-200'}`}>
                        <div className={`h-3 w-3 bg-white rounded-full absolute top-1 transition-all ${billSettings.showQrCode ? 'right-1' : 'left-1'}`} />
                      </div>
                   </label>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveBillSettings}
              className="w-full h-12 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-black/10 mt-4"
            >
              Save Bill Settings
            </button>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center">
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-10">RECEIPT PREVIEW</span>
             
             <div className="shadow-xl rounded-sm text-[#1a1a1a] flex flex-col items-center text-center overflow-hidden">
                <ReceiptTemplate 
                  billSettings={billSettings} 
                  bill={{
                    orderNumber: 124,
                    orderType: "DINE_IN",
                    tableNumber: "GROUND-05",
                    totalAmount: 23.50,
                    taxAmount: 2.13,
                    createdAt: new Date().toISOString(),
                    items: [
                      { id: "1", name: "Cloud Coffee", quantity: 1, price: 5.50 },
                      { id: "2", name: "Classic Burger", quantity: 1, price: 18.00 }
                    ]
                  }}
                  payment={{
                    method: "CARD",
                    amount: 23.50,
                    changeAmount: 0
                  }}
                  cashierName="Admin"
                />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
