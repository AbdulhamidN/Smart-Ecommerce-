import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useProduct, useRecommendations } from '../api/products';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useAddToCart } from '../api/cart';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: recommendations = [], isLoading: isRecsLoading } = useRecommendations(id);
  const addToCartMutation = useAddToCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-2xl"></div>
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-24 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The product you are looking for does not exist or may have been unlisted.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const fallbackUrl = `https://placehold.co/800x600/png?text=${encodeURIComponent(product.title)}`;
  const rawImages = product.images && product.images.length > 0
    ? product.images.filter((img) => img && img.url)
    : [];
  const images = rawImages.length > 0
    ? rawImages
    : [{ id: 'default', url: fallbackUrl, sortOrder: 0 }];

  const currentImageUrl = images[selectedImageIndex]?.url || images[0]?.url || fallbackUrl;

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
      });
      showToast(`Added ${quantity} × "${product.title}" to cart!`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to add item to cart';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition">Products</Link>
        <span>/</span>
        <Link to={`/?category=${product.category?.slug}`} className="hover:text-indigo-600 transition capitalize">
          {product.category?.name || 'Category'}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
        {/* Left: Images Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
            <img
              src={currentImageUrl}
              alt={product.title}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIndex === idx ? 'border-indigo-600 shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col justify-between">
          <div className="space-y-6">
            {/* Category & SKU */}
            <div className="flex items-center justify-between">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-md">
                {product.category?.name}
              </span>
              <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
            </div>

            {/* Title & Seller */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {product.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Sold by <span className="font-semibold text-gray-800">{product.seller?.storeName}</span>
              </p>
            </div>

            {/* Price & Stock Badge */}
            <div className="flex items-center gap-4 py-4 border-y border-gray-100">
              <span className="text-3xl font-black text-gray-900 tracking-tight">
                {formatMoney(product.priceCents)}
              </span>

              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Low Stock: Only {product.stock} left!
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    In Stock ({product.stock} units)
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">About this item</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-semibold text-gray-900 min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  (Max: {product.stock})
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-8 mt-6 border-t border-gray-100">
            <button
              disabled={isOutOfStock || addToCartMutation.isPending}
              onClick={handleAddToCart}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                  : addToCartMutation.isPending
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-indigo-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>
                {isOutOfStock
                  ? 'Currently Out of Stock'
                  : addToCartMutation.isPending
                  ? 'Adding to Cart...'
                  : `Add to Cart (${formatMoney(product.priceCents * quantity)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-16 pt-12 border-t border-gray-200/80">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Smart Suggestions
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
              You May Also Like
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Frequently purchased together or popular in this category.
            </p>
          </div>
        </div>

        {isRecsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((recProduct) => (
              <ProductCard key={recProduct.id} product={recProduct} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400">
            No additional recommendations available for this product.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
