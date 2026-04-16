import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
  image?: string | null;
  isActive: boolean;
  isOutOfStock?: boolean;
  description: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface BillItem {
  id: string;
  menuItemId: string | null;
  name: string;
  categoryName: string;
  price: number;
  quantity: number;
  lineTotal: number;
  notes: string | null;
}

export interface BillRecord {
  id: string;
  orderNumber: number;
  orderType: string;
  status: string;
  tableNumber: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  kotSentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  items: BillItem[];
}

interface SendToKitchenResult {
  success: boolean;
  billId?: string;
  kitchenOrderId?: string;
  error?: string;
}

interface CashPaymentResult {
  success: boolean;
  bill?: BillRecord;
  payment?: {
    id: string;
    amount: number;
    cashReceived: number;
    change: number;
  };
  error?: string;
}

interface PosCartContextType {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  openBills: BillRecord[];
  activeBill: BillRecord | null;
  billItems: BillItem[];
  totalItems: number;
  billTotal: number;
  isLoading: boolean;
  error: string | null;
  loadOpenBills: () => Promise<void>;
  createBillSession: (orderType: string, tableNumber?: string | null) => Promise<BillRecord>;
  loadBill: (billId: string) => Promise<BillRecord | null>;
  addItemToBill: (item: MenuItem) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, action: 'increase' | 'decrease') => Promise<void>;
  clearBill: () => void;
  sendToKitchen: () => Promise<SendToKitchenResult>;
  processCashPayment: (amount: number, cashReceived: number) => Promise<CashPaymentResult>;
  loadMenuItems: () => Promise<void>;
}

const PosCartContext = createContext<PosCartContextType | undefined>(undefined);
const ACTIVE_BILL_KEY = 'active_pos_bill_id';

export const PosCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openBills, setOpenBills] = useState<BillRecord[]>([]);
  const [activeBill, setActiveBill] = useState<BillRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeMenuCategories = (responseData: unknown): MenuCategory[] => {
    if (!Array.isArray(responseData)) {
      throw new Error('Invalid response from server');
    }

    return responseData.map((category: any) => {
      const categoryItems = Array.isArray(category.items) ? category.items : [];

      return {
        id: category.id,
        name: category.name,
        items: categoryItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price ?? 0),
          categoryId: item.categoryId || category.id,
          categoryName: category.name,
          image: item.image ?? item.imageUrl ?? null,
          isActive: item.isActive !== false,
          isOutOfStock: item.isOutOfStock,
          description: item.description || '',
        })),
      };
    });
  };

  const normalizeBill = (bill: any): BillRecord => ({
    id: bill.id,
    orderNumber: Number(bill.orderNumber ?? 0),
    orderType: bill.orderType,
    status: bill.status,
    tableNumber: bill.tableNumber || null,
    subtotalAmount: Number(bill.subtotalAmount ?? 0),
    taxAmount: Number(bill.taxAmount ?? 0),
    totalAmount: Number(bill.totalAmount ?? 0),
    kotSentAt: bill.kotSentAt || null,
    paidAt: bill.paidAt || null,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    itemCount: Number(bill.itemCount ?? 0),
    items: Array.isArray(bill.items)
      ? bill.items.map((item: any) => ({
          id: item.id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          categoryName: item.categoryName,
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 0),
          lineTotal: Number(item.lineTotal ?? 0),
          notes: item.notes || null,
        }))
      : [],
  });

  const syncBill = (nextBill: BillRecord | null) => {
    setActiveBill(nextBill);
    if (nextBill) {
      localStorage.setItem(ACTIVE_BILL_KEY, nextBill.id);
    } else {
      localStorage.removeItem(ACTIVE_BILL_KEY);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/menu/categories');
      const transformedCategories = normalizeMenuCategories(response.data);

      setCategories(transformedCategories);
      setMenuItems(transformedCategories.flatMap((category) => category.items));
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load menu items';
      setError(errorMsg);
      console.error('Error loading menu items:', err);
      setCategories([]);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOpenBills = async () => {
    const response = await api.get('/bills');
    setOpenBills(Array.isArray(response.data) ? response.data.map(normalizeBill) : []);
  };

  const createBillSession = async (orderType: string, tableNumber?: string | null) => {
    const response = await api.post('/bills', {
      orderType,
      tableNumber: tableNumber || undefined,
    });

    const bill = normalizeBill(response.data);
    syncBill(bill);
    return bill;
  };

  const loadBill = async (billId: string) => {
    try {
      const response = await api.get(`/bills/${billId}`);
      const bill = normalizeBill(response.data);
      syncBill(bill);
      return bill;
    } catch (err) {
      console.error('Error loading bill:', err);
      syncBill(null);
      return null;
    }
  };

  useEffect(() => {
    if (!user?.id || !accessToken) {
      setCategories([]);
      setMenuItems([]);
      setOpenBills([]);
      syncBill(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const hydrate = async () => {
      await loadMenuItems();

      const storedBillId = localStorage.getItem(ACTIVE_BILL_KEY);
      if (storedBillId) {
        await loadBill(storedBillId);
      }
    };

    void hydrate();
  }, [user?.id, accessToken]);

  const addItemToBill = async (item: MenuItem) => {
    if (!item.isActive || item.isOutOfStock) {
      return false;
    }

    if (!activeBill) {
      return false;
    }

    try {
      const response = await api.post(`/bills/${activeBill.id}/items`, {
        menuItemId: item.id,
        quantity: 1,
      });

      syncBill(normalizeBill(response.data));
      return true;
    } catch (err) {
      console.error('Error adding bill item:', err);
      return false;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!activeBill) {
      return;
    }

    const response = await api.delete(`/bills/${activeBill.id}/items/${itemId}`);
    syncBill(normalizeBill(response.data));
  };

  const updateQuantity = async (itemId: string, action: 'increase' | 'decrease') => {
    if (!activeBill) {
      return;
    }

    const item = activeBill.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    if (action === 'decrease' && item.quantity <= 1) {
      await removeItem(itemId);
      return;
    }

    const response = await api.patch(`/bills/${activeBill.id}/items/${itemId}`, {
      quantity: action === 'increase' ? item.quantity + 1 : item.quantity - 1,
    });

    syncBill(normalizeBill(response.data));
  };

  const clearBill = () => {
    syncBill(null);
  };

  const sendToKitchen = async (): Promise<SendToKitchenResult> => {
    if (!activeBill) {
      return { success: false, error: 'No active bill' };
    }

    try {
      const response = await api.post(`/bills/${activeBill.id}/kot`);
      syncBill(normalizeBill(response.data.bill));
      return {
        success: true,
        billId: response.data.bill?.id || activeBill.id,
        kitchenOrderId: response.data.kitchenOrder?.id,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error sending order to kitchen';
      console.error('Send to kitchen error:', err);
      return { success: false, error: errorMsg };
    }
  };

  const processCashPayment = async (
    amount: number,
    cashReceived: number,
  ): Promise<CashPaymentResult> => {
    if (!activeBill) {
      return { success: false, error: 'No active bill' };
    }

    try {
      const response = await api.post('/payments/cash', {
        billId: activeBill.id,
        amount,
        cashReceived,
      });

      const nextBill = normalizeBill(response.data.bill);
      syncBill(nextBill);

      return {
        success: true,
        bill: nextBill,
        payment: response.data.payment,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error processing cash payment';
      console.error('Cash payment error:', err);
      return { success: false, error: errorMsg };
    }
  };

  const billItems = activeBill?.items || [];

  const totalItems = useMemo(
    () => billItems.reduce((sum, item) => sum + item.quantity, 0),
    [billItems],
  );

  const billTotal = activeBill?.totalAmount ?? 0;

  return (
    <PosCartContext.Provider
      value={{
        categories,
        menuItems,
        openBills,
        activeBill,
        billItems,
        totalItems,
        billTotal,
        isLoading,
        error,
        loadOpenBills,
        createBillSession,
        loadBill,
        addItemToBill,
        removeItem,
        updateQuantity,
        clearBill,
        sendToKitchen,
        processCashPayment,
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