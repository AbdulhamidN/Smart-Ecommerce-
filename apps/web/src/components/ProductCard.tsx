import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '../api/products';
import apiClient from '../api/client';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useAddToCart } from '../api/cart';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: Product;
  hidePrice?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, hidePrice = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const addToCartMutation = useAddToCart();

  const fallbackUrl =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3EGibeMart Item%3C/text%3E%3C/svg%3E";
  
  const imageUrl =
    product.images && product.images.length > 0 && product.images[0]?.url
      ? product.images[0].url
      : fallbackUrl;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  // Prefetch product details on hover for instant navigation
  const handleMouseEnter = () => {
    if (!product?.id) return;
    queryClient.prefetchQuery({
      queryKey: ['product', product.id],
      queryFn: async () => {
        const res = await apiClient.get(`/products/${product.id}`);
        return res.data.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      showToast(`Added "${product.title}" to cart!`, 'success');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = errorObj.response?.data?.error?.message || 'Failed to add item to cart';
      showToast(msg, 'error');
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-stone-200 overflow-hidden transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
    >
      <div>
        {/* Product Image with sleek zoom hover effect */}
        <Link to={`/products/${product.id}`} className="block relative aspect-[4/3] bg-stone-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== fallbackUrl) {
                target.src = fallbackUrl;
              }
            }}
          />

          {/* Gradient subtle shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Stock Badge Overlay */}
          {!hidePrice && (
            <div className="absolute top-3 right-3 z-10">
              {isOutOfStock ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white shadow-md">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-stone-950 shadow-md">
                  Only {product.stock} left
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-600 text-white shadow-md">
                  In Stock
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {product.category?.name || 'General'}
            </span>
            {product.seller?.storeName && (
              <span className="text-[11px] text-stone-400 font-medium truncate max-w-[120px]">
                {product.seller.storeName}
              </span>
            )}
          </div>

          <Link to={`/products/${product.id}`} className="block">
            <h3 className="font-bold text-stone-900 group-hover:text-teal-700 transition-colors line-clamp-1 text-base tracking-tight">
              {product.title}
            </h3>
          </Link>

          {hidePrice ? (
            <p className="mt-1 text-xs text-stone-500 line-clamp-1">
              {product.category?.name ? `Category: ${product.category.name}` : 'Quality Ethiopian Product'}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Price & Action: ONLY when !hidePrice */}
      {!hidePrice && (
        <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between mt-auto bg-stone-50/50">
          <div>
            <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">Price</span>
            <span className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              {formatMoney(product.priceCents)}
            </span>
          </div>

          <button
            disabled={isOutOfStock || addToCartMutation.isPending}
            onClick={handleAddToCart}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                : addToCartMutation.isPending
                ? 'bg-teal-400 text-white cursor-wait'
                : 'bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-teal-600/20'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {isOutOfStock
              ? 'Unavailable'
              : addToCartMutation.isPending
              ? 'Adding...'
              : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
