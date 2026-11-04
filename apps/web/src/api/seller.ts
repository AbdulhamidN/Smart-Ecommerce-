import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { Product } from './products';

export interface CreateProductInput {
  title: string;
  description: string;
  priceCents: number;
  currency?: string;
  stock?: number;
  categoryId: string;
  sku: string;
  status?: 'DRAFT' | 'ACTIVE';
  images?: { url: string; sortOrder?: number }[];
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  priceCents?: number;
  currency?: string;
  stock?: number;
  categoryId?: string;
  sku?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  images?: { url: string; sortOrder?: number }[];
}

export const useSellerProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['seller', 'products'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/products');
      return res.data.data;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await apiClient.post('/seller/products', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductInput }) => {
      const res = await apiClient.patch(`/seller/products/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
};

export const useArchiveProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/seller/products/${id}`);
      return res.data.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
};
