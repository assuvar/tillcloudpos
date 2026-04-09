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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c1424]/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[500px] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 pb-0 flex justify-between items-start">
          <div>
            <h2 className="text-[24px] font-black text-[#0c1424] tracking-tight">New Inventory item</h2>
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
        <div className="p-8 space-y-6">
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
          <div className="flex gap-4 pt-4">
            <button 
               onClick={onClose}
               className="flex-1 h-14 rounded-2xl bg-slate-50 text-[14px] font-black text-[#0c1424] uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button 
               onClick={() => onAdd({ name, category, quantity })}
               className="flex-1 h-14 rounded-2xl bg-[#0c1424] text-[14px] font-black text-white uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-black transition-all"
            >
              Add
            </button>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50/50 border-t border-slate-100 p-6 flex items-start gap-3">
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
