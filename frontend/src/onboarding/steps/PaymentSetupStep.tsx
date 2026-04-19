import { ArrowLeft, CircleDot, CreditCard } from "lucide-react";
import { ReactNode } from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PaymentSetupData } from "../OnboardingFlow";

interface PaymentSetupStepProps {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  data: PaymentSetupData;
  onChange: (data: PaymentSetupData) => void;
}

function OptionCard({
  title,
  subtitle,
  active,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  active?: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[9px] p-4 border ${
        active ? "border-[#59c9ef] bg-white" : "border-slate-200 bg-[#f4f8fc]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-8 w-8 rounded-full inline-flex items-center justify-center ${
            active ? "bg-[#07142a] text-[#59c9ef]" : "bg-slate-200 text-slate-500"
          }`}
        >
          {icon}
        </div>
        <div>
          <div className="text-[14px] font-bold text-[#111827]">{title}</div>
          <div className="text-[11px] mt-1 text-slate-500">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export function PaymentSetupStep({ onBack, onNext, onSkip, data, onChange }: PaymentSetupStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const canConnectTyro = data.merchantId.trim() !== '' && data.terminalId.trim() !== '';

  const connectTyro = async () => {
    if (!canConnectTyro) {
      return;
    }

    setIsConnecting(true);
    onChange({
      ...data,
      tyroConnected: true,
    });
    setIsConnecting(false);
  };

  const runTestTransaction = async () => undefined;

  return (
    <section>
      <h1 className="text-[34px] sm:text-[52px] font-extrabold text-[#0b1324] leading-[1.05] tracking-[-0.02em]">
        Payment setup
      </h1>
      <p className="text-slate-600 mt-3 text-[15px]">
        Connect your Tiro payment terminal to start accepting card payments instantly.
      </p>

      <div className="mt-8 rounded-[10px] border border-slate-200 bg-white p-5 sm:p-8 max-w-[760px]">
        <div className="space-y-3">
          <OptionCard
            title="Set up Tyro (Recommended)"
            subtitle="Connect card, tap, Apple Pay, Google Pay via Tyro EFTPOS terminal."
            active={data.paymentMode === 'TYRO'}
            icon={<CircleDot size={14} />}
            onClick={() => onChange({ ...data, paymentMode: 'TYRO' })}
          />

          <OptionCard
            title="Start with cash only"
            subtitle="Skip payment setup, only cash payments available until Tyro is connected."
            icon={<CreditCard size={14} />}
            active={data.paymentMode === 'CASH'}
            onClick={() => onChange({ ...data, paymentMode: 'CASH' })}
          />
        </div>

        {data.paymentMode === 'TYRO' && (
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={data.merchantId}
              onChange={(event) => onChange({ ...data, merchantId: event.target.value })}
              placeholder="Tyro Merchant ID"
              className="h-11 rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-[13px]"
              aria-label="Tyro Merchant ID"
            />
            <input
              type="text"
              value={data.terminalId}
              onChange={(event) => onChange({ ...data, terminalId: event.target.value })}
              placeholder="Tyro Terminal ID"
              className="h-11 rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-[13px]"
              aria-label="Tyro Terminal ID"
            />
          </div>
        )}

        {data.paymentMode === 'TYRO' && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={!canConnectTyro || isConnecting}
              onClick={() => {
                void connectTyro();
              }}
              className="h-10 px-5 rounded-full bg-[#07142a] text-white text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isConnecting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isConnecting ? 'Connecting...' : 'Connect Tyro'}
            </button>

            {data.tyroConnected && (
              <button
                type="button"
                onClick={() => {
                  void runTestTransaction();
                }}
                className="h-10 px-5 rounded-full border border-slate-300 text-[12px] font-semibold"
              >
                Run Test Transaction
              </button>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="flex items-center gap-5">
            <button type="button" onClick={onSkip} className="text-[12px] uppercase tracking-[0.12em] text-slate-700 font-semibold">
              Skip for now
            </button>
            <button
              type="button"
              onClick={onNext}
              className="h-11 px-8 rounded-full bg-[#07142a] text-white text-[12px] uppercase tracking-[0.12em] font-semibold shadow-xl shadow-black/20"
            >
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
