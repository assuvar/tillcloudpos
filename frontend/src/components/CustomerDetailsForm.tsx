import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  X,
  Check,
  Loader2,
} from "lucide-react";

interface CustomerDetailsFormProps {
  orderType: string;
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function CustomerDetailsForm({
  orderType,
  initialData,
  onSubmit,
  onCancel,
}: CustomerDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName:
      initialData?.customerName ||
      initialData?.pickupName ||
      initialData?.deliveryName ||
      "",
    customerPhone:
      initialData?.customerPhone ||
      initialData?.pickupPhone ||
      initialData?.deliveryPhone ||
      "",
    customerAddress:
      initialData?.customerAddress || initialData?.deliveryAddress || "",
    paymentType:
      initialData?.paymentType ||
      initialData?.deliveryPaymentMethod ||
      "CASH_ON_DELIVERY",
    deliveryNotes: initialData?.deliveryNotes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName.trim())
      newErrors.customerName = "Name is required";
    if (!formData.customerPhone.trim())
      newErrors.customerPhone = "Phone is required";

    if (orderType === "DELIVERY") {
      if (!formData.customerAddress.trim())
        newErrors.customerAddress = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-[32px] border border-slate-100 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-[#0c1424]">Customer Details</h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-rose-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="group">
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-sky-500 transition-colors">
            Customer Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.customerName ? "text-rose-500" : "text-slate-400 group-focus-within:text-sky-500"}`}
              size={18}
            />
            <input
              type="text"
              autoFocus
              value={formData.customerName}
              onChange={(e) => {
                setFormData({ ...formData, customerName: e.target.value });
                if (errors.customerName)
                  setErrors({ ...errors, customerName: "" });
              }}
              className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-2 text-sm font-bold placeholder:text-slate-300 transition-all focus:outline-none ${errors.customerName ? "border-rose-500/20 bg-rose-50/30" : "border-transparent focus:border-sky-500/10 focus:bg-white focus:ring-4 focus:ring-sky-500/5"}`}
              placeholder="Enter customer name"
            />
          </div>
          {errors.customerName && (
            <p className="mt-1.5 text-[10px] font-bold text-rose-500 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
              <span className="w-1 h-1 rounded-full bg-rose-500" />
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="group">
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-sky-500 transition-colors">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.customerPhone ? "text-rose-500" : "text-slate-400 group-focus-within:text-sky-500"}`}
              size={18}
            />
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d\s+]/g, "");
                setFormData({ ...formData, customerPhone: val });
                if (errors.customerPhone)
                  setErrors({ ...errors, customerPhone: "" });
              }}
              className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-2 text-sm font-bold placeholder:text-slate-300 transition-all focus:outline-none ${errors.customerPhone ? "border-rose-500/20 bg-rose-50/30" : "border-transparent focus:border-sky-500/10 focus:bg-white focus:ring-4 focus:ring-sky-500/5"}`}
              placeholder="e.g. 0400 000 000"
            />
          </div>
          {errors.customerPhone && (
            <p className="mt-1.5 text-[10px] font-bold text-rose-500 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
              <span className="w-1 h-1 rounded-full bg-rose-500" />
              {errors.customerPhone}
            </p>
          )}
        </div>

        {/* Address Field (Conditional) */}
        {orderType === "DELIVERY" && (
          <div className="group">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-sky-500 transition-colors">
              Delivery Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin
                className={`absolute left-4 top-4 transition-colors ${errors.customerAddress ? "text-rose-500" : "text-slate-400 group-focus-within:text-sky-500"}`}
                size={18}
              />
              <textarea
                value={formData.customerAddress}
                onChange={(e) => {
                  setFormData({ ...formData, customerAddress: e.target.value });
                  if (errors.customerAddress)
                    setErrors({ ...errors, customerAddress: "" });
                }}
                className={`w-full min-h-[100px] pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 text-sm font-bold placeholder:text-slate-300 transition-all focus:outline-none ${errors.customerAddress ? "border-rose-500/20 bg-rose-50/30" : "border-transparent focus:border-sky-500/10 focus:bg-white focus:ring-4 focus:ring-sky-500/5"} resize-none`}
                placeholder="Enter full delivery address"
              />
            </div>
            {errors.customerAddress && (
              <p className="mt-1.5 text-[10px] font-bold text-rose-500 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                <span className="w-1 h-1 rounded-full bg-rose-500" />
                {errors.customerAddress}
              </p>
            )}
          </div>
        )}

        {/* Payment Type (Conditional) */}
        {orderType === "DELIVERY" && (
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Payment Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, paymentType: "CASH_ON_DELIVERY" })
                }
                className={`flex flex-col items-center justify-center gap-1 h-20 rounded-2xl border-2 transition-all ${formData.paymentType === "CASH_ON_DELIVERY" ? "border-sky-500 bg-sky-50/50 text-sky-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100"}`}
              >
                <Wallet size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Cash
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, paymentType: "CARD_ON_DELIVERY" })
                }
                className={`flex flex-col items-center justify-center gap-1 h-20 rounded-2xl border-2 transition-all ${formData.paymentType === "CARD_ON_DELIVERY" ? "border-sky-500 bg-sky-50/50 text-sky-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100"}`}
              >
                <CreditCard size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Card
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-14 rounded-2xl bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-[2] h-14 rounded-2xl bg-[#4adeff] text-[#0c1424] font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-400/20 transition-all flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:brightness-95 active:scale-95"}`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Check size={18} strokeWidth={3} />
            )}
            {isSubmitting ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
