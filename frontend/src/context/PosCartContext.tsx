import { createContext, useContext, useMemo, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

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
  tableId: string | null;
  tableNumber: string | null;
  table?: {
    id: string;
    name: string;
    floor: string;
  } | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  customerName?: string | null;
  kotSentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  pickupName?: string | null;
  deliveryName?: string | null;
  deliveryAddress?: string | null;
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
  createBillSession: (
    serviceType: string,
    data: {
      tableId?: string | null;
      customer?: string | null;
      pickupName?: string | null;
      pickupPhone?: string | null;
      pickupTime?: string | null;
      deliveryName?: string | null;
      deliveryPhone?: string | null;
      deliveryAddress?: string | null;
      deliveryNotes?: string | null;
    }
  ) => Promise<BillRecord>;
  loadBill: (billId: string) => Promise<BillRecord | null>;
  addItemToBill: (item: MenuItem) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (
    itemId: string,
    action: "increase" | "decrease",
  ) => Promise<void>;
  clearBill: () => void;
  sendToKitchen: () => Promise<SendToKitchenResult>;
  processCashPayment: (
    amount: number,
    _cashReceived: number,
  ) => Promise<CashPaymentResult>;
  closeOrder: (orderId: string) => Promise<boolean>;
  loadMenuItems: () => Promise<void>;
}

const PosCartContext = createContext<PosCartContextType | undefined>(undefined);
const ACTIVE_BILL_KEY = "active_pos_bill_id";
const ACTIVE_BILL_DATA_KEY = "active_pos_bill_data";

export const PosCartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, accessToken } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openBills, setOpenBills] = useState<BillRecord[]>([]);
  const [activeBill, setActiveBill] = useState<BillRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseApiError = (err: any, fallback: string) => {
    const payload = err?.response?.data?.message;
    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }

    if (
      payload &&
      typeof payload === "object" &&
      typeof payload.message === "string"
    ) {
      return payload.message;
    }

    return err?.message || fallback;
  };

  const normalizeMenuCategories = (responseData: unknown): MenuCategory[] => {
    if (!Array.isArray(responseData)) {
      throw new Error("Invalid response from server");
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
          description: item.description || "",
        })),
      };
    });
  };

  const normalizeBill = (bill: any): BillRecord => {
    // Handle both normalized responses (from /bills with dollar amounts)
    // AND raw Prisma responses (from /orders with cents fields)
    const toDollars = (dollars: unknown, cents: unknown): number => {
      const d = Number(dollars);
      if (d > 0 || (dollars !== undefined && dollars !== null)) return d;
      const c = Number(cents);
      return Number.isFinite(c) ? c / 100 : 0;
    };

    const items = Array.isArray(bill.items)
      ? bill.items.map((item: any) => ({
          id: item.id,
          menuItemId: item.menuItemId || null,
          name: item.name || item.itemName,
          categoryName: item.categoryName,
          price: toDollars(item.price, item.unitPriceInCents),
          quantity: Number(item.quantity ?? 0),
          lineTotal: toDollars(item.lineTotal, item.lineTotalCents),
          notes: item.notes || null,
        }))
      : [];

    // Compute itemCount from actual items array
    const itemCount = items.reduce((sum: number, i: BillItem) => sum + i.quantity, 0);

    return {
      id: bill.id,
      orderNumber: Number(bill.orderNumber ?? 0),
      orderType: bill.orderType,
      status: bill.status,
      tableId: bill.tableId || null,
      tableNumber: bill.tableNumber || null,
      subtotalAmount: toDollars(bill.subtotalAmount, bill.subtotalCents),
      taxAmount: toDollars(bill.taxAmount, bill.taxAmountCents),
      totalAmount: toDollars(bill.totalAmount, bill.totalCents),
      kotSentAt: bill.kotSentAt || null,
      paidAt: bill.paidAt || null,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
      itemCount,
      pickupName: bill.pickupName || null,
      deliveryName: bill.deliveryName || null,
      deliveryAddress: bill.deliveryAddress || null,
      items,
    };
  };

  const syncBill = (nextBill: BillRecord | null) => {
    setActiveBill(nextBill);
    if (nextBill) {
      try {
        localStorage.setItem(ACTIVE_BILL_KEY, nextBill.id);
        localStorage.setItem(ACTIVE_BILL_DATA_KEY, JSON.stringify(nextBill));
      } catch (e) {
        console.warn('Failed to persist active bill to localStorage', e);
      }
    } else {
      localStorage.removeItem(ACTIVE_BILL_KEY);
      localStorage.removeItem(ACTIVE_BILL_DATA_KEY);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get("/menu/categories");
      const transformedCategories = normalizeMenuCategories(response.data);

      setCategories(transformedCategories);
      setMenuItems(transformedCategories.flatMap((category) => category.items));
      setError(null);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load menu items";
      setError(errorMsg);
      console.error("Error loading menu items:", err);
      setCategories([]);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOpenBills = async () => {
    try {
      const response = await api.get("/orders");
      const payload = Array.isArray(response.data) ? response.data : [];
      setOpenBills(payload);
    } catch (err: any) {
      console.error('[PosCartContext] Failed to load open bills:', err);
      setOpenBills([]);
      setError('Failed to load open bills');
    }
  };

  const createBillSession = async (
    serviceType: string,
    data: {
      tableId?: string | null;
      customer?: string | null;
      pickupName?: string | null;
      pickupPhone?: string | null;
      pickupTime?: string | null;
      deliveryName?: string | null;
      deliveryPhone?: string | null;
      deliveryAddress?: string | null;
      deliveryNotes?: string | null;
    }
  ) => {
    try {
      const response = await api.post("/orders", {
        serviceType,
        ...data,
        tableId: data.tableId || undefined,
        customer: data.customer || undefined
      });

      const orderData = response.data;
      if (!orderData.id) {
        throw new Error("No order ID returned from server");
      }

      // Re-load full bill from the created session
      const bill = await loadBill(orderData.id);
      if (!bill) throw new Error("Failed to load bill after creation");

      syncBill(bill);
      await loadOpenBills();
      return bill;
    } catch (err: any) {
      console.error('[PosCartContext] Failed to create order session:', err);
      const errorMsg = parseApiError(err, 'Failed to create POS session');
      setError(errorMsg);
      throw err;
    }
  };

  const loadBill = async (billId: string) => {
    try {
      const response = await api.get(`/bills/${billId}`);
      const bill = normalizeBill(response.data);
      syncBill(bill);
      return bill;
    } catch (err) {
      console.error("Error loading bill:", err);
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

      // Try to hydrate active bill from localStorage to avoid flicker
      try {
        const stored = localStorage.getItem(ACTIVE_BILL_DATA_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            setActiveBill(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to hydrate active bill from storage', e);
      }

      const storedBillId = localStorage.getItem(ACTIVE_BILL_KEY);
      if (storedBillId) {
        // Refresh from API but don't block UI if it fails
        void loadBill(storedBillId).catch((e) => {
          console.warn('Failed to refresh stored bill from API', e);
        });
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
      const response = await api.post(`/orders/${activeBill.id}/items`, {
        productId: item.id,
        quantity: 1,
      });

      syncBill(normalizeBill(response.data));
      setError(null);
      return true;
    } catch (err: any) {
      const errorMsg = parseApiError(err, "Failed to add item");
      setError(errorMsg);
      return false;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!activeBill) {
      return;
    }

    try {
      const response = await api.delete(
        `/bills/${activeBill.id}/items/${itemId}`,
      );
      syncBill(normalizeBill(response.data));
    } catch (err: any) {
      console.error("Error removing bill item:", err);
    }
  };

  const updateQuantity = async (
    itemId: string,
    action: "increase" | "decrease",
  ) => {
    if (!activeBill) {
      return;
    }

    const item = activeBill.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    if (action === "decrease" && item.quantity <= 1) {
      await removeItem(itemId);
      return;
    }

    try {
      const response = await api.patch(
        `/bills/${activeBill.id}/items/${itemId}`,
        {
          quantity:
            action === "increase" ? item.quantity + 1 : item.quantity - 1,
        },
      );

      syncBill(normalizeBill(response.data));
      setError(null);
    } catch (err: any) {
      const errorMsg = parseApiError(
        err,
        "Failed to update bill item quantity",
      );
      setError(errorMsg);
    }
  };

  const clearBill = () => {
    syncBill(null);
  };

  const sendToKitchen = async (): Promise<SendToKitchenResult> => {
    if (!activeBill) {
      return { success: false, error: "No active bill" };
    }

    try {
      const response = await api.post(`/orders/${activeBill.id}/send-to-kitchen`);
      syncBill(normalizeBill(response.data));
      await loadOpenBills(); // Sync dashboard
      return {
        success: true,
        billId: activeBill.id,
      };
    } catch (err: any) {
      const errorMsg = parseApiError(err, "Error sending order to kitchen");
      return { success: false, error: errorMsg };
    }
  };

  const processCashPayment = async (
    amount: number,
    _cashReceived: number,
  ): Promise<CashPaymentResult> => {
    if (!activeBill) {
      return { success: false, error: "No active bill" };
    }

    try {
      const response = await api.post("/payments", {
        orderId: activeBill.id,
        amount,
        method: 'CASH',
      });

      const nextBill = normalizeBill(response.data.bill);
      syncBill(nextBill);
      
      // Force data refetching for UI synchronization (Requirement)
      await Promise.all([
        loadOpenBills(), // Sync dashboard
        loadMenuItems(), // Sync item stock/out-of-stock status
      ]);

      return {
        success: true,
        bill: nextBill,
        payment: response.data.payment,
      };
    } catch (err: any) {
      const errorMsg = parseApiError(err, "Payment failed");
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const closeOrder = async (orderId: string): Promise<boolean> => {
    try {
      await api.patch(`/orders/${orderId}/close`);
      
      // Clear active bill if it was the one being closed
      if (activeBill?.id === orderId) {
        clearBill();
      }

      await Promise.all([
        loadOpenBills(),
        // Also reload tables if possible (handled by dashboard intervals but good to be explicit)
      ]);
      return true;
    } catch (err: any) {
      console.error('Failed to close order:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to close order';
      setError(msg);
      return false;
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
        closeOrder,
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
    throw new Error("usePosCart must be used within a PosCartProvider");
  }

  return context;
};
