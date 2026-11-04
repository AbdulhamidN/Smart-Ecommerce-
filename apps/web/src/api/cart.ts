import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export interface CartProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface CartProduct {
  id: string;
  title: string;
  priceCents: number;
  stock: number;
  status: string;
  images: CartProductImage[];
  seller?: {
    id: string;
    storeName: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  subtotalCents: number;
  isAvailable: boolean;
  product: CartProduct;
}

export interface CartData {
  items: CartItem[];
  totalCents: number;
  totalQuantity: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemProduct {
  id: string;
  title: string;
  sku: string;
  images?: { url: string }[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  priceCents: number;
  product: OrderItemProduct;
  seller: {
    id: string;
    storeName: string;
  };
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  subtotalCents?: number;
  shippingCents?: number;
  totalCents: number;
  status: OrderStatus;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingCountry: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface CheckoutPayload {
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingCountry: string;
}

export const useCart = (enabled: boolean = true) => {
  return useQuery<CartData>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await apiClient.get('/cart');
      return res.data.data;
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const res = await apiClient.post('/cart', { productId, quantity });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await apiClient.patch(`/cart/${id}`, { quantity });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/cart/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const idempotencyKey = crypto.randomUUID();
      const res = await apiClient.post('/orders', payload, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return res.data.data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useOrders = (enabled: boolean = true) => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders');
      return res.data.data;
    },
    enabled,
  });
};

export const useOrder = (id: string) => {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
