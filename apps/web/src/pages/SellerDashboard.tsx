import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSellerProducts, useArchiveProduct } from '../api/seller';
import { Product } from '../api/products';
import { formatMoney } from '../utils/format';
import { useToast } from '../context/ToastContext';
import SellerProductForm from './SellerProductForm';

export const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: products = [], isLoading, error } = useSellerProducts();
  const archiveMutation = useArchiveProduct();
  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const storeName = user?.seller?.storeName || `${user?.name}'s Store`;
  const isPendingApproval = user?.seller?.status === 'PENDING';

  const handleCreateClick = () => {
    if (isPendingApproval) {
      showToast('Your store is pending Admin approval. You cannot add products yet.', 'info');
      return;
    }
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleArchiveClick = async (productId: string) => {
    if (window.confirm('Are you sure you want to archive this product? It will be hidden from the catalog.')) {
      try {
        setArchivingId(productId);
        await archiveMutation.mutateAsync(productId);
        showToast('Product archived successfully', 'success');
      } finally {
        setArchivingId(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Pending Status Alert Banner */}
      {isPendingApproval && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0 text-amber-900 font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-900">
                Your store is pending Admin approval. You cannot add products yet.
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Our team reviews merchant accounts promptly. Once an Admin approves your application, your catalog tools will automatically activate.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wider shrink-0">
            Pending Review
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {storeName}
            </h1>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              isPendingApproval
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isPendingApproval ? 'Pending Approval' : 'Verified Merchant'}
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-500">
            Manage your GibeMart store inventory, publish new listings, and update prices in ETB.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl">
            <span className="px-3.5 py-1.5 text-xs font-bold bg-white text-emerald-700 shadow-sm rounded-xl">
              Products
            </span>
            <Link
              to="/seller/analytics"
              className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 rounded-xl transition"
            >
              Analytics
            </Link>
          </div>

          <button
            onClick={handleCreateClick}
            disabled={isPendingApproval}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition gap-2 ${
              isPendingApproval
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
            }`}
            title={isPendingApproval ? 'Your store is pending Admin approval. You cannot add products yet.' : 'Create a new product listing'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Create Product
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
          Failed to load seller products. Please refresh or try again later.
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">No products yet</h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6">
              {isPendingApproval
                ? 'Your store is currently pending approval. Once verified, you will be able to create and list products.'
                : 'You haven\'t listed any products in your store catalog yet. Start by creating your first product listing.'}
            </p>
            <button
              onClick={handleCreateClick}
              disabled={isPendingApproval}
              className={`inline-flex items-center px-4 py-2 font-bold text-xs rounded-xl transition shadow-sm gap-2 ${
                isPendingApproval
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead className="bg-stone-50 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Product</th>
                  <th scope="col" className="px-6 py-3.5">SKU</th>
                  <th scope="col" className="px-6 py-3.5">Category</th>
                  <th scope="col" className="px-6 py-3.5">Price</th>
                  <th scope="col" className="px-6 py-3.5">Stock</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white text-xs sm:text-sm">
                {products.map((product) => {
                  const firstImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=100&q=80';
                  const isArchived = product.status === 'ARCHIVED';
                  const isThisArchiving = archivingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isArchived ? 'opacity-60 bg-stone-50/50' : ''
                      }`}
                    >
                      {/* Title & Thumbnail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={firstImage}
                            alt={product.title}
                            className="w-10 h-10 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=100&q=80';
                            }}
                          />
                          <div className="max-w-xs">
                            <div className="font-bold text-stone-900 truncate" title={product.title}>
                              {product.title}
                            </div>
                            <div className="text-[11px] text-stone-400 line-clamp-1 truncate">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-stone-600">
                        {product.sku}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap font-black text-stone-900">
                        {formatMoney(product.priceCents)}
                      </td>

                      {/* Stock Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : product.stock <= 3 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Low Stock ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {product.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : product.status === 'DRAFT' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          disabled={isArchived}
                          className="px-2.5 py-1.5 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Edit
                        </button>
                        {!isArchived ? (
                          <button
                            onClick={() => handleArchiveClick(product.id)}
                            disabled={isThisArchiving}
                            className="px-2.5 py-1.5 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50 disabled:opacity-40 transition"
                          >
                            {isThisArchiving ? 'Archiving...' : 'Archive'}
                          </button>
                        ) : (
                          <span className="text-stone-400 italic px-2 py-1 select-none">
                            Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <SellerProductForm
          product={editingProduct}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
