import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";

interface ServiceModelRulesModalProps {
  serviceModel: string;
  serviceModelLabel: string;
  initialRules: {
    collectCustomerDetails: boolean;
    requiredFields: string[];
    paymentRequiredBeforeKOT: boolean;
  };
  onSubmit: (rules: {
    collectCustomerDetails: boolean;
    requiredFields: string[];
    paymentRequiredBeforeKOT: boolean;
  }) => void;
  onCancel: () => void;
}

export default function ServiceModelRulesModal({
  serviceModel,
  serviceModelLabel,
  initialRules,
  onSubmit,
  onCancel,
}: ServiceModelRulesModalProps) {
  const [collectCustomerDetails, setCollectCustomerDetails] = useState(
    initialRules?.collectCustomerDetails ?? false
  );
  const [requiredFields, setRequiredFields] = useState<string[]>(
    initialRules?.requiredFields ?? []
  );
  const [paymentRequiredBeforeKOT, setPaymentRequiredBeforeKOT] = useState(
    initialRules?.paymentRequiredBeforeKOT ?? false
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // If Collect Customer Details is toggled OFF, automatically clear required fields
  useEffect(() => {
    if (!collectCustomerDetails) {
      setRequiredFields([]);
    }
  }, [collectCustomerDetails]);

  const handleToggleRequiredField = (field: string) => {
    setValidationError(null);
    setRequiredFields((prev) => {
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field);
      }
      return [...prev, field];
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce: If Service Model is Delivery and customer collection is ON, at least one required field must be checked
    if (serviceModel === "DELIVERY" && collectCustomerDetails) {
      if (requiredFields.length === 0) {
        setValidationError(
          "For Delivery service model with details collection ON, at least one required field must be selected."
        );
        return;
      }
    }

    onSubmit({
      collectCustomerDetails,
      requiredFields: collectCustomerDetails ? requiredFields : [],
      paymentRequiredBeforeKOT,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5dc7ec] bg-blue-50 px-2.5 py-1 rounded-full">
            Rule Editor
          </span>
          <h3 className="text-xl font-black text-[#0c1424] mt-2">
            Configure {serviceModelLabel}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-transparent transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle 1: Collect Customer Details */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50 transition-all hover:border-slate-200/50">
          <div className="max-w-[70%]">
            <h4 className="text-[13px] font-black text-[#0c1424]">
              Collect Customer Details
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
              Require the cashier to fill in customer information when creating an order.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              setCollectCustomerDetails(!collectCustomerDetails);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              collectCustomerDetails ? "bg-[#0c1424]" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                collectCustomerDetails ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Checkboxes: Required Fields */}
        {collectCustomerDetails && (
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-100 bg-white space-y-3 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Required Fields (Choose Mandatory)
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["name", "phone", "address"].map((field) => {
                const isChecked = requiredFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => handleToggleRequiredField(field)}
                    className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wide ${
                      isChecked
                        ? "border-[#0c1424] bg-[#0c1424] text-white"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                    {field}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle 2: Payment Required Before KOT */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50 transition-all hover:border-slate-200/50">
          <div className="max-w-[70%]">
            <h4 className="text-[13px] font-black text-[#0c1424]">
              Payment Required Before KOT
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
              If enabled, cashier must complete checkout first. Sends to kitchen automatically upon successful payment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentRequiredBeforeKOT(!paymentRequiredBeforeKOT)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              paymentRequiredBeforeKOT ? "bg-[#0c1424]" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                paymentRequiredBeforeKOT ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Validation Errors banner */}
        {validationError && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-600 text-xs font-bold leading-relaxed animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{validationError}</p>
          </div>
        )}

        {/* Form CTA Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-12 rounded-xl bg-[#0c1424] text-white font-black text-xs uppercase tracking-widest hover:bg-opacity-95 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-1.5"
          >
            <Check size={14} strokeWidth={3} />
            Save Rules
          </button>
        </div>
      </form>
    </div>
  );
}
