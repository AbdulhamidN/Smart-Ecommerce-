import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    SELLER: 'bg-blue-100 text-blue-800 border-blue-200',
    CUSTOMER: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Dashboard
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Welcome back, <span className="font-semibold text-gray-700">{user.name}</span>. Here is your platform overview.
            </p>
          </div>
        </div>
      </div>

      {/* Profile & Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Account Details
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Name</span>
              <span className="font-medium text-gray-900">{user.name}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Email</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Role</span>
              <span className="font-medium text-gray-900">{user.role}</span>
            </div>
          </div>
        </div>

        {user.seller && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Seller Profile
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Store Name</span>
                <span className="font-medium text-gray-900">{user.seller.storeName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Status</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    user.seller.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : user.seller.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.seller.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Platform Status
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="font-medium text-gray-900">API Connected</span>
            </div>
            <p className="text-gray-500 text-xs">
              Phase 2 Authentication active with secure httpOnly cookies and role-based access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
