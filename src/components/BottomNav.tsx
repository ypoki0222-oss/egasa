import React from 'react';
import { Home, Heart, ShoppingBag } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'categories' | 'favorites';
  cartCount: number;
  language?: 'ar' | 'fr' | 'en';
  onTabChange: (tab: 'home' | 'categories' | 'favorites') => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  cartCount,
  language = 'ar',
  onTabChange,
  onOpenCart,
}) => {
  const labels = {
    ar: { home: 'الرئيسية', cart: 'السلة', favorites: 'المفضلة' },
    fr: { home: 'Accueil', cart: 'Panier', favorites: 'Favoris' },
    en: { home: 'Home', cart: 'Cart', favorites: 'Wishlist' },
  }[language] || { home: 'الرئيسية', cart: 'السلة', favorites: 'المفضلة' };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-8 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden shadow-lg font-['Cairo',sans-serif]">
      <div className="flex items-center justify-around text-[11px] font-bold">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 ${
            activeTab === 'home' ? 'text-teal-700' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>{labels.home}</span>
        </button>

        {/* Cart Quick Button */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 text-stone-500 hover:text-teal-700"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </div>
          <span>{labels.cart}</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => onTabChange('favorites')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 ${
            activeTab === 'favorites' ? 'text-teal-700' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>{labels.favorites}</span>
        </button>
      </div>
    </div>
  );
};
