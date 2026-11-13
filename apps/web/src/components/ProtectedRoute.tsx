import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl shadow-md text-center border border-stone-200">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold">403</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Access Forbidden</h1>
        <p className="text-stone-600 mb-6 text-sm">
          Your account role (<span className="font-semibold">{user.role}</span>) does not have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
