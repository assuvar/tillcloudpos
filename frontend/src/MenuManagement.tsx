import {
  Edit2,
  Plus,
  Trash2,
  Layers,
  Grid,
  Percent,
  Sliders,
  FolderClosed,
  HelpCircle,
  Tag,
  Check,
  DollarSign,
  X,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import AddItemDrawer from "./AddItemDrawer";
import {
  getCategoryItemCount,
  MenuManagementProvider,
  useMenuManagement,
} from "./context/MenuManagementContext";

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#f59e0b", // Orange
  "#ec4899", // Pink
  "#ef4444", // Red
  "#0f172a", // Dark Slate
];

function MenuManagementContent() {
  const [activeTab, setActiveTab] = useState<
    "items" | "categories" | "deals" | "variations" | "addons" | "groups"
  >("items");

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    categories,
    items,
    selectedCategoryId,
    newCategoryName,
    newCategoryColor,
    toastMessage,
    setNewCategoryName,
    setNewCategoryColor,
    createCategory,
    openAddDrawer,
    openEditDrawer,
    deleteItem,
    toggleItemActive,
    filterItemsByCategory,
    toggleCategoryActive,
    saveCategory,

    // Phase 2 & 3 Hooks
    variationGroups,
    addonGroups,
    selectableGroups,
    deals,
    loadModifiersAndDeals,
    createVariationGroup,
    updateVariationGroup,
    deleteVariationGroup,
    assignVariationGroup,
    createAddonGroup,
    updateAddonGroup,
    deleteAddonGroup,
    assignAddonGroup,
    createSelectableGroup,
    updateSelectableGroup,
    deleteSelectableGroup,
    createDeal,
    updateDeal,
    deleteDeal,
  } = useMenuManagement();

  useEffect(() => {
    if (["variations", "addons", "groups", "deals"].includes(activeTab)) {
      loadModifiersAndDeals();
    }
  }, [activeTab]);

  // Inline forms states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openModalType, setOpenModalType] = useState<"variations" | "addons" | "groups" | "deals" | null>(null);

  // Premium Filtering engine states
  const [filterItemId, setFilterItemId] = useState<string>("");

  const [varFilterCategoryId, setVarFilterCategoryId] = useState<string>("");
  const [varFilterItemId, setVarFilterItemId] = useState<string>("");

  const [addonFilterCategoryId, setAddonFilterCategoryId] = useState<string>("");
  const [addonFilterItemId, setAddonFilterItemId] = useState<string>("");

  const [poolFilterDealId, setPoolFilterDealId] = useState<string>("");

  const [dealFilterCategoryId, setDealFilterCategoryId] = useState<string>("");
  const [dealFilterItemId, setDealFilterItemId] = useState<string>("");

  // Category Edit states and handlers
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [selectedCategoryVgs, setSelectedCategoryVgs] = useState<string[]>([]);
  const [selectedCategoryAds, setSelectedCategoryAds] = useState<string[]>([]);

  const handleStartEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color || "");

    // Find assigned variation groups
    const activeVgs = variationGroups
      .filter((vg) => vg.categories?.some((c: any) => c.categoryId === category.id))
      .map((vg) => vg.id);

    // Find assigned addon groups
    const activeAds = addonGroups
      .filter((ag) => ag.categories?.some((c: any) => c.categoryId === category.id))
      .map((ag) => ag.id);

    setSelectedCategoryVgs(activeVgs);
    setSelectedCategoryAds(activeAds);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setNewCategoryName("");
    setNewCategoryColor("");
    setSelectedCategoryVgs([]);
    setSelectedCategoryAds([]);
  };

  const handleSaveCategorySubmit = async () => {
    if (!editingCategoryId || !newCategoryName.trim()) return;
    const success = await saveCategory(
      editingCategoryId,
      newCategoryName,
      newCategoryColor,
      selectedCategoryVgs,
      selectedCategoryAds,
    );
    if (success) {
      handleCancelEditCategory();
    }
  };
  
  // Variations form
  const [varFormName, setVarFormName] = useState("");
  const [varFormOptions, setVarFormOptions] = useState<{ name: string; price: string }[]>([
    { name: "", price: "" }
  ]);

  // Addons form
  const [addonFormName, setAddonFormName] = useState("");
  const [addonFormOptions, setAddonFormOptions] = useState<{ name: string; price: string }[]>([
    { name: "", price: "" }
  ]);

  // Groups form
  const [groupFormName, setGroupFormName] = useState("");
  const [groupFormMin, setGroupFormMin] = useState("1");
  const [groupFormMax, setGroupFormMax] = useState("1");
  const [groupFormRequired, setGroupFormRequired] = useState(true);
  const [groupFormSelectedItems, setGroupFormSelectedItems] = useState<{ itemId: string; priceOverride: string }[]>([]);

  // Deals form
  const [dealFormName, setDealFormName] = useState("");
  const [dealFormDesc, setDealFormDesc] = useState("");
  const [dealFormPrice, setDealFormPrice] = useState("");
  const [dealFormColor, setDealFormColor] = useState("#f59e0b");
  const [dealFormShortcode, setDealFormShortcode] = useState("");
  const [dealFormSelectedGroups, setDealFormSelectedGroups] = useState<string[]>([]);
  const [dealFormSelectedAddons, setDealFormSelectedAddons] = useState<string[]>([]);



  const resetForms = () => {
    setEditingId(null);
    setVarFormName("");
    setVarFormOptions([{ name: "", price: "" }]);
    setAddonFormName("");
    setAddonFormOptions([{ name: "", price: "" }]);
    setGroupFormName("");
    setGroupFormMin("1");
    setGroupFormMax("1");
    setGroupFormRequired(true);
    setGroupFormSelectedItems([]);
    setDealFormName("");
    setDealFormDesc("");
    setDealFormPrice("");
    setDealFormColor("#f59e0b");
    setDealFormShortcode("");
    setDealFormSelectedGroups([]);
    setDealFormSelectedAddons([]);
    setOpenModalType(null);
  };

  const handleSaveVarGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varFormName.trim()) return;
    
    const optionsDto = varFormOptions
      .filter(o => o.name.trim())
      .map((o, idx) => ({
        name: o.name.trim(),
        priceInCents: Math.round(parseFloat(o.price || "0") * 100),
        sortOrder: idx,
      }));

    const payload = {
      name: varFormName.trim(),
      type: "SINGLE",
      options: optionsDto,
    };

    if (editingId) {
      await updateVariationGroup(editingId, payload);
    } else {
      await createVariationGroup(payload);
    }
    resetForms();
  };

  const handleSaveAddonGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonFormName.trim()) return;

    const addonsDto = addonFormOptions
      .filter(a => a.name.trim())
      .map((a, idx) => ({
        name: a.name.trim(),
        priceInCents: Math.round(parseFloat(a.price || "0") * 100),
        sortOrder: idx,
      }));

    const payload = {
      name: addonFormName.trim(),
      selectionType: "MULTIPLE",
      addons: addonsDto,
    };

    if (editingId) {
      await updateAddonGroup(editingId, payload);
    } else {
      await createAddonGroup(payload);
    }
    resetForms();
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormName.trim()) return;

    const payload = {
      name: groupFormName.trim(),
      minSelect: parseInt(groupFormMin || "1"),
      maxSelect: parseInt(groupFormMax || "1"),
      required: groupFormRequired,
      items: groupFormSelectedItems.map(it => ({
        menuItemId: it.itemId,
        priceOverrideInCents: it.priceOverride ? Math.round(parseFloat(it.priceOverride) * 100) : null,
      })),
    };

    if (editingId) {
      await updateSelectableGroup(editingId, payload);
    } else {
      await createSelectableGroup(payload);
    }
    resetForms();
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealFormName.trim()) return;

    const payload = {
      name: dealFormName.trim(),
      description: dealFormDesc.trim(),
      priceInCents: Math.round(parseFloat(dealFormPrice || "0") * 100),
      color: dealFormColor,
      shortcode: dealFormShortcode.trim() || undefined,
      isActive: true,
      groups: dealFormSelectedGroups.map((gId, idx) => ({
        menuGroupId: gId,
        sortOrder: idx,
      })),
      addonGroups: dealFormSelectedAddons.map(aId => ({
        addonGroupId: aId,
      })),
    };

    if (editingId) {
      await updateDeal(editingId, payload);
    } else {
      await createDeal(payload);
    }
    resetForms();
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Page Title & Add New Item Button */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-[32px] font-black text-[#0c1424] tracking-tight">
            Advanced Menu Engine
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Configure multi-channel visibility, modifiers, deals, and colors.
          </p>
        </div>

        {activeTab === "items" && (
          <button
            onClick={openAddDrawer}
            className="h-12 px-8 rounded-full bg-[#0c1424] text-white text-[13px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 w-fit"
          >
            <Plus size={18} />
            Add New Item
          </button>
        )}
      </div>

      {/* Top Horizontal Submenu (Navigation Tabs) */}
      <div className="bg-white rounded-[24px] p-2 border border-slate-100 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActiveTab("items");
            resetForms();
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "items"
              ? "bg-[#0c1424] text-white shadow-md shadow-black/15"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers size={14} />
          <span>Menu Items</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "items" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {items.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("categories");
            resetForms();
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "categories"
              ? "bg-[#0c1424] text-white shadow-md shadow-black/15"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Grid size={14} />
          <span>Categories</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "categories" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("variations");
            resetForms();
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "variations"
              ? "bg-[#0c1424] text-white shadow-md shadow-black/15"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Sliders size={14} />
          <span>Variations</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "variations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {variationGroups.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("addons");
            resetForms();
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "addons"
              ? "bg-[#0c1424] text-white shadow-md shadow-black/15"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Tag size={14} />
          <span>Add-ons / Toppings</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "addons" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {addonGroups.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("groups");
            resetForms();
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "groups"
              ? "bg-[#0c1424] text-white shadow-md shadow-black/15"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FolderClosed size={14} />
          <span>Selectable Groups</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "groups" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {selectableGroups.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("deals");
            resetForms();
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "deals"
              ? "bg-[#0c1424] text-white shadow-md shadow-black/15"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Percent size={14} />
          <span>Deals & Combos</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "deals" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {deals.length}
          </span>
        </button>
      </div>

      {activeTab === "items" && (() => {
        const selectedItemParentCategory = filterItemId
          ? items.find((i) => i.id === filterItemId)?.categoryId
          : null;

        return (
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column Sidebar: Filters */}
            <div className="col-span-12 md:col-span-3 flex flex-col gap-4 sticky top-6">
              {/* Specific Menu Item Filter Card */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col gap-2">
                <div className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Search Menu Item
                </div>
                <div className="relative">
                  <select
                    value={filterItemId}
                    onChange={(e) => {
                      setFilterItemId(e.target.value);
                      if (e.target.value) {
                        filterItemsByCategory("all");
                      }
                    }}
                    className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- All Products / Dishes --</option>
                    {items.map(it => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={12} />
                  </div>
                </div>
                {filterItemId && (
                  <button
                    onClick={() => setFilterItemId("")}
                    className="h-8 w-full rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                  >
                    <X size={11} /> Clear Filter
                  </button>
                )}
              </div>

              {/* Category Filter Cards */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col gap-1">
                <div className="px-1.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Category Filters
                </div>

                <button
                  onClick={() => filterItemsByCategory("all")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                    selectedCategoryId === "all"
                      ? "bg-[#0c1424] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Layers size={13} />
                  <span>All Items</span>
                  <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    selectedCategoryId === "all" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {items.length}
                  </span>
                </button>

                {categories.map((category) => {
                  const isParentCat = selectedItemParentCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => filterItemsByCategory(category.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                        selectedCategoryId === category.id
                          ? "bg-[#0c1424] text-white shadow-sm animate-in fade-in"
                          : isParentCat
                          ? "bg-amber-500/10 text-amber-700 border border-amber-400/30 animate-pulse"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-white shrink-0 shadow-sm"
                        style={{ backgroundColor: category.color || "#cbd5e1" }}
                      />
                      <span className="truncate max-w-[110px]">{category.name}</span>
                      {isParentCat && (
                        <span className="text-[8px] font-black tracking-wider uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-md ml-1 shrink-0">
                          PARENT
                        </span>
                      )}
                      <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                        selectedCategoryId === category.id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {getCategoryItemCount(items, category.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

        {/* Right Column Content: Categorized scroll items grid */}
        <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
              <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">No items found</h3>
                <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                  Create some products or adjust active category filters to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {selectedCategoryId === "all" ? (
                <>
                  {categories.map((category) => {
                    const categoryItems = items
                      .filter((item) => item.categoryId === category.id)
                      .filter((item) => !filterItemId || item.id === filterItemId);
                    if (categoryItems.length === 0) return null;
                    return (
                      <div key={category.id} className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white shrink-0 shadow-md"
                            style={{ backgroundColor: category.color || "#cbd5e1" }}
                          />
                          <h3 className="text-sm font-black text-[#0c1424] uppercase tracking-wider">
                            {category.name}
                          </h3>
                          <span className="text-xs font-bold text-slate-400">
                            ({categoryItems.length} items)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group relative"
                              style={{ borderTop: item.color ? `4px solid ${item.color}` : '1px solid #f1f5f9' }}
                            >
                              <div className="p-5 flex flex-col gap-4 h-full">
                                <div className="flex gap-4 items-start">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-inner"
                                    />
                                  ) : (
                                    <div
                                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-black text-white shadow-inner"
                                      style={{ backgroundColor: item.color || "#cbd5e1" }}
                                    >
                                      {item.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-[#0c1424] text-[15px] truncate leading-snug">
                                      {item.name}
                                    </h4>
                                    <span className="inline-block mt-1 text-slate-900 font-extrabold text-sm">
                                      ${item.price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                {item.description && (
                                  <p className="text-[12px] font-medium text-slate-400 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}

                                {item.shortcode && (
                                  <div className="flex items-center gap-1.5 mt-auto">
                                    <span className="text-[9px] font-black tracking-widest text-[#0c1424] uppercase bg-[#0c1424]/5 px-2 py-0.5 rounded-md border border-[#0c1424]/10">
                                      CODE: {item.shortcode}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleItemActive(item.id)}
                                      className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                                        item.isActive ? "bg-emerald-500" : "bg-slate-200"
                                      }`}
                                    >
                                      <div
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                                          item.isActive ? "translate-x-4" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                    <span className="text-[11px] font-bold text-slate-500">
                                      {item.isActive ? "Active" : "Disabled"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditDrawer(item.id)}
                                      className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                                      className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                   {/* Uncategorized section */}
                   {items.filter(it => (!it.categoryId || !categories.some(c => c.id === it.categoryId)) && (!filterItemId || it.id === filterItemId)).length > 0 && (
                     <div className="space-y-4">
                       <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                         <div className="w-3.5 h-3.5 rounded-full border border-white shrink-0 bg-slate-300 shadow-md" />
                         <h3 className="text-sm font-black text-[#0c1424] uppercase tracking-wider">
                           Uncategorized Items
                         </h3>
                         <span className="text-xs font-bold text-slate-400">
                           ({items.filter(it => (!it.categoryId || !categories.some(c => c.id === it.categoryId)) && (!filterItemId || it.id === filterItemId)).length} items)
                         </span>
                       </div>
 
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                         {items
                           .filter(it => (!it.categoryId || !categories.some(c => c.id === it.categoryId)) && (!filterItemId || it.id === filterItemId))
                          .map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group relative"
                              style={{ borderTop: item.color ? `4px solid ${item.color}` : '1px solid #f1f5f9' }}
                            >
                              <div className="p-5 flex flex-col gap-4 h-full">
                                <div className="flex gap-4 items-start">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-inner"
                                    />
                                  ) : (
                                    <div
                                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-black text-white shadow-inner"
                                      style={{ backgroundColor: item.color || "#cbd5e1" }}
                                    >
                                      {item.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-[#0c1424] text-[15px] truncate leading-snug">
                                      {item.name}
                                    </h4>
                                    <span className="inline-block mt-1 text-slate-900 font-extrabold text-sm">
                                      ${item.price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                {item.description && (
                                  <p className="text-[12px] font-medium text-slate-400 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}

                                {item.shortcode && (
                                  <div className="flex items-center gap-1.5 mt-auto">
                                    <span className="text-[9px] font-black tracking-widest text-[#0c1424] uppercase bg-[#0c1424]/5 px-2 py-0.5 rounded-md border border-[#0c1424]/10">
                                      CODE: {item.shortcode}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleItemActive(item.id)}
                                      className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                                        item.isActive ? "bg-emerald-500" : "bg-slate-200"
                                      }`}
                                    >
                                      <div
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                                          item.isActive ? "translate-x-4" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                    <span className="text-[11px] font-bold text-slate-500">
                                      {item.isActive ? "Active" : "Disabled"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditDrawer(item.id)}
                                      className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                                      className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Single category view */
                categories
                  .filter((c) => c.id === selectedCategoryId)
                  .map((category) => {
                    const categoryItems = items
                      .filter((item) => item.categoryId === category.id)
                      .filter((item) => !filterItemId || item.id === filterItemId);
                    return (
                      <div key={category.id} className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white shrink-0 shadow-md"
                            style={{ backgroundColor: category.color || "#cbd5e1" }}
                          />
                          <h3 className="text-sm font-black text-[#0c1424] uppercase tracking-wider">
                            {category.name}
                          </h3>
                          <span className="text-xs font-bold text-slate-400">
                            ({categoryItems.length} items)
                          </span>
                        </div>

                        {categoryItems.length === 0 ? (
                          <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                              <HelpCircle size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800">No items found</h3>
                              <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                                This category does not have any items yet. Create or assign items here!
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                            {categoryItems.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group relative"
                                style={{ borderTop: item.color ? `4px solid ${item.color}` : '1px solid #f1f5f9' }}
                              >
                                <div className="p-5 flex flex-col gap-4 h-full">
                                  <div className="flex gap-4 items-start">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-inner"
                                      />
                                    ) : (
                                      <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-black text-white shadow-inner"
                                        style={{ backgroundColor: item.color || "#cbd5e1" }}
                                      >
                                        {item.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-black text-[#0c1424] text-[15px] truncate leading-snug">
                                        {item.name}
                                      </h4>
                                      <span className="inline-block mt-1 text-slate-900 font-extrabold text-sm">
                                        ${item.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {item.description && (
                                    <p className="text-[12px] font-medium text-slate-400 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}

                                  {item.shortcode && (
                                    <div className="flex items-center gap-1.5 mt-auto">
                                      <span className="text-[9px] font-black tracking-widest text-[#0c1424] uppercase bg-[#0c1424]/5 px-2 py-0.5 rounded-md border border-[#0c1424]/10">
                                        CODE: {item.shortcode}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleItemActive(item.id)}
                                        className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                                          item.isActive ? "bg-emerald-500" : "bg-slate-200"
                                        }`}
                                      >
                                        <div
                                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                                            item.isActive ? "translate-x-4" : "translate-x-0"
                                          }`}
                                        />
                                      </button>
                                      <span className="text-[11px] font-bold text-slate-500">
                                        {item.isActive ? "Active" : "Disabled"}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openEditDrawer(item.id)}
                                        className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                                        className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </div>
    );
  })()}

      {activeTab !== "items" && (
        <div className="w-full">
          {/* TABS 2: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="flex flex-col gap-6">
              {/* Category creation panel */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[#0c1424] text-[18px]">
                    {editingCategoryId ? `Modify Category: ${categories.find(c => c.id === editingCategoryId)?.name || ""}` : "Create Custom Category"}
                  </h3>
                  {editingCategoryId && (
                    <button
                      onClick={handleCancelEditCategory}
                      className="text-xs font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <X size={12} />
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category Name (e.g., Woodfired Pizza)"
                    className="h-12 flex-1 min-w-[200px] border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />

                  {/* Preset color theme selector */}
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-200/50">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          newCategoryColor === color ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {newCategoryColor === color && (
                          <Check size={12} className="text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={editingCategoryId ? handleSaveCategorySubmit : createCategory}
                    disabled={!newCategoryName.trim()}
                    className="h-12 px-6 rounded-xl bg-[#0c1424] text-white font-black text-xs uppercase tracking-wider hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {editingCategoryId ? "Save Category" : "Add Category"}
                  </button>
                </div>

                {/* Direct category default modifier checklists */}
                {editingCategoryId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 pt-4 border-t border-slate-50 animate-in fade-in duration-300">
                    {/* Default variation groups */}
                    <div className="flex flex-col gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Default Variation Groups for Category
                      </span>
                      {variationGroups.length === 0 ? (
                        <span className="text-xs text-slate-400 font-medium">No Variation Groups created yet.</span>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {variationGroups.map((vg) => {
                            const isChecked = selectedCategoryVgs.includes(vg.id);
                            return (
                              <button
                                key={vg.id}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedCategoryVgs(selectedCategoryVgs.filter(id => id !== vg.id));
                                  } else {
                                    setSelectedCategoryVgs([...selectedCategoryVgs, vg.id]);
                                  }
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                  isChecked
                                    ? "bg-[#0c1424] text-white border-[#0c1424] shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{vg.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Default addon groups */}
                    <div className="flex flex-col gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Default Addon Groups for Category
                      </span>
                      {addonGroups.length === 0 ? (
                        <span className="text-xs text-slate-400 font-medium">No Addon Groups created yet.</span>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {addonGroups.map((ag) => {
                            const isChecked = selectedCategoryAds.includes(ag.id);
                            return (
                              <button
                                key={ag.id}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedCategoryAds(selectedCategoryAds.filter(id => id !== ag.id));
                                  } else {
                                    setSelectedCategoryAds([...selectedCategoryAds, ag.id]);
                                  }
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                  isChecked
                                    ? "bg-[#0c1424] text-white border-[#0c1424] shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{ag.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Categories listing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  return (
                    <div
                      key={category.id}
                      className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all relative animate-in fade-in duration-300"
                      style={{ borderTop: category.color ? `4px solid ${category.color}` : '1px solid #f1f5f9' }}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className="truncate flex-1 pr-2">
                          <h3 className="font-black text-[#0c1424] text-[16px] truncate leading-tight">
                            {category.name}
                          </h3>
                          <span className="text-xs font-bold text-slate-400 block mt-1">
                            {getCategoryItemCount(items, category.id)} items registered
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(category)}
                          className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all shrink-0 hover:border-blue-100"
                          title="Edit Category Details & Modifiers"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCategoryActive(category.id)}
                            className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
                              category.isActive ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                                category.isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-[11px] font-bold text-slate-500">
                            {category.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABS 3: VARIATIONS */}
          {activeTab === "variations" && (() => {
            const filteredVariationGroups = variationGroups.filter((vg) => {
              if (varFilterCategoryId) {
                const isLinkedToCategory = vg.categories?.some((c: any) => c.categoryId === varFilterCategoryId);
                if (!isLinkedToCategory) return false;
              }
              if (varFilterItemId) {
                const isLinkedToItem = vg.items?.some((i: any) => i.menuItemId === varFilterItemId);
                if (!isLinkedToItem) return false;
              }
              return true;
            });

            return (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Header card with create button */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-black text-[#0c1424] text-[18px]">Size Variations</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Configure sizing groups and price surcharges for products.</p>
                  </div>
                  <button
                    onClick={() => {
                      resetForms();
                      setOpenModalType("variations");
                    }}
                    className="h-11 px-6 rounded-xl bg-[#0c1424] text-white text-[13px] font-black uppercase tracking-wider shadow-lg shadow-black/10 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Variation Group
                  </button>
                </div>

                {/* Premium Search & Filter Panel */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Category</label>
                    <div className="relative">
                      <select
                        value={varFilterCategoryId}
                        onChange={(e) => setVarFilterCategoryId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- All Categories --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Linked Menu Item</label>
                    <div className="relative">
                      <select
                        value={varFilterItemId}
                        onChange={(e) => setVarFilterItemId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- All Menu Items --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>{it.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Groups listing list */}
                {filteredVariationGroups.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 font-black">No variations match filters</h3>
                      <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                        Try selecting another Category or Menu Item.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredVariationGroups.map((g) => (
                  <div key={g.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-[#0c1424] text-[16px]">{g.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                          Size Selection Group • {g.options.length} Options
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(g.id);
                            setVarFormName(g.name);
                            setVarFormOptions(g.options.map((o: any) => ({ name: o.name, price: (o.priceInCents / 100).toString() })));
                            setOpenModalType("variations");
                          }}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteVariationGroup(g.id)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {g.options.map((o: any) => (
                        <span key={o.id} className="text-xs font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-600">
                          {o.name} (+${(o.priceInCents / 100).toFixed(2)})
                        </span>
                      ))}
                    </div>

                    {/* Reverse Links visualization */}
                    {(() => {
                      const linkedCats = g.categories?.map((c: any) => categories.find((cat) => cat.id === c.categoryId)?.name).filter(Boolean);
                      const linkedIts = g.menuItems?.map((mi: any) => items.find((it) => it.id === mi.menuItemId)?.name).filter(Boolean);
                      
                      if ((linkedCats && linkedCats.length > 0) || (linkedIts && linkedIts.length > 0)) {
                        return (
                          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 flex flex-col gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Linked Collections</span>
                            
                            {linkedCats && linkedCats.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">Categories:</span>
                                {linkedCats.map((catName: string, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 font-black px-2 py-0.5 rounded-full border border-blue-100/50">
                                    {catName}
                                  </span>
                                ))}
                              </div>
                            )}

                            {linkedIts && linkedIts.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">Items:</span>
                                {linkedIts.map((itemName: string, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-[#0c1424]/5 text-[#0c1424] font-black px-2 py-0.5 rounded-full border border-slate-200/50">
                                    {itemName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="text-[10px] text-slate-400 font-bold italic mt-1">
                          Not currently linked to any Category or Menu Item.
                        </div>
                      );
                    })()}

                    {/* Quick Assignment Binders */}
                    <div className="border-t border-slate-50 pt-4 flex flex-col gap-2">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fast-Link Assignment</div>
                      <div className="flex gap-2">
                        <select
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val) {
                              await assignVariationGroup(g.id, undefined, val);
                              e.target.value = "";
                            }
                          }}
                          className="flex-1 h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 px-2 bg-slate-50/50"
                        >
                          <option value="">Link Category Default...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <select
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val) {
                              await assignVariationGroup(g.id, val, undefined);
                              e.target.value = "";
                            }
                          }}
                          className="flex-1 h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 px-2 bg-slate-50/50"
                        >
                          <option value="">Link MenuItem Override...</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

          {/* TABS 4: ADDONS */}
          {activeTab === "addons" && (() => {
            const filteredAddonGroups = addonGroups.filter((ag) => {
              if (addonFilterCategoryId) {
                const isLinkedToCategory = ag.categories?.some((c: any) => c.categoryId === addonFilterCategoryId);
                if (!isLinkedToCategory) return false;
              }
              if (addonFilterItemId) {
                const isLinkedToItem = ag.items?.some((i: any) => i.menuItemId === addonFilterItemId);
                if (!isLinkedToItem) return false;
              }
              return true;
            });

            return (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Header card with create button */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-black text-[#0c1424] text-[18px]">Toppings & Add-ons</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Configure toppings, optional side upgrades, and custom pricing modifiers.</p>
                  </div>
                  <button
                    onClick={() => {
                      resetForms();
                      setOpenModalType("addons");
                    }}
                    className="h-11 px-6 rounded-xl bg-[#0c1424] text-white text-[13px] font-black uppercase tracking-wider shadow-lg shadow-black/10 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Topping Group
                  </button>
                </div>

                {/* Premium Search & Filter Panel */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Category</label>
                    <div className="relative">
                      <select
                        value={addonFilterCategoryId}
                        onChange={(e) => setAddonFilterCategoryId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- All Categories --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Linked Menu Item</label>
                    <div className="relative">
                      <select
                        value={addonFilterItemId}
                        onChange={(e) => setAddonFilterItemId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- All Menu Items --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>{it.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Addons List */}
                {filteredAddonGroups.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 font-black">No toppings match filters</h3>
                      <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                        Try selecting another Category or Menu Item.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAddonGroups.map((g) => (
                  <div key={g.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-[#0c1424] text-[16px]">{g.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                          Addon Topping Group • {g.addons.length} Choices
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(g.id);
                            setAddonFormName(g.name);
                            setAddonFormOptions(g.addons.map((a: any) => ({ name: a.name, price: (a.priceInCents / 100).toString() })));
                            setOpenModalType("addons");
                          }}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteAddonGroup(g.id)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {g.addons.map((a: any) => (
                        <span key={a.id} className="text-xs font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-600">
                          {a.name} (+${(a.priceInCents / 100).toFixed(2)})
                        </span>
                      ))}
                    </div>

                    {/* Reverse Links visualization */}
                    {(() => {
                      const linkedCats = g.categories?.map((c: any) => categories.find((cat) => cat.id === c.categoryId)?.name).filter(Boolean);
                      const linkedIts = g.menuItems?.map((mi: any) => items.find((it) => it.id === mi.menuItemId)?.name).filter(Boolean);
                      
                      if ((linkedCats && linkedCats.length > 0) || (linkedIts && linkedIts.length > 0)) {
                        return (
                          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 flex flex-col gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Linked Collections</span>
                            
                            {linkedCats && linkedCats.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">Categories:</span>
                                {linkedCats.map((catName: string, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 font-black px-2 py-0.5 rounded-full border border-blue-100/50">
                                    {catName}
                                  </span>
                                ))}
                              </div>
                            )}

                            {linkedIts && linkedIts.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">Items:</span>
                                {linkedIts.map((itemName: string, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-[#0c1424]/5 text-[#0c1424] font-black px-2 py-0.5 rounded-full border border-slate-200/50">
                                    {itemName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="text-[10px] text-slate-400 font-bold italic mt-1">
                          Not currently linked to any Category or Menu Item.
                        </div>
                      );
                    })()}

                    <div className="border-t border-slate-50 pt-4 flex flex-col gap-2">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fast-Link Assignment</div>
                      <div className="flex gap-2">
                        <select
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val) {
                              await assignAddonGroup(g.id, undefined, val);
                              e.target.value = "";
                            }
                          }}
                          className="flex-1 h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 px-2 bg-slate-50/50"
                        >
                          <option value="">Link Category Default...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <select
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val) {
                              await assignAddonGroup(g.id, val, undefined);
                              e.target.value = "";
                            }
                          }}
                          className="flex-1 h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 px-2 bg-slate-50/50"
                        >
                          <option value="">Link MenuItem Override...</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

          {/* TABS 5: SELECTABLE GROUPS */}
          {activeTab === "groups" && (() => {
            const filteredSelectableGroups = selectableGroups.filter((sg) => {
              if (poolFilterDealId) {
                const selectedDeal = deals.find(d => d.id === poolFilterDealId);
                if (!selectedDeal) return true;
                const isPartofDeal = selectedDeal.groups?.some((dg: any) => dg.menuGroupId === sg.id);
                if (!isPartofDeal) return false;
              }
              return true;
            });

            return (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Header card with create button */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-black text-[#0c1424] text-[18px]">Selectable Pools</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Configure item choices pools (e.g. burgers, drinks, side dishes) and price overrides for combo deals.</p>
                  </div>
                  <button
                    onClick={() => {
                      resetForms();
                      setOpenModalType("groups");
                    }}
                    className="h-11 px-6 rounded-xl bg-[#0c1424] text-white text-[13px] font-black uppercase tracking-wider shadow-lg shadow-black/10 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Menu Pool
                  </button>
                </div>

                {/* Premium Search & Filter Panel */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Combo Deal Package</label>
                  <div className="relative">
                    <select
                      value={poolFilterDealId}
                      onChange={(e) => setPoolFilterDealId(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- All Combo Deal Packages --</option>
                      {deals.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>

                {/* Groups listing list */}
                {filteredSelectableGroups.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 font-black">No selectable pools match filters</h3>
                      <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                        Try selecting another Combo Deal.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSelectableGroups.map((g) => (
                  <div key={g.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-[#0c1424] text-[16px]">{g.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                          Pooled Item Group • {g.items.length} Products • {g.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(g.id);
                            setGroupFormName(g.name);
                            setGroupFormMin(g.minSelect.toString());
                            setGroupFormMax(g.maxSelect.toString());
                            setGroupFormRequired(g.required);
                            setGroupFormSelectedItems(g.items.map((gi: any) => ({
                              itemId: gi.menuItem.id,
                              priceOverride: gi.priceOverrideInCents !== null ? (gi.priceOverrideInCents / 100).toString() : "",
                            })));
                            setOpenModalType("groups");
                          }}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteSelectableGroup(g.id)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      {g.items.map((gi: any) => (
                        <div key={gi.menuItem.id} className="text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-600 flex justify-between">
                          <span>{gi.menuItem.name}</span>
                          <span className="text-indigo-600 font-extrabold">
                            {gi.priceOverrideInCents !== null ? `+$${(gi.priceOverrideInCents/100).toFixed(2)} override` : "default price"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

          {/* TABS 6: DEALS */}
          {activeTab === "deals" && (() => {
            const filteredDeals = deals.filter((deal) => {
              if (dealFilterCategoryId) {
                const containsCategoryItem = deal.groups?.some((dg: any) => {
                  const pool = selectableGroups.find(p => p.id === dg.menuGroupId);
                  return pool?.items?.some((gi: any) => gi.menuItem?.categoryId === dealFilterCategoryId);
                });
                if (!containsCategoryItem) return false;
              }
              if (dealFilterItemId) {
                const containsSpecificItem = deal.groups?.some((dg: any) => {
                  const pool = selectableGroups.find(p => p.id === dg.menuGroupId);
                  return pool?.items?.some((gi: any) => gi.menuItemId === dealFilterItemId);
                });
                if (!containsSpecificItem) return false;
              }
              return true;
            });

            return (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Header card with create button */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-black text-[#0c1424] text-[18px]">Combo Deals & Packages</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Design multi-tier custom combo packages with stepping selection pools and addon options.</p>
                  </div>
                  <button
                    onClick={() => {
                      resetForms();
                      setOpenModalType("deals");
                    }}
                    className="h-11 px-6 rounded-xl bg-[#0c1424] text-white text-[13px] font-black uppercase tracking-wider shadow-lg shadow-black/10 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Combo Deal
                  </button>
                </div>

                {/* Premium Search & Filter Panel */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Category of Choices</label>
                    <div className="relative">
                      <select
                        value={dealFilterCategoryId}
                        onChange={(e) => setDealFilterCategoryId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- All Choice Categories --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter by Specific Choice Item</label>
                    <div className="relative">
                      <select
                        value={dealFilterItemId}
                        onChange={(e) => setDealFilterItemId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 pl-2.5 pr-8 bg-slate-50/50 focus:outline-none focus:border-[#0c1424] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- All Choice Menu Items --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>{it.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deals Listing list */}
                {filteredDeals.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 font-black">No combo deals match filters</h3>
                      <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
                        Try selecting another category or product.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredDeals.map((deal) => (
                  <div key={deal.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4" style={{ borderTop: `4px solid ${deal.color || '#f59e0b'}` }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-[#0c1424] text-[16px]">{deal.name}</h4>
                        <span className="text-[12px] font-extrabold text-amber-600 mt-1 block">
                          Base Price: ${(deal.priceInCents/100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(deal.id);
                            setDealFormName(deal.name);
                            setDealFormDesc(deal.description || "");
                            setDealFormPrice((deal.priceInCents/100).toString());
                            setDealFormColor(deal.color || "#f59e0b");
                            setDealFormShortcode(deal.shortcode || "");
                            setDealFormSelectedGroups(deal.groups.map((g: any) => g.menuGroupId));
                            setDealFormSelectedAddons(deal.addonGroups.map((a: any) => a.addonGroupId));
                            setOpenModalType("deals");
                          }}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-500"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteDeal(deal.id)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-rose-50 flex items-center justify-center text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {deal.description && (
                      <p className="text-xs font-medium text-slate-400 leading-normal">{deal.description}</p>
                    )}

                    <div className="flex flex-col gap-1.5 border-t border-slate-50 pt-3">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Step Groups & Upgrades</div>
                      <div className="flex flex-wrap gap-1.5">
                        {deal.groups.map((g: any) => (
                          <span key={g.id} className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100/50 flex items-center gap-1">
                            <Layers size={10} /> Step: {g.menuGroup.name}
                          </span>
                        ))}
                        {deal.addonGroups.map((a: any) => (
                          <span key={a.id} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100/50 flex items-center gap-1">
                            <Tag size={10} /> Upgrade: {a.addonGroup.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
        </div>
      )}

      {/* ----------------- MODIFIER & DEALS CREATOR MODALS ----------------- */}
      {openModalType && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/45 backdrop-blur-sm"
            onClick={resetForms}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-[#0c1424]">
                {openModalType === "variations" && (editingId ? "Modify Size Variation Group" : "Create Size Variation Group")}
                {openModalType === "addons" && (editingId ? "Modify Toppings & Addons Group" : "Create Toppings & Addons Group")}
                {openModalType === "groups" && (editingId ? "Modify Menu Choice Pool" : "Create Selectable Choices Pool")}
                {openModalType === "deals" && (editingId ? "Modify Combo Deal Package" : "Build Combo Deal Package")}
              </h3>
              <button
                onClick={resetForms}
                className="h-9 w-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {openModalType === "variations" && (
                <form onSubmit={handleSaveVarGroup} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Group Name</label>
                    <input
                      type="text"
                      value={varFormName}
                      onChange={(e) => setVarFormName(e.target.value)}
                      placeholder="e.g. Pizza Size, Steak Sizing"
                      className="h-12 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all w-full"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Options / Price Surcharges</div>
                    <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1">
                      {varFormOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => {
                              const clone = [...varFormOptions];
                              clone[idx].name = e.target.value;
                              setVarFormOptions(clone);
                            }}
                            placeholder="Option Name (e.g., Large)"
                            className="h-11 flex-1 border border-slate-200 rounded-xl px-4 text-xs font-medium"
                          />
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              step="0.01"
                              value={opt.price}
                              onChange={(e) => {
                                const clone = [...varFormOptions];
                                clone[idx].price = e.target.value;
                                setVarFormOptions(clone);
                              }}
                              placeholder="0.00"
                              className="h-11 w-28 pl-8 pr-4 border border-slate-200 rounded-xl text-xs font-black text-slate-700"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setVarFormOptions(varFormOptions.filter((_, i) => i !== idx))}
                            className="h-11 w-11 rounded-xl border border-rose-100 hover:bg-rose-50 flex items-center justify-center text-rose-500"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setVarFormOptions([...varFormOptions, { name: "", price: "0" }])}
                      className="h-11 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50/50 flex items-center justify-center text-xs font-bold text-slate-500 gap-1.5 mt-1"
                    >
                      <Plus size={14} /> Add Option Value
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={resetForms}
                      className="h-11 px-5 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!varFormName.trim()}
                      className="h-11 px-6 bg-[#0c1424] text-white rounded-xl text-xs font-black uppercase tracking-wide disabled:opacity-50"
                    >
                      {editingId ? "Save Changes" : "Create Variation Group"}
                    </button>
                  </div>
                </form>
              )}

              {openModalType === "addons" && (
                <form onSubmit={handleSaveAddonGroup} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Group Name</label>
                    <input
                      type="text"
                      value={addonFormName}
                      onChange={(e) => setAddonFormName(e.target.value)}
                      placeholder="e.g. Burger Toppings, Extra Sauces"
                      className="h-12 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Addons / Price Surcharges</div>
                    <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1">
                      {addonFormOptions.map((add, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={add.name}
                            onChange={(e) => {
                              const clone = [...addonFormOptions];
                              clone[idx].name = e.target.value;
                              setAddonFormOptions(clone);
                            }}
                            placeholder="Addon Name (e.g., Extra Cheese)"
                            className="h-11 flex-1 border border-slate-200 rounded-xl px-4 text-xs font-medium"
                          />
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              step="0.01"
                              value={add.price}
                              onChange={(e) => {
                                const clone = [...addonFormOptions];
                                clone[idx].price = e.target.value;
                                setAddonFormOptions(clone);
                              }}
                              placeholder="0.00"
                              className="h-11 w-28 pl-8 pr-4 border border-slate-200 rounded-xl text-xs font-black text-slate-700"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddonFormOptions(addonFormOptions.filter((_, i) => i !== idx))}
                            className="h-11 w-11 rounded-xl border border-rose-100 hover:bg-rose-50 flex items-center justify-center text-rose-500"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddonFormOptions([...addonFormOptions, { name: "", price: "0" }])}
                      className="h-11 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50/50 flex items-center justify-center text-xs font-bold text-slate-500 gap-1.5 mt-1"
                    >
                      <Plus size={14} /> Add Addon Topping
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={resetForms}
                      className="h-11 px-5 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!addonFormName.trim()}
                      className="h-11 px-6 bg-[#0c1424] text-white rounded-xl text-xs font-black uppercase tracking-wide disabled:opacity-50"
                    >
                      {editingId ? "Save Changes" : "Create Addon Group"}
                    </button>
                  </div>
                </form>
              )}

              {openModalType === "groups" && (
                <form onSubmit={handleSaveGroup} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Group Title</label>
                      <input
                        type="text"
                        value={groupFormName}
                        onChange={(e) => setGroupFormName(e.target.value)}
                        placeholder="e.g., Choose your Burger"
                        className="h-12 w-full mt-1 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Required</label>
                      <button
                        type="button"
                        onClick={() => setGroupFormRequired(!groupFormRequired)}
                        className={`h-12 w-full mt-1 border-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                          groupFormRequired ? "border-emerald-500 bg-emerald-50/10 text-emerald-600" : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {groupFormRequired ? "Required" : "Optional"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Select pooled products & Set surcharges</label>
                    <div className="max-h-60 overflow-y-auto border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-2.5 font-sans">
                      {items.map((it) => {
                        const match = groupFormSelectedItems.find(x => x.itemId === it.id);
                        return (
                          <div key={it.id} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-50 last:border-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (match) {
                                  setGroupFormSelectedItems(groupFormSelectedItems.filter(x => x.itemId !== it.id));
                                } else {
                                  setGroupFormSelectedItems([...groupFormSelectedItems, { itemId: it.id, priceOverride: "" }]);
                                }
                              }}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                match ? "border-[#0c1424] bg-[#0c1424]" : "border-slate-200"
                              }`}>
                                {match && <Check size={12} className="text-white" />}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{it.name}</span>
                            </button>
                            {match && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-400">Override Price:</span>
                                <div className="relative">
                                  <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={match.priceOverride}
                                    onChange={(e) => {
                                      setGroupFormSelectedItems(groupFormSelectedItems.map(x => x.itemId === it.id ? { ...x, priceOverride: e.target.value } : x));
                                    }}
                                    placeholder="0.00"
                                    className="h-8 w-24 pl-6 pr-2 border border-slate-200 rounded-lg text-xs font-black text-slate-600"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={resetForms}
                      className="h-11 px-5 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!groupFormName.trim()}
                      className="h-11 px-6 bg-[#0c1424] text-white rounded-xl text-xs font-black uppercase tracking-wide disabled:opacity-50"
                    >
                      {editingId ? "Save Changes" : "Create Menu Group"}
                    </button>
                  </div>
                </form>
              )}

              {openModalType === "deals" && (
                <form onSubmit={handleSaveDeal} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Combo Name</label>
                      <input
                        type="text"
                        value={dealFormName}
                        onChange={(e) => setDealFormName(e.target.value)}
                        placeholder="Deal Name (e.g., Super Saver Combo)"
                        className="h-12 w-full mt-1 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Base Combo Price</label>
                      <div className="relative mt-1">
                        <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={dealFormPrice}
                          onChange={(e) => setDealFormPrice(e.target.value)}
                          placeholder="0.00"
                          className="h-12 w-full pl-9 pr-4 border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Short Description</label>
                    <input
                      type="text"
                      value={dealFormDesc}
                      onChange={(e) => setDealFormDesc(e.target.value)}
                      placeholder="Combo marketing text shown in terminal"
                      className="h-12 w-full mt-1 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <label className="text-[11px] font-black uppercase text-[#0c1424] tracking-widest block mb-2">Combo Steps (Selectable pools)</label>
                      <div className="border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                        {selectableGroups.map(g => {
                          const has = dealFormSelectedGroups.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                if (has) {
                                  setDealFormSelectedGroups(dealFormSelectedGroups.filter(x => x !== g.id));
                                } else {
                                  setDealFormSelectedGroups([...dealFormSelectedGroups, g.id]);
                                }
                              }}
                              className="flex items-center gap-3 py-1 text-left"
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                has ? "border-[#0c1424] bg-[#0c1424]" : "border-slate-200"
                              }`}>
                                {has && <Check size={12} className="text-white" />}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{g.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-[#0c1424] tracking-widest block mb-2">Combo Addons (Optional upgrades)</label>
                      <div className="border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                        {addonGroups.map(g => {
                          const has = dealFormSelectedAddons.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                if (has) {
                                  setDealFormSelectedAddons(dealFormSelectedAddons.filter(x => x !== g.id));
                                } else {
                                  setDealFormSelectedAddons([...dealFormSelectedAddons, g.id]);
                                }
                              }}
                              className="flex items-center gap-3 py-1 text-left"
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                has ? "border-[#0c1424] bg-[#0c1424]" : "border-slate-200"
                              }`}>
                                {has && <Check size={12} className="text-white" />}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{g.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={resetForms}
                      className="h-11 px-5 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!dealFormName.trim()}
                      className="h-11 px-6 bg-[#0c1424] text-white rounded-xl text-xs font-black uppercase tracking-wide disabled:opacity-50"
                    >
                      {editingId ? "Save Changes" : "Save Deal Package"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <AddItemDrawer />

      {pendingDelete ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/50 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-[#0c1424]">
              Delete Menu Item?
            </h3>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {pendingDelete.name} will be archived and hidden from active menu
              use.
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              This action is blocked automatically when the item is used in
              active bills.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase tracking-widest text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void deleteItem(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="h-11 rounded-xl bg-rose-600 px-4 text-xs font-black uppercase tracking-widest text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-[#0c1424] px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-black/20">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

export default function MenuManagement() {
  return (
    <MenuManagementProvider>
      <MenuManagementContent />
    </MenuManagementProvider>
  );
}
