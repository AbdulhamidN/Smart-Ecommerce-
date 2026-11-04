import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  totalOrders: number;
  totalRevenueCents: number;
}

export interface PendingSeller {
  id: string;
  userId: string;
  storeName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
}

export interface AdminOrderItem {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: {
    id: string;
    title: string;
    sku: string;
    images?: { url: string }[];
  };
  seller: {
    id: string;
    storeName: string;
  };
}

export interface AdminOrder {
  id: string;
  customerId: string;
  totalCents: number;
  currency: string;
  status: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingCountry: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: AdminOrderItem[];
}

export interface RevenueTimelineEntry {
  date: string;
  revenueCents: number;
  orderCount: number;
}

export interface SellerAnalytics {
  totalRevenueCents: number;
  totalOrders: number;
  totalUnitsSold: number;
  revenueOverTime: RevenueTimelineEntry[];
}

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/stats');
      return res.data.data;
    },
  });
};

export const usePendingSellers = () => {
  return useQuery<PendingSeller[]>({
    queryKey: ['admin', 'sellers', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/sellers/pending');
      return res.data.data;
    },
  });
};

export const useUpdateSellerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sellerId,
      status,
    }: {
      sellerId: string;
      status: 'APPROVED' | 'REJECTED';
    }) => {
      const res = await apiClient.patch(`/admin/sellers/${sellerId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminOrders = () => {
  return useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/orders');
      return res.data.data;
    },
  });
};

export const useSellerAnalytics = () => {
  return useQuery<SellerAnalytics>({
    queryKey: ['seller', 'analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/analytics');
      return res.data.data;
    },
  });
};
