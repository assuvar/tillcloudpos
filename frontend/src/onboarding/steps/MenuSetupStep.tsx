import { ArrowLeft, CirclePlus } from "lucide-react";
import { useState } from "react";
import { MenuCategoryData, MenuItemData } from "../OnboardingFlow";
import { isNonNegativeNumber } from "../validation";

interface MenuSetupStepProps {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  categories: MenuCategoryData[];
  items: MenuItemData[];
  onCategoriesChange: (categories: MenuCategoryData[]) => void;
  onItemsChange: (items: MenuItemData[]) => void;
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

export function MenuSetupStep({
  onBack,
  onNext,
  onSkip,
  categories,
  items,
  onCategoriesChange,
  onItemsChange,
}: MenuSetupStepProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [disabledTooltip, setDisabledTooltip] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.categoryId === selectedCategory.id)
    : [];

  const addCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setDisabledTooltip('Enter a category name first');
      window.setTimeout(() => setDisabledTooltip(''), 1800);
      return;
    }

    const nextCategory: MenuCategoryData = {
      id: crypto.randomUUID(),
      name: trimmedName,
      isActive: true,
    };
    const nextCategories = [...categories, nextCategory];
    onCategoriesChange(nextCategories);
    setSelectedCategoryId(nextCategory.id);
    setNewCategoryName('');
  };

  const addItem = () => {
    if (!selectedCategory) {
      setDisabledTooltip('Add a category first');
      window.setTimeout(() => setDisabledTooltip(''), 1800);
      return;
    }

    const nextItem: MenuItemData = {
      id: crypto.randomUUID(),
      categoryId: selectedCategory.id,
      name: '',
      price: '',
      description: '',
    };
    onItemsChange([...items, nextItem]);
  };

  const updateItem = (itemId: string, field: keyof MenuItemData, value: string) => {
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const updateCategory = (categoryId: string, value: string) => {
    onCategoriesChange(
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: value,
            }
          : category,
      ),
    );
  };

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
              <span className="text-[11px] text-slate-400">{categories.length} Total</span>
            </div>

            <div className="mb-3 rounded-md border border-slate-200 bg-white p-2">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Category name
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => {
                  setNewCategoryName(event.target.value);
                  setDisabledTooltip('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="e.g. Burgers"
                className="h-10 w-full rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-[13px] outline-none"
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={newCategoryName.trim() === ''}
                className="mt-2 h-9 w-full rounded-md bg-[#07142a] text-[12px] font-semibold text-white"
              >
                Add Category
              </button>
            </div>

            <div className="space-y-1">
              {categories.length === 0 && (
                <div className="rounded-md px-3 py-2 text-[13px] text-slate-400">No categories yet</div>
              )}
              {categories.map(({ id, name, isActive }) => {
                const isSelected = selectedCategoryId === id;
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCategoryId(id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedCategoryId(id);
                      }
                    }}
                    className={`w-full rounded-md px-3 py-2 flex items-center gap-3 text-[13px] border ${
                      isSelected ? 'bg-white border-[#5cc7eb]' : 'border-transparent'
                    }`}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => updateCategory(id, event.target.value)}
                      onFocus={() => setSelectedCategoryId(id)}
                      className={`w-full bg-transparent font-medium outline-none ${
                        isSelected ? 'text-[#111827]' : 'text-slate-600'
                      }`}
                      aria-label={`Category name for ${name || 'untitled category'}`}
                    />
                    <Toggle on={isActive} />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addCategory}
              disabled={newCategoryName.trim() === ''}
              className="mt-20 h-10 w-full rounded-md border border-dashed border-slate-300 text-[13px] text-slate-600 inline-flex items-center justify-center gap-2"
            >
              <CirclePlus size={14} />
              Add Category
            </button>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[18px] font-bold text-[#111827]">{selectedCategory?.name || 'Menu Items'}</div>
                <div className="text-[11px] text-slate-500">Configure individual items for this category</div>
              </div>
              <div
                className="relative"
                onClick={() => {
                  if (categories.length === 0) {
                    setDisabledTooltip('Add a category first');
                    window.setTimeout(() => setDisabledTooltip(''), 1800);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={addItem}
                  disabled={categories.length === 0}
                  aria-disabled={categories.length === 0}
                  className="h-9 px-4 rounded-full bg-[#07142a] text-white text-[12px] font-semibold disabled:opacity-50"
                >
                  + Add Item
                </button>
                {disabledTooltip && (
                  <div className="absolute right-0 mt-2 rounded-md bg-slate-800 px-3 py-1 text-[11px] text-white">
                    {disabledTooltip}
                  </div>
                )}
              </div>
            </div>

            {filteredItems.length === 0 && (
              <div className="rounded-[8px] border border-dashed border-slate-300 bg-[#f7fafc] p-4 mb-3 text-sm text-slate-500">
                Add at least one item to this category, or skip for now.
              </div>
            )}

            {filteredItems.map((item) => (
              <div key={item.id} className="rounded-[8px] border border-slate-200 bg-[#f7fafc] p-4 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">ITEM NAME</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(event) => updateItem(item.id, 'name', event.target.value)}
                      className="mt-1 h-9 w-full rounded bg-[#edf2f8] px-3 text-[13px] text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">PRICE (AUD)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.price}
                      disabled={item.name.trim() === ''}
                      onChange={(event) => updateItem(item.id, 'price', event.target.value)}
                      className="mt-1 h-9 w-full rounded bg-[#edf2f8] px-3 text-[13px] text-slate-700 outline-none"
                    />
                    {item.price.trim() !== '' && !isNonNegativeNumber(item.price) && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-600">Price must be greater than or equal to 0.</p>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-[10px] font-semibold text-slate-500">DESCRIPTION</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(event) => updateItem(item.id, 'description', event.target.value)}
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
