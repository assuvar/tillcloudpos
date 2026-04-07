import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface MenuCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  trackInventory: boolean;
  isActive: boolean;
}

export interface DrawerFormState {
  name: string;
  image: string;
  price: string;
  categoryId: string;
  description: string;
  trackInventory: boolean;
  isActive: boolean;
}

type DrawerMode = 'add' | 'edit';

interface MenuManagementContextType {
  categories: MenuCategory[];
  items: MenuItem[];
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
  createCategory: () => Promise<void>;
  openAddDrawer: () => void;
  openEditDrawer: (itemId: string) => void;
  closeDrawer: () => void;
  updateDrawerField: <K extends keyof DrawerFormState>(field: K, value: DrawerFormState[K]) => void;
  saveDrawerItem: () => Promise<boolean>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItemActive: (itemId: string) => Promise<void>;
  toggleInventory: (itemId: string) => Promise<void>;
  filterItemsByCategory: (categoryId: string) => void;
  toggleCategoryActive: (categoryId: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const initialDrawerForm: DrawerFormState = {
  name: '',
  image: '',
  price: '',
  categoryId: '',
  description: '',
  trackInventory: true,
  isActive: true,
};

const MenuManagementContext = createContext<MenuManagementContextType | undefined>(undefined);

export function MenuManagementProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('add');
  const [drawerEditingItemId, setDrawerEditingItemId] = useState<string | null>(null);
  const [drawerForm, setDrawerForm] = useState<DrawerFormState>(initialDrawerForm);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  /**
   * Show toast message
   */
  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 2400);
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
      const [categoriesResponse, productsResponse] = await Promise.all([
        api.get(`/categories`),
        api.get(`/products`),
      ]);

      // Validate responses are arrays
      const categoriesArray = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      const productsArray = Array.isArray(productsResponse.data) ? productsResponse.data : [];

      const categoriesData = categoriesArray.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        isActive: cat.isActive,
      }));

      const productsData = productsArray.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.priceInCents / 100, // Convert cents to dollars
        categoryId: product.categoryId,
        image: product.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
        trackInventory: product.trackInventory || false,
        isActive: product.isActive !== false,
      }));

      setCategories(categoriesData);
      setItems(productsData);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load menu data';
      setError(errorMsg);
      console.error('Failed to load menu data:', err);
      setCategories([]);
      setItems([]);
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
      setError('Restaurant ID not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // POST to backend to create category
      const response = await api.post('/categories', {
        name,
        isActive: true,
      });

      // Add the newly created category to local state
      const newCategory: MenuCategory = {
        id: response.data.id,
        name: response.data.name,
        isActive: response.data.isActive,
      };

      setCategories((currentCategories) => [...currentCategories, newCategory]);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      setSelectedCategoryId(newCategory.id);
      showToast('Category added successfully');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create category';
      setError(errorMsg);
      showToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open add item drawer
   */
  const openAddDrawer = () => {
    setDrawerMode('add');
    setDrawerEditingItemId(null);
    setDrawerForm({
      ...initialDrawerForm,
      categoryId:
        selectedCategoryId === 'all'
          ? categories[0]?.id || ''
          : selectedCategoryId,
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

    setDrawerMode('edit');
    setDrawerEditingItemId(item.id);
    setDrawerForm({
      name: item.name,
      image: item.image,
      price: item.price.toString(),
      categoryId: item.categoryId,
      description: item.description,
      trackInventory: item.trackInventory,
      isActive: item.isActive,
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
    value: DrawerFormState[K]
  ) => {
    setDrawerForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  /**
   * Save item (create or update)
   */
  const saveDrawerItem = async () => {
    const name = drawerForm.name.trim();
    const categoryId = drawerForm.categoryId;
    const price = Number.parseFloat(drawerForm.price);

    if (!name || !categoryId || Number.isNaN(price) || price < 0) {
      setError('Please fill in all required fields');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const priceInCents = Math.round(price * 100);

      if (drawerMode === 'edit' && drawerEditingItemId) {
        // Update existing item
        await api.patch(`/products/${drawerEditingItemId}`, {
          name,
          description: drawerForm.description.trim(),
          priceInCents,
          categoryId,
          imageUrl:
            drawerForm.image.trim() ||
            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
          trackInventory: drawerForm.trackInventory,
          isActive: drawerForm.isActive,
        });

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
                  image:
                    drawerForm.image.trim() ||
                    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
                  trackInventory: drawerForm.trackInventory,
                  isActive: drawerForm.isActive,
                }
              : item
          )
        );

        showToast('Item updated successfully');
      } else {
        // Create new item
        const response = await api.post('/products', {
          name,
          description: drawerForm.description.trim(),
          priceInCents,
          categoryId,
          imageUrl:
            drawerForm.image.trim() ||
            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
          trackInventory: drawerForm.trackInventory,
          isActive: drawerForm.isActive,
        });

        // Add to local state
        const newItem: MenuItem = {
          id: response.data.id,
          name,
          description: drawerForm.description.trim(),
          price,
          categoryId,
          image:
            drawerForm.image.trim() ||
            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
          trackInventory: drawerForm.trackInventory,
          isActive: drawerForm.isActive,
        };

        setItems((currentItems) => [...currentItems, newItem]);
        showToast('Item added successfully');
      }

      closeDrawer();
      return true;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to save item';
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
    try {
      setIsLoading(true);
      setError(null);

      await api.delete(`/products/${itemId}`);

      // Remove from local state
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemId)
      );

      showToast('Item deleted successfully');
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to delete item';
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
          item.id === itemId
            ? { ...item, isActive: !item.isActive }
            : item
        )
      );
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to update item';
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
            : item
        )
      );
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to update item';
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
      setError('Restaurant ID not available');
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
            : category
        )
      );

      showToast(`Category ${!category.isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to update category';
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
    if (selectedCategoryId === 'all') {
      return items;
    }

    return items.filter((item) => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  /**
   * Load data on mount and when restaurantId changes
   */
  useEffect(() => {
    loadData();
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
    loadData,
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
      'useMenuManagement must be used within a MenuManagementProvider'
    );
  }

  return context;
}

export function getCategoryItemCount(items: MenuItem[], categoryId: string) {
  return items.filter((item) => item.categoryId === categoryId).length;
}

export function getCategoryEffectiveActive(
  categories: MenuCategory[],
  categoryId: string
) {
  return (
    categories.find((category) => category.id === categoryId)?.isActive ?? false
  );
}

export function getCategoryLabel(
  categories: MenuCategory[],
  categoryId: string
) {
  if (categoryId === 'all') {
    return 'All Items';
  }

  return getCategoryNameById(categories, categoryId);
}

function getCategoryNameById(
  categories: MenuCategory[],
  categoryId: string
) {
  return (
    categories.find((category) => category.id === categoryId)?.name ||
    'Uncategorized'
  );
}
