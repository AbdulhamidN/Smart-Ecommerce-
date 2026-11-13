import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../api/cart';
import { useToast } from '../context/ToastContext';
import NotificationBell from './NotificationBell';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const { data: cart } = useCart(!!user && user.role === 'CUSTOMER');

  const [profileOpen, setProfileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Afaan Oromoo' | 'Amharic'>('English');
  const [headerSearch, setHeaderSearch] = useState(searchParams.get('q') || '');

  const profileRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  const cartQuantity = cart?.totalQuantity || 0;

  // Sync header search when url parameter 'q' changes
  useEffect(() => {
    setHeaderSearch(searchParams.get('q') || '');
  }, [searchParams]);

  // Click outside listeners to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(target)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = headerSearch.trim();
    if (location.pathname === '/') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (query) {
          next.set('q', query);
        } else {
          next.delete('q');
        }
        next.set('page', '1');
        return next;
      });
    } else {
      navigate(`/?q=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  // Helper renderer for Profile (Name) button & dropdown
  const renderProfileDropdown = () => {
    if (!user) return null;

    return (
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 text-stone-800 text-xs font-bold transition border border-stone-200"
          aria-expanded={profileOpen}
        >
          <div className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline max-w-[130px] truncate">
            Profile ({user.name})
          </span>
          <span className="sm:hidden font-bold">
            Profile
          </span>
          <svg
            className={`w-3.5 h-3.5 text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2.5 border-b border-stone-100">
              <p className="text-xs text-stone-500 font-medium">Signed in as</p>
              <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
              <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {user.role} Account
              </span>
            </div>

            <div className="py-1">
              <Link
                to="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-teal-50 hover:text-teal-800 transition"
              >
                <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Account Dashboard
              </Link>

              {user.role === 'CUSTOMER' && (
                <Link
                  to="/orders"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-teal-50 hover:text-teal-800 transition"
                >
                  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  My Orders
                </Link>
              )}

              {user.role === 'SELLER' && (
                <>
                  <Link
                    to="/seller"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-teal-50 hover:text-teal-800 transition"
                  >
                    <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Seller Inventory
                  </Link>
                  <Link
                    to="/seller/analytics"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-teal-50 hover:text-teal-800 transition"
                  >
                    <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Seller Analytics
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                >
                  <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Control Panel
                </Link>
              )}
            </div>

            <div className="border-t border-stone-100 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 text-stone-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* 1. Left: Logo (restored to original prominent size) */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="GibeMart"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* 2. Center-Left: Search Bar ONLY (No categories button) */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search Ethiopian coffee, Habesha kemis, electronics, gadgets..."
                className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 text-sm pl-4 pr-11 py-2 rounded-xl border border-stone-300 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1 bottom-1 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg flex items-center justify-center transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* 3. Right: [Language Dropdown] [Sign In / Profile] [Sell] [Cart] */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Dropdown */}
            <div className="relative shrink-0" ref={languageRef}>
              <button
                type="button"
                onClick={() => setLanguageOpen(!languageOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition border border-stone-200"
                aria-label="Select Language"
                aria-expanded={languageOpen}
              >
                <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <span className="hidden sm:inline font-medium">{selectedLanguage}</span>
                <svg
                  className={`w-3.5 h-3.5 text-stone-400 transition-transform ${languageOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {languageOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Language / ቋንቋ
                    </span>
                  </div>
                  {(['English', 'Afaan Oromoo', 'Amharic'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setLanguageOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition ${
                        selectedLanguage === lang
                          ? 'bg-teal-50 text-teal-800'
                          : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      <span>{lang}</span>
                      {selectedLanguage === lang && (
                        <span className="text-teal-600 font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* If Logged Out: [Sign In] [Sell] [Cart] */}
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
                >
                  Sign In
                </Link>

                <Link
                  to="/sell"
                  className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200"
                >
                  Sell
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 text-stone-700 hover:text-teal-700 hover:bg-stone-100 rounded-xl transition flex items-center shrink-0"
                  aria-label="Shopping Cart"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {cartQuantity > 99 ? '99+' : cartQuantity}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              /* If Logged In: [Profile (Name)] [NotificationBell] [Sell] [Cart] */
              <>
                {renderProfileDropdown()}

                <NotificationBell />

                <Link
                  to="/sell"
                  className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200"
                >
                  Sell
                </Link>

                <Link
                  to="/cart"
                  className="relative p-2 text-stone-700 hover:text-teal-700 hover:bg-stone-100 rounded-xl transition flex items-center shrink-0"
                  aria-label="Shopping Cart"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {cartQuantity > 99 ? '99+' : cartQuantity}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center">
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search GibeMart products..."
                className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 text-xs pl-3 pr-10 py-2 rounded-xl border border-stone-300 focus:outline-none focus:bg-white focus:border-teal-600"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1 bottom-1 px-2.5 bg-amber-500 text-stone-950 font-bold rounded-lg flex items-center justify-center text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
