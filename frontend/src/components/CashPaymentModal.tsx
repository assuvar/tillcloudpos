import { useState } from 'react';
import { Delete } from 'lucide-react';

interface CashPaymentModalProps {
  amountDue: number;
  onComplete: () => void;
  onCancel: () => void;
}

export default function CashPaymentModal({ amountDue, onComplete, onCancel }: CashPaymentModalProps) {
  const [cashInput, setCashInput] = useState('');

  const cashTendered = parseFloat(cashInput) || 0;
  const changeToReturn = cashTendered > amountDue ? cashTendered - amountDue : 0;

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setCashInput(prev => prev.slice(0, -1));
      return;
    }
    if (key === '.' && cashInput.includes('.')) return;
    // Limit to 2 decimal places
    if (cashInput.includes('.') && cashInput.split('.')[1].length >= 2) return;
    setCashInput(prev => prev + key);
  };

  const handleQuickAmount = (amount: number) => {
    setCashInput(amount.toFixed(2));
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
        onClick={onCancel}
        style={{ animation: 'cpFadeIn 0.3s ease-out' }}
      />

      {/* Modal Card */}
      <div
        className="bg-white w-full max-w-[560px] rounded-[36px] shadow-2xl relative z-10 overflow-hidden"
        style={{ animation: 'cpScaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        {/* Header - Dark Section */}
        <div className="bg-[#0c1424] px-8 py-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-[0.2em] mb-2">Amount Due</div>
              <div className="text-4xl font-black text-white tracking-tight">{formatCurrency(amountDue)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cash Tendered</div>
              <div className="text-4xl font-black text-[#5dc7ec] tracking-tight">
                {cashInput ? formatCurrency(cashTendered) : '$0.00'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-2xl px-5 py-4 border border-white/10">
            <span className="text-sm font-bold text-slate-400">Change to return</span>
            <span className="text-2xl font-black text-[#5dc7ec]">{formatCurrency(changeToReturn)}</span>
          </div>
        </div>

        {/* Keypad Section */}
        <div className="p-8">
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[20, 50, 100].map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className="h-14 rounded-2xl bg-[#f0f4f8] border border-slate-100 text-[15px] font-black text-[#0c1424] hover:bg-slate-100 transition-all active:scale-95"
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all active:scale-95 ${
                  key === 'backspace'
                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100'
                    : 'bg-[#f8fafc] border border-slate-100 text-[#0c1424] hover:bg-slate-50'
                }`}
              >
                {key === 'backspace' ? <Delete size={22} /> : key}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={onComplete}
            disabled={cashTendered < amountDue}
            className="w-full h-16 rounded-2xl bg-[#0c1424] text-white font-black text-[15px] shadow-xl shadow-black/15 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mb-3"
          >
            Complete Payment
          </button>
          <button
            onClick={onCancel}
            className="w-full h-14 rounded-2xl border-2 border-slate-100 text-slate-600 font-black text-[14px] hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cpScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
