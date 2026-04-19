import api from './api';

export type SummaryResponse = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
};

export type TrendPoint = {
  date: string;
  value: number;
};

export type TopItem = {
  name: string;
  quantity: number;
};

export type CategorySale = {
  category: string;
  value: number;
};

export type AnalyticsResponse = {
  revenueTrend: TrendPoint[];
  ordersTrend: TrendPoint[];
  topItems: TopItem[];
  categorySales: CategorySale[];
};

export type Order = {
  id: string;
  billNumber: number;
  total: number;
  status: string;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
};

export type AnalyticsParams = {
  startDate?: string;
  endDate?: string;
};

export type CloseDayResponse = {
  success: boolean;
  businessDate: string;
  closedAt: string;
  billsCount: number;
  revenue: number;
  lockNote: string;
};

type ApiSummaryPayload = {
  revenue?: unknown;
  orders?: unknown;
  avgOrderValue?: unknown;
  totalRevenue?: unknown;
  totalOrders?: unknown;
  averageOrderValue?: unknown;
};

type ApiAnalyticsPayload = {
  revenueTrend?: Array<{ date?: unknown; value?: unknown }>;
  ordersTrend?: Array<{ date?: unknown; value?: unknown }>;
  topItems?: Array<{ name?: unknown; quantity?: unknown }>;
  categorySales?: Array<{ category?: unknown; value?: unknown; revenue?: unknown }>;
};

type ApiOrderPayload = {
  id?: unknown;
  billNumber?: unknown;
  orderNumber?: unknown;
  total?: unknown;
  totalAmount?: unknown;
  status?: unknown;
  createdAt?: unknown;
};

type ApiInventoryPayload = {
  id?: unknown;
  name?: unknown;
  currentStock?: unknown;
  quantity?: unknown;
  minStock?: unknown;
  lowStockThreshold?: unknown;
};

type ApiCloseDayPayload = {
  success?: unknown;
  businessDate?: unknown;
  closedAt?: unknown;
  billsCount?: unknown;
  revenue?: unknown;
  lockNote?: unknown;
};

const toNumber = (value: unknown): number => Number(value || 0);

const toText = (value: unknown): string => (typeof value === 'string' ? value : String(value || ''));

const toBlob = (value: unknown): Blob =>
  value instanceof Blob ? value : new Blob([value as BlobPart], { type: 'text/csv;charset=utf-8;' });

const request = async <T>(
  path: string,
  options?: { params?: Record<string, string | number>; responseType?: 'blob' },
): Promise<T> => {
  const response = await api.get(path, options);
  return response.data as T;
};

export const reportsService = {
  async getSummary(): Promise<SummaryResponse> {
    const payload = await request<ApiSummaryPayload>('/reports/summary');

    return {
      totalRevenue: toNumber(payload.totalRevenue ?? payload.revenue),
      totalOrders: toNumber(payload.totalOrders ?? payload.orders),
      averageOrderValue: toNumber(payload.averageOrderValue ?? payload.avgOrderValue),
    };
  },

  async getAnalytics(params?: AnalyticsParams): Promise<AnalyticsResponse> {
    const query: Record<string, string> = {};

    if (params?.startDate) {
      query.startDate = params.startDate;
    }

    if (params?.endDate) {
      query.endDate = params.endDate;
    }

    const payload = await request<ApiAnalyticsPayload>('/reports/analytics', {
      params: query,
    });

    return {
      revenueTrend: Array.isArray(payload.revenueTrend)
        ? payload.revenueTrend.map((row) => ({
            date: toText(row.date),
            value: toNumber(row.value),
          }))
        : [],
      ordersTrend: Array.isArray(payload.ordersTrend)
        ? payload.ordersTrend.map((row) => ({
            date: toText(row.date),
            value: toNumber(row.value),
          }))
        : [],
      topItems: Array.isArray(payload.topItems)
        ? payload.topItems.map((row) => ({
            name: toText(row.name),
            quantity: toNumber(row.quantity),
          }))
        : [],
      categorySales: Array.isArray(payload.categorySales)
        ? payload.categorySales.map((row) => ({
            category: toText(row.category),
            value: toNumber(row.value ?? row.revenue),
          }))
        : [],
    };
  },

  async getRecentOrders(limit = 15): Promise<Order[]> {
    const payload = await request<ApiOrderPayload[]>('/bills', {
      params: {
        limit,
      },
    });

    return Array.isArray(payload)
      ? payload.map((row) => ({
          id: toText(row.id),
          billNumber: toNumber(row.billNumber ?? row.orderNumber),
          total: toNumber(row.total ?? row.totalAmount),
          status: toText(row.status),
          createdAt: toText(row.createdAt),
        }))
      : [];
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const payload = await request<ApiInventoryPayload[]>('/inventory/low-stock');

    return Array.isArray(payload)
      ? payload.map((row) => ({
          id: toText(row.id),
          name: toText(row.name),
          currentStock: toNumber(row.currentStock ?? row.quantity),
          minStock: toNumber(row.minStock ?? row.lowStockThreshold),
        }))
      : [];
  },

  async exportReport(): Promise<Blob> {
    const response = await api.get('/reports/export?format=csv', {
      responseType: 'blob',
    });

    return toBlob(response.data);
  },

  async closeDay(businessDate?: string): Promise<CloseDayResponse> {
    const response = await api.post('/reports/close-day', {
      businessDate,
    });
    const payload = response.data as ApiCloseDayPayload | undefined;

    return {
      success: Boolean(payload?.success),
      businessDate: toText(payload?.businessDate),
      closedAt: toText(payload?.closedAt),
      billsCount: toNumber(payload?.billsCount),
      revenue: toNumber(payload?.revenue),
      lockNote: toText(payload?.lockNote),
    };
  },
};
