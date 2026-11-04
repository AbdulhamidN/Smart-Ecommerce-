import React from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useSellerAnalytics } from '../api/admin';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export const SellerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { data: analytics, isLoading, isError } = useSellerAnalytics();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-3xl"></div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load analytics</h2>
        <p className="text-xs text-gray-500 mb-6">Unable to retrieve seller sales data at this time.</p>
        <Link
          to="/seller"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Format data for recharts
  const chartData = analytics.revenueOverTime.map((entry) => ({
    date: entry.date,
    revenue: entry.revenueCents / 100, // in dollars for chart rendering
    revenueCents: entry.revenueCents,
    orderCount: entry.orderCount,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <span>{user?.seller?.storeName || 'Merchant'}</span>
            <span>&bull;</span>
            <span className="text-indigo-600">Performance Overview</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sales Analytics</h1>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start sm:self-auto">
          <Link
            to="/seller"
            className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-lg transition"
          >
            Products
          </Link>
          <span className="px-4 py-1.5 text-xs font-bold bg-white text-indigo-600 shadow-sm rounded-lg">
            Analytics
          </span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Store Revenue
            </span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {formatMoney(analytics.totalRevenueCents)}
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
              {analytics.totalOrders}
            </span>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Units Sold
            </span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {analytics.totalUnitsSold}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Over Time Line Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Revenue Over Time</h2>
            <p className="text-xs text-gray-500">Daily gross merchandise sales trajectory.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start">
            Cumulative Records: {chartData.length} active day(s)
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">No sales data recorded yet.</p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4338ca' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerAnalytics;
