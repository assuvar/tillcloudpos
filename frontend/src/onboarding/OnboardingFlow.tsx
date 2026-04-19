import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { StaffTerminalsStep } from "./steps/StaffTerminalsStep.tsx";
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
  { id: 4, label: "Staff", icon: Users },
  { id: 5, label: "Payment Setup", icon: CreditCard },
];

interface StepActions {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export type BusinessProfileData = {
  name: string;
  phone: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  abn: string;
  logoUrl: string;
  timezone: string;
  currency: string;
};

export type TaxConfigurationData = {
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE' | 'NONE';
  taxRate: string;
};

export type MenuCategoryData = {
  id: string;
  name: string;
  isActive: boolean;
};

export type MenuItemData = {
  id: string;
  categoryId: string;
  name: string;
  price: string;
  description: string;
};

export type PaymentSetupData = {
  paymentMode: 'TYRO' | 'CASH';
  merchantId: string;
  terminalId: string;
  tyroConnected: boolean;
};

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
              className={`relative flex items-center gap-3 px-7 py-4 text-[13px] font-medium transition-colors ${
                isActive ? "text-[#111827] bg-white" : isCompleted ? "text-[#0c607b]" : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black ${
                  isActive
                    ? 'border-[#5dc7ec] bg-[#e9f7fc] text-[#0c607b]'
                    : isCompleted
                      ? 'border-[#5dc7ec] bg-[#5dc7ec] text-white'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : <Icon size={10} />}
              </span>
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
  const [stepFeedback, setStepFeedback] = useState<string>('');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData>({
    name: '',
    phone: '',
    streetAddress: '',
    suburb: '',
    state: '',
    postcode: '',
    abn: '',
    logoUrl: '',
    timezone: '(GMT+10:00) Sydney',
    currency: 'AUD',
  });
  const [taxConfig, setTaxConfig] = useState<TaxConfigurationData>({
    taxMode: 'INCLUSIVE',
    taxRate: '10',
  });
  const [menuCategories, setMenuCategories] = useState<MenuCategoryData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [paymentSetup, setPaymentSetup] = useState<PaymentSetupData>({
    paymentMode: 'TYRO',
    merchantId: '',
    terminalId: '',
    tyroConnected: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { updateOnboardingStatus, logout } = useAuth();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const stepParam = query.get('step');
    const parsed = stepParam ? Number(stepParam) : NaN;
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      setCurrentStep(parsed);
    }
  }, [location.search]);

  useEffect(() => {
    const hydrateOnboarding = async () => {
      try {
        const [statusResponse, restaurantResponse, menuResponse] = await Promise.all([
          api.get('/onboarding/status'),
          api.get('/restaurant'),
          api.get('/menu/categories'),
        ]);

        const statusData = statusResponse.data as {
          onboardingCompleted?: boolean;
        };

        if (statusData?.onboardingCompleted) {
          updateOnboardingStatus(true);
          navigate('/dashboard', { replace: true });
          return;
        }

        const restaurant = restaurantResponse.data as {
          name?: string;
          phone?: string;
          streetAddress?: string;
          suburb?: string;
          state?: string;
          postcode?: string;
          abn?: string;
          logoUrl?: string;
          timezone?: string;
          taxMode?: 'INCLUSIVE' | 'EXCLUSIVE' | 'NONE';
          taxRate?: number;
        };

        setBusinessProfile((previous) => ({
          ...previous,
          name: restaurant.name || previous.name,
          phone: restaurant.phone || previous.phone,
          streetAddress: restaurant.streetAddress || previous.streetAddress,
          suburb: restaurant.suburb || previous.suburb,
          state: restaurant.state || previous.state,
          postcode: restaurant.postcode || previous.postcode,
          abn: restaurant.abn || previous.abn,
          logoUrl: restaurant.logoUrl || previous.logoUrl,
          timezone: restaurant.timezone || previous.timezone,
        }));

        setTaxConfig((previous) => ({
          taxMode: restaurant.taxMode || previous.taxMode,
          taxRate:
            restaurant.taxRate !== undefined
              ? String(restaurant.taxRate)
              : previous.taxRate,
        }));

        const menuCategoriesResponse = (menuResponse.data || []) as Array<{
          id: string;
          name: string;
          items?: Array<{
            id: string;
            name: string;
            price: number;
            description?: string;
            categoryId: string;
          }>;
        }>;

        setMenuCategories(
          menuCategoriesResponse.map((category) => ({
            id: category.id,
            name: category.name,
            isActive: true,
          })),
        );

        setMenuItems(
          menuCategoriesResponse.flatMap((category) =>
            (category.items || []).map((item) => ({
              id: item.id,
              categoryId: item.categoryId,
              name: item.name,
              price: String(item.price),
              description: item.description || '',
            })),
          ),
        );
      } catch (error) {
        console.error('Failed to hydrate onboarding data', error);
      }
    };

    void hydrateOnboarding();
  }, [navigate, updateOnboardingStatus]);

  const persistMenuSetup = async () => {
    if (menuCategories.length === 0 || menuItems.length === 0) {
      return;
    }

    const existingResponse = await api.get('/menu/categories');
    const existingCategories = (existingResponse.data || []) as Array<{
      id: string;
      name: string;
      items?: Array<{ id: string; name: string; categoryId: string }>;
    }>;

    const categoryMap = new Map<string, string>();
    existingCategories.forEach((category) => {
      categoryMap.set(category.name.trim().toLowerCase(), category.id);
    });

    for (const category of menuCategories) {
      const normalizedName = category.name.trim();
      if (!normalizedName) {
        continue;
      }

      const key = normalizedName.toLowerCase();
      if (!categoryMap.has(key)) {
        const created = await api.post('/menu/categories', {
          name: normalizedName,
        });
        const createdId = created.data?.id as string | undefined;
        if (createdId) {
          categoryMap.set(key, createdId);
        }
      }
    }

    const refreshed = await api.get('/menu/categories');
    const refreshedCategories = (refreshed.data || []) as Array<{
      id: string;
      name: string;
      items?: Array<{ id: string; name: string; categoryId: string }>;
    }>;

    const existingItemsByCategory = new Map<string, Set<string>>();
    refreshedCategories.forEach((category) => {
      const names = new Set<string>();
      (category.items || []).forEach((item) => names.add(item.name.trim().toLowerCase()));
      existingItemsByCategory.set(category.id, names);
      categoryMap.set(category.name.trim().toLowerCase(), category.id);
    });

    for (const item of menuItems) {
      const category = menuCategories.find((value) => value.id === item.categoryId);
      const categoryName = category?.name?.trim();
      const categoryId = categoryName ? categoryMap.get(categoryName.toLowerCase()) : undefined;
      const itemName = item.name.trim();
      const itemPrice = Number(item.price);

      if (!categoryId || !itemName || !Number.isFinite(itemPrice) || itemPrice < 0) {
        continue;
      }

      const existingNames = existingItemsByCategory.get(categoryId) || new Set<string>();
      const normalizedItemName = itemName.toLowerCase();
      if (existingNames.has(normalizedItemName)) {
        continue;
      }

      await api.post('/menu/items', {
        name: itemName,
        categoryId,
        price: itemPrice,
        description: item.description?.trim() || '',
      });

      existingNames.add(normalizedItemName);
      existingItemsByCategory.set(categoryId, existingNames);
    }
  };

  const persistBusinessSetup = async () => {
    const response = await api.patch('/restaurant', {
      name: businessProfile.name,
      phone: businessProfile.phone,
      streetAddress: businessProfile.streetAddress,
      suburb: businessProfile.suburb,
      state: businessProfile.state,
      postcode: businessProfile.postcode,
      abn: businessProfile.abn,
      logoUrl: businessProfile.logoUrl,
      timezone: businessProfile.timezone,
    });

    const restaurant = response.data as Partial<BusinessProfileData>;
    setBusinessProfile((previous) => ({
      ...previous,
      name: restaurant.name || previous.name,
      phone: restaurant.phone || previous.phone,
      streetAddress: restaurant.streetAddress || previous.streetAddress,
      suburb: restaurant.suburb || previous.suburb,
      state: restaurant.state || previous.state,
      postcode: restaurant.postcode || previous.postcode,
      abn: restaurant.abn || previous.abn,
      logoUrl: restaurant.logoUrl || previous.logoUrl,
      timezone: restaurant.timezone || previous.timezone,
    }));
  };

  const persistTaxSetup = async () => {
    const response = await api.patch('/restaurant/tax', {
      taxMode: taxConfig.taxMode,
      taxRate: Number(taxConfig.taxRate || 0),
    });

    const taxData = response.data as {
      taxMode?: TaxConfigurationData['taxMode'];
      taxRate?: number;
    };
    setTaxConfig((previous) => ({
      taxMode: taxData.taxMode || previous.taxMode,
      taxRate:
        taxData.taxRate !== undefined
          ? String(taxData.taxRate)
          : previous.taxRate,
    }));
  };

  const persistPaymentSetup = async () => {
    if (paymentSetup.paymentMode !== 'TYRO') {
      return;
    }

    await api.patch('/restaurant', {
      tyroMerchantId: paymentSetup.merchantId.trim() || null,
      tyroTerminalId: paymentSetup.terminalId.trim() || null,
      tyroConnected: paymentSetup.tyroConnected,
    });
  };

  const nextStep = async () => {
    setIsSubmitting(true);
    setStepFeedback('');
    try {
      if (currentStep === 1) {
        await persistBusinessSetup();
        setStepFeedback('Saved successfully');
      }

      if (currentStep === 2) {
        await persistTaxSetup();
        setStepFeedback('Saved successfully');
      }

      if (currentStep === 3) {
        await persistMenuSetup();
        setStepFeedback('Saved successfully');
      }

      if (currentStep === 4) {
        setStepFeedback('Saved successfully');
      }

      if (currentStep === 5) {
        await persistPaymentSetup();
        const completionResponse = await api.post('/onboarding/complete');
        if (completionResponse.data?.onboardingCompleted) {
          setStepFeedback('Setup completed successfully');
          updateOnboardingStatus(true);
          window.setTimeout(() => {
            navigate('/dashboard');
          }, 900);
          return;
        }
      }

      setCurrentStep((previous) => Math.min(5, previous + 1));
    } catch (error) {
      console.error('Failed to persist onboarding step', error);
      setStepFeedback('Unable to save step. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backStep = () => setCurrentStep((previous) => Math.max(1, previous - 1));

  const skipStep = () => {
    if (currentStep === 5) {
      void nextStep();
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
        return (
          <BusinessProfileStep
            {...actions}
            data={businessProfile}
            onChange={setBusinessProfile}
          />
        );
      case 2:
        return (
          <TaxConfigurationStep
            {...actions}
            data={taxConfig}
            onChange={setTaxConfig}
          />
        );
      case 3:
        return (
          <MenuSetupStep
            {...actions}
            categories={menuCategories}
            items={menuItems}
            onCategoriesChange={setMenuCategories}
            onItemsChange={setMenuItems}
          />
        );
      case 4:
        return (
          <StaffTerminalsStep {...actions} />
        );
      case 5:
        return (
          <PaymentSetupStep
            {...actions}
            data={paymentSetup}
            onChange={setPaymentSetup}
          />
        );
      default:
        return (
          <BusinessProfileStep
            {...actions}
            data={businessProfile}
            onChange={setBusinessProfile}
          />
        );
    }
  }, [currentStep, actions, businessProfile, taxConfig, menuCategories, menuItems, paymentSetup]);

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

            {stepFeedback ? (
              <div className="mb-5 rounded-xl border border-[#b6e5f6] bg-[#e9f7fc] px-4 py-3 text-[12px] font-semibold text-[#0c607b]">
                {stepFeedback}
              </div>
            ) : null}

            {currentView}
          </div>
        </main>
      </div>
    </div>
  );
}
