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
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-xl shadow-md text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold">403</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Forbidden</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Your account role (<span className="font-semibold">{user.role}</span>) does not have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
