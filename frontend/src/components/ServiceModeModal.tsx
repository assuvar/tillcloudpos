import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Utensils, 
  ShoppingBag, 
  Store, 
  Bike, 
  ArrowRight,
  CheckCircle2
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


export default function ServiceModeModal({ onClose }: ServiceModeModalProps) {
  const navigate = useNavigate();
  const { createBillSession } = usePosCart();
  const [selectedType, setSelectedType] = useState<PosOrderType>('DINE_IN');
  const [inputValue, setInputValue] = useState('');
  const [availableTables, setAvailableTables] = useState<{id: string, name: string, seats: number, floor: string}[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleServiceModels, setVisibleServiceModels] = useState<PosOrderType[]>([
    ...ALLOWED_SERVICE_MODELS,
  ]);
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryData, setDeliveryData] = useState({ name: '', phone: '', address: '' });

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

  useEffect(() => {
    if (selectedType === 'DINE_IN') {
      const loadTables = async () => {
        try {
          const response = await api.get('/tables?status=AVAILABLE');
          setAvailableTables(response.data);
          if (response.data.length > 0) {
            setSelectedTableId(response.data[0].id);
          }
        } catch (err) {
          console.error('Failed to load available tables:', err);
        }
      };
      void loadTables();
    }
  }, [selectedType]);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let sessionData: any = {};
      
      if (selectedType === 'DINE_IN') {
        sessionData = { tableId: selectedTableId };
      } else if (selectedType === 'DELIVERY') {
        sessionData = {
          deliveryName: deliveryData.name,
          deliveryPhone: deliveryData.phone,
          deliveryAddress: deliveryData.address,
          customer: deliveryData.name
        };
      } else if (selectedType === 'PICKUP') {
        sessionData = {
          pickupName: inputValue,
          pickupPhone: pickupPhone,
          pickupTime: pickupTime,
          customer: inputValue
        };
      }

      const bill = await createBillSession(selectedType, sessionData);
      navigate(`/pos/order-entry?billId=${bill.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create bill:', error);
      const detailParam = selectedType === 'DELIVERY' ? deliveryData.name : inputValue;
      navigate(`/pos/order-entry?type=${selectedType}&detail=${encodeURIComponent(detailParam || '')}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDelivery = selectedType === 'DELIVERY';
  const canConfirm = isDelivery 
    ? deliveryData.name.trim().length > 0 && deliveryData.address.trim().length > 0 && deliveryData.phone.trim().length > 0
    : selectedType === 'DINE_IN' 
      ? selectedTableId !== '' 
      : selectedType === 'PICKUP'
        ? inputValue.trim().length > 0 && pickupPhone.trim().length > 0
        : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c1424]/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-[850px] mx-auto rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-400 my-auto">
        <div className="p-8 sm:p-10 px-8 sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-[950] text-[#0c1424] mb-2 tracking-tight">New Bill</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select the order type to proceed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {visibleServiceModels.map((model, idx) => {
              const config = SERVICE_MODEL_CONFIG[model];
              const isActive = selectedType === model;

              return (
                <div
                  key={model}
                  onClick={() => {
                    setSelectedType(model);
                    setInputValue('');
                  }}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${
                    isActive ? 'bg-white border-[#0c1424] shadow-2xl scale-[1.01]' : 'bg-slate-50/50 border-slate-100/50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#0c1424] text-[#5dc7ec]' : 'bg-[#f0f7ff] text-[#5dc7ec]'}`}>
                      {<config.icon size={24} />}
                    </div>
                    {isActive && (
                      <div className="h-6 w-6 rounded-full bg-[#0c1424] flex items-center justify-center border-2 border-white shadow-sm">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[20px] font-black text-[#0c1424] leading-none tracking-tight">{SERVICE_MODEL_LABELS[model]}</h3>
                    <p className="text-[13px] font-medium text-slate-400 leading-tight">{config.description}</p>
                  </div>

                  {isActive ? (
                    <div className="pt-2 animate-in slide-in-from-top-4 duration-300 min-h-[120px]">
                      {model === 'DELIVERY' ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={deliveryData.name}
                              onChange={(e) => setDeliveryData({ ...deliveryData, name: e.target.value })}
                              placeholder="Customer Name"
                              className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 text-sm font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
                            />
                            <input
                              type="tel"
                              value={deliveryData.phone}
                              onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })}
                              placeholder="Mobile Number"
                              className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 text-sm font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
                            />
                          </div>
                          <textarea
                            value={deliveryData.address}
                            onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })}
                            placeholder="Delivery Address"
                            rows={2}
                            className="w-full p-4 rounded-xl bg-white border border-slate-100 text-sm font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all resize-none"
                          />
                        </div>
                      ) : model === 'PICKUP' ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder="Customer Name"
                              className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 text-sm font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
                            />
                            <input
                              type="tel"
                              value={pickupPhone}
                              onChange={(e) => setPickupPhone(e.target.value)}
                              placeholder="Mobile Number"
                              className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 text-sm font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
                            />
                          </div>
                          <input
                            type="text"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            placeholder="Pickup Time (Optional)"
                            className="w-full h-12 px-4 rounded-xl bg-white border border-slate-100 text-sm font-bold text-[#0c1424] outline-none focus:border-[#5dc7ec] transition-all"
                          />
                        </div>
                      ) : model === 'DINE_IN' ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <label className="block text-[9px] font-black text-[#5dc7ec] uppercase tracking-widest ml-1">
                            SELECT AVAILABLE TABLE <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl bg-white border border-slate-100 focus:border-[#5dc7ec] focus:ring-4 focus:ring-[#5dc7ec]/10 text-[15px] font-bold text-[#0c1424] transition-all outline-none appearance-none"
                            autoFocus
                          >
                            <option value="">Choose a table...</option>
                            {availableTables.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} - {t.floor.toLowerCase()} floor ({t.seats} seats)
                              </option>
                            ))}
                          </select>
                          {availableTables.length === 0 && (
                            <p className="text-[10px] font-bold text-rose-500 ml-1">No tables currently available</p>
                          )}
                        </div>
                      ) : (
                        <div className="h-14 rounded-2xl bg-white border border-dashed border-slate-100 flex items-center justify-center">
                          <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">No additional info required</span>
                        </div>
                      )}
                    </div>
                  ) : (
                      <div className="min-h-[120px]" />
                  )}
                </div>
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
