import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";

interface LoyaltyCustomer {
  name: string;
  id: string;
  phone: string;
  loyaltyPoints: number;
}

interface LoyaltyModalProps {
  customer: LoyaltyCustomer;
  onApplyDiscount: (amount: number, pointsUsed: number) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function LoyaltyModal({
  customer,
  onApplyDiscount,
  onSkip,
  onClose,
}: LoyaltyModalProps) {
  // Generate redemption tiers based on available points
  const tiers = [
    { amount: 5, points: 50 },
    { amount: 10, points: 100 },
    {
      amount: Math.floor(customer.loyaltyPoints / 10),
      points: customer.loyaltyPoints,
    },
  ].filter((t) => t.points <= customer.loyaltyPoints);

  const [selectedTier, setSelectedTier] = useState(tiers.length > 1 ? 1 : 0);

  const currentTier = tiers[selectedTier];
  const remainingPoints = customer.loyaltyPoints - (currentTier?.points || 0);
  const maxDiscount = Math.floor(customer.loyaltyPoints / 10);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
        onClick={onClose}
        style={{ animation: "fadeIn 0.3s ease-out" }}
      />

      {/* Modal Card */}
      <div
        className="bg-white w-full max-w-[620px] rounded-[36px] shadow-2xl relative z-10 overflow-hidden"
        style={{
          animation: "scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        {/* Notch */}
        <div className="flex justify-center pt-4">
          <div className="w-12 h-1.5 rounded-full bg-slate-200" />
        </div>

        <div className="p-8 pb-10">
          {/* Customer Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#0c1424] flex items-center justify-center overflow-hidden shadow-xl shadow-black/10">
                <span className="text-xl font-black text-white">
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0c1424]">
                  {customer.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-[#5dc7ec]" />
                  <span className="text-sm font-bold text-slate-500">
                    {customer.loyaltyPoints} points available
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500">
              Worth up to ${maxDiscount.toFixed(2)} in discounts
            </div>
          </div>

          {/* Redemption Amount Selection */}
          <div className="mb-8">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">
              Select Redemption Amount
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {tiers.map((tier, index) => (
                <button
                  key={tier.points}
                  onClick={() => setSelectedTier(index)}
                  className={`relative h-28 rounded-[20px] border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                    selectedTier === index
                      ? "bg-[#0c1424] border-[#0c1424] text-white shadow-xl shadow-black/15"
                      : "bg-white border-slate-100 text-[#0c1424] hover:border-slate-200"
                  }`}
                >
                  <span className="text-3xl font-black">${tier.amount}</span>
                  <span
                    className={`text-xs font-bold ${selectedTier === index ? "text-[#5dc7ec]" : "text-slate-400"}`}
                  >
                    {tier.points} pts
                  </span>
                  {selectedTier === index && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#5dc7ec] flex items-center justify-center shadow-lg">
                      <CheckCircle2
                        size={14}
                        className="text-white"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Remaining Points Info */}
          <div className="flex items-center justify-center gap-2 mb-8 text-sm font-medium text-slate-400">
            <Info size={16} className="text-slate-300" />
            <span>You will have {remainingPoints} points remaining</span>
          </div>

          {/* Apply Button */}
          <button
            onClick={() =>
              currentTier &&
              onApplyDiscount(currentTier.amount, currentTier.points)
            }
            className="w-full h-16 rounded-2xl bg-[#0c1424] text-white flex items-center justify-center gap-3 font-black text-[15px] shadow-xl shadow-black/15 hover:bg-black transition-all active:scale-[0.98]"
          >
            Apply Discount
            <span className="text-[#5dc7ec] font-bold">
              (-${currentTier?.amount.toFixed(2)})
            </span>
          </button>

          {/* Skip Link */}
          <button
            onClick={onSkip}
            className="w-full mt-5 text-center text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-[#0c1424] transition-colors py-2"
          >
            Skip for this bill
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
