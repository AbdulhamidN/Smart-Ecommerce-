import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSellerProducts, useArchiveProduct } from '../api/seller';
import { Product } from '../api/products';
import { formatMoney } from '../utils/format';
import SellerProductForm from './SellerProductForm';

export const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: products = [], isLoading, error } = useSellerProducts();
  const archiveMutation = useArchiveProduct();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const storeName = user?.seller?.storeName || `${user?.name}'s Store`;

  const handleCreateClick = () => {
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
      } finally {
        setArchivingId(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {storeName}
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              Seller Portal
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Manage your store inventory, publish new listings, and update product pricing.
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shrink-0 gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Product
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          Failed to load seller products. Please refresh or try again later.
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              You haven't listed any products in your store catalog yet. Start by creating your first product listing.
            </p>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition shadow-sm gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {products.map((product) => {
                  const firstImage = product.images?.[0]?.url || 'https://placehold.co/100x100?text=No+Image';
                  const isArchived = product.status === 'ARCHIVED';
                  const isThisArchiving = archivingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isArchived ? 'opacity-60 bg-gray-50/50' : ''
                      }`}
                    >
                      {/* Title & Thumbnail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={firstImage}
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Item';
                            }}
                          />
                          <div className="max-w-xs">
                            <div className="font-semibold text-gray-900 truncate" title={product.title}>
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-400 line-clamp-1 truncate">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">
                        {product.sku}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {formatMoney(product.priceCents)}
                      </td>

                      {/* Stock Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            Out of Stock
                          </span>
                        ) : product.stock <= 3 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Low Stock ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {product.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : product.status === 'DRAFT' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          disabled={isArchived}
                          className="px-2.5 py-1.5 text-indigo-600 hover:text-indigo-900 font-semibold rounded hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Edit
                        </button>
                        {!isArchived ? (
                          <button
                            onClick={() => handleArchiveClick(product.id)}
                            disabled={isThisArchiving}
                            className="px-2.5 py-1.5 text-red-600 hover:text-red-900 font-semibold rounded hover:bg-red-50 disabled:opacity-40 transition"
                          >
                            {isThisArchiving ? 'Archiving...' : 'Archive'}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic px-2 py-1 select-none">
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
