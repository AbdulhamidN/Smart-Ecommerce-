import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Product } from '../api/products';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useAddToCart } from '../api/cart';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const addToCartMutation = useAddToCart();

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : `https://placehold.co/600x400/png?text=${encodeURIComponent(product.title)}`;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

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
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to add item to cart';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <Link to={`/products/${product.id}`} className="block relative aspect-video bg-gray-50 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Stock Badge Overlay */}
          <div className="absolute top-2.5 right-2.5">
            {isOutOfStock ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Low Stock ({product.stock} left)
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                In Stock
              </span>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {product.category?.name || 'General'}
            </span>
            <span>{product.seller?.storeName}</span>
          </div>

          <Link to={`/products/${product.id}`} className="block">
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-base">
              {product.title}
            </h3>
          </Link>

          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Price & Action */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-50 flex items-center justify-between mt-auto">
        <div>
          <span className="text-xs text-gray-400 block">Price</span>
          <span className="text-lg font-bold text-gray-900">
            {formatMoney(product.priceCents)}
          </span>
        </div>

        <button
          disabled={isOutOfStock || addToCartMutation.isPending}
          onClick={handleAddToCart}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : addToCartMutation.isPending
              ? 'bg-indigo-400 text-white cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
          }`}
        >
          {isOutOfStock
            ? 'Out of Stock'
            : addToCartMutation.isPending
            ? 'Adding...'
            : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
