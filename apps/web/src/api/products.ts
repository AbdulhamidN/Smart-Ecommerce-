import { useQuery } from '@tanstack/react-query';
import apiClient from './client';

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Seller {
  id: string;
  storeName: string;
  status?: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  category: Category;
  seller: Seller;
  images: ProductImage[];
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  q?: string;
}

export const useProducts = (params?: ProductQueryParams) => {
  const queryParams = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    sort: params?.sort ?? 'newest',
    category: params?.category || undefined,
    minPrice: params?.minPrice !== undefined && !isNaN(params.minPrice) ? params.minPrice : undefined,
    maxPrice: params?.maxPrice !== undefined && !isNaN(params.maxPrice) ? params.maxPrice : undefined,
    inStock: params?.inStock ? true : undefined,
    q: params?.q?.trim() || undefined,
  };

  return useQuery<ProductsResponse>({
    queryKey: ['products', queryParams],
    queryFn: async () => {
      const res = await apiClient.get('/products', {
        params: queryParams,
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useProduct = (id?: string) => {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data;
    },
  });
};

export const useRecommendations = (id?: string) => {
  return useQuery<Product[]>({
    queryKey: ['recommendations', id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}/recommendations`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
