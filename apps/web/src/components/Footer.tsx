import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* 4 Responsive Columns: 1 on mobile, 4 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Column 1: About us */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                About us
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <Link to="/" className="hover:text-white transition">
                    GiBeMart
                  </Link>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition">
                    Blog
                  </span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition">
                    FAQs
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 2: With us */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                With us
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <Link
                    to="/sell"
                    className="text-amber-400 hover:text-amber-300 font-semibold transition"
                  >
                    Sell On GibeMart
                  </Link>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition">
                    Advertise
                  </span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition">
                    Make it real
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3: Payments */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                Payments
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-stone-800 text-teal-400 font-mono font-bold text-[10px]">
                    telebirr
                  </span>
                  <span className="hover:text-white cursor-pointer transition">Telebirr</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-stone-800 text-amber-400 font-mono font-bold text-[10px]">
                    CBE
                  </span>
                  <span className="hover:text-white cursor-pointer transition">CBE</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-stone-800 text-emerald-400 font-mono font-bold text-[10px]">
                    M-Pesa
                  </span>
                  <span className="hover:text-white cursor-pointer transition">M-Pesa</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Helps */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                Helps
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <span className="hover:text-white cursor-pointer transition">
                    Report an issue
                  </span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition">
                    Privacy note
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Centered Copyright */}
          <div className="pt-8 border-t border-stone-800 text-center">
            <p className="text-xs text-stone-400">
              © {new Date().getFullYear()} GibeMart. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Fixed Back to Top Floating Button in Bottom-Right Corner */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to Top"
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-xl hover:shadow-2xl transition duration-200 border border-teal-500/30 flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-teal-500/20"
      >
        <svg
          className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </>
  );
};

export default Footer;
