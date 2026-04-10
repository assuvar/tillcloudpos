import { useState } from 'react';
import { X, Plus, Minus, Info, PlusCircle, MinusCircle, Edit3, ChevronDown } from 'lucide-react';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onUpdate: (adjustment: any) => void;
}

type AdjustmentMode = 'ADD' | 'REMOVE' | 'SET_FIXED';

export default function AdjustStockModal({ isOpen, onClose, item, onUpdate }: AdjustStockModalProps) {
  const [mode, setMode] = useState<AdjustmentMode>('ADD');
  const [quantity, setQuantity] = useState(12);
  const [reason, setReason] = useState('Restock from Supplier');

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-2 bg-[#0c1424]/40 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4">
      <div className="w-full max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-300 sm:max-w-[540px] sm:rounded-[32px]">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-4 sm:p-8">
          <div>
            <h2 className="text-[22px] font-black tracking-tight text-[#0c1424] sm:text-[24px]">Manual Adjustment</h2>
            <div className="flex flex-col mt-1 gap-0.5">
              <p className="text-[13px] text-slate-400 font-medium">Modifying: <span className="text-[#0c1424] font-bold">{item.name}</span></p>
              {mode === 'SET_FIXED' && (
                <p className="text-[13px] text-slate-400 font-medium">Available: <span className="text-[#0c1424] font-bold">{item.quantity}</span></p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-8">
          <button 
            onClick={() => setMode('ADD')}
            className={`flex-1 h-16 rounded-[20px] border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'ADD' ? 'bg-white border-[#5dc7ec] shadow-[0_8px_20px_rgba(93,199,236,0.15)] ring-1 ring-[#5dc7ec]' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
          >
            <PlusCircle size={18} className={mode === 'ADD' ? 'text-emerald-500' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
          </button>
          <button 
            onClick={() => setMode('REMOVE')}
            className={`flex-1 h-16 rounded-[20px] border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'REMOVE' ? 'bg-white border-[#5dc7ec] shadow-[0_8px_20px_rgba(93,199,236,0.15)] ring-1 ring-[#5dc7ec]' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
          >
            <MinusCircle size={18} className={mode === 'REMOVE' ? 'text-rose-500' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Remove</span>
          </button>
          <button 
            onClick={() => setMode('SET_FIXED')}
            className={`flex-1 h-16 rounded-[20px] border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'SET_FIXED' ? 'bg-white border-[#5dc7ec] shadow-[0_8px_20px_rgba(93,199,236,0.15)] ring-1 ring-[#5dc7ec]' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
          >
            <Edit3 size={18} className={mode === 'SET_FIXED' ? 'text-emerald-500' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">Set Fixed</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-4 sm:p-8">
          {/* Quantity Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {mode === 'SET_FIXED' ? 'Set Fixed' : 'Adjust Quantity'}
            </label>
            <div className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center gap-4 pr-2 pl-6">
              <div className="flex-1 flex items-center gap-2">
                 <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-transparent w-full text-[15px] font-black text-[#0c1424] outline-none"
                />
                <span className="text-[13px] font-bold text-slate-400">Units</span>
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="h-6 w-8 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-[#0c1424] shadow-sm transition-all"
                >
                  <Plus size={12} />
                </button>
                <button 
                  onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                  className="h-6 w-8 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-[#0c1424] shadow-sm transition-all"
                >
                  <Minus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Reason Field (Hidden in SET_FIXED for Image 4, but let's follow design) */}
          {mode !== 'SET_FIXED' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Adjustment</label>
              <div 
                onClick={() => setReason(reason === 'Restock from Supplier' ? 'Inventory Count' : 'Restock from Supplier')}
                className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center justify-between px-6 cursor-pointer hover:bg-slate-100/50 transition-colors"
              >
                <span className="text-[14px] font-bold text-[#0c1424]">{reason}</span>
                <ChevronDown size={18} className="text-slate-400" />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
            <button 
               onClick={onClose}
               className="h-14 flex-1 rounded-2xl bg-slate-50 text-[14px] font-black uppercase tracking-widest text-[#0c1424] transition-all hover:bg-slate-100"
            >
              Cancel
            </button>
            <button 
               onClick={() => onUpdate({ mode, quantity, reason, itemId: item.id })}
               className="h-14 flex-1 rounded-2xl bg-[#0c1424] text-[14px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/20 transition-all hover:bg-black"
            >
              Confirm Update
            </button>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-start gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
            <Info size={12} />
          </div>
          <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
            Updating inventory will reflect across all linked menu items and trigger auto-order alerts if below threshold.
          </p>
        </div>
      </div>
    </div>
  );
}
