import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  isActive: boolean;
  stock: number;
  isOutOfStock?: boolean;
  description: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SendToKitchenResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

interface PosCartContextType {
  menuItems: MenuItem[];
  billItems: BillItem[];
  totalItems: number;
  billTotal: number;
  isLoading: boolean;
  error: string | null;
  addItemToBill: (item: MenuItem) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, action: 'increase' | 'decrease') => void;
  clearBill: () => void;
  sendToKitchen: (items?: BillItem[]) => Promise<SendToKitchenResult>;
  loadMenuItems: () => Promise<void>;
}

const PosCartContext = createContext<PosCartContextType | undefined>(undefined);

export const PosCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load menu items from API on mount
  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/products');
      const products = response.data;
      
      // Validate response is an array
      if (!Array.isArray(products)) {
        throw new Error('Invalid response from server');
      }
      
      // Transform backend response to MenuItem format
      const transformedItems: MenuItem[] = products
        .filter((product: any) => product.isActive !== false)
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.priceInCents / 100, // Convert cents to dollars
          category: product.category?.name || 'Uncategorized',
          image: product.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop',
          isActive: product.isActive !== false,
          stock: 999, // Placeholder - would need inventory API
          description: product.description || '',
        }));

      setMenuItems(transformedItems);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load menu items';
      setError(errorMsg);
      console.error('Error loading menu items:', err);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load menu items on component mount and when user authenticates
  useEffect(() => {
    if (user?.id && accessToken) {
      loadMenuItems();
    } else {
      setMenuItems([]);
      setError(null);
      setIsLoading(false);
    }
  }, [user?.id, accessToken]);

  const addItemToBill = (item: MenuItem) => {
    if (!item.isActive || item.stock === 0 || item.isOutOfStock) {
      return false;
    }

    setBillItems((currentItems) => {
      const existing = currentItems.find((billItem) => billItem.id === item.id);
      if (existing) {
        return currentItems.map((billItem) => (
          billItem.id === item.id
            ? { ...billItem, quantity: billItem.quantity + 1 }
            : billItem
        ));
      }

      return [
        ...currentItems,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });

    return true;
  };

  const removeItem = (itemId: string) => {
    setBillItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, action: 'increase' | 'decrease') => {
    setBillItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          if (action === 'increase') {
            return { ...item, quantity: item.quantity + 1 };
          }

          return { ...item, quantity: item.quantity - 1 };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearBill = () => {
    setBillItems([]);
  };

  const sendToKitchen = async (items: BillItem[] = billItems): Promise<SendToKitchenResult> => {
    if (items.length === 0) {
      return { success: false, error: 'No items in bill' };
    }

    try {
      // Call backend API to create a bill/order
      const response = await api.post('/orders', {
        items: items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        orderType: 'DINE_IN',
      });

      if (response.status === 201 || response.status === 200) {
        // Do NOT clear bill items here — the bill persists for payment flow
        // Bill is only cleared on payment completion via clearBill()
        
        return {
          success: true,
          orderId: response.data.id || `KOT-${Date.now().toString().slice(-6)}`,
        };
      }

      return { 
        success: false, 
        error: 'Failed to send order to kitchen' 
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error sending order to kitchen';
      console.error('Send to kitchen error:', err);
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  const totalItems = useMemo(
    () => billItems.reduce((sum, item) => sum + item.quantity, 0),
    [billItems],
  );

  const billTotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [billItems],
  );

  return (
    <PosCartContext.Provider
      value={{
        menuItems,
        billItems,
        totalItems,
        billTotal,
        isLoading,
        error,
        addItemToBill,
        removeItem,
        updateQuantity,
        clearBill,
        sendToKitchen,
        loadMenuItems,
      }}
    >
      {children}
    </PosCartContext.Provider>
  );
};

export const usePosCart = () => {
  const context = useContext(PosCartContext);
  if (!context) {
    throw new Error('usePosCart must be used within a PosCartProvider');
  }

  return context;
};