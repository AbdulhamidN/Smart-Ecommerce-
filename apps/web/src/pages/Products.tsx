import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts, useCategories, ProductQueryParams, Category } from '../api/products';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

interface DynamicCategorySectionProps {
  category: Category;
  onSelectCategory: (slug: string) => void;
}

const DynamicCategorySection: React.FC<DynamicCategorySectionProps> = ({
  category,
  onSelectCategory,
}) => {
  const { data, isLoading } = useProducts({ limit: 8, category: category.slug });

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
            {category.name}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Explore our handpicked collection of {category.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectCategory(category.slug)}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
        >
          See All {category.name} →
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse space-y-3">
              <div className="aspect-[4/3] bg-stone-200 rounded-xl" />
              <div className="h-4 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {(data?.data || []).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} hidePrice={true} />
          ))}
        </div>
      )}

      {/* Bottom-right See All button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => onSelectCategory(category.slug)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border border-stone-200 shadow-sm transition"
        >
          See All {category.name}
          <span className="text-teal-600">→</span>
        </button>
      </div>
    </section>
  );
};

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Parameters
  const currentCategory = searchParams.get('category') || '';
  const currentQ = searchParams.get('q') || '';
  const currentSort = (searchParams.get('sort') as ProductQueryParams['sort']) || 'newest';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Search input state
  const [searchInput, setSearchInput] = useState(currentQ);
  const [debouncedQ, setDebouncedQ] = useState(currentQ);

  // Price range inputs (in ETB Birr, stored in cents in query params)
  const [minPriceInput, setMinPriceInput] = useState(
    currentMinPrice ? (parseInt(currentMinPrice, 10) / 100).toString() : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    currentMaxPrice ? (parseInt(currentMaxPrice, 10) / 100).toString() : ''
  );

  // Category bar dropdown state
  const [catBarOpen, setCatBarOpen] = useState(false);
  const catBarDropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if URL search query changes externally (e.g. from header)
  useEffect(() => {
    setSearchInput(currentQ);
    setDebouncedQ(currentQ);
  }, [currentQ]);

  // Click outside listener for category bar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catBarDropdownRef.current && !catBarDropdownRef.current.contains(event.target as Node)) {
        setCatBarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedQ(trimmed);
      if (trimmed !== currentQ) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (trimmed) {
              next.set('q', trimmed);
            } else {
              next.delete('q');
            }
            next.set('page', '1');
            return next;
          },
          { replace: true }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentQ, setSearchParams]);

  // Categories data from API
  const { data: categories = [] } = useCategories();
  const queryClient = useQueryClient();

  // Prefetch category products on hover for ultra-fast category switching
  const handlePrefetchCategory = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: [
        'products',
        {
          page: 1,
          limit: 12,
          sort: currentSort,
          category: slug || undefined,
          minPrice: undefined,
          maxPrice: undefined,
          inStock: undefined,
          q: undefined,
        },
      ],
      queryFn: async () => {
        const res = await apiClient.get('/products', {
          params: { page: 1, limit: 12, sort: currentSort, category: slug || undefined },
        });
        return res.data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  // Exactly the 5 MOST POPULAR categories for quick links on the bar
  const popularCategories = useMemo(() => {
    if (categories.length === 0) return [];
    const preferredSlugs = ['coffee-spices', 'tech', 'traditional-heritage', 'phones', 'laptops'];
    const matched = preferredSlugs
      .map((slug) => categories.find((c) => c.slug === slug))
      .filter((c): c is (typeof categories)[0] => !!c);

    if (matched.length >= 5) return matched.slice(0, 5);
    const remaining = categories.filter((c) => !matched.some((m) => m.id === c.id));
    return [...matched, ...remaining].slice(0, 5);
  }, [categories]);

  // Find category slugs for distinct homepage sections
  const techCategory = categories.find(
    (c) => c.slug === 'tech' || c.slug.includes('tech') || c.slug.includes('electronic') || c.slug === 'laptops'
  );
  const techCategorySlug = techCategory?.slug || 'tech';

  const fashionCategory = categories.find(
    (c) => c.slug === 'traditional-heritage' || c.slug.includes('fashion') || c.slug.includes('heritage')
  );
  const fashionCategorySlug = fashionCategory?.slug || 'traditional-heritage';

  // Remaining categories for infinite category loop (excluding the initial featured ones)
  const remainingCategories = useMemo(() => {
    return categories.filter(
      (c) => c.slug !== techCategorySlug && c.slug !== fashionCategorySlug
    );
  }, [categories, techCategorySlug, fashionCategorySlug]);

  const [loadedCategoryCount, setLoadedCategoryCount] = useState(0);

  // State to determine if we are in Category / Search View or Default Homepage View
  const isCategoryView = Boolean(currentCategory || debouncedQ || currentQ);

  // Main Category / Search Catalog Query
  const catalogQueryParams: ProductQueryParams = useMemo(() => {
    const params: ProductQueryParams = {
      page: currentPage,
      limit: 12,
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

  const { data: catalogData, isLoading: catalogLoading, isFetching: catalogFetching } = useProducts(
    isCategoryView ? catalogQueryParams : undefined
  );

  // Queries for Default Homepage Grids (8 items each, 2 rows of 4)
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useProducts(
    !isCategoryView ? { limit: 8, sort: 'newest' } : undefined
  );

  const { data: techData, isLoading: techLoading } = useProducts(
    !isCategoryView ? { limit: 8, category: techCategorySlug } : undefined
  );

  const { data: fashionData, isLoading: fashionLoading } = useProducts(
    !isCategoryView ? { limit: 8, category: fashionCategorySlug } : undefined
  );

  const handleCategorySelect = (slug: string) => {
    setCatBarOpen(false);
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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sort', e.target.value);
      next.set('page', '1');
      return next;
    });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (minPriceInput && !isNaN(Number(minPriceInput))) {
        next.set('minPrice', Math.round(Number(minPriceInput) * 100).toString());
      } else {
        next.delete('minPrice');
      }
      if (maxPriceInput && !isNaN(Number(maxPriceInput))) {
        next.set('maxPrice', Math.round(Number(maxPriceInput) * 100).toString());
      } else {
        next.delete('maxPrice');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQ('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedQ('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
    const catalogElement = document.getElementById('catalog-view-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const catalogProducts = catalogData?.data || [];
  const pagination = catalogData?.pagination;
  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);

  // Carousel curated items
  const carouselItems = [
    {
      title: 'Traditional Habesha Fashion',
      category: "Men's & Women's Fashion",
      slug: 'traditional-heritage',
      image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'High-End Laptops & Ultrabooks',
      category: 'Electronics & Computing',
      slug: 'tech',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Ethiopian Yirgacheffe Specialty Coffee',
      category: 'Coffee & Spices',
      slug: 'coffee-spices',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Studio Quality Wireless Headphones',
      category: 'Audio & Sound',
      slug: 'audio',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Flagship Smartphones & Gadgets',
      category: 'Phones & Accessories',
      slug: 'phones',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Artisan Clay Jebena & Woven Crafts',
      category: 'Traditional & Heritage',
      slug: 'traditional-heritage',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Pro Gaming & Setup Gear',
      category: 'Gaming Gear',
      slug: 'gaming',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Smart Fitness & Wearables',
      category: 'Wearables & Health',
      slug: 'wearables',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Category Bar (Amazon-Style Single Line Strip)                   */}
      {/* ------------------------------------------------------------------ */}
      <nav className="bg-teal-900 text-stone-100 border-b border-teal-950 shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 gap-3">
            
            {/* Left: "All Categories" Dropdown Button (unclipped dropdown) */}
            <div className="relative shrink-0" ref={catBarDropdownRef}>
              <button
                type="button"
                onClick={() => setCatBarOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                  catBarOpen || (!currentCategory && !currentQ)
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                    : 'bg-teal-800 text-white hover:bg-teal-700'
                }`}
                aria-expanded={catBarOpen}
              >
                <svg className="w-4 h-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>All Categories</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${catBarOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Working Dropdown Menu of ALL Categories */}
              {catBarOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      All Departments
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('')}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition ${
                        !currentCategory
                          ? 'bg-teal-50 text-teal-800 font-bold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span>All Products (Homepage)</span>
                      <span className="text-stone-400">→</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onMouseEnter={() => handlePrefetchCategory(cat.slug)}
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between transition ${
                          currentCategory === cat.slug
                            ? 'bg-teal-50 text-teal-800 font-bold'
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-stone-400 text-[10px]">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Quick Links for ONLY the 5 MOST POPULAR Categories */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
              {popularCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => handlePrefetchCategory(cat.slug)}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    currentCategory === cat.slug
                      ? 'text-amber-400 font-bold bg-teal-800'
                      : 'text-stone-200 hover:text-white hover:bg-teal-800/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Filter Bar (Only visible when a Category or Search is selected)   */}
      {/* ------------------------------------------------------------------ */}
      {isCategoryView && (
        <section className="bg-white border-b border-stone-200 shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Active Filter Indicators */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-stone-500 font-medium">
                  Showing <strong className="text-stone-900">{catalogProducts.length}</strong> of{' '}
                  <strong className="text-stone-900">{pagination?.total || 0}</strong> products
                </span>

                {activeCategoryObj && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                    Category: {activeCategoryObj.name}
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('')}
                      className="hover:text-red-600 font-bold ml-1"
                      title="Clear category filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {(debouncedQ || currentQ) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    "{debouncedQ || currentQ}"
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="hover:text-red-600 font-bold ml-1"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition ml-1"
                >
                  Reset All Filters
                </button>
              </div>

              {/* Filter Controls: In Stock, Price Range ETB, Sort */}
              <div className="flex flex-wrap items-center gap-3">
                {/* In-Stock Filter */}
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 transition select-none">
                  <input
                    type="checkbox"
                    checked={currentInStock}
                    onChange={handleInStockToggle}
                    className="w-4 h-4 text-teal-600 rounded border-stone-300 focus:ring-teal-500"
                  />
                  <span>In Stock Only</span>
                </label>

                {/* Price Filter Form in ETB */}
                <form onSubmit={handlePriceApply} className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                  <span className="text-[11px] font-bold text-stone-500">ETB:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-16 px-2 py-1 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                  <span className="text-stone-400">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-16 px-2 py-1 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg transition"
                  >
                    Go
                  </button>
                </form>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 text-xs">
                  <select
                    id="sortSelect"
                    value={currentSort}
                    onChange={handleSortChange}
                    className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl focus:ring-teal-500 focus:border-teal-500 px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* 2. DEFAULT HOMEPAGE VIEW (When no category or search is active)     */}
      {/* ================================================================== */}
      {!isCategoryView ? (
        <div className="space-y-12 pb-16">
          {/* Animated Hero Carousel: High-quality product images sliding infinitely from right to left */}
          <section className="relative overflow-hidden bg-stone-900 py-6 border-b border-stone-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Featured Curations & Collections
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline">
                Hover to pause · Click to explore
              </span>
            </div>

            {/* Pure CSS Infinite Sliding Carousel (Right to Left) */}
            <div className="overflow-hidden w-full relative">
              <div className="animate-carousel-scroll gap-5 py-2">
                {carouselItems.concat(carouselItems).map((item, idx) => (
                  <button
                    key={`${item.slug}-${idx}`}
                    type="button"
                    onClick={() => handleCategorySelect(item.slug)}
                    className="group relative w-64 sm:w-72 h-44 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-stone-700/60 focus:outline-none text-left transition transform group-hover:scale-102"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/90 text-stone-950 font-bold text-[10px] uppercase tracking-wider mb-1">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Homepage Grids Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            {/* ----------------------------------------------------------- */}
            {/* Section 1: New Arrivals (2 rows = 8 products)               */}
            {/* ----------------------------------------------------------- */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
                    New Arrivals
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Freshly added merchandise across all Ethiopian merchants
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  See All New Arrivals →
                </button>
              </div>

              {newArrivalsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse space-y-3">
                      <div className="aspect-[4/3] bg-stone-200 rounded-xl" />
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {(newArrivalsData?.data || []).slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} hidePrice={true} />
                  ))}
                </div>
              )}

              {/* Bottom-right See All button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border border-stone-200 shadow-sm transition"
                >
                  See All New Arrivals
                  <span className="text-teal-600">→</span>
                </button>
              </div>
            </section>

            {/* ----------------------------------------------------------- */}
            {/* Section 2: Tech & Electronics (2 rows = 8 products)         */}
            {/* ----------------------------------------------------------- */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    Electronics & Tech
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Smartphones, laptops, computing hardware, and modern accessories
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCategorySelect(techCategorySlug)}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  See All Electronics →
                </button>
              </div>

              {techLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse space-y-3">
                      <div className="aspect-[4/3] bg-stone-200 rounded-xl" />
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {(techData?.data || []).slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} hidePrice={true} />
                  ))}
                </div>
              )}

              {/* Bottom-right See All button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect(techCategorySlug)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border border-stone-200 shadow-sm transition"
                >
                  See All Electronics
                  <span className="text-teal-600">→</span>
                </button>
              </div>
            </section>

            {/* ----------------------------------------------------------- */}
            {/* Section 3: Fashion & Traditional Heritage (2 rows = 8 items)*/}
            {/* ----------------------------------------------------------- */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
                    Traditional Heritage & Fashion
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Authentic Habesha Kemis, artisan woven wear, and cultural garments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCategorySelect(fashionCategorySlug)}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  See All Fashion →
                </button>
              </div>

              {fashionLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse space-y-3">
                      <div className="aspect-[4/3] bg-stone-200 rounded-xl" />
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {(fashionData?.data || []).slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} hidePrice={true} />
                  ))}
                </div>
              )}

              {/* Bottom-right See All button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect(fashionCategorySlug)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold border border-stone-200 shadow-sm transition"
                >
                  See All Fashion & Heritage
                  <span className="text-teal-600">→</span>
                </button>
              </div>
            </section>

            {/* ----------------------------------------------------------- */}
            {/* Section 4+: Dynamically Loaded Categories (Infinite Loop)   */}
            {/* ----------------------------------------------------------- */}
            {remainingCategories.slice(0, loadedCategoryCount).map((category) => (
              <DynamicCategorySection
                key={category.id}
                category={category}
                onSelectCategory={handleCategorySelect}
              />
            ))}

            {/* "See More Categories" Button - appears below 3rd section and moves below newly loaded blocks */}
            {loadedCategoryCount < remainingCategories.length && (
              <div className="flex justify-center pt-4 pb-4">
                <button
                  type="button"
                  onClick={() =>
                    setLoadedCategoryCount((prev) => Math.min(prev + 1, remainingCategories.length))
                  }
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 border-2 border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
                >
                  <span>See More Categories</span>
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-xs font-black group-hover:translate-y-0.5 transition-transform">
                    ↓
                  </span>
                </button>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* ================================================================== */
        /* 4. CATEGORY VIEW (When a category or search is active)              */
        /* Cards hide price & Add to Cart (hidePrice={true}); details on click */
        /* ================================================================== */
        <section id="catalog-view-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              {activeCategoryObj ? activeCategoryObj.name : 'Search Results'}
            </h2>
            <button
              type="button"
              onClick={() => handleCategorySelect('')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
            >
              ← Back to Homepage
            </button>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse space-y-4">
                  <div className="aspect-[4/3] bg-stone-200 rounded-xl" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : catalogProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm my-6">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">No products found</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
                We couldn't find any products matching your active filters. Try adjusting price bounds or resetting filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Category Grid: Cards use hidePrice={true} (shows only image and title; details on click) */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-opacity ${
                  catalogFetching ? 'opacity-70' : 'opacity-100'
                }`}
              >
                {catalogProducts.map((product) => (
                  <ProductCard key={product.id} product={product} hidePrice={true} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200 bg-white px-6 py-4 rounded-2xl shadow-sm">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 text-xs font-bold rounded-xl text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <span>←</span> Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - currentPage) <= 1)
                      .map((pageNum, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && pageNum - prevPage > 1;
                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && <span className="px-2 text-stone-400 text-sm">...</span>}
                            <button
                              type="button"
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                                pageNum === currentPage
                                  ? 'bg-teal-600 text-white shadow-md'
                                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= pagination.pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 text-xs font-bold rounded-xl text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next <span>→</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default Products;
