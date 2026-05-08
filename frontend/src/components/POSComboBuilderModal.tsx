import { useState, useEffect } from "react";
import { X, Check, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";

interface GroupItem {
  id: string;
  name: string;
  priceInCents: number;
  priceOverride: number | null;
  priceOverrideInCents: number | null;
}

interface MenuGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  items: GroupItem[];
}

interface Addon {
  id: string;
  name: string;
  price: number;
  priceInCents: number;
}

interface AddonGroup {
  id: string;
  name: string;
  addons: Addon[];
}

interface Deal {
  id: string;
  name: string;
  price: number;
  description: string;
  groups: MenuGroup[];
  addonGroups?: AddonGroup[];
}

interface POSComboBuilderModalProps {
  isOpen: boolean;
  deal: Deal | null;
  onClose: () => void;
  onConfirm: (finalPriceInCents: number, notes: string) => void;
}

export default function POSComboBuilderModal({
  isOpen,
  deal,
  onClose,
  onConfirm,
}: POSComboBuilderModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, GroupItem[]>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, Addon[]>>({});

  useEffect(() => {
    if (deal) {
      setCurrentStep(0);
      setSelections({});
      setSelectedAddons({});
    }
  }, [deal]);

  if (!isOpen || !deal) return null;

  const totalSteps = deal.groups.length;
  const isLastStep = currentStep === totalSteps; // Step totalSteps is for optional upgrades/addons

  // Get current active group
  const currentGroup = deal.groups[currentStep] || null;

  // Compute pricing
  const basePriceCents = Math.round(deal.price * 100);
  
  let overrideSurchargesCents = 0;
  // Calculate selected group items surcharges (price overrides)
  Object.values(selections).flat().forEach((item) => {
    if (item.priceOverrideInCents !== null && item.priceOverrideInCents !== undefined) {
      overrideSurchargesCents += item.priceOverrideInCents;
    }
  });

  // Calculate chosen deal toppings surcharges
  Object.values(selectedAddons).flat().forEach((addon) => {
    overrideSurchargesCents += addon.priceInCents;
  });

  const totalCents = basePriceCents + overrideSurchargesCents;

  const handleSelectItem = (item: GroupItem) => {
    if (!currentGroup) return;
    const currentSelected = selections[currentGroup.id] || [];
    
    // Toggle logic for item select
    if (currentSelected.some((x) => x.id === item.id)) {
      setSelections({
        ...selections,
        [currentGroup.id]: currentSelected.filter((x) => x.id !== item.id),
      });
    } else {
      // If maxSelect is 1, enforce radio button-like replacement
      if (currentGroup.maxSelect === 1) {
        setSelections({
          ...selections,
          [currentGroup.id]: [item],
        });
      } else if (currentSelected.length < currentGroup.maxSelect) {
        setSelections({
          ...selections,
          [currentGroup.id]: [...currentSelected, item],
        });
      }
    }
  };

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

  const handleNext = () => {
    if (!currentGroup) {
      setCurrentStep(currentStep + 1);
      return;
    }
    const chosen = selections[currentGroup.id] || [];
    if (currentGroup.required && chosen.length < currentGroup.minSelect) {
      alert(`Please select at least ${currentGroup.minSelect} item(s) for ${currentGroup.name}`);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = () => {
    // Validate all required steps are completed
    for (const g of deal.groups) {
      const chosen = selections[g.id] || [];
      if (g.required && chosen.length < g.minSelect) {
        alert(`Step "${g.name}" is incomplete.`);
        return;
      }
    }

    // Build combo description note: e.g., "[Cheeseburger, French Fries, Milkshake (+$1.50)]"
    const choicesParts: string[] = [];
    deal.groups.forEach((g) => {
      const itemsSelected = selections[g.id] || [];
      itemsSelected.forEach((item) => {
        if (item.priceOverrideInCents !== null && item.priceOverrideInCents > 0) {
          choicesParts.push(`${item.name} (+$${(item.priceOverrideInCents/100).toFixed(2)})`);
        } else {
          choicesParts.push(item.name);
        }
      });
    });

    // Append extra toppings/addons if selected
    const extraParts: string[] = [];
    Object.values(selectedAddons).flat().forEach((a) => {
      extraParts.push(`${a.name} (+$${a.price.toFixed(2)})`);
    });

    let notesText = `[${choicesParts.join(", ")}]`;
    if (extraParts.length > 0) {
      notesText += ` • Upgrade: ${extraParts.join(", ")}`;
    }

    onConfirm(totalCents, notesText);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0c1424]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase">
                Step-by-Step Combo Builder
              </span>
              <h3 className="text-xl font-black text-[#0c1424] mt-2">{deal.name}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">{deal.description}</p>
            </div>
            <button onClick={onClose} className="h-9 w-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <X size={18} />
            </button>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="flex gap-1.5 mt-5">
            {deal.groups.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "bg-amber-500 scale-y-110"
                    : idx < currentStep
                    ? "bg-slate-800"
                    : "bg-slate-100"
                }`}
              />
            ))}
            {deal.addonGroups && deal.addonGroups.length > 0 && (
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  totalSteps === currentStep
                    ? "bg-indigo-500 scale-y-110"
                    : "bg-slate-100"
                }`}
              />
            )}
          </div>
        </div>

        {/* Wizard Main Panel */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isLastStep && currentGroup ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <h4 className="text-lg font-black text-[#0c1424] mt-0.5">{currentGroup.name}</h4>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  {currentGroup.required ? `Choose ${currentGroup.minSelect}` : "Optional Choice"}
                </span>
              </div>

              {/* Items checklist grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentGroup.items.map((item) => {
                  const isSelected = (selections[currentGroup.id] || []).some(x => x.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`p-4 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/5 text-[#0c1424] shadow-md"
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200"
                        }`}>
                          {isSelected && <Check size={11} />}
                        </div>
                        <span className="text-xs font-black">{item.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-400">
                        {item.priceOverrideInCents !== null && item.priceOverrideInCents > 0 
                          ? `+$${(item.priceOverrideInCents/100).toFixed(2)}` 
                          : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Upgrades step
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                  Final Step
                </span>
                <h4 className="text-lg font-black text-[#0c1424] mt-0.5">Optional Combo Upgrades</h4>
                <p className="text-xs font-medium text-slate-400 mt-1">Select any premium extra toppings or beverages for your deal.</p>
              </div>

              <div className="space-y-6">
                {deal.addonGroups?.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      {group.name}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.addons.map((add) => {
                        const isSelected = (selectedAddons[group.id] || []).some(x => x.id === add.id);
                        return (
                          <button
                            key={add.id}
                            onClick={() => handleToggleAddon(group.id, add)}
                            className={`p-4 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600/5 text-[#0c1424]"
                                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200"
                              }`}>
                                {isSelected && <Check size={11} />}
                              </div>
                              <span className="text-xs font-black">{add.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                              +${add.price.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Combo Total</span>
            <span className="text-2xl font-black text-[#0c1424] mt-0.5">
              ${(totalCents / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2.5">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            {isLastStep || (!deal.addonGroups || deal.addonGroups.length === 0) && (currentStep === totalSteps - 1) ? (
              <button
                onClick={handleConfirm}
                className="h-12 px-8 bg-[#0c1424] hover:bg-black text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2.5 shadow-lg shadow-black/10 active:scale-95 transition-all"
              >
                <ShoppingBag size={14} />
                Add Combo to Order
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="h-12 px-8 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2.5 active:scale-95 transition-all"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
