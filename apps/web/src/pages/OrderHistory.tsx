import React from 'react';
import { Link } from 'react-router-dom';
import { useOrders, Order, OrderStatus } from '../api/cart';
import { formatMoney } from '../utils/format';

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PAID', label: 'Payment Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'PENDING':
      return -1;
    case 'PAID':
      return 0;
    case 'PROCESSING':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 3;
    case 'CANCELLED':
      return -2;
    default:
      return -1;
  }
};

const OrderTimeline: React.FC<{ status: OrderStatus }> = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>This order has been cancelled and refunded.</span>
      </div>
    );
  }

  const currentIdx = getStepIndex(status);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-0"></div>
        {/* Completed connector progress */}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-0 transition-all duration-500"
          style={{
            width: `${Math.max(0, (Math.min(currentIdx, 3) / 3) * 100 - (currentIdx === 0 ? 0 : 5))}%`,
          }}
        ></div>

        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-50'
                    : isCurrent
                    ? 'bg-white border-2 border-indigo-600 text-indigo-600 ring-4 ring-indigo-100'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                  isCurrent
                    ? 'text-indigo-600'
                    : isDone
                    ? 'text-gray-800'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const OrderHistory: React.FC = () => {
  const { data: orders, isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to load orders</h2>
        <p className="text-xs text-gray-500 mb-4">An error occurred while fetching your orders.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            No Orders Yet
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
            When you purchase items from the catalog, your order receipts and status updates will be listed here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Check the status and history of your recent purchases
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          &larr; Back to Catalog
        </Link>
      </div>

      <div className="space-y-8">
        {orders.map((order: Order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Order ID</span>
                    <span className="text-sm font-bold text-gray-900 font-mono">
                      #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Order Placed</span>
                    <span className="text-sm font-semibold text-gray-700">{dateStr}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Total Amount</span>
                    <span className="text-sm font-black text-indigo-600">
                      {formatMoney(order.totalCents)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : order.status === 'SHIPPED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Order Status Progress
                </span>
                <OrderTimeline status={order.status} />
              </div>

              {/* Order Items & Shipping details */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items column */}
                <div className="md:col-span-2 space-y-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Purchased Items ({order.items.length})
                  </span>
                  {order.items.map((item) => {
                    const imgUrl =
                      item.product.images && item.product.images.length > 0
                        ? item.product.images[0].url
                        : `https://placehold.co/100x100/png?text=${encodeURIComponent(item.product.title)}`;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-b-0"
                      >
                        <img
                          src={imgUrl}
                          alt={item.product.title}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = `https://placehold.co/100x100/png?text=${encodeURIComponent(item.product.title)}`;
                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.productId}`}
                            className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition truncate block"
                          >
                            {item.product.title}
                          </Link>
                          <div className="text-xs text-gray-400 mt-0.5">
                            SKU: {item.product.sku} &bull; Seller: {item.seller?.storeName || 'Merchant'}
                          </div>
                          <div className="text-xs font-semibold text-gray-700 mt-1">
                            Qty: {item.quantity} &times; {formatMoney(item.priceCents)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {formatMoney(item.priceCents * item.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery column */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Shipping Address
                    </span>
                    <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="font-bold text-gray-900">{order.shippingName}</p>
                      <p>{order.shippingLine1}</p>
                      <p>
                        {order.shippingCity}, {order.shippingCountry}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Payment Method
                    </span>
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Credit Card / Simulated Payment (PAID)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
