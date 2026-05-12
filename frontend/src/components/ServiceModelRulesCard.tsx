import React, { useState } from "react";
import { Edit3, Check, Loader2 } from "lucide-react";
import ServiceModelRulesModal from "./ServiceModelRulesModal";
import api from "../services/api";

const SERVICE_MODEL_LABELS: Record<string, string> = {
  DINE_IN: "Dine-In",
  IN_STORE: "In-Store/Takeaway",
  DELIVERY: "Delivery",
  PICKUP: "Pickup",
};

interface RuleData {
  collectCustomerDetails: boolean;
  requiredFields: string[];
  paymentRequiredBeforeKOT: boolean;
}

interface ServiceModelRulesCardProps {
  isAdmin: boolean;
  enabledModels: string[]; // e.g. ["DINE_IN", "DELIVERY"]
  initialRules: Record<string, RuleData> | null;
  onRefresh: () => void;
}

const DEFAULT_SERVICE_MODEL_RULES: Record<string, RuleData> = {
  DINE_IN: {
    collectCustomerDetails: false,
    requiredFields: [],
    paymentRequiredBeforeKOT: false,
  },
  IN_STORE: {
    collectCustomerDetails: false,
    requiredFields: [],
    paymentRequiredBeforeKOT: false,
  },
  DELIVERY: {
    collectCustomerDetails: true,
    requiredFields: ["name", "phone", "address"],
    paymentRequiredBeforeKOT: true,
  },
  PICKUP: {
    collectCustomerDetails: true,
    requiredFields: ["name", "phone"],
    paymentRequiredBeforeKOT: false,
  },
};

export default function ServiceModelRulesCard({
  isAdmin,
  enabledModels,
  initialRules,
  onRefresh,
}: ServiceModelRulesCardProps) {
  // Merge loaded rules with recommended defaults to prevent null properties
  const [rules, setRules] = useState<Record<string, RuleData>>(() => {
    const base = { ...DEFAULT_SERVICE_MODEL_RULES };
    if (initialRules) {
      Object.keys(initialRules).forEach((key) => {
        if (initialRules[key]) {
          base[key] = {
            collectCustomerDetails: !!initialRules[key].collectCustomerDetails,
            requiredFields: Array.isArray(initialRules[key].requiredFields)
              ? initialRules[key].requiredFields
              : [],
            paymentRequiredBeforeKOT: !!initialRules[key].paymentRequiredBeforeKOT,
          };
        }
      });
    }
    return base;
  });

  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state if initialRules prop changes (e.g. after refresh)
  React.useEffect(() => {
    if (initialRules) {
      setRules((prev) => {
        const next = { ...prev };
        Object.keys(initialRules).forEach((key) => {
          if (initialRules[key]) {
            next[key] = {
              collectCustomerDetails: !!initialRules[key].collectCustomerDetails,
              requiredFields: Array.isArray(initialRules[key].requiredFields)
                ? initialRules[key].requiredFields
                : [],
              paymentRequiredBeforeKOT: !!initialRules[key].paymentRequiredBeforeKOT,
            };
          }
        });
        return next;
      });
    }
  }, [initialRules]);

  const handleEditClick = (model: string) => {
    if (!isAdmin) return;
    setEditingModel(model);
  };

  const handleModalSubmit = (updatedModelRules: RuleData) => {
    if (!editingModel) return;
    setRules((prev) => ({
      ...prev,
      [editingModel]: updatedModelRules,
    }));
    setEditingModel(null);
  };

  const handleSaveAll = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.patch("/restaurant", {
        serviceModelRules: rules,
      });
      setMessage({ type: "success", text: "Service Model Rules updated successfully!" });
      onRefresh();
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error("[Settings] Failed to save rules:", error);
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to update rules. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Only render supported POS service models
  const visibleModels = enabledModels.filter((m) =>
    ["DINE_IN", "IN_STORE", "DELIVERY", "PICKUP"].includes(m)
  );

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header details */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-5">
        <div>
          <h3 className="text-[16px] font-black text-[#0c1424]">
            Service Model Rules
          </h3>
          <p className="text-[12px] text-slate-400 font-medium mt-1">
            Configure automated checkout validation and payment-before-KOT logic for your enabled channels.
          </p>
        </div>
        {isAdmin && visibleModels.length > 0 && (
          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={saving}
            className="h-11 px-6 rounded-full bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-opacity-95 shadow-lg shadow-black/5 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} strokeWidth={3} />
            )}
            {saving ? "Saving..." : "Save Rules"}
          </button>
        )}
      </div>

      {/* Grid rows list */}
      {visibleModels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 p-6 text-center text-slate-400 font-bold text-xs leading-relaxed">
          No service models are currently enabled above. Enable Dine-In, In-Store, Delivery, or Pickup models to configure rules.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleModels.map((model) => {
            const activeRule = rules[model] || DEFAULT_SERVICE_MODEL_RULES[model];
            const nameLabel = SERVICE_MODEL_LABELS[model] || model;

            return (
              <div
                key={model}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-50 bg-slate-50/20 transition-all hover:border-slate-200/50 hover:bg-slate-50/40 relative group"
              >
                {/* Rule parameters visual summaries */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#5dc7ec] shrink-0" />
                    <h4 className="text-[13px] font-[900] text-[#0c1424] leading-none">
                      {nameLabel}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-6 pt-1">
                    {/* Parameter 1: Collect Details */}
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-slate-400 font-medium">Customer Details:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider leading-none ${
                          activeRule.collectCustomerDetails
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/30"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {activeRule.collectCustomerDetails ? "Yes" : "No"}
                      </span>
                    </div>

                    {/* Parameter 2: Required Fields */}
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-slate-400 font-medium font-bold-none">Mandatory:</span>
                      {activeRule.collectCustomerDetails && activeRule.requiredFields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeRule.requiredFields.map((field) => (
                            <span
                              key={field}
                              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#5dc7ec] border border-blue-100/30 leading-none"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold tracking-wide text-[9px] uppercase">
                          None
                        </span>
                      )}
                    </div>

                    {/* Parameter 3: Payment Requirement */}
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-slate-400 font-medium">Payment Before KOT:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider leading-none ${
                          activeRule.paymentRequiredBeforeKOT
                            ? "bg-amber-50 text-amber-700 border border-amber-100/30"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {activeRule.paymentRequiredBeforeKOT ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Action clicker */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleEditClick(model)}
                    className="h-9 px-4 rounded-xl border border-slate-100 bg-white text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-slate-300 hover:text-[#0c1424] hover:shadow-sm transition-all flex items-center gap-1.5 self-start md:self-center shrink-0"
                  >
                    <Edit3 size={12} strokeWidth={2.5} />
                    Edit Rules
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save feedback banners */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-black uppercase tracking-wider ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-100"
          } animate-in fade-in duration-200`}
        >
          {message.text}
        </div>
      )}

      {/* Editing Modal rendering */}
      {editingModel && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
            onClick={() => setEditingModel(null)}
          />
          <ServiceModelRulesModal
            serviceModel={editingModel}
            serviceModelLabel={SERVICE_MODEL_LABELS[editingModel] || editingModel}
            initialRules={rules[editingModel]}
            onSubmit={handleModalSubmit}
            onCancel={() => setEditingModel(null)}
          />
        </div>
      )}
    </div>
  );
}
