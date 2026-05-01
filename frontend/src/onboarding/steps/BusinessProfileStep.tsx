import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import { BusinessProfileData } from "../OnboardingFlow";

interface BusinessProfileStepProps {
  onBack: () => void;
  onNext: () => void;
  data: BusinessProfileData;
  onChange: (data: BusinessProfileData) => void;
}

export function BusinessProfileStep({
  onBack,
  onNext,
  data,
  onChange,
}: BusinessProfileStepProps) {
  const requiredReady =
    data.name.trim() !== "" &&
    data.phone.trim() !== "" &&
    data.streetAddress.trim() !== "" &&
    data.suburb.trim() !== "" &&
    data.state.trim() !== "" &&
    data.postcode.trim() !== "";

  const updateField = (field: keyof BusinessProfileData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <section>
      <h1 className="text-[34px] sm:text-[52px] font-extrabold text-[#0b1324] leading-[1.05] tracking-[-0.02em]">
        Setup your Business profile
      </h1>
      <p className="text-slate-600 mt-3 text-[15px]">
        Tell us about your restaurant&apos;s location and identity.
      </p>

      <div className="mt-8 rounded-[10px] border border-slate-200 bg-white p-5 sm:p-8">
        <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-semibold text-[#111827]">
                Business Name
              </label>
              <input
                type="text"
                placeholder="e.g. TillCloud Cafe"
                value={data.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                aria-label="Business Name"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#111827]">
                Phone
              </label>
              <input
                type="text"
                placeholder="e.g. +61 2 1234 5678"
                value={data.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                aria-label="Business Phone"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#111827]">
                Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 123 George St"
                value={data.streetAddress}
                onChange={(event) =>
                  updateField("streetAddress", event.target.value)
                }
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                aria-label="Street Address"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#111827]">
                Suburb
              </label>
              <input
                type="text"
                placeholder="Sydney"
                value={data.suburb}
                onChange={(event) => updateField("suburb", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                aria-label="Suburb"
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#111827]">
                  State
                </label>
                <div className="relative mt-2">
                  <select
                    value={data.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-600 outline-none"
                    aria-label="State"
                  >
                    <option value="">Select state</option>
                    <option>NSW</option>
                    <option>QLD</option>
                    <option>VIC</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#111827]">
                  Postcode
                </label>
                <input
                  type="text"
                  placeholder="2000"
                  value={data.postcode}
                  onChange={(event) =>
                    updateField("postcode", event.target.value)
                  }
                  className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                  aria-label="Postcode"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-semibold text-[#111827]">
                ABN (Optional)
              </label>
              <input
                type="text"
                placeholder="11-digit number"
                value={data.abn}
                onChange={(event) => updateField("abn", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                aria-label="ABN (Optional)"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#111827]">
                Restaurant Logo
              </label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={data.logoUrl}
                onChange={(event) => updateField("logoUrl", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                aria-label="Restaurant Logo URL"
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#111827]">
                  Timezone
                </label>
                <div className="relative mt-2">
                  <select
                    value={data.timezone}
                    onChange={(event) =>
                      updateField("timezone", event.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-3 text-[12px] text-slate-600 outline-none pr-7"
                  >
                    <option>(GMT+10:00) Sydney</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#111827]">
                  Currency
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={data.currency}
                    readOnly
                    className="h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-700 outline-none"
                  />
                  <Search
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          {!requiredReady ? (
            <div className="max-w-[420px] rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] font-semibold text-rose-700">
              Required: business name, phone, street address, suburb, state, and
              postcode.
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!requiredReady}
              className="h-11 px-8 rounded-full bg-[#07142a] text-white text-[13px] font-semibold shadow-xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={!requiredReady}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
