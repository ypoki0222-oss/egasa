import React from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import { AppLanguage } from '../types';

interface NavbarProps {
  storeName: string;
  cartCount: number;
  onOpenCart: () => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  storeName,
  cartCount,
  onOpenCart,
  onSearchClick,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Balanced spacer */}
        <div className="w-20 flex items-center justify-start" />

        {/* Center: Brand Title EGASA */}
        <div className="flex items-center justify-center">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-700 uppercase font-serif hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>{storeName}</span>
          </a>
        </div>

        {/* Right: Search & Cart Button */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-20">
          {/* Search Button */}
          <button
            onClick={onSearchClick}
            className="p-2 text-stone-600 hover:text-teal-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            aria-label="بحث"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart toggle button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-teal-800 hover:bg-teal-50 rounded-full transition-colors cursor-pointer"
            aria-label="سلة المشتريات"
          >
            <ShoppingBag className="w-5 h-5 text-teal-700" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 -right-0.5 inline-flex items-center justify-center bg-rose-500 text-white font-bold text-[10px] rounded-full h-4 min-w-[16px] px-1 tabular-nums animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

