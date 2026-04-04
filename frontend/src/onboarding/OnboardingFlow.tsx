import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  BadgeCheck,
  Banknote,
  ClipboardList,
  CreditCard,
  LucideIcon,
  Store,
  Users,
} from "lucide-react";
import { BusinessProfileStep } from "./steps/BusinessProfileStep";
import { TaxConfigurationStep } from "./steps/TaxConfigurationStep";
import { MenuSetupStep } from "./steps/MenuSetupStep";
import { StaffTerminalsStep } from "./steps/StaffTerminalsStep";
import { PaymentSetupStep } from "./steps/PaymentSetupStep";

interface StepItem {
  id: number;
  label: string;
  icon: LucideIcon;
}

const stepItems: StepItem[] = [
  { id: 1, label: "Business Profile", icon: Store },
  { id: 2, label: "Tax Configuration", icon: ClipboardList },
  { id: 3, label: "Menu Setup", icon: Banknote },
  { id: 4, label: "Staff and terminals", icon: Users },
  { id: 5, label: "Payment Setup", icon: CreditCard },
];

interface StepActions {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

function Sidebar({ currentStep }: { currentStep: number }) {
  return (
    <aside className="hidden lg:block w-[280px] border-r border-slate-200 bg-[#f7f7f8]">
      <div className="px-7 py-6 text-[24px] font-black tracking-tight text-[#111827]">
        TILLCLOUD
      </div>

      <div className="px-7 pb-5">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-semibold">
          <BadgeCheck size={13} className="text-[#5dc7ec]" />
          <span>Registration</span>
        </div>
        <div className="mt-2 text-[28px] font-bold text-[#111827] leading-tight">
          Onboarding
        </div>
        <div className="text-[12px] text-slate-500 mt-1">Step {currentStep} of 5</div>
      </div>

      <nav className="py-2 border-t border-slate-200">
        {stepItems.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`relative flex items-center gap-3 px-7 py-4 text-[13px] font-medium ${
                isActive ? "text-[#111827] bg-white" : "text-slate-500"
              }`}
            >
              <Icon size={14} className={isCompleted ? "text-[#5dc7ec]" : ""} />
              <span>{step.label}</span>
              {isActive && <span className="absolute right-0 top-0 h-full w-[2px] bg-[#5dc7ec]" />}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, updateOnboardingStatus, logout } = useAuth();

  const nextStep = async () => {
    if (currentStep === 5) {
      setIsSubmitting(true);
      try {
        await api.patch(`/users/onboarding/${user?.id}`, {
          fullName: user?.fullName, // Keep current name
          restaurantData: {
            // Simplified for now, could collect from steps
            streetAddress: 'Updated Address',
            suburb: 'Sydney',
            postcode: '2000'
          }
        });
        updateOnboardingStatus(true);
        navigate("/dashboard");
      } catch (error) {
        console.error("Failed to complete onboarding", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setCurrentStep((previous) => Math.min(5, previous + 1));
  };

  const backStep = () => setCurrentStep((previous) => Math.max(1, previous - 1));

  const skipStep = () => {
    if (currentStep === 5) {
      navigate("/dashboard");
      return;
    }
    setCurrentStep((previous) => Math.min(5, previous + 1));
  };

  const actions: StepActions = {
    onBack: backStep,
    onNext: nextStep,
    onSkip: skipStep,
    isSubmitting,
  };

  const currentView = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <BusinessProfileStep {...actions} />;
      case 2:
        return <TaxConfigurationStep {...actions} />;
      case 3:
        return <MenuSetupStep {...actions} />;
      case 4:
        return <StaffTerminalsStep {...actions} />;
      case 5:
        return <PaymentSetupStep {...actions} />;
      default:
        return <BusinessProfileStep {...actions} />;
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="min-h-screen grid lg:grid-cols-[280px_1fr]">
        <Sidebar currentStep={currentStep} />

        <main className="bg-[#ebf5f9]">
          <div className="mx-auto max-w-[980px] px-5 py-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between lg:justify-end mb-6">
              <div className="lg:hidden text-[22px] font-black text-[#111827]">TILLCLOUD</div>
              <button
                type="button"
                disabled={isSubmitting}
                className="h-9 px-6 rounded-full bg-[#0c1424] text-white text-[11px] tracking-[0.12em] font-bold uppercase shadow-lg shadow-black/20 disabled:opacity-50"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>

            {currentView}
          </div>
        </main>
      </div>
    </div>
  );
}
