import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, useCategories, ProductQueryParams } from '../api/products';
import ProductCard from '../components/ProductCard';

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const currentCategory = searchParams.get('category') || '';
  const currentQ = searchParams.get('q') || '';
  const currentSort = (searchParams.get('sort') as ProductQueryParams['sort']) || 'newest';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Debounced search input state
  const [searchInput, setSearchInput] = useState(currentQ);
  const [debouncedQ, setDebouncedQ] = useState(currentQ);

  // Local price input states (in dollars for easy user input)
  const [minPriceInput, setMinPriceInput] = useState(
    currentMinPrice ? (parseInt(currentMinPrice, 10) / 100).toString() : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    currentMaxPrice ? (parseInt(currentMaxPrice, 10) / 100).toString() : ''
  );

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(currentQ);
    setDebouncedQ(currentQ);
  }, [currentQ]);

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedQ(trimmed);
      if (trimmed !== currentQ) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (trimmed) {
            next.set('q', trimmed);
          } else {
            next.delete('q');
          }
          next.set('page', '1');
          return next;
        }, { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentQ, setSearchParams]);

  // Categories data
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // Query params for useProducts hook
  const queryParams: ProductQueryParams = useMemo(() => {
    const params: ProductQueryParams = {
      page: currentPage,
      limit: 20,
      sort: currentSort,
    };
    if (currentCategory) params.category = currentCategory;
    const activeSearch = debouncedQ || currentQ;
    if (activeSearch) params.q = activeSearch;
    if (currentInStock) params.inStock = true;
    if (currentMinPrice) params.minPrice = parseInt(currentMinPrice, 10);
    if (currentMaxPrice) params.maxPrice = parseInt(currentMaxPrice, 10);
    return params;
  }, [currentPage, currentSort, currentCategory, debouncedQ, currentQ, currentInStock, currentMinPrice, currentMaxPrice]);

  const { data: productsData, isLoading: productsLoading, isFetching } = useProducts(queryParams);

  // Handler for category selection
  const handleCategorySelect = (slug: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) {
        next.set('category', slug);
      } else {
        next.delete('category');
      }
      next.set('page', '1');
      return next;
    });
  };

  // Handler for stock checkbox
  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (e.target.checked) {
        next.set('inStock', 'true');
      } else {
        next.delete('inStock');
      }
      next.set('page', '1');
      return next;
    });
  };

  // Handler for sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sort', e.target.value);
      next.set('page', '1');
      return next;
    });
  };

  // Apply price range
  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (minPriceInput && !isNaN(Number(minPriceInput))) {
        next.set('minPrice', (Math.round(Number(minPriceInput) * 100)).toString());
      } else {
        next.delete('minPrice');
      }
      if (maxPriceInput && !isNaN(Number(maxPriceInput))) {
        next.set('maxPrice', (Math.round(Number(maxPriceInput) * 100)).toString());
      } else {
        next.delete('maxPrice');
      }
      next.set('page', '1');
      return next;
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQ('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams());
  };

  // Clear search input directly
  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedQ('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  // Pagination navigation
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const hasActiveFilters = Boolean(
    currentCategory || debouncedQ || currentQ || currentInStock || currentMinPrice || currentMaxPrice || currentSort !== 'newest'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search Bar & Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse premium electronics, wearables, accessories and more.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              title="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar / Filters */}
        <aside className="w-full lg:w-64 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shrink-0">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="py-5 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Categories</h3>
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1.5 text-sm">
                <li>
                  <button
                    onClick={() => handleCategorySelect('')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition ${
                      currentCategory === ''
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition ${
                        currentCategory === cat.slug
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stock Filter */}
          <div className="py-5 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Availability</h3>
            <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={currentInStock}
                onChange={handleInStockToggle}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="font-medium">In Stock Only</span>
            </label>
          </div>

          {/* Price Range Filter */}
          <div className="py-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Price Range ($)</h3>
            <form onSubmit={handlePriceApply} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="1000"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition"
              >
                Apply Price
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              {productsLoading ? (
                'Loading products...'
              ) : (
                <span>
                  Showing <strong className="text-gray-900">{products.length}</strong> of{' '}
                  <strong className="text-gray-900">{pagination?.total || 0}</strong> products
                  {currentCategory && (
                    <> in <span className="font-semibold text-indigo-600 capitalize">{currentCategory}</span></>
                  )}
                  {(debouncedQ || currentQ) && (
                    <> matching "<span className="font-semibold text-gray-900">{debouncedQ || currentQ}</span>"</>
                  )}
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 text-sm">
              <label htmlFor="sortSelect" className="text-gray-500 shrink-0">Sort by:</label>
              <select
                id="sortSelect"
                value={currentSort}
                onChange={handleSortChange}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid or Skeletons or Empty */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse space-y-4">
                  <div className="aspect-video bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm my-4">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                We couldn't find any products matching your active filters. Try adjusting your search query, price range, or category.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity ${
                isFetching ? 'opacity-70' : 'opacity-100'
              }`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-10 flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  <div className="hidden sm:block text-sm text-gray-700">
                    Page <span className="font-semibold">{pagination.page}</span> of{' '}
                    <span className="font-semibold">{pagination.pages}</span>
                  </div>

                  <button
                    disabled={currentPage >= pagination.pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;
