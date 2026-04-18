import { useState } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'ea', label: 'Each (ea)' },
  { value: 'pc', label: 'Pieces (pc)' },
  { value: 'doz', label: 'Dozen (doz)' },
  { value: 'pack', label: 'Pack (pack)' },
  { value: 'box', label: 'Box (box)' },
  { value: 'tray', label: 'Tray (tray)' },
  { value: 'carton', label: 'Carton (carton)' },
  { value: 'bottle', label: 'Bottle (bottle)' },
  { value: 'can', label: 'Can (can)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'c', label: 'Celsius (C)' },
] as const;

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    name: string;
    unit: string;
    quantity: number;
    lowStockThreshold: number;
    conversionRatio: number;
  }) => void;
}

export default function NewItemModal({ isOpen, onClose, onAdd }: NewItemModalProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('ea');
  const [quantity, setQuantity] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(0);
  const [conversionRatio, setConversionRatio] = useState(1);

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

          {/* Unit Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
            <div className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center px-6">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-transparent w-full text-[15px] font-bold text-[#0c1424] outline-none"
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                <span className="text-[13px] font-bold text-slate-400">{unit}</span>
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

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Low Stock Threshold</label>
            <div className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center gap-4 px-6">
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="bg-transparent w-full text-[15px] font-black text-[#0c1424] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conversion Ratio</label>
            <div className="h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center gap-4 px-6">
              <input
                type="number"
                min="0.0001"
                step="0.001"
                value={conversionRatio}
                onChange={(e) => setConversionRatio(Math.max(0.0001, Number(e.target.value || 1)))}
                className="bg-transparent w-full text-[15px] font-black text-[#0c1424] outline-none"
              />
            </div>
            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
              Use 1 for direct units. Example: if 1 pack contains 12 each, set ratio to 12.
            </p>
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
              onClick={() =>
                onAdd({
                  name,
                  unit,
                  quantity,
                  lowStockThreshold,
                  conversionRatio,
                })
              }
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
            Quantity values are automatically normalized to base units (g, ml, ea, mm, c) in backend calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
