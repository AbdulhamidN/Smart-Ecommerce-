import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../api/cart';
import { formatMoney } from '../utils/format';
import { CheckoutModal } from '../components/CheckoutModal';
import { useToast } from '../context/ToastContext';

export const Cart: React.FC = () => {
  const { data: cart, isLoading, isError } = useCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const { showToast } = useToast();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isError || !cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Your Cart is Empty
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            Looks like you haven't added anything to your cart yet. Explore our catalog of products and discover great deals.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  const handleUpdateQuantity = async (id: string, newQty: number, maxStock: number) => {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      showToast(`Cannot add more than available stock (${maxStock})`, 'error');
      return;
    }
    try {
      await updateCartItemMutation.mutateAsync({ id, quantity: newQty });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update quantity', 'error');
    }
  };

  const handleRemove = async (id: string, title: string) => {
    try {
      await removeCartItemMutation.mutateAsync(id);
      showToast(`Removed "${title}" from cart`, 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to remove item', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-1">
            You have {cart.totalQuantity} item{cart.totalQuantity === 1 ? '' : 's'} in your cart
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          &larr; Continue Shopping
        </Link>
      </div>

      {hasUnavailableItems && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-amber-800">
            <span className="font-bold">Attention:</span> Some items in your cart exceed available inventory or are no longer available. Please update quantities before checking out.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const product = item.product;
            const imageUrl =
              product.images && product.images.length > 0
                ? product.images[0].url
                : `https://placehold.co/400x300/png?text=${encodeURIComponent(product.title)}`;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition flex flex-col sm:flex-row items-center gap-5 ${
                  !item.isAvailable ? 'border-amber-300 bg-amber-50/20' : 'border-gray-100'
                }`}
              >
                {/* Product Image */}
                <Link
                  to={`/products/${product.id}`}
                  className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100"
                >
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {product.category?.name || 'Item'}
                    </span>
                    {product.seller && (
                      <span className="text-xs text-gray-400">
                        by {product.seller.storeName}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/products/${product.id}`}
                    className="font-bold text-gray-900 hover:text-indigo-600 transition text-base block truncate"
                  >
                    {product.title}
                  </Link>

                  <div className="mt-1 flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-extrabold text-gray-900 text-sm">
                      {formatMoney(product.priceCents)}
                    </span>
                    {product.stock <= 0 ? (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        Out of stock
                      </span>
                    ) : product.stock < item.quantity ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Only {product.stock} available
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <button
                      type="button"
                      disabled={item.quantity <= 1 || updateCartItemMutation.isPending}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, product.stock)}
                      className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold text-gray-800 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= product.stock || updateCartItemMutation.isPending}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, product.stock)}
                      className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition font-bold text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[5rem]">
                    <span className="text-xs text-gray-400 block">Subtotal</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatMoney(item.subtotalCents)}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => handleRemove(item.id, product.title)}
                    disabled={removeCartItemMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-lg font-black text-gray-900 tracking-tight mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.totalQuantity} items)</span>
                <span className="font-semibold text-gray-900">{formatMoney(cart.totalCents)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Standard Shipping</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax</span>
                <span className="font-semibold text-gray-900">$0.00</span>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-indigo-600 tracking-tight">
                  {formatMoney(cart.totalCents)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={hasUnavailableItems}
              className="mt-6 w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition active:scale-98"
            >
              Proceed to Checkout
            </button>

            {hasUnavailableItems && (
              <p className="mt-2 text-xs text-center text-red-500 font-medium">
                Please resolve out-of-stock items before proceeding.
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
      />
    </div>
  );
};

export default Cart;
