import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Utensils, 
  ShoppingBag, 
  Store, 
  Bike, 
  ArrowRight,
  CheckCircle2,
  ListPlus
} from 'lucide-react';

interface NewBillModalProps {
  onClose: () => void;
}

const OrderTypeButton = ({ 
  active, 
  icon: Icon, 
  title, 
  description, 
  onClick 
}: { 
  active: boolean; 
  icon: any; 
  title: string; 
  description: string; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative p-6 rounded-[32px] border-2 transition-all text-left flex flex-col gap-4 ${
      active ? 'bg-white border-[#0c1424] shadow-xl' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
    }`}
  >
    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${active ? 'bg-[#0c1424] text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
      <Icon size={24} />
    </div>
    
    <div>
      <h3 className="text-xl font-black text-[#0c1424] leading-tight mb-2">{title}</h3>
      <p className="text-xs font-medium text-slate-400 leading-relaxed">{description}</p>
    </div>

    {active && (
      <div className="absolute top-4 right-4 text-[#0c1424]">
        <CheckCircle2 size={20} fill="#0c1424" className="text-white" />
      </div>
    )}
  </button>
);

export default function NewBillModal({ onClose }: NewBillModalProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'dining' | 'pickup' | 'in-store' | 'delivery'>('dining');
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    // Navigate to order entry with the type and details
    navigate(`/pos/order-entry?type=${selectedType}&detail=${encodeURIComponent(inputValue)}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0c1424] mb-4">New Bill</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Select the order type to proceed</p>
          </div>

          {/* Grid Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="space-y-4">
              <OrderTypeButton 
                active={selectedType === 'dining'} 
                title="Dine In"
                description="Customer orders at counter, pays, sits at table"
                icon={Utensils}
                onClick={() => setSelectedType('dining')}
              />
              {selectedType === 'dining' && (
                <div className="px-6 pb-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Table Number <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full h-14 px-6 rounded-2xl bg-[#f0f7ff] border-none focus:ring-2 focus:ring-[#5899ff]/30 text-[15px] font-bold"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <OrderTypeButton 
                active={selectedType === 'pickup'} 
                title="Pickup"
                description="Order placed, kitchen starts, customer pays on collection"
                icon={ShoppingBag}
                onClick={() => setSelectedType('pickup')}
              />
              {selectedType === 'pickup' && (
                <div className="px-6 pb-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Pickup Name or Number <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Customer name or ID"
                    className="w-full h-14 px-6 rounded-2xl bg-[#f0f7ff] border-none focus:ring-2 focus:ring-[#5899ff]/30 text-[15px] font-bold"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <OrderTypeButton 
                active={selectedType === 'in-store'} 
                title="In Store"
                description="Quick counter service — pays immediately, waits and collects"
                icon={Store}
                onClick={() => setSelectedType('in-store')}
              />
              {selectedType === 'in-store' && (
                <div className="px-6 bg-slate-50/50 rounded-2xl h-14 flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest animate-in fade-in duration-300">
                  No additional info required
                </div>
              )}
            </div>

            <div className="space-y-4">
              <OrderTypeButton 
                active={selectedType === 'delivery'} 
                title="Delivery"
                description="Driver delivers to address, payment on delivery"
                icon={Bike}
                onClick={() => setSelectedType('delivery')}
              />
              {selectedType === 'delivery' && (
                <div className="px-6 animate-in slide-in-from-top-4 duration-300">
                  <button className="w-full h-14 rounded-2xl bg-[#f0f7ff] text-[#0c1424] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-[#e2efff] transition-all">
                    <ListPlus size={18} />
                    Add Delivery Details
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="h-16 px-10 rounded-full border-2 border-slate-100 text-[13px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
            
            <div className="flex items-center gap-12">
               <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Mode</span>
                  <span className="text-xl font-black text-[#0c1424]">{selectedType.toUpperCase().replace('-', ' ')}</span>
               </div>
               
                <button 
                  onClick={handleConfirm}
                  className="bg-[#0c1424] text-white h-16 px-12 rounded-[24px] flex items-center gap-4 shadow-2xl shadow-black/20 hover:bg-black transition-all active:scale-95 group"
                >
                  <span className="text-[13px] font-black uppercase tracking-widest">Confirm & Add Items</span>
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
