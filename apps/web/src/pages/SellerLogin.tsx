import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const sellerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(1, 'Password is required'),
});

type SellerLoginFormData = z.infer<typeof sellerLoginSchema>;

export const SellerLogin: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SellerLoginFormData>({
    resolver: zodResolver(sellerLoginSchema),
  });

  // If already logged in as seller, redirect to /seller
  if (user && user.role === 'SELLER') {
    return <Navigate to="/seller" replace />;
  }

  const onSubmit = async (data: SellerLoginFormData) => {
    try {
      setServerError(null);
      const loggedUser = await login(data.email, data.password);
      if (loggedUser && loggedUser.role === 'SELLER') {
        showToast('Welcome back to your Seller Dashboard!', 'success');
        navigate('/seller', { replace: true });
      } else {
        showToast('Signed in successfully', 'info');
        navigate('/sell', { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        setServerError(err.response.data.error.message);
      } else {
        setServerError('Unable to sign in as seller. Please verify your credentials.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <Link to="/">
            <img src="/logo.png" alt="GibeMart" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <h2 className="text-center text-3xl font-black text-stone-900 tracking-tight">
          Welcome Back, <span className="text-amber-500">Seller</span>
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Sign in to manage your GibeMart merchant store and orders
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-stone-200">
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="seller-email" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Seller Email
              </label>
              <div className="mt-1">
                <input
                  id="seller-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-stone-300'
                  }`}
                  placeholder="seller1@demo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="seller-password" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="seller-password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-stone-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In as Seller'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone-500 space-y-2">
            <p>
              Don't have a seller account yet?{' '}
              <Link to="/sell" className="font-bold text-teal-600 hover:text-teal-700 underline">
                Register as a Seller
              </Link>
            </p>
            <p>
              Looking for buyer shopping?{' '}
              <Link to="/login" className="font-semibold text-stone-600 hover:text-stone-900 underline">
                Customer Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
