import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Utensils, 
  ShoppingBag, 
  Store, 
  Bike, 
  ArrowRight,
  CheckCircle2,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { usePosCart } from '../context/PosCartContext';
import { ALLOWED_SERVICE_MODELS, SERVICE_MODEL_LABELS, type ServiceModel } from '../serviceModels';

interface ServiceModeModalProps {
  onClose: () => void;
}

type PosOrderType = ServiceModel;

const SERVICE_MODEL_CONFIG: Record<
  PosOrderType,
  { icon: any; description: string; inputLabel?: string; inputPlaceholder?: string; inputRequired?: boolean }
> = {
  DINE_IN: {
    icon: Utensils,
    description: 'Customer orders at counter, pays, sits at table',
    inputLabel: 'TABLE NUMBER',
    inputPlaceholder: 'e.g. 14',
    inputRequired: true,
  },
  PICKUP: {
    icon: ShoppingBag,
    description: 'Order placed, kitchen starts, customer pays on collection',
    inputLabel: 'PICKUP NAME OR NUMBER',
    inputPlaceholder: 'Customer name or ID',
    inputRequired: true,
  },
  IN_STORE: {
    icon: Store,
    description: 'Quick counter service — pays immediately, waits and collects',
  },
  DELIVERY: {
    icon: Bike,
    description: 'Driver delivers to address, payment on delivery',
  },
};

const ServiceModeCard = ({ 
  active, 
  icon: Icon, 
  title, 
  description, 
  onClick,
  config,
  value,
  onValueChange,
  index
}: { 
  active: boolean; 
  icon: any; 
  title: string; 
  description: string; 
  onClick: () => void;
  config: any;
  value: string;
  onValueChange: (val: string) => void;
  index: number;
}) => (
  <div
    onClick={onClick}
    style={{ animationDelay: `${index * 100}ms` }}
    className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${
      active ? 'bg-white border-[#0c1424] shadow-2xl scale-[1.01]' : 'bg-slate-50/50 border-slate-100/50 hover:border-slate-200'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${active ? 'bg-[#0c1424] text-[#5dc7ec]' : 'bg-[#f0f7ff] text-[#5dc7ec]'}`}>
        <Icon size={24} />
      </div>
      {active && (
        <div className="h-6 w-6 rounded-full bg-[#0c1424] flex items-center justify-center border-2 border-white shadow-sm">
          <CheckCircle2 size={12} className="text-white" />
        </div>
      )}
    </div>

    <div className="space-y-1">
      <h3 className="text-[20px] font-black text-[#0c1424] leading-none tracking-tight">{title}</h3>
      <p className="text-[13px] font-medium text-slate-400 leading-tight">{description}</p>
    </div>

    {active ? (
      <div className="pt-2 animate-in slide-in-from-top-4 duration-300 min-h-[100px]">
        {config.inputRequired ? (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <label className="block text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">
              {config.inputLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={config.inputPlaceholder}
              className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-100 focus:border-[#5dc7ec] focus:ring-4 focus:ring-[#5dc7ec]/10 text-[15px] font-bold text-[#0c1424] placeholder:text-slate-300 transition-all outline-none"
              autoFocus
            />
          </div>
        ) : title === 'In Store' ? (
          <div className="h-14 rounded-2xl bg-white border border-dashed border-slate-100 flex items-center justify-center">
            <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">No additional info required</span>
          </div>
        ) : (
          <button 
            className="w-full h-14 rounded-2xl bg-[#f0f7ff] text-[#0c1424] flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-[#e2efff] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus size={16} />
            Add Delivery Details
          </button>
        )}
      </div>
    ) : (
        <div className="min-h-[100px]" />
    )}
  </div>
);

export default function ServiceModeModal({ onClose }: ServiceModeModalProps) {
  const navigate = useNavigate();
  const { createBillSession } = usePosCart();
  const [selectedType, setSelectedType] = useState<PosOrderType>('DINE_IN');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleServiceModels, setVisibleServiceModels] = useState<PosOrderType[]>([
    ...ALLOWED_SERVICE_MODELS,
  ]);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await api.get('/restaurant');
        if (response.data?.serviceModels && Array.isArray(response.data.serviceModels) && response.data.serviceModels.length > 0) {
            setVisibleServiceModels(response.data.serviceModels.filter((m: string) => ALLOWED_SERVICE_MODELS.includes(m as any)));
        }
      } catch {
        setVisibleServiceModels([...ALLOWED_SERVICE_MODELS]);
      }
    };
    void loadRestaurant();
  }, []);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const bill = await createBillSession(selectedType, inputValue || null);
      navigate(`/pos/order-entry?billId=${bill.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create bill:', error);
      navigate(`/pos/order-entry?type=${selectedType}&detail=${encodeURIComponent(inputValue)}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedConfig = SERVICE_MODEL_CONFIG[selectedType];
  const hasInput = selectedConfig.inputRequired;
  const canConfirm = hasInput ? inputValue.trim().length > 0 : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c1424]/40 backdrop-blur-md overflow-y-auto">
      {/* Modal Card Centered Container */}
      <div className="bg-white w-full max-w-[850px] mx-auto rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-400 my-auto">
        <div className="p-8 sm:p-10 px-8 sm:px-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-[950] text-[#0c1424] mb-2 tracking-tight">New Bill</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select the order type to proceed</p>
          </div>

          {/* Grid Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {visibleServiceModels.map((model, idx) => {
              const config = SERVICE_MODEL_CONFIG[model];
              const isActive = selectedType === model;

              return (
                <ServiceModeCard
                  key={model}
                  index={idx}
                  active={isActive}
                  title={SERVICE_MODEL_LABELS[model]}
                  description={config.description}
                  icon={config.icon}
                  config={config}
                  value={isActive ? inputValue : ''}
                  onValueChange={setInputValue}
                  onClick={() => {
                    setSelectedType(model);
                    setInputValue('');
                  }}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-50">
            <button 
              onClick={onClose}
              className="h-14 px-8 rounded-3xl border-2 border-slate-100 text-[12px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <X size={18} strokeWidth={3} />
              Cancel
            </button>
            
            <div className="flex items-center gap-8">
               <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SELECTED MODE</span>
                  <span className="text-lg font-black text-[#0c1424] tracking-tight">{selectedType.replace(/_/g, ' ')}</span>
               </div>
               
                <button 
                  onClick={() => void handleConfirm()}
                  disabled={!canConfirm || isSubmitting}
                  className="bg-[#0c1424] text-white h-14 px-10 rounded-[22px] flex items-center gap-4 shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 group"
                >
                  <span className="text-[12px] font-black uppercase tracking-widest">
                    {isSubmitting ? 'Confirming...' : 'Confirm & Add Items'}
                  </span>
                  {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" strokeWidth={3} />}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
