import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronRight, ChevronLeft, SlidersHorizontal, Check } from 'lucide-react';
import { Product, AppLanguage } from '../types';
import { TRANSLATIONS } from '../utils/i18n';

interface SearchBarWithCategoriesProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string; // 'all' or category name
  onSelectCategory: (category: string) => void;
  categoriesEnabled?: boolean;
  categories?: string[];
  products: Product[];
  inputRef?: React.RefObject<HTMLInputElement | null>;
  language?: AppLanguage;
}

export const SearchBarWithCategories: React.FC<SearchBarWithCategoriesProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categoriesEnabled = true,
  categories = [],
  products,
  inputRef,
  language = 'ar',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag-to-scroll states for desktop
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Calculate product counts per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Combined list of categories (merging configured categories + any present in products)
  const displayCategories = React.useMemo(() => {
    const set = new Set<string>();
    // First add configured categories
    categories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    // Also include any product categories not already in the list
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [categories, products]);

  // Check scroll positions to show/hide scroll indicator arrows
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // In RTL, scrollLeft can be negative or positive depending on browser implementation
    const maxScroll = scrollWidth - clientWidth;
    const currentScroll = Math.abs(scrollLeft);

    setCanScrollRight(currentScroll > 10);
    setCanScrollLeft(currentScroll < maxScroll - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, displayCategories]);

  // Horizontal scroll buttons
  const handleScroll = (direction: 'right' | 'left') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // In RTL, scrolling right or left:
    const distance = 240;
    // Use direction multiplier based on document direction
    const isRtl = document.dir === 'rtl' || true;
    const delta = direction === 'left' ? (isRtl ? -distance : distance) : (isRtl ? distance : -distance);
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  // Mouse Drag to scroll (desktop friendly swiping)
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Drag sensitivity
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleCategoryClick = (cat: string) => {
    // If user was dragging, don't trigger click
    if (hasMovedRef.current) return;
    onSelectCategory(cat);
  };

  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  return (
    <div className="w-full space-y-2.5 mb-6">
      {/* 1. Main Search Bar */}
      <div className="relative w-full">
        <div className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none flex items-center`}>
          <Search className="w-4 h-4 text-stone-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full ${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'} py-3 bg-white border border-stone-200/90 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 shadow-2xs transition-all`}
        />

        {/* Clear Search Button */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors cursor-pointer`}
            title="مسح البحث"
            aria-label="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Swipeable Categories Track (Under Search Bar - Only if enabled) */}
      {categoriesEnabled && displayCategories.length > 0 && (
        <div className="relative w-full">
          {/* Scroll Right Indicator / Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 border border-stone-200 shadow-md rounded-full items-center justify-center text-stone-700 hover:text-teal-700 hover:scale-105 transition-all cursor-pointer"
              title="سحب لليمين"
              aria-label="سحب لليمين"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Container with horizontal swipe */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 px-0.5 select-none touch-pan-x cursor-grab active:cursor-grabbing scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* "All" Category Chip */}
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                selectedCategory === 'all'
                  ? 'bg-teal-800 text-white shadow-xs ring-2 ring-teal-800/20'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 hover:border-stone-300'
              }`}
            >
              <span>{t.allCategories}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                  selectedCategory === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {products.length}
              </span>
            </button>

            {/* Dynamic Category Chips */}
            {displayCategories.map((category) => {
              const count = categoryCounts[category] || 0;
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    isSelected
                      ? 'bg-teal-800 text-white shadow-xs ring-2 ring-teal-800/20'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  <span>{category}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll Left Indicator / Button (in RTL: moves towards the left) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 border border-stone-200 shadow-md rounded-full items-center justify-center text-stone-700 hover:text-teal-700 hover:scale-105 transition-all cursor-pointer"
              title="سحب لليسار"
              aria-label="سحب لليسار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Active Filter Bar (shown if specific category or search term is selected) */}
      {isFiltered && (
        <div className="flex items-center justify-between text-[11px] text-stone-500 bg-teal-50/50 border border-teal-100/70 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>تصفية بحسب:</span>
            {selectedCategory !== 'all' && (
              <span className="font-bold text-teal-900 bg-white border border-teal-200 rounded px-1.5 py-0.5">
                {selectedCategory}
              </span>
            )}
            {searchQuery && (
              <span className="font-bold text-stone-800">
                "{searchQuery}"
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onSelectCategory('all');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer shrink-0 ml-2"
          >
            إلغاء التصفية
          </button>
        </div>
      )}
    </div>
  );
};
