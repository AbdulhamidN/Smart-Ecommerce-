import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['CUSTOMER', 'SELLER']),
    storeName: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'SELLER' && (!data.storeName || data.storeName.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Store name is required when registering as a Seller',
      path: ['storeName'],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CUSTOMER',
      name: '',
      email: '',
      password: '',
      storeName: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        storeName: data.role === 'SELLER' ? data.storeName : undefined,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        setServerError(err.response.data.error.message);
      } else {
        setServerError('Unable to create account. Please check your inputs and try again.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl sm:px-10 border border-gray-100">
          {serverError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{serverError}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Jane Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="jane@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center py-2.5 px-3 border rounded-lg cursor-pointer text-sm font-medium transition ${
                    selectedRole === 'CUSTOMER'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value="CUSTOMER"
                    {...register('role')}
                    className="sr-only"
                  />
                  <span>Customer</span>
                </label>

                <label
                  className={`flex items-center justify-center py-2.5 px-3 border rounded-lg cursor-pointer text-sm font-medium transition ${
                    selectedRole === 'SELLER'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value="SELLER"
                    {...register('role')}
                    className="sr-only"
                  />
                  <span>Seller</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {selectedRole === 'SELLER' && (
              <div className="pt-1 transition-all">
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                  Store Name
                </label>
                <div className="mt-1">
                  <input
                    id="storeName"
                    type="text"
                    {...register('storeName')}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      errors.storeName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="My Brand Store"
                  />
                  {errors.storeName && (
                    <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
