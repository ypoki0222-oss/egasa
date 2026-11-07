import React from 'react';
import { Product } from '../types';
import { FashionIllustration } from './FashionIllustration';
import { ProductImage } from './ProductImage';
import survetteLocalImg from '../assets/survette_amelia.png';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: string;
  onSelect: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onSelect,
  onQuickOrder,
}) => {
  const effectiveCurrency = (product.currency && product.currency.trim()) || currency;

  // Dynamic image resolution: merchant custom image, first gallery image, or demo initial survette only if it is that specific demo item
  const displayImage =
    product.customImage ||
    (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
    (product.id === 'prod-survette-amelia' && !product.customImage ? survetteLocalImg : null);

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 text-right font-['Cairo',sans-serif]">
      {/* Product Image Slot — حاوية بنسبة ثابتة 1/1 لتجنب CLS + معالج فشل التحميل (retry → logo) */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-square w-full overflow-hidden bg-stone-100 cursor-pointer p-2"
      >
        <ProductImage
          fill
          src={displayImage}
          alt={product.name}
          objectFit="contain"
          imgClassName="transition-transform duration-300 group-hover:scale-105"
          fallbackIllustration={
            <FashionIllustration
              type={product.imageSvgType || 'dress'}
              accentColor={product.colors?.[0]?.hex || '#2D3748'}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          }
        />

        {/* Optional Badge if explicitly set by merchant */}
        {product.badge && (
          <div className="absolute top-2 right-2 bg-stone-900/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-xs">
            {product.badge}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Product Title */}
          <h3
            onClick={() => onSelect(product)}
            className="text-xs sm:text-sm font-bold text-stone-900 hover:text-teal-800 transition-colors cursor-pointer line-clamp-1 mb-1.5"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price Baseline */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm sm:text-base font-extrabold text-[#701a75] font-mono tabular-nums">
              {product.price} {effectiveCurrency}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-stone-400 line-through font-mono tabular-nums">
                {product.originalPrice} {effectiveCurrency}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onQuickOrder(product)}
          className="w-full py-2 sm:py-2.5 px-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>أطلب الآن</span>
        </button>
      </div>
    </div>
  );
};
