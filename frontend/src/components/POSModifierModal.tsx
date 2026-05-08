import { useState, useEffect } from "react";
import { X, Check, ShoppingBag } from "lucide-react";

interface Option {
  id: string;
  name: string;
  price?: number;
  priceInCents: number;
}

interface VariationGroup {
  id: string;
  name: string;
  type: string;
  options: Option[];
}

interface Addon {
  id: string;
  name: string;
  price?: number;
  priceInCents: number;
}

interface AddonGroup {
  id: string;
  name: string;
  selectionType: string;
  addons: Addon[];
}

interface Item {
  id: string;
  name: string;
  price: number;
  variationGroups?: VariationGroup[];
  addonGroups?: AddonGroup[];
}

interface POSModifierModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onConfirm: (finalPriceInCents: number, notes: string) => void;
}

export default function POSModifierModal({
  isOpen,
  item,
  onClose,
  onConfirm,
}: POSModifierModalProps) {
  const [selectedVars, setSelectedVars] = useState<Record<string, Option>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, Addon[]>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (item) {
      // Auto-select first option for each variation group as default
      const defaultVars: Record<string, Option> = {};
      item.variationGroups?.forEach((g) => {
        if (g.options.length > 0) {
          defaultVars[g.id] = g.options[0];
        }
      });
      setSelectedVars(defaultVars);
      setSelectedAddons({});
      setQuantity(1);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Calculate prices
  const basePriceCents = Math.round(item.price * 100);
  
  let totalModifierCents = 0;
  // Variations pricing
  Object.values(selectedVars).forEach((o) => {
    totalModifierCents += o.priceInCents;
  });
  // Addons pricing
  Object.values(selectedAddons).flat().forEach((a) => {
    totalModifierCents += a.priceInCents;
  });

  const singleItemCents = basePriceCents + totalModifierCents;
  const totalCents = singleItemCents * quantity;

  const handleToggleAddon = (groupId: string, addon: Addon) => {
    const current = selectedAddons[groupId] || [];
    if (current.some((x) => x.id === addon.id)) {
      setSelectedAddons({
        ...selectedAddons,
        [groupId]: current.filter((x) => x.id !== addon.id),
      });
    } else {
      setSelectedAddons({
        ...selectedAddons,
        [groupId]: [...current, addon],
      });
    }
  };

  const handleConfirm = () => {
    // Build descriptive notes string e.g. "Size: Large | Addons: Extra Cheese, Bacon"
    const parts: string[] = [];
    
    // Variations notes
    const varStrings = Object.values(selectedVars).map(o => o.name);
    if (varStrings.length > 0) {
      parts.push(varStrings.join(", "));
    }

    // Addons notes
    const addonStrings = Object.values(selectedAddons).flat().map(a => a.name);
    if (addonStrings.length > 0) {
      parts.push(`+ ${addonStrings.join(", ")}`);
    }

    const finalNotes = parts.join(" • ");
    // We pass single item price (incorporating surcharges) so that checkout quantity additions work seamlessly
    onConfirm(singleItemCents, finalNotes);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0c1424]/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-350">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-[#0c1424]">{item.name}</h3>
            <p className="text-sm font-bold text-indigo-600 mt-1">
              Base Price: ${item.price.toFixed(2)}
            </p>
          </div>
          <button onClick={onClose} className="h-9 w-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Modifiers Selector Scroller */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Variations Selector (Single Choice) */}
          {item.variationGroups?.map((group) => (
            <div key={group.id} className="space-y-2.5">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                {group.name}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {group.options.map((opt) => {
                  const isSelected = selectedVars[group.id]?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedVars({ ...selectedVars, [group.id]: opt })}
                      className={`p-3.5 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
                        isSelected 
                          ? "border-[#0c1424] bg-[#0c1424]/5 text-[#0c1424] shadow-md" 
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.name}</span>
                      <span className="text-xs font-black text-slate-400">
                        {opt.priceInCents > 0 ? `+$${(opt.priceInCents / 100).toFixed(2)}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 2. Addons Selector (Multiple Choices) */}
          {item.addonGroups?.map((group) => (
            <div key={group.id} className="space-y-2.5">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                {group.name}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {group.addons.map((add) => {
                  const isSelected = (selectedAddons[group.id] || []).some(x => x.id === add.id);
                  return (
                    <button
                      key={add.id}
                      onClick={() => handleToggleAddon(group.id, add)}
                      className={`p-3.5 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
                        isSelected 
                          ? "border-[#0c1424] bg-[#0c1424]/5 text-[#0c1424] shadow-md" 
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected ? "border-[#0c1424] bg-[#0c1424]" : "border-slate-200"
                        }`}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold">{add.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">
                        +${(add.priceInCents / 100).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary and Action Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Price</span>
            <span className="text-2xl font-black text-[#0c1424] mt-0.5">
              ${(totalCents / 100).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleConfirm}
            className="h-12 px-8 bg-[#0c1424] hover:bg-black text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-black/10 active:scale-95 transition-all"
          >
            <ShoppingBag size={15} />
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
