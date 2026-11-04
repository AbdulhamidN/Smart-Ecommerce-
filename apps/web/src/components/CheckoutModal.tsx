import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCheckout, CartData } from '../api/cart';
import { formatMoney } from '../utils/format';
import { useToast } from '../context/ToastContext';

const checkoutAddressSchema = z.object({
  shippingName: z.string().trim().min(1, 'Full name is required').max(255),
  shippingLine1: z.string().trim().min(1, 'Street address is required').max(255),
  shippingCity: z.string().trim().min(1, 'City is required').max(100),
  shippingCountry: z.string().trim().min(1, 'Country is required').max(100),
});

type CheckoutAddressForm = z.infer<typeof checkoutAddressSchema>;

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartData;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const checkoutMutation = useCheckout();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutAddressForm>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      shippingName: '',
      shippingLine1: '',
      shippingCity: '',
      shippingCountry: 'United States',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CheckoutAddressForm) => {
    setErrorMessage(null);
    try {
      const order = await checkoutMutation.mutateAsync({
        shippingName: data.shippingName,
        shippingLine1: data.shippingLine1,
        shippingCity: data.shippingCity,
        shippingCountry: data.shippingCountry,
      });

      showToast(
        `Order #${order.orderNumber || order.id.slice(0, 8).toUpperCase()} placed successfully!`,
        'success'
      );
      onClose();
      navigate('/orders');
    } catch (err: any) {
      const errCode = err.response?.data?.error?.code;
      if (errCode === 'OUT_OF_STOCK' || errCode === 'INSUFFICIENT_STOCK') {
        setErrorMessage('Sorry, an item went out of stock.');
      } else {
        setErrorMessage(
          err.response?.data?.error?.message || 'An error occurred during checkout. Please try again.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Checkout & Shipping</h3>
            <p className="text-xs text-gray-500">
              Provide delivery details to place your order
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Summary box */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-indigo-900 font-medium">Items ({cart.totalQuantity}):</span>
              <span className="font-semibold text-indigo-900">{formatMoney(cart.totalCents)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-indigo-900 font-medium">Standard Shipping:</span>
              <span className="font-semibold text-indigo-900">FREE</span>
            </div>
            <div className="border-t border-indigo-200 mt-2 pt-2 flex justify-between items-center text-base font-bold text-indigo-950">
              <span>Total Amount:</span>
              <span>{formatMoney(cart.totalCents)}</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Shipping Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Recipient Full Name
              </label>
              <input
                type="text"
                {...register('shippingName')}
                placeholder="Jane Doe"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.shippingName ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                }`}
              />
              {errors.shippingName && (
                <p className="text-xs text-red-600 mt-1">{errors.shippingName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Street Address Line 1
              </label>
              <input
                type="text"
                {...register('shippingLine1')}
                placeholder="123 Market St, Suite 400"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.shippingLine1 ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                }`}
              />
              {errors.shippingLine1 && (
                <p className="text-xs text-red-600 mt-1">{errors.shippingLine1.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  {...register('shippingCity')}
                  placeholder="San Francisco"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.shippingCity ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.shippingCity && (
                  <p className="text-xs text-red-600 mt-1">{errors.shippingCity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Country
                </label>
                <input
                  type="text"
                  {...register('shippingCountry')}
                  placeholder="United States"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.shippingCountry ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.shippingCountry && (
                  <p className="text-xs text-red-600 mt-1">{errors.shippingCountry.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || checkoutMutation.isPending}
                className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || checkoutMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center space-x-2"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>Place Order ({formatMoney(cart.totalCents)})</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
