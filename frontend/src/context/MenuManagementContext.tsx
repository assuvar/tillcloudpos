import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

export interface MenuCategory {
  id: string;
  name: string;
  isActive: boolean;
  color?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  trackInventory: boolean;
  recipeItems: {
    ingredientId: string;
    ingredientName: string;
    unit: string;
    quantity: number;
  }[];
  isActive: boolean;
  color?: string;
  shortcode?: string;
  visibility?: {
    dineIn: boolean;
    pickup: boolean;
    delivery: boolean;
    inStore: boolean;
    qrOrdering: boolean;
    kiosk: boolean;
    onlineOrdering: boolean;
  };
}

export interface IngredientOption {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  isLowStock: boolean;
}

export interface DrawerRecipeItem {
  ingredientId: string;
  quantity: string;
  unit?: string;
}

export interface DrawerFormState {
  name: string;
  image: string;
  imageFile: File | null;
  price: string;
  categoryId: string;
  description: string;
  trackInventory: boolean;
  recipeItems: DrawerRecipeItem[];
  isActive: boolean;
  color: string;
  shortcode: string;
  visibility: {
    dineIn: boolean;
    pickup: boolean;
    delivery: boolean;
    inStore: boolean;
    qrOrdering: boolean;
    kiosk: boolean;
    onlineOrdering: boolean;
  };
}

type DrawerMode = "add" | "edit";

interface MenuManagementContextType {
  categories: MenuCategory[];
  items: MenuItem[];
  ingredientOptions: IngredientOption[];
  selectedCategoryId: string;
  filteredItems: MenuItem[];
  isCreatingCategory: boolean;
  newCategoryName: string;
  drawerOpen: boolean;
  drawerMode: DrawerMode;
  drawerEditingItemId: string | null;
  drawerForm: DrawerFormState;
  toastMessage: string;
  isLoading: boolean;
  error: string | null;
  setSelectedCategoryId: (categoryId: string) => void;
  setIsCreatingCategory: (value: boolean) => void;
  setNewCategoryName: (value: string) => void;
  newCategoryColor: string;
  setNewCategoryColor: (value: string) => void;
  createCategory: () => Promise<void>;
  openAddDrawer: () => void;
  openEditDrawer: (itemId: string) => void;
  closeDrawer: () => void;
  updateDrawerField: <K extends keyof DrawerFormState>(
    field: K,
    value: DrawerFormState[K],
  ) => void;
  saveDrawerItem: (
    variationGroupIds?: string[],
    addonGroupIds?: string[],
  ) => Promise<boolean>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItemActive: (itemId: string) => Promise<void>;
  toggleInventory: (itemId: string) => Promise<void>;
  filterItemsByCategory: (categoryId: string) => void;
  toggleCategoryActive: (categoryId: string) => Promise<void>;
  saveCategory: (
    id: string,
    name: string,
    color: string,
    variationGroupIds?: string[],
    addonGroupIds?: string[],
  ) => Promise<boolean>;
  loadData: () => Promise<void>;

  variationGroups: any[];
  addonGroups: any[];
  selectableGroups: any[];
  deals: any[];
  loadModifiersAndDeals: () => Promise<void>;
  createVariationGroup: (dto: any) => Promise<void>;
  updateVariationGroup: (id: string, dto: any) => Promise<void>;
  deleteVariationGroup: (id: string) => Promise<void>;
  assignVariationGroup: (id: string, itemId?: string, categoryId?: string) => Promise<void>;
  unassignVariationGroup: (id: string, itemId?: string, categoryId?: string) => Promise<void>;

  createAddonGroup: (dto: any) => Promise<void>;
  updateAddonGroup: (id: string, dto: any) => Promise<void>;
  deleteAddonGroup: (id: string) => Promise<void>;
  assignAddonGroup: (id: string, itemId?: string, categoryId?: string) => Promise<void>;
  unassignAddonGroup: (id: string, itemId?: string, categoryId?: string) => Promise<void>;

  createSelectableGroup: (dto: any) => Promise<void>;
  updateSelectableGroup: (id: string, dto: any) => Promise<void>;
  deleteSelectableGroup: (id: string) => Promise<void>;

  createDeal: (dto: any) => Promise<void>;
  updateDeal: (id: string, dto: any) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
}

const initialDrawerForm: DrawerFormState = {
  name: "",
  image: "",
  imageFile: null,
  price: "",
  categoryId: "",
  description: "",
  trackInventory: true,
  recipeItems: [{ ingredientId: "", quantity: "1" }],
  isActive: true,
  color: "",
  shortcode: "",
  visibility: {
    dineIn: true,
    pickup: true,
    delivery: true,
    inStore: true,
    qrOrdering: true,
    kiosk: true,
    onlineOrdering: true,
  },
};

const MenuManagementContext = createContext<
  MenuManagementContextType | undefined
>(undefined);

export function MenuManagementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<
    IngredientOption[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("add");
  const [drawerEditingItemId, setDrawerEditingItemId] = useState<string | null>(
    null,
  );
  const [drawerForm, setDrawerForm] =
    useState<DrawerFormState>(initialDrawerForm);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [variationGroups, setVariationGroups] = useState<any[]>([]);
  const [addonGroups, setAddonGroups] = useState<any[]>([]);
  const [selectableGroups, setSelectableGroups] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const toastTimerRef = useRef<number | null>(null);

  /**
   * Show toast message
   */
  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), 2400);
  };

  const resolveImageUrl = (value?: string | null) => {
    if (!value) {
      return "";
    }

    if (value.startsWith("/uploads/")) {
      return `${apiBaseUrl}${value}`;
    }

    return value;
  };

  /**
   * Load categories and items from backend
   */
  const loadData = async () => {
    if (!user?.restaurantId || !accessToken) {
      setCategories([]);
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch categories and products in parallel
      const [categoriesResponse, productsResponse, ingredientsResponse] =
        await Promise.all([
          api.get(`/categories`),
          api.get(`/products`),
          api.get("/inventory/ingredients"),
        ]);

      // Validate responses are arrays
      const categoriesArray = Array.isArray(categoriesResponse.data)
        ? categoriesResponse.data
        : [];
      const productsArray = Array.isArray(productsResponse.data)
        ? productsResponse.data
        : [];
      const ingredientsArray = Array.isArray(ingredientsResponse.data)
        ? ingredientsResponse.data
        : [];

      const categoriesData = categoriesArray.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        isActive: cat.isActive,
        color: cat.color || "",
      }));

      const productsData = productsArray.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.priceInCents / 100, // Convert cents to dollars
        categoryId: product.categoryId,
        image: resolveImageUrl(product.imageUrl),
        trackInventory: product.trackInventory || false,
        recipeItems: Array.isArray(product.recipeItems)
          ? product.recipeItems.map((recipeItem: any) => ({
              ingredientId: recipeItem.ingredientId,
              ingredientName:
                recipeItem.ingredient?.name || "Unknown ingredient",
              unit: recipeItem.ingredient?.unit || "units",
              quantity: Number(recipeItem.quantity || 0),
            }))
          : [],
        isActive: product.isActive !== false,
        color: product.color || "",
        shortcode: product.shortcode || "",
        visibility: product.visibility ? (typeof product.visibility === "string" ? JSON.parse(product.visibility) : product.visibility) : {
          dineIn: true,
          pickup: true,
          delivery: true,
          inStore: true,
          qrOrdering: true,
          kiosk: true,
          onlineOrdering: true,
        },
      }));

      const ingredientsData = ingredientsArray.map((ingredient: any) => ({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: Number(ingredient.quantity || 0),
        isLowStock: Boolean(ingredient.isLowStock),
      }));

      setCategories(categoriesData);
      setItems(productsData);
      setIngredientOptions(ingredientsData);
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load menu data";
      setError(errorMsg);
      console.error("Failed to load menu data:", err);
      setCategories([]);
      setItems([]);
      setIngredientOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModifiersAndDeals = async () => {
    if (!user?.restaurantId || !accessToken) {
      setVariationGroups([]);
      setAddonGroups([]);
      setSelectableGroups([]);
      setDeals([]);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [varsRes, addonsRes, groupsRes, dealsRes] = await Promise.all([
        api.get("/menu/variations/groups"),
        api.get("/menu/addons/groups"),
        api.get("/menu/groups"),
        api.get("/menu/deals"),
      ]);
      setVariationGroups(Array.isArray(varsRes.data) ? varsRes.data : []);
      setAddonGroups(Array.isArray(addonsRes.data) ? addonsRes.data : []);
      setSelectableGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
    } catch (err: any) {
      console.error("Failed to load modifiers & deals:", err);
      setError("Failed to load modifiers and combo deals.");
    } finally {
      setIsLoading(false);
    }
  };

  // VARIATIONS
  const createVariationGroup = async (dto: any) => {
    try {
      setIsLoading(true);
      await api.post("/menu/variations/groups", dto);
      showToast("Variation Group created successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to create variation group");
    } finally {
      setIsLoading(false);
    }
  };

  const updateVariationGroup = async (id: string, dto: any) => {
    try {
      setIsLoading(true);
      await api.put(`/menu/variations/groups/${id}`, dto);
      showToast("Variation Group updated successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update variation group");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVariationGroup = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/menu/variations/groups/${id}`);
      showToast("Variation Group deleted successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete variation group");
    } finally {
      setIsLoading(false);
    }
  };

  const assignVariationGroup = async (id: string, itemId?: string, categoryId?: string) => {
    try {
      setIsLoading(true);
      if (itemId) {
        await api.post(`/menu/variations/groups/${id}/assign-item`, { itemId });
      } else if (categoryId) {
        await api.post(`/menu/variations/groups/${id}/assign-category`, { categoryId });
      }
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to assign variation group");
    } finally {
      setIsLoading(false);
    }
  };

  const unassignVariationGroup = async (id: string, itemId?: string, categoryId?: string) => {
    try {
      setIsLoading(true);
      if (itemId) {
        await api.post(`/menu/variations/groups/${id}/unassign-item`, { itemId });
      } else if (categoryId) {
        await api.post(`/menu/variations/groups/${id}/unassign-category`, { categoryId });
      }
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to unassign variation group");
    } finally {
      setIsLoading(false);
    }
  };

  // ADDONS
  const createAddonGroup = async (dto: any) => {
    try {
      setIsLoading(true);
      await api.post("/menu/addons/groups", dto);
      showToast("Addon Group created successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to create addon group");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddonGroup = async (id: string, dto: any) => {
    try {
      setIsLoading(true);
      await api.put(`/menu/addons/groups/${id}`, dto);
      showToast("Addon Group updated successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update addon group");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddonGroup = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/menu/addons/groups/${id}`);
      showToast("Addon Group deleted successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete addon group");
    } finally {
      setIsLoading(false);
    }
  };

  const assignAddonGroup = async (id: string, itemId?: string, categoryId?: string) => {
    try {
      setIsLoading(true);
      if (itemId) {
        await api.post(`/menu/addons/groups/${id}/assign-item`, { itemId });
      } else if (categoryId) {
        await api.post(`/menu/addons/groups/${id}/assign-category`, { categoryId });
      }
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to assign addon group");
    } finally {
      setIsLoading(false);
    }
  };

  const unassignAddonGroup = async (id: string, itemId?: string, categoryId?: string) => {
    try {
      setIsLoading(true);
      if (itemId) {
        await api.post(`/menu/addons/groups/${id}/unassign-item`, { itemId });
      } else if (categoryId) {
        await api.post(`/menu/addons/groups/${id}/unassign-category`, { categoryId });
      }
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to unassign addon group");
    } finally {
      setIsLoading(false);
    }
  };

  // SELECTABLE GROUPS
  const createSelectableGroup = async (dto: any) => {
    try {
      setIsLoading(true);
      await api.post("/menu/groups", dto);
      showToast("Selectable Group created successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to create selectable group");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSelectableGroup = async (id: string, dto: any) => {
    try {
      setIsLoading(true);
      await api.put(`/menu/groups/${id}`, dto);
      showToast("Selectable Group updated successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update selectable group");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelectableGroup = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/menu/groups/${id}`);
      showToast("Selectable Group deleted successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete selectable group");
    } finally {
      setIsLoading(false);
    }
  };

  // DEALS / COMBOS
  const createDeal = async (dto: any) => {
    try {
      setIsLoading(true);
      await api.post("/menu/deals", dto);
      showToast("Combo Deal created successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to create deal");
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeal = async (id: string, dto: any) => {
    try {
      setIsLoading(true);
      await api.put(`/menu/deals/${id}`, dto);
      showToast("Combo Deal updated successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update deal");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/menu/deals/${id}`);
      showToast("Combo Deal deleted successfully");
      await loadModifiersAndDeals();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to delete deal");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new category
   */
  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }

    if (!user?.restaurantId || !accessToken) {
      setError("Restaurant ID not available");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // POST to backend to create category
      const response = await api.post("/categories", {
        name,
        isActive: true,
        color: newCategoryColor || null,
      });

      // Add the newly created category to local state
      const newCategory: MenuCategory = {
        id: response.data.id,
        name: response.data.name,
        isActive: response.data.isActive,
        color: response.data.color || "",
      };

      setCategories((currentCategories) => [...currentCategories, newCategory]);
      setNewCategoryName("");
      setNewCategoryColor("");
      setIsCreatingCategory(false);
      setSelectedCategoryId(newCategory.id);
      showToast("Category added successfully");
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Failed to create category";
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update category name, color, and assign default modifier groups
   */
  const saveCategory = async (
    id: string,
    name: string,
    color: string,
    variationGroupIds: string[] = [],
    addonGroupIds: string[] = [],
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. PATCH category name and color
      await api.patch(`/categories/${id}`, {
        name: name.trim(),
        color,
      });

      // 2. Sync variation groups for category
      const currentVgs = variationGroups
        .filter((vg) => vg.categories?.some((c: any) => c.categoryId === id))
        .map((vg) => vg.id);
      const vgsToAdd = variationGroupIds.filter((vgId) => !currentVgs.includes(vgId));
      const vgsToRemove = currentVgs.filter((vgId) => !variationGroupIds.includes(vgId));

      // 3. Sync addon groups for category
      const currentAds = addonGroups
        .filter((ag) => ag.categories?.some((c: any) => c.categoryId === id))
        .map((ag) => ag.id);
      const adsToAdd = addonGroupIds.filter((agId) => !currentAds.includes(agId));
      const adsToRemove = currentAds.filter((agId) => !addonGroupIds.includes(agId));

      await Promise.all([
        ...vgsToAdd.map((vgId) => api.post(`/menu/variations/groups/${vgId}/assign-category`, { categoryId: id })),
        ...vgsToRemove.map((vgId) => api.post(`/menu/variations/groups/${vgId}/unassign-category`, { categoryId: id })),
        ...adsToAdd.map((agId) => api.post(`/menu/addons/groups/${agId}/assign-category`, { categoryId: id })),
        ...adsToRemove.map((agId) => api.post(`/menu/addons/groups/${agId}/unassign-category`, { categoryId: id })),
      ]);

      // Refresh both category list and modifiers mapping
      await Promise.all([loadData(), loadModifiersAndDeals()]);
      showToast("Category updated successfully");
      return true;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to update category";
      showToast(errorMsg);
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open add item drawer
   */
  const openAddDrawer = () => {
    setDrawerMode("add");
    setDrawerEditingItemId(null);
    setDrawerForm({
      ...initialDrawerForm,
      categoryId:
        selectedCategoryId === "all"
          ? categories[0]?.id || ""
          : selectedCategoryId,
      recipeItems: [{ ingredientId: "", quantity: "1" }],
    });
    setDrawerOpen(true);
  };

  /**
   * Open edit item drawer
   */
  const openEditDrawer = (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    setDrawerMode("edit");
    setDrawerEditingItemId(item.id);
    setDrawerForm({
      name: item.name,
      image: item.image,
      imageFile: null,
      price: item.price.toString(),
      categoryId: item.categoryId,
      description: item.description,
      trackInventory: item.trackInventory,
      recipeItems:
        item.recipeItems.length > 0
          ? item.recipeItems.map((recipeItem) => ({
              ingredientId: recipeItem.ingredientId,
              quantity: recipeItem.quantity.toString(),
              unit: recipeItem.unit,
            }))
          : [{ ingredientId: "", quantity: "1" }],
      isActive: item.isActive,
      color: item.color || "",
      shortcode: item.shortcode || "",
      visibility: item.visibility || {
        dineIn: true,
        pickup: true,
        delivery: true,
        inStore: true,
        qrOrdering: true,
        kiosk: true,
        onlineOrdering: true,
      },
    });
    setDrawerOpen(true);
  };

  /**
   * Close drawer
   */
  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerEditingItemId(null);
    setDrawerForm(initialDrawerForm);
    setError(null);
  };

  /**
   * Update drawer field
   */
  const updateDrawerField = <K extends keyof DrawerFormState>(
    field: K,
    value: DrawerFormState[K],
  ) => {
    setDrawerForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  /**
   * Save item (create or update)
   */
  const saveDrawerItem = async (
    variationGroupIds: string[] = [],
    addonGroupIds: string[] = [],
  ) => {
    const name = drawerForm.name.trim();
    const categoryId = drawerForm.categoryId;
    const price = Number.parseFloat(drawerForm.price);

    if (!name || !categoryId || Number.isNaN(price) || price < 0) {
      setError("Please fill in all required fields");
      return false;
    }

    const normalizedRecipeItems = drawerForm.recipeItems
      .filter((recipeItem) => recipeItem.ingredientId)
      .map((recipeItem) => ({
        ingredientId: recipeItem.ingredientId,
        quantity: Number.parseFloat(recipeItem.quantity),
        unit: recipeItem.unit,
      }));

    if (drawerForm.trackInventory && normalizedRecipeItems.length === 0) {
      setError(
        "Tracked inventory items must have at least one ingredient recipe",
      );
      return false;
    }

    if (
      normalizedRecipeItems.some(
        (recipeItem) =>
          Number.isNaN(recipeItem.quantity) || recipeItem.quantity <= 0,
      )
    ) {
      setError("Recipe ingredient quantities must be greater than 0");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const priceInCents = Math.round(price * 100);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", drawerForm.description.trim());
      formData.append("priceInCents", String(priceInCents));
      formData.append("categoryId", categoryId);
      formData.append("trackInventory", String(drawerForm.trackInventory));
      formData.append("isActive", String(drawerForm.isActive));
      formData.append("recipeItems", JSON.stringify(normalizedRecipeItems));
      formData.append("color", drawerForm.color || "");
      formData.append("shortcode", drawerForm.shortcode || "");
      formData.append("visibility", JSON.stringify(drawerForm.visibility));

      if (drawerForm.imageFile) {
        formData.append("image", drawerForm.imageFile);
      }

      let targetItemId = "";

      if (drawerMode === "edit" && drawerEditingItemId) {
        targetItemId = drawerEditingItemId;
        // Update existing item
        const response = await api.patch(
          `/products/${drawerEditingItemId}`,
          formData,
        );

        // Update local state
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === drawerEditingItemId
              ? {
                  ...item,
                  name,
                  description: drawerForm.description.trim(),
                  price,
                  categoryId,
                  image: resolveImageUrl(response.data.imageUrl),
                  trackInventory: drawerForm.trackInventory,
                  recipeItems: normalizedRecipeItems.map((recipeItem) => {
                    const ingredient = ingredientOptions.find(
                      (option) => option.id === recipeItem.ingredientId,
                    );
                    return {
                      ingredientId: recipeItem.ingredientId,
                      ingredientName: ingredient?.name || "Unknown ingredient",
                      unit: ingredient?.unit || "units",
                      quantity: recipeItem.quantity,
                    };
                  }),
                  isActive: drawerForm.isActive,
                  color: response.data.color || "",
                  shortcode: response.data.shortcode || "",
                  visibility: response.data.visibility ? (typeof response.data.visibility === "string" ? JSON.parse(response.data.visibility) : response.data.visibility) : drawerForm.visibility,
                }
              : item,
          ),
        );

        // Sync modifier groups for existing item
        const currentVgs = variationGroups
          .filter((vg) => vg.menuItems?.some((mi: any) => mi.menuItemId === targetItemId))
          .map((vg) => vg.id);
        const vgsToAdd = variationGroupIds.filter((id) => !currentVgs.includes(id));
        const vgsToRemove = currentVgs.filter((id) => !variationGroupIds.includes(id));

        const currentAds = addonGroups
          .filter((ag) => ag.menuItems?.some((mi: any) => mi.menuItemId === targetItemId))
          .map((ag) => ag.id);
        const adsToAdd = addonGroupIds.filter((id) => !currentAds.includes(id));
        const adsToRemove = currentAds.filter((id) => !addonGroupIds.includes(id));

        await Promise.all([
          ...vgsToAdd.map((id) => api.post(`/menu/variations/groups/${id}/assign-item`, { itemId: targetItemId })),
          ...vgsToRemove.map((id) => api.post(`/menu/variations/groups/${id}/unassign-item`, { itemId: targetItemId })),
          ...adsToAdd.map((id) => api.post(`/menu/addons/groups/${id}/assign-item`, { itemId: targetItemId })),
          ...adsToRemove.map((id) => api.post(`/menu/addons/groups/${id}/unassign-item`, { itemId: targetItemId })),
        ]);

        showToast("Item updated successfully");
      } else {
        // Create new item
        const response = await api.post("/products", formData);
        targetItemId = response.data.id;

        // Add to local state
        const newItem: MenuItem = {
          id: targetItemId,
          name,
          description: drawerForm.description.trim(),
          price,
          categoryId,
          image: resolveImageUrl(response.data.imageUrl),
          trackInventory: drawerForm.trackInventory,
          recipeItems: normalizedRecipeItems.map((recipeItem) => {
            const ingredient = ingredientOptions.find(
              (option) => option.id === recipeItem.ingredientId,
            );
            return {
              ingredientId: recipeItem.ingredientId,
              ingredientName: ingredient?.name || "Unknown ingredient",
              unit: ingredient?.unit || "units",
              quantity: recipeItem.quantity,
            };
          }),
          isActive: drawerForm.isActive,
          color: response.data.color || "",
          shortcode: response.data.shortcode || "",
          visibility: response.data.visibility ? (typeof response.data.visibility === "string" ? JSON.parse(response.data.visibility) : response.data.visibility) : drawerForm.visibility,
        };

        // Sync modifiers for new item
        await Promise.all([
          ...variationGroupIds.map((id) => api.post(`/menu/variations/groups/${id}/assign-item`, { itemId: targetItemId })),
          ...addonGroupIds.map((id) => api.post(`/menu/addons/groups/${id}/assign-item`, { itemId: targetItemId })),
        ]);

        setItems((currentItems) => [...currentItems, newItem]);
        showToast("Item added successfully");
      }

      await loadModifiersAndDeals();
      closeDrawer();
      return true;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to save item";
      setError(errorMsg);
      showToast(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete item
   */
  const deleteItem = async (itemId: string) => {
    if (!itemId || itemId === ":id") {
      setError("Cannot delete item: invalid item ID loaded from the server.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.delete(`/products/${itemId}`);
      const archivedItem = response?.data?.item;

      // Remove from current list view to match delete intent in UI.
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemId),
      );

      showToast(
        archivedItem?.name
          ? `${archivedItem.name} archived successfully`
          : "Item archived successfully",
      );
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to delete item";
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle item active status
   */
  const toggleItemActive = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.patch(`/products/${itemId}`, {
        isActive: !item.isActive,
      });

      // Update local state
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, isActive: !item.isActive } : item,
        ),
      );
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to update item";
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle inventory tracking
   */
  const toggleInventory = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (!item.trackInventory && item.recipeItems.length === 0) {
      showToast("Add a recipe before enabling inventory tracking");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await api.patch(`/products/${itemId}`, {
        trackInventory: !item.trackInventory,
      });

      // Update local state
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId
            ? { ...item, trackInventory: !item.trackInventory }
            : item,
        ),
      );
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to update item";
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filter items by category
   */
  const filterItemsByCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  /**
   * Toggle category active status
   */
  const toggleCategoryActive = async (categoryId: string) => {
    if (!user?.restaurantId || !accessToken) {
      setError("Restaurant ID not available");
      return;
    }

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    try {
      setIsLoading(true);
      setError(null);

      // PATCH to backend to toggle category active status
      await api.patch(`/categories/${categoryId}`, {
        isActive: !category.isActive,
      });

      // Update local state
      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId
            ? { ...category, isActive: !category.isActive }
            : category,
        ),
      );

      showToast(`Category ${!category.isActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Failed to update category";
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Memoized filtered items
   */
  const filteredItems = useMemo(() => {
    if (selectedCategoryId === "all") {
      return items;
    }

    return items.filter((item) => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  /**
   * Load data on mount and when restaurantId changes
   */
  useEffect(() => {
    loadData();
    loadModifiersAndDeals();
  }, [user?.restaurantId, accessToken]);

  /**
   * Cleanup toast timer on unmount
   */
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const value: MenuManagementContextType = {
    categories,
    items,
    ingredientOptions,
    selectedCategoryId,
    filteredItems,
    isCreatingCategory,
    newCategoryName,
    drawerOpen,
    drawerMode,
    drawerEditingItemId,
    drawerForm,
    toastMessage,
    isLoading,
    error,
    setSelectedCategoryId,
    setIsCreatingCategory,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    createCategory,
    openAddDrawer,
    openEditDrawer,
    closeDrawer,
    updateDrawerField,
    saveDrawerItem,
    deleteItem,
    toggleItemActive,
    toggleInventory,
    filterItemsByCategory,
    toggleCategoryActive,
    saveCategory,
    loadData,

    variationGroups,
    addonGroups,
    selectableGroups,
    deals,
    loadModifiersAndDeals,
    createVariationGroup,
    updateVariationGroup,
    deleteVariationGroup,
    assignVariationGroup,
    unassignVariationGroup,
    createAddonGroup,
    updateAddonGroup,
    deleteAddonGroup,
    assignAddonGroup,
    unassignAddonGroup,
    createSelectableGroup,
    updateSelectableGroup,
    deleteSelectableGroup,
    createDeal,
    updateDeal,
    deleteDeal,
  };

  return (
    <MenuManagementContext.Provider value={value}>
      {children}
    </MenuManagementContext.Provider>
  );
}

export function useMenuManagement() {
  const context = useContext(MenuManagementContext);
  if (!context) {
    throw new Error(
      "useMenuManagement must be used within a MenuManagementProvider",
    );
  }

  return context;
}

export function getCategoryItemCount(items: MenuItem[], categoryId: string) {
  return items.filter((item) => item.categoryId === categoryId).length;
}

export function getCategoryEffectiveActive(
  categories: MenuCategory[],
  categoryId: string,
) {
  return (
    categories.find((category) => category.id === categoryId)?.isActive ?? false
  );
}

export function getCategoryLabel(
  categories: MenuCategory[],
  categoryId: string,
) {
  if (categoryId === "all") {
    return "All Items";
  }

  return getCategoryNameById(categories, categoryId);
}

function getCategoryNameById(categories: MenuCategory[], categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.name ||
    "Uncategorized"
  );
}
