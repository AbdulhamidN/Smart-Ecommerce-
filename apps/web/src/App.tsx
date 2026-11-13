import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerLogin from './pages/SellerLogin';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import SellerDashboard from './pages/SellerDashboard';
import SellerAnalytics from './pages/SellerAnalytics';
import SellerOnboarding from './pages/SellerOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
            <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Catalog Public Routes */}
                  <Route path="/" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/sell" element={<SellerOnboarding />} />
                  <Route path="/sell/login" element={<SellerLogin />} />

                  {/* Secret Admin Login */}
                  <Route path="/admin/login" element={<AdminLogin />} />

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

                  {/* Admin Route */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Seller Dashboard & Analytics */}
                  <Route
                    path="/seller"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/analytics"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerAnalytics />
                      </ProtectedRoute>
                    }
                  />

                  {/* Customer Auth Routes */}
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

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
