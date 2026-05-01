import { ChevronDown, Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import AddItemDrawer from "./AddItemDrawer";
import {
  getCategoryItemCount,
  getCategoryLabel,
  MenuManagementProvider,
  useMenuManagement,
} from "./context/MenuManagementContext";

function MenuManagementContent() {
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const {
    categories,
    items,
    filteredItems,
    selectedCategoryId,
    isCreatingCategory,
    newCategoryName,
    toastMessage,
    setSelectedCategoryId,
    setIsCreatingCategory,
    setNewCategoryName,
    createCategory,
    openAddDrawer,
    openEditDrawer,
    deleteItem,
    toggleItemActive,
    toggleInventory,
    filterItemsByCategory,
    toggleCategoryActive,
  } = useMenuManagement();

  const allCategoryCount = items.length;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[32px] font-black text-[#0c1424] tracking-tight">
            Items in {getCategoryLabel(categories, selectedCategoryId)}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage pricing, availability, and inventory with instant state
            updates.
          </p>
        </div>

        <button
          onClick={openAddDrawer}
          className="h-12 px-8 rounded-full bg-[#0c1424] text-white text-[13px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-black transition-all flex items-center gap-3"
        >
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-lg font-black text-[#0c1424]">Categories</h2>
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategoryId === "all" ? "bg-[#0c1424] text-white" : "bg-blue-50 text-[#5dc7ec]"}`}
              >
                All ({allCategoryCount})
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((category) => {
                const active = selectedCategoryId === category.id;

                return (
                  <div
                    key={category.id}
                    className={`group rounded-2xl border transition-all ${active ? "bg-[#f0f7ff] border-blue-100 ring-2 ring-blue-500/5 shadow-sm" : "bg-white border-transparent hover:bg-slate-50"}`}
                  >
                    <button
                      type="button"
                      onClick={() => filterItemsByCategory(category.id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${active ? "bg-blue-500" : "bg-slate-200"}`}
                        />
                        <div>
                          <div
                            className={`text-[15px] font-bold ${active ? "text-[#0c1424]" : "text-slate-600"}`}
                          >
                            {category.name}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {getCategoryItemCount(items, category.id)} Items
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {category.isActive ? "Active" : "Inactive"}
                      </div>
                    </button>

                    <div className="flex items-center justify-between px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => toggleCategoryActive(category.id)}
                        className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${category.isActive ? "bg-blue-500" : "bg-slate-200"}`}
                        aria-label={`Toggle ${category.name} category`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${category.isActive ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                      <span className="text-[11px] font-bold text-slate-400">
                        Items follow this state in POS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCreatingCategory ? (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  New Category
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g. Breakfast"
                  className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all placeholder:font-medium"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="flex-1 h-11 rounded-xl border border-slate-100 text-[12px] font-black uppercase tracking-widest text-[#0c1424] hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 h-11 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingCategory(true)}
                className="mt-8 h-12 w-full rounded-2xl border border-dashed border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:border-[#0c1424] hover:text-[#0c1424] transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Add New Category
              </button>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="text-left py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">
                    Item Details
                  </th>
                  <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Price (AUD)
                  </th>
                  <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Track Inv
                  </th>
                  <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Active
                  </th>
                  <th className="text-right py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => {
                  const category = categories.find(
                    (entry) => entry.id === item.categoryId,
                  );
                  const effectiveActive =
                    Boolean(category?.isActive) && item.isActive;

                  return (
                    <tr
                      key={item.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-5">
                          {item.image ? (
                            <div className="h-16 w-16 rounded-[20px] overflow-hidden border border-slate-100 shadow-sm shrink-0 bg-slate-50">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[16px] font-black text-[#0c1424] tracking-tight">
                                {item.name}
                              </span>
                              <span className="bg-blue-50 text-[9px] font-black text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {category?.name || "Uncategorized"}
                              </span>
                              {!effectiveActive && (
                                <span className="bg-rose-50 text-[9px] font-black text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[300px] line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="text-[15px] font-black text-[#0c1424]">
                          ${item.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleInventory(item.id)}
                            className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${item.trackInventory ? "bg-blue-500" : "bg-slate-200"}`}
                            aria-label={`Toggle inventory tracking for ${item.name}`}
                          >
                            <div
                              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${item.trackInventory ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleItemActive(item.id)}
                            className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${effectiveActive ? "bg-blue-500" : "bg-slate-200"}`}
                            aria-label={`Toggle active state for ${item.name}`}
                          >
                            <div
                              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${effectiveActive ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDrawer(item.id)}
                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#0c1424] hover:bg-slate-50 transition-all flex items-center justify-center"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({ id: item.id, name: item.name })
                            }
                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-8 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredItems.length} of {items.length} items
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="h-9 w-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>
              <button className="h-9 w-9 rounded-xl bg-[#0c1424] text-white text-xs font-black flex items-center justify-center">
                1
              </button>
              <button className="h-9 w-9 rounded-xl border border-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center justify-center transition-colors">
                2
              </button>
              <button className="h-9 w-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
