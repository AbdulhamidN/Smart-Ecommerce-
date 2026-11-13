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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-bold flex items-center justify-center shadow-md">
            G
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">GibeMart Admin Control Panel</h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Marketplace performance in ETB, merchant store approvals, and platform order management.
        </p>
      </div>

      {/* 1. Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-lg border border-emerald-100">
            ETB
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {isStatsLoading ? '...' : formatMoney(stats?.totalRevenueCents || 0)}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Platform Orders
            </span>
            <span className="text-2xl font-black text-stone-900 tracking-tight">
              {isStatsLoading ? '...' : stats?.totalOrders || 0}
            </span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Registered Users
            </span>
            <span className="text-2xl font-black text-stone-900 tracking-tight">
              {isStatsLoading ? '...' : stats?.totalUsers || 0}
            </span>
          </div>
        </div>

        {/* Total & Pending Sellers */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Store Merchants
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-stone-900 tracking-tight">
                {isStatsLoading ? '...' : stats?.totalSellers || 0}
              </span>
              {stats?.pendingSellers ? (
                <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {stats.pendingSellers} Pending
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pending Sellers Approval Section */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">Pending Merchant Store Approvals</h2>
            <p className="text-xs text-stone-500">
              Review and authorize Ethiopian sellers wishing to list products on GibeMart.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200">
            {pendingSellers.length} Awaiting Approval
          </span>
        </div>

        {isSellersLoading ? (
          <div className="p-8 text-center text-stone-400 animate-pulse text-xs font-semibold">
            Loading pending merchant applications...
          </div>
        ) : pendingSellers.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-bold text-stone-800">All caught up!</p>
            <p className="text-xs text-stone-400 mt-1">There are no pending seller applications awaiting review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-stone-600">
              <thead className="bg-stone-50 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="px-6 py-3.5">Store Name</th>
                  <th className="px-6 py-3.5">Merchant Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pendingSellers.map((seller: PendingSeller) => (
                  <tr key={seller.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-6 py-4 font-bold text-stone-900">{seller.storeName}</td>
                    <td className="px-6 py-4 text-stone-700 font-medium">{seller.user?.name}</td>
                    <td className="px-6 py-4 text-stone-500 font-mono text-xs">{seller.user?.email}</td>
                    <td className="px-6 py-4 text-stone-500 text-xs">
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
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(seller, 'REJECTED')}
                        disabled={updateStatusMutation.isPending}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
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
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">Recent Platform Orders</h2>
            <p className="text-xs text-stone-500">Live feed of transactions across Ethiopia.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-stone-100 text-stone-700 rounded-full">
            {orders.length} Total Orders
          </span>
        </div>

        {isOrdersLoading ? (
          <div className="p-8 text-center text-stone-400 animate-pulse text-xs font-semibold">
            Loading platform orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">No orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-stone-600">
              <thead className="bg-stone-50 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order: AdminOrder) => (
                  <tr key={order.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-stone-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-800 text-xs">{order.customer?.name}</p>
                      <p className="text-[11px] text-stone-400 font-mono">{order.customer?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-700 font-medium">
                      {order.items?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-800'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-stone-900">
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
