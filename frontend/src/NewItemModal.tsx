import { useState } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

export default function NewItemModal({ isOpen, onClose, onAdd }: NewItemModalProps) {
  const [name, setName] = useState('Puffs');
  const [category, setCategory] = useState('Snacks');
  const [quantity, setQuantity] = useState(12);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-2 bg-[#0c1424]/40 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4">
      <div className="w-full max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-300 sm:max-w-[500px] sm:rounded-[32px]">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-0 sm:p-8">
          <div>
            <h2 className="text-[22px] font-black tracking-tight text-[#0c1424] sm:text-[24px]">New Inventory item</h2>
            <p className="text-[13px] text-slate-400 font-medium mt-1">New items that adds to the inventory</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-4 sm:p-8">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
            <div className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center px-6">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent w-full text-[15px] font-bold text-[#0c1424] outline-none"
              />
            </div>
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
            <div className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center px-6">
              <input 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent w-full text-[15px] font-bold text-[#0c1424] outline-none"
              />
            </div>
          </div>

          {/* Quantity Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter Quantity</label>
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

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
            <button 
               onClick={onClose}
               className="h-14 flex-1 rounded-2xl bg-slate-50 text-[14px] font-black uppercase tracking-widest text-[#0c1424] transition-all hover:bg-slate-100"
            >
              Cancel
            </button>
            <button 
               onClick={() => onAdd({ name, category, quantity })}
               className="h-14 flex-1 rounded-2xl bg-[#0c1424] text-[14px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/20 transition-all hover:bg-black"
            >
              Add
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
