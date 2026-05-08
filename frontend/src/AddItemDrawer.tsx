import { useEffect, useRef, useState } from "react";
import { ChevronDown, ImagePlus, Plus, Trash2, X, Check } from "lucide-react";
import { useMenuManagement } from "./context/MenuManagementContext";

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#f59e0b", // Orange
  "#ec4899", // Pink
  "#ef4444", // Red
  "#0f172a", // Dark Slate
];

export default function AddItemDrawer() {
  const {
    categories,
    ingredientOptions,
    drawerOpen,
    drawerMode,
    drawerForm,
    drawerEditingItemId,
    closeDrawer,
    updateDrawerField,
    saveDrawerItem,
    variationGroups,
    addonGroups,
  } = useMenuManagement();

  const [selectedVariationGroups, setSelectedVariationGroups] = useState<string[]>([]);
  const [selectedAddonGroups, setSelectedAddonGroups] = useState<string[]>([]);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (drawerOpen) {
      if (drawerMode === "edit" && drawerEditingItemId) {
        const activeVgs = variationGroups
          .filter((vg) => vg.menuItems?.some((mi: any) => mi.menuItemId === drawerEditingItemId))
          .map((vg) => vg.id);
        const activeAds = addonGroups
          .filter((ag) => ag.menuItems?.some((mi: any) => mi.menuItemId === drawerEditingItemId))
          .map((ag) => ag.id);
        setSelectedVariationGroups(activeVgs);
        setSelectedAddonGroups(activeAds);
      } else {
        setSelectedVariationGroups([]);
        setSelectedAddonGroups([]);
      }
    }
  }, [drawerOpen, drawerMode, drawerEditingItemId, variationGroups, addonGroups]);

  useEffect(() => {
    if (!drawerOpen) {
      setLocalError("");
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    }
  }, [drawerOpen]);

  useEffect(() => {
    setLocalError("");
  }, [drawerMode, drawerEditingItemId]);

  if (!drawerOpen) {
    return null;
  }

  const parsedPrice = Number.parseFloat(drawerForm.price);
  const isFormValid = Boolean(
    drawerForm.name.trim() &&
    drawerForm.categoryId &&
    !Number.isNaN(parsedPrice) &&
    parsedPrice >= 0,
  );

  const handleClose = () => {
    setLocalError("");
    closeDrawer();
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalError("Please select an image file");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    updateDrawerField("imageFile", file);
    updateDrawerField("image", previewUrl);
    setLocalError("");
  };

  const clearImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    updateDrawerField("imageFile", null);
    updateDrawerField("image", "");
  };

  const generateShortcode = () => {
    const name = drawerForm.name.trim();
    if (!name) return;
    
    const words = name.split(/\s+/).filter(Boolean);
    let code = "";
    if (words.length >= 2) {
      code = words.map(w => w.charAt(0)).join("").substring(0, 4);
    } else {
      code = name.substring(0, 3);
    }
    updateDrawerField("shortcode", code.toUpperCase());
  };

  const handleSave = async () => {
    const success = await saveDrawerItem(selectedVariationGroups, selectedAddonGroups);
    if (!success) {
      setLocalError("Please complete item name, category, price, and required settings.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end p-2 sm:p-0">
      <div
        className="absolute inset-0 bg-[#0c1424]/30 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div className="relative flex h-full max-h-[calc(100vh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-500 sm:max-h-none sm:max-w-[580px]">
        <div className="flex items-start justify-between border-b border-slate-50 p-4 pb-4 sm:p-8">
          <div>
            <h2 className="text-[24px] font-black leading-tight text-[#0c1424] sm:text-[28px]">
              {drawerMode === "edit" ? "Edit Item" : "Add New Item"}
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[13px] text-slate-500 font-medium tracking-tight">
                Category:
              </span>
              <span className="text-[13px] text-blue-500 font-black tracking-tight">
                {categories.find(
                  (category) => category.id === drawerForm.categoryId,
                )?.name || "Select category"}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-[#0c1424] transition-all hover:bg-slate-50 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 pt-6 sm:space-y-8 sm:p-8">
          {localError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {localError}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Item Name
            </label>
            <input
              type="text"
              value={drawerForm.name}
              onChange={(event) =>
                updateDrawerField("name", event.target.value)
              }
              placeholder="e.g., Crispy Skin Duck"
              className="w-full h-12 bg-blue-50/50 border border-transparent rounded-xl px-4 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all placeholder:font-medium"
            />
          </div>

          {/* COLOR AND SHORTCODE SECTIONS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Keyboard Shortcode Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                POS Keyboard Shortcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={drawerForm.shortcode}
                  onChange={(event) =>
                    updateDrawerField("shortcode", event.target.value.toUpperCase())
                  }
                  placeholder="e.g. CSD"
                  className="w-full h-12 bg-blue-50/50 border border-transparent rounded-xl px-4 text-[14px] font-black text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:font-bold"
                />
                <button
                  type="button"
                  onClick={generateShortcode}
                  disabled={!drawerForm.name.trim()}
                  className="h-12 px-4 rounded-xl border border-slate-250 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50 shrink-0"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Item Specific Custom Theme Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Display Color
                </label>
                {drawerForm.color && (
                  <button
                    type="button"
                    onClick={() => updateDrawerField("color", "")}
                    className="text-[9px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase"
                  >
                    Clear Custom
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 h-12 bg-blue-50/50 rounded-xl px-3 border border-transparent">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateDrawerField("color", color)}
                    className="w-7 h-7 rounded-full relative transition-transform hover:scale-110 flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {drawerForm.color === color && (
                      <Check size={12} className="text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Item Image (Optional)
            </label>
            <div className="rounded-xl bg-blue-50/50 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleFileSelect(event.target.files?.[0] || null)
                  }
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#0c1424] shadow-sm animate-none"
                >
                  <ImagePlus size={14} />
                  Choose File
                </button>
                <div className="text-[12px] font-semibold text-slate-500">
                  {drawerForm.imageFile
                    ? drawerForm.imageFile.name
                    : drawerMode === "edit" && drawerForm.image
                      ? "Current image retained until replaced"
                      : "No image selected"}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                {drawerForm.image ? (
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                    <img
                      src={drawerForm.image}
                      alt="Menu preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-slate-500">
                    Upload an image file if needed. Items can be saved without
                    images.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-[#0c1424] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                    >
                      Select Image
                    </button>
                    {drawerForm.imageFile && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="rounded-full border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Price (AUD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0c1424] font-black text-[14px]">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={drawerForm.price}
                  onChange={(event) =>
                    updateDrawerField("price", event.target.value)
                  }
                  className="w-full h-12 bg-blue-50/50 border border-transparent rounded-xl pl-8 pr-4 text-[14px] font-black text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Category
              </label>
              <div className="relative">
                <select
                  value={drawerForm.categoryId}
                  onChange={(event) =>
                    updateDrawerField("categoryId", event.target.value)
                  }
                  className="w-full h-12 appearance-none bg-blue-50/50 border border-transparent rounded-xl px-4 text-[14px] font-black text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* AVAILABILITY & VISIBILITY SECTION */}
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="flex items-center justify-between border-b border-slate-100/40 pb-4">
              <div>
                <div className="text-[13px] font-black text-[#0c1424] leading-tight">
                  POS Active Status
                </div>
                <div className="text-[11px] text-slate-400 font-bold tracking-tight mt-0.5">
                  Is this menu item active and visible inside the POS terminal?
                </div>
              </div>
              <input
                type="checkbox"
                checked={drawerForm.isActive}
                onChange={(event) =>
                  updateDrawerField("isActive", event.target.checked)
                }
                className="h-5 w-5 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424] cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <div className="text-[13px] font-black text-[#0c1424] leading-tight">
                POS Channels Availability
              </div>
              <div className="text-[11px] text-slate-400 font-bold tracking-tight mt-0.5">
                Select checkout channels where this menu item is visible
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { key: "dineIn", label: "Dine-In" },
                { key: "pickup", label: "Pickup" },
                { key: "delivery", label: "Delivery" },
                { key: "inStore", label: "In-Store" },
                { key: "qrOrdering", label: "QR Ordering" },
                { key: "kiosk", label: "Kiosk" },
                { key: "onlineOrdering", label: "Online" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-blue-500/20 hover:shadow-sm transition-all shadow-none"
                >
                  <input
                    type="checkbox"
                    checked={drawerForm.visibility?.[key as keyof typeof drawerForm.visibility] ?? true}
                    onChange={(event) => {
                      const updatedVis = {
                        ...drawerForm.visibility,
                        [key]: event.target.checked,
                      };
                      updateDrawerField("visibility", updatedVis);
                    }}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424]"
                  />
                  <span className="text-[13px] font-bold text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Description
            </label>
            <textarea
              value={drawerForm.description}
              onChange={(event) =>
                updateDrawerField("description", event.target.value)
              }
              placeholder="Brief description of the dish..."
              className="w-full h-28 bg-blue-50/50 border border-transparent rounded-xl p-4 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:font-medium resize-none"
            />
            <div className="flex justify-end pt-1">
              <span className="text-[10px] font-bold text-slate-300">
                {drawerForm.description.length} / 200 characters
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <label className="flex items-center justify-between gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div>
                <div className="text-[13px] font-black text-[#0c1424] leading-tight">
                  Track Inventory
                </div>
                <div className="text-[11px] text-slate-400 font-bold tracking-tight">
                  Alert when stock is low
                </div>
              </div>
              <input
                type="checkbox"
                checked={drawerForm.trackInventory}
                onChange={(event) =>
                  updateDrawerField("trackInventory", event.target.checked)
                }
                className="h-5 w-5 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424]"
              />
            </label>

            {drawerForm.trackInventory ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-black text-[#0c1424] leading-tight">
                      Recipe Ingredients
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold tracking-tight">
                      Quantity consumed per item sale
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateDrawerField("recipeItems", [
                        ...drawerForm.recipeItems,
                        { ingredientId: "", quantity: "1" },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0c1424] shadow-sm"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {drawerForm.recipeItems.map((recipeItem, index) => {
                    const selectedIngredient = ingredientOptions.find(
                      (ingredient) => ingredient.id === recipeItem.ingredientId,
                    );
                    const defaultUnit = selectedIngredient?.unit || "ea";

                    return (
                      <div
                        key={`recipe-${index}`}
                        className="grid grid-cols-[1fr_110px_90px_auto] gap-2"
                      >
                        <div className="relative">
                          <select
                            value={recipeItem.ingredientId}
                            onChange={(event) => {
                              const nextRecipe = drawerForm.recipeItems.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        ingredientId: event.target.value,
                                        unit:
                                          ingredientOptions.find(
                                            (ingredient) =>
                                              ingredient.id ===
                                              event.target.value,
                                          )?.unit ||
                                          item.unit ||
                                          "ea",
                                      }
                                    : item,
                              );
                              updateDrawerField("recipeItems", nextRecipe);
                            }}
                            className="w-full h-11 appearance-none bg-white border border-slate-100 rounded-xl px-3 text-[13px] font-bold text-[#0c1424] focus:outline-none"
                          >
                            <option value="">Select ingredient</option>
                            {ingredientOptions.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name} ({ingredient.unit})
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>

                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={recipeItem.quantity}
                          onChange={(event) => {
                            const nextRecipe = drawerForm.recipeItems.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, quantity: event.target.value }
                                  : item,
                            );
                            updateDrawerField("recipeItems", nextRecipe);
                          }}
                          className="h-11 bg-white border border-slate-100 rounded-xl px-3 text-[13px] font-bold text-[#0c1424] focus:outline-none"
                          placeholder="Qty"
                        />

                        <select
                          value={recipeItem.unit || defaultUnit}
                          onChange={(event) => {
                            const nextRecipe = drawerForm.recipeItems.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, unit: event.target.value }
                                  : item,
                            );
                            updateDrawerField("recipeItems", nextRecipe);
                          }}
                          className="h-11 bg-white border border-slate-100 rounded-xl px-2 text-[12px] font-bold text-[#0c1424] focus:outline-none"
                        >
                          <option value={defaultUnit}>{defaultUnit}</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="mg">mg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="ea">ea</option>
                          <option value="pc">pc</option>
                          <option value="doz">doz</option>
                          <option value="pack">pack</option>
                          <option value="box">box</option>
                          <option value="tray">tray</option>
                          <option value="carton">carton</option>
                          <option value="bottle">bottle</option>
                          <option value="can">can</option>
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const nextRecipe = drawerForm.recipeItems.filter(
                              (_, itemIndex) => itemIndex !== index,
                            );
                            updateDrawerField(
                              "recipeItems",
                              nextRecipe.length > 0
                                ? nextRecipe
                                : [{ ingredientId: "", quantity: "1" }],
                            );
                          }}
                          className="h-11 w-11 rounded-xl border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* LINKED MODIFIER GROUPS SECTIONS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-black text-[#0c1424] uppercase tracking-wide">
                Linked Modifier Groups
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Size Variations */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Size Variations
                  </span>
                  {variationGroups.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium">No Variation Groups created yet.</span>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {variationGroups.map((vg) => {
                        const isChecked = selectedVariationGroups.includes(vg.id);
                        return (
                          <div key={vg.id} className="flex flex-col gap-1.5 p-2 rounded-xl border border-transparent hover:bg-white/60 hover:border-slate-100 transition-all">
                            <label className="flex items-center gap-2.5 cursor-pointer text-[13px] font-bold text-slate-700 w-full">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedVariationGroups(selectedVariationGroups.filter(id => id !== vg.id));
                                  } else {
                                    setSelectedVariationGroups([...selectedVariationGroups, vg.id]);
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424]"
                              />
                              <span className="truncate">{vg.name}</span>
                              <span className="text-[10px] text-slate-400 font-black bg-slate-100 px-1.5 py-0.5 rounded-md ml-auto shrink-0">
                                {vg.options?.length || 0} opt
                              </span>
                            </label>
                            {vg.options && vg.options.length > 0 && (
                              <div className="pl-6.5 flex flex-wrap gap-1">
                                {vg.options.map((opt: any) => (
                                  <span key={opt.id} className="text-[10px] text-slate-500 font-bold bg-white border border-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                                    {opt.name} {opt.priceInCents > 0 ? `(+$${(opt.priceInCents / 100).toFixed(2)})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Toppings & Addons */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Toppings & Addons
                  </span>
                  {addonGroups.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium">No Addon Groups created yet.</span>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {addonGroups.map((ag) => {
                        const isChecked = selectedAddonGroups.includes(ag.id);
                        return (
                          <div key={ag.id} className="flex flex-col gap-1.5 p-2 rounded-xl border border-transparent hover:bg-white/60 hover:border-slate-100 transition-all">
                            <label className="flex items-center gap-2.5 cursor-pointer text-[13px] font-bold text-slate-700 w-full">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedAddonGroups(selectedAddonGroups.filter(id => id !== ag.id));
                                  } else {
                                    setSelectedAddonGroups([...selectedAddonGroups, ag.id]);
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424]"
                              />
                              <span className="truncate">{ag.name}</span>
                              <span className="text-[10px] text-slate-400 font-black bg-slate-100 px-1.5 py-0.5 rounded-md ml-auto shrink-0">
                                {ag.addons?.length || 0} opt
                              </span>
                            </label>
                            {ag.addons && ag.addons.length > 0 && (
                              <div className="pl-6.5 flex flex-wrap gap-1">
                                {ag.addons.map((add: any) => (
                                  <span key={add.id} className="text-[10px] text-slate-500 font-bold bg-white border border-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                                    {add.name} {add.priceInCents > 0 ? `(+$${(add.priceInCents / 100).toFixed(2)})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:gap-4 sm:p-8 shrink-0">
          <button
            onClick={handleClose}
            className="h-12 flex-1 rounded-xl border border-slate-100 text-[13px] font-black uppercase tracking-widest text-[#0c1424] transition-all hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className="h-12 flex-1 rounded-xl bg-[#0c1424] text-[13px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/20 transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
