import React from 'react';
import {
  useAdminStats,
  usePendingSellers,
  useUpdateSellerStatus,
  useAdminOrders,
  PendingSeller,
  AdminOrder,
} from '../api/admin';
import { formatMoney } from '../utils/format';
import { useToast } from '../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: isStatsLoading } = useAdminStats();
  const { data: pendingSellers = [], isLoading: isSellersLoading } = usePendingSellers();
  const { data: orders = [], isLoading: isOrdersLoading } = useAdminOrders();
  const updateStatusMutation = useUpdateSellerStatus();
  const { showToast } = useToast();

  const handleUpdateStatus = async (seller: PendingSeller, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateStatusMutation.mutateAsync({
        sellerId: seller.id,
        status,
      });
      showToast(
        `Seller "${seller.storeName}" has been ${status.toLowerCase()} successfully!`,
        'success'
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.error?.message || `Failed to ${status.toLowerCase()} seller`,
        'error'
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform-wide health metrics, seller approvals, and global order records.
        </p>
      </div>

      {/* 1. Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {isStatsLoading ? '...' : formatMoney(stats?.totalRevenueCents || 0)}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {isStatsLoading ? '...' : stats?.totalOrders || 0}
            </span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Registered Users
            </span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {isStatsLoading ? '...' : stats?.totalUsers || 0}
            </span>
          </div>
        </div>

        {/* Total & Pending Sellers */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Total Sellers
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                {isStatsLoading ? '...' : stats?.totalSellers || 0}
              </span>
              {stats?.pendingSellers ? (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {stats.pendingSellers} Pending
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pending Sellers Approval Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Pending Seller Approvals</h2>
            <p className="text-xs text-gray-500">
              Review and authorize merchants wishing to sell on the marketplace.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
            {pendingSellers.length} Awaiting Review
          </span>
        </div>

        {isSellersLoading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse text-sm">
            Loading pending applications...
          </div>
        ) : pendingSellers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">There are no pending seller applications awaiting review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Store Name</th>
                  <th className="px-6 py-3.5">Applicant Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Application Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingSellers.map((seller: PendingSeller) => (
                  <tr key={seller.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">{seller.storeName}</td>
                    <td className="px-6 py-4 text-gray-700">{seller.user?.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{seller.user?.email}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(seller.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(seller, 'APPROVED')}
                        disabled={updateStatusMutation.isPending}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(seller, 'REJECTED')}
                        disabled={updateStatusMutation.isPending}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Platform Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Platform Orders</h2>
            <p className="text-xs text-gray-500">Live feed of transactions across all sellers.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            {orders.length} Total Orders
          </span>
        </div>

        {isOrdersLoading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse text-sm">
            Loading platform orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: AdminOrder) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 text-xs">{order.customer?.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{order.customer?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700">
                      {order.items?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      {formatMoney(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
