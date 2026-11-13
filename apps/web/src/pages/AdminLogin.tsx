import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid administrator email').trim(),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export const AdminLogin: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  // If already logged in as ADMIN, redirect to /admin
  if (user && user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      setServerError(null);
      const loggedUser = await login(data.email, data.password);

      if (!loggedUser || loggedUser.role !== 'ADMIN') {
        await logout();
        setServerError('Access denied. This portal is strictly restricted to system administrators.');
        showToast('Access denied: Administrator privileges required', 'error');
        return;
      }

      showToast('Welcome to GibeMart Admin Control Panel', 'success');
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        setServerError(err.response.data.error.message);
      } else {
        setServerError('Invalid administrator credentials.');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-900 text-stone-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white font-black text-2xl mx-auto flex items-center justify-center shadow-lg border border-rose-400/30 mb-4">
          🛡️
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight">
          Admin Control Center
        </h2>
        <p className="mt-2 text-center text-xs font-semibold uppercase tracking-widest text-stone-400">
          Authorized Personnel Only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-stone-700">
          {serverError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-700 text-xs font-semibold text-red-200 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Administrator Email
              </label>
              <div className="mt-1">
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-900 border rounded-xl shadow-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                    errors.email ? 'border-red-500' : 'border-stone-700'
                  }`}
                  placeholder="admin@demo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400 font-semibold">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`appearance-none block w-full px-3.5 py-2.5 bg-stone-900 border rounded-xl shadow-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                    errors.password ? 'border-red-500' : 'border-stone-700'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400 font-semibold">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Admin Console'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-700/60 text-center text-[11px] text-stone-500">
            Internal GibeMart Platform · All administrative sessions are audited.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
