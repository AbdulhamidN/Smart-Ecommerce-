import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories, Product } from '../api/products';
import { useCreateProduct, useUpdateProduct } from '../api/seller';

const productFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  sku: z.string().trim().min(1, 'SKU is required').max(100, 'SKU cannot exceed 100 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  priceDollars: z.number().positive('Price must be greater than 0'),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Please select a category'),
  imageUrl: z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: 'Image URL must be a valid URL starting with http:// or https://',
    })
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE']),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface SellerProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SellerProductForm: React.FC<SellerProductFormProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(product);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending;
  const serverError =
    (createProductMutation.error as any)?.response?.data?.error?.message ||
    (updateProductMutation.error as any)?.response?.data?.error?.message ||
    null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: product?.title || '',
      sku: product?.sku || '',
      description: product?.description || '',
      priceDollars: product ? product.priceCents / 100 : 0,
      stock: product ? product.stock : 0,
      categoryId: product?.category?.id || '',
      imageUrl: product?.images?.[0]?.url || '',
      status: (product?.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT') as 'DRAFT' | 'ACTIVE',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        sku: product.sku,
        description: product.description,
        priceDollars: product.priceCents / 100,
        stock: product.stock,
        categoryId: product.category.id,
        imageUrl: product.images?.[0]?.url || '',
        status: product.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
      });
    } else {
      reset({
        title: '',
        sku: '',
        description: '',
        priceDollars: 0,
        stock: 0,
        categoryId: '',
        imageUrl: '',
        status: 'DRAFT',
      });
    }
  }, [product, reset]);

  const onSubmit = async (values: ProductFormValues) => {
    const priceCents = Math.round(values.priceDollars * 100);
    const finalImageUrl =
      values.imageUrl && values.imageUrl.trim().length > 0
        ? values.imageUrl.trim()
        : `https://placehold.co/600x400/png?text=${encodeURIComponent(values.title.slice(0, 20))}`;

    const payload = {
      title: values.title,
      sku: values.sku,
      description: values.description,
      priceCents,
      stock: values.stock,
      categoryId: values.categoryId,
      status: values.status,
      currency: 'USD',
      images: [{ url: finalImageUrl, sortOrder: 0 }],
    };

    try {
      if (isEditing && product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          data: payload,
        });
      } else {
        await createProductMutation.mutateAsync(payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      // Handled by mutation error state
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h3>
            <p className="text-xs text-gray-500">
              {isEditing
                ? 'Update your product details and inventory'
                : 'Add a new product to your store catalog'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-sm text-red-700">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Ergonomic Bluetooth Keyboard"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('sku')}
                placeholder="e.g. PROD-KB-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.sku && (
                <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('categoryId')}
                disabled={categoriesLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Price ($) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Price ($ USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('priceDollars', { valueAsNumber: true })}
                  placeholder="29.99"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.priceDollars && (
                <p className="text-xs text-red-500 mt-1">{errors.priceDollars.message}</p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Initial Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                {...register('stock', { valueAsNumber: true })}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.stock && (
                <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Publish Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ACTIVE">ACTIVE (Visible in catalog)</option>
                <option value="DRAFT">DRAFT (Hidden from catalog)</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                {...register('imageUrl')}
                placeholder="https://placehold.co/600x400/png?text=Preview"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.imageUrl && (
                <p className="text-xs text-red-500 mt-1">{errors.imageUrl.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Provide detailed information regarding features, specifications, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              ></textarea>
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerProductForm;
