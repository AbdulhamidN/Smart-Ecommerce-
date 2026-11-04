import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import SellerDashboard from './pages/SellerDashboard';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import { useCart } from './api/cart';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: cart } = useCart(!!user && user.role === 'CUSTOMER');

  const cartQuantity = cart?.totalQuantity || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                S
              </div>
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">
                Smart E-Commerce
              </span>
            </Link>

            <Link
              to="/"
              className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition"
            >
              Catalog
            </Link>

            {user?.role === 'CUSTOMER' && (
              <Link
                to="/orders"
                className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Orders
              </Link>
            )}

            {user?.role === 'SELLER' && (
              <Link
                to="/seller"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Seller Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart Icon (visible to customers and guests) */}
            {(!user || user.role === 'CUSTOMER') && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition flex items-center rounded-lg hover:bg-gray-50"
                aria-label="Shopping Cart"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {cartQuantity > 99 ? '99+' : cartQuantity}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Dashboard
                </Link>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Welcome, <span className="font-semibold text-gray-900">{user.name}</span>{' '}
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">
                    ({user.role})
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Catalog Public Routes */}
                  <Route path="/" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />

                  {/* Customer Cart & Orders */}
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <OrderHistory />
                      </ProtectedRoute>
                    }
                  />

                  {/* Auth Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <Login />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicOnlyRoute>
                        <Register />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Protected Dashboard Route */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Seller Route */}
                  <Route
                    path="/seller"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
