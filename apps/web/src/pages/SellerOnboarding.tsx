import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const sellerRegisterSchema = z.object({
  name: z.string().min(1, 'Full name is required').trim(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  storeName: z.string().min(1, 'Store name is required').trim(),
});

type SellerRegisterFormData = z.infer<typeof sellerRegisterSchema>;

export const SellerOnboarding: React.FC = () => {
  const { user, isLoading, register: registerAuth, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SellerRegisterFormData>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      storeName: '',
    },
  });

  // If loading session, avoid flicker
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. If logged in as SELLER: Redirect to /seller dashboard
  if (user && user.role === 'SELLER') {
    return <Navigate to="/seller" replace />;
  }

  // 2. If logged in as CUSTOMER: Show message
  if (user && user.role === 'CUSTOMER') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-stone-200 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-brand-gold mx-auto flex items-center justify-center mb-6 shadow-sm border border-amber-200">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Buyer Account Detected
          </h2>
          <p className="mt-4 text-base text-stone-600 max-w-lg mx-auto leading-relaxed">
            You are currently logged in as a buyer. Please log out to register a seller account.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={async () => {
                await logout();
                showToast('Signed out. You can now register as a seller.', 'info');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition"
            >
              Log Out & Register Seller
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition"
            >
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin edge case
  if (user && user.role === 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone-200">
          <h2 className="text-2xl font-bold text-stone-900">Admin Account Detected</h2>
          <p className="mt-2 text-stone-600 text-sm">You are logged in as an administrator.</p>
          <div className="mt-6">
            <Link
              to="/admin"
              className="inline-flex px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm"
            >
              Go to Admin Control Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. If logged out: Show split screen + 3-step guide + Register as a Seller form
  const onSubmit = async (data: SellerRegisterFormData) => {
    try {
      setServerError(null);
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'SELLER',
        storeName: data.storeName,
      });

      showToast('Your store is pending Admin approval. You cannot add products yet.', 'info');
      navigate('/seller', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        setServerError(err.response.data.error.message);
      } else {
        setServerError('Unable to create seller account. Please verify your information and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Split Screen Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          {/* Subtle warm gold decorative glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Column: "Sell with GibeMart" text */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold tracking-wide uppercase border border-amber-400/30">
              <span>✦ Ethiopia's Trusted Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Sell with <span className="text-amber-400">GibeMart</span>
            </h1>
            <p className="text-stone-200 text-sm sm:text-base leading-relaxed max-w-xl">
              Turn your business into an Ethiopian e-commerce powerhouse. Reach thousands of active shoppers in Addis Ababa and across all regional states with secure payments, instant telebirr settlements, and merchant support.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-100">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                Instant telebirr & CBE integration
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-100">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                Zero upfront store listing fees
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-100">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                Real-time inventory & sales insights
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-100">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                Rapid dispatch with local couriers
              </div>
            </div>
          </div>

          {/* Right Column: "Sign In" button for existing sellers */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-stone-950 font-black text-xl mx-auto flex items-center justify-center shadow-md">
              🏪
            </div>
            <h3 className="text-xl font-bold text-white">Already a GibeMart Seller?</h3>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              Log in to manage your inventory, process pending customer orders, and view sales performance.
            </p>
            <div className="pt-2">
              <Link
                to="/sell/login"
                className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-lg transition transform hover:-translate-y-0.5"
              >
                Sign In as Seller
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 3-Step Guide: "How to Sell on GibeMart" */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              How to Sell on <span className="text-teal-600">GibeMart</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Get your storefront up and running in 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-200 relative overflow-hidden group hover:border-teal-500 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Register Your Store</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Provide your personal details, email, and distinct merchant store name below to establish your official vendor account.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-200 relative overflow-hidden group hover:border-teal-500 transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">List Your Products</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Add your merchandise with descriptions, photography, stock levels, and prices denominated in Ethiopian Birr (ETB).
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-200 relative overflow-hidden group hover:border-teal-500 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Ship & Get Paid</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Receive order notifications, dispatch products through courier partners, and enjoy fast payouts via telebirr or bank deposit.
              </p>
            </div>
          </div>
        </div>

        {/* "Register as a Seller" Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-stone-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Register as a <span className="text-teal-600">Seller</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2">
              Create your merchant profile and launch your online store today.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="seller-name" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Full Name *
              </label>
              <div className="mt-1">
                <input
                  id="seller-name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  placeholder="e.g. Almaz Bekele"
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${
                    errors.name ? 'border-red-300' : 'border-stone-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="seller-email" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Email Address *
              </label>
              <div className="mt-1">
                <input
                  id="seller-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="store@example.com"
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-stone-300'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="seller-password" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Password *
              </label>
              <div className="mt-1">
                <input
                  id="seller-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  placeholder="At least 8 characters"
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-stone-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Store Name */}
            <div>
              <label htmlFor="seller-storeName" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Store Name *
              </label>
              <div className="mt-1">
                <input
                  id="seller-storeName"
                  type="text"
                  {...register('storeName')}
                  placeholder="e.g. Abyssinia Coffee Roasters"
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${
                    errors.storeName ? 'border-red-300' : 'border-stone-300'
                  }`}
                />
                {errors.storeName && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.storeName.message}</p>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-stone-500">
                Note: All seller accounts are submitted for Admin verification before product listing is unlocked.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Seller Account...' : 'Register as a Seller'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SellerOnboarding;
