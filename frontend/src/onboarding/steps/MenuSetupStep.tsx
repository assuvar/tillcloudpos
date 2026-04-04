import { ArrowLeft, CirclePlus } from "lucide-react";

interface MenuSetupStepProps {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className={`inline-flex w-8 h-4 rounded-full items-center p-[2px] ${
        on ? "bg-[#59c9ef]" : "bg-slate-300"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-full bg-white transition ${on ? "translate-x-4" : "translate-x-0"}`}
      />
    </span>
  );
}

export function MenuSetupStep({ onBack, onNext, onSkip }: MenuSetupStepProps) {
  return (
    <section>
      <h1 className="text-[34px] sm:text-[52px] font-extrabold text-[#0b1324] leading-[1.05] tracking-[-0.02em]">
        Set up your menu
      </h1>
      <p className="text-slate-600 mt-3 text-[15px]">
        Add your categories and items. You can skip this and complete it later.
      </p>

      <div className="mt-8 rounded-[10px] border border-slate-200 bg-white p-5 sm:p-8">
        <div className="grid lg:grid-cols-[250px_1fr] gap-5">
          <aside className="rounded-[8px] border border-slate-200 bg-[#f8fbff] p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-bold text-slate-600">Categories</span>
              <span className="text-[11px] text-slate-400">4 Total</span>
            </div>

            <div className="space-y-1">
              {[
                { name: "Mains", active: true },
                { name: "Starters", active: false },
                { name: "Desserts", active: false },
                { name: "Drinks", active: false },
              ].map(({ name, active }) => (
                <div
                  key={name}
                  className={`rounded-md px-3 py-2 flex items-center justify-between text-[13px] ${
                    active ? "bg-white border border-[#5cc7eb]" : ""
                  }`}
                >
                  <span className={`font-medium ${active ? "text-[#111827]" : "text-slate-600"}`}>{name}</span>
                  <Toggle />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-20 h-10 w-full rounded-md border border-dashed border-slate-300 text-[13px] text-slate-600 inline-flex items-center justify-center gap-2"
            >
              <CirclePlus size={14} />
              Add Category
            </button>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[18px] font-bold text-[#111827]">Mains</div>
                <div className="text-[11px] text-slate-500">Configure individual items for this category</div>
              </div>
              <button
                type="button"
                className="h-9 px-4 rounded-full bg-[#07142a] text-white text-[12px] font-semibold"
              >
                + Add Item
              </button>
            </div>

            {["Wagyu Beef Burger", "Wild Mushroom Risotto"].map((item, index) => (
              <div key={item} className="rounded-[8px] border border-slate-200 bg-[#f7fafc] p-4 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">ITEM NAME</label>
                    <input
                      type="text"
                      value={item}
                      readOnly
                      className="mt-1 h-9 w-full rounded bg-[#edf2f8] px-3 text-[13px] text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">PRICE (AUD)</label>
                    <input
                      type="text"
                      value={index === 0 ? "$ 28.50" : "$ 24.00"}
                      readOnly
                      className="mt-1 h-9 w-full rounded bg-[#edf2f8] px-3 text-[13px] text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-[10px] font-semibold text-slate-500">DESCRIPTION</label>
                  <input
                    type="text"
                    value={
                      index === 0
                        ? "Premium wagyu patty, truffle mayo, caramelised onions, brioche bun."
                        : "Arborio rice with seasonal mushrooms, parmesan, and chive oil."
                    }
                    readOnly
                    className="mt-1 h-9 w-full rounded bg-[#edf2f8] px-3 text-[12px] text-slate-500 outline-none"
                  />
                </div>

                <div className="mt-3 flex items-center gap-6 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    Track Inventory <Toggle on={false} />
                  </span>
                  <span className="inline-flex items-center gap-2">
                    Active <Toggle on />
                  </span>
                  <span className="ml-auto text-red-400">🗑</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="flex items-center gap-5">
            <button type="button" onClick={onSkip} className="text-[13px] text-slate-700 font-medium">
              Skip for now
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
      </div>
    </section>
  );
}
