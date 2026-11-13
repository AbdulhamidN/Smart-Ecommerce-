import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await login(data.email, data.password);
      showToast('Signed in successfully! Welcome to GibeMart.', 'success');

      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        setServerError(err.response.data.error.message);
      } else {
        setServerError('Unable to sign in. Please verify your credentials and try again.');
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
          Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          New to GibeMart?{' '}
          <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 underline">
            Create an account
          </Link>
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
              <label htmlFor="email" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-stone-300'
                  }`}
                  placeholder="customer1@demo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone-500 space-y-2">
            <p>
              Are you a merchant?{' '}
              <Link to="/sell/login" className="font-bold text-amber-600 hover:text-amber-700 underline">
                Sign in as Seller
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
