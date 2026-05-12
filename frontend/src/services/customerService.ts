import api from './api';

export interface CustomerStats {
  todayCustomers: number;
  todayVisitors: number;
}

export interface CustomerData {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  loyaltyPoints: number;
  totalVisits: number;
  totalSpentCents: number;
  lastVisitAt: string | null;
  memberSince: string;
}

export const getCustomers = async (filters: any) => {
  const { data } = await api.get('/customers', { params: filters });
  return data;
};

export const getCustomerDetails = async (id: string) => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

export const adjustLoyaltyPoints = async (id: string, payload: { pointsChange: number; reason: string }) => {
  const { data } = await api.patch(`/customers/${id}/loyalty`, payload);
  return data;
};
