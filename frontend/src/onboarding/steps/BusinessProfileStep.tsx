import { ArrowLeft, ChevronDown, Search } from "lucide-react";

interface BusinessProfileStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function BusinessProfileStep({ onBack, onNext }: BusinessProfileStepProps) {
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
              <label className="text-[12px] font-semibold text-[#111827]">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 123 George St"
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#111827]">Suburb</label>
              <input
                type="text"
                placeholder="Sydney"
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#111827]">State</label>
                <div className="relative mt-2">
                  <select className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-600 outline-none">
                    <option>NSW</option>
                    <option>QLD</option>
                    <option>VIC</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#111827]">Postcode</label>
                <input
                  type="text"
                  placeholder="2000"
                  className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-semibold text-[#111827]">ABN (Optional)</label>
              <input
                type="text"
                placeholder="11-digit number"
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#111827]">Restaurant Logo</label>
              <button
                type="button"
                className="mt-2 h-[84px] w-full rounded-md border border-dashed border-slate-300 bg-[#f4f7fc] text-[12px] text-slate-500"
              >
                Click to upload (SVG, PNG, JPG)
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#111827]">Timezone</label>
                <div className="relative mt-2">
                  <select className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-3 text-[12px] text-slate-600 outline-none pr-7">
                    <option>(GMT+10:00) Sydney</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#111827]">Currency</label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value="AUD"
                    readOnly
                    className="h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-700 outline-none"
                  />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
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
            className="h-11 px-8 rounded-full bg-[#07142a] text-white text-[13px] font-semibold shadow-xl shadow-black/20"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
