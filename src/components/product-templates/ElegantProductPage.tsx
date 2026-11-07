import React from 'react';
import { Product, StoreSettings, Order } from '../../types';
import { FashionIllustration } from '../FashionIllustration';
import { ProductImage } from '../ProductImage';
import { RichDescriptionView } from '../RichDescriptionView';
import { ProductReviewsSection } from '../ProductReviewsSection';
import { useProductPageController } from './useProductPageController';
import { OrderFormBlock } from './OrderFormBlock';
import {
  ShoppingCart,
  Search,
  Phone,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Truck,
  Gem,
} from 'lucide-react';

interface ElegantProductPageProps {
  product: Product;
  settings: StoreSettings;
  cartCount: number;
  onBack: () => void;
  onOpenCart: () => void;
  onOrderSuccess: (order: Order) => Promise<void>;
}

export const ElegantProductPage: React.FC<ElegantProductPageProps> = ({
  product,
  settings,
  cartCount,
  onBack,
  onOpenCart,
  onOrderSuccess,
}) => {
  const c = useProductPageController(product, settings, onOrderSuccess);
  const isRtl = c.dir === 'rtl';
  const discountPct =
    c.unitOriginalPrice > c.unitPrice
      ? Math.round(((c.unitOriginalPrice - c.unitPrice) / c.unitOriginalPrice) * 100)
      : 0;

  return (
    <div
      dir={c.dir}
      style={{ fontFamily: c.font }}
      className={`min-h-screen bg-[#faf7f2] text-stone-900 pb-32 ${isRtl ? 'text-right' : 'text-left'}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#faf7f2]/95 backdrop-blur-md border-b border-stone-300/70 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative p-1.5 text-stone-800 hover:text-amber-800 cursor-pointer transition-transform active:scale-95"
            aria-label={c.t.cartTitle}
          >
            <ShoppingCart className="w-5 h-5 stroke-[2]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-800 text-white font-bold text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={onBack}
            className="p-1.5 text-stone-800 hover:text-amber-800 cursor-pointer transition-transform active:scale-95"
            aria-label={c.t.searchPlaceholder}
            title={c.t.searchPlaceholder}
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span
            onClick={onBack}
            className="text-base sm:text-lg font-bold tracking-[0.35em] text-stone-900 uppercase cursor-pointer hover:opacity-85 select-none"
          >
            EGASA
          </span>
          <span className="text-[9px] tracking-[0.3em] text-stone-500 uppercase">
            {c.activeLang === 'ar' ? 'مجموعة فاخرة' : c.activeLang === 'fr' ? 'Collection Premium' : 'Premium Collection'}
          </span>
        </div>
        <div className="w-12" />
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-semibold text-stone-700 hover:text-amber-800 cursor-pointer transition-colors"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{c.t.backToStore}</span>
        </button>
        <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase text-amber-800 font-bold">
          <Gem className="w-3 h-3" />
          {c.activeLang === 'ar' ? 'جودة فاخرة' : c.activeLang === 'fr' ? 'Qualité Premium' : 'Premium Quality'}
        </span>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-3 space-y-6">
        {/* Hero + Gallery */}
        <div className="space-y-3">
          <div
            onClick={() => c.handleOpenLightbox(c.activeImageIndex)}
            className="group relative aspect-[4/3] w-full rounded-none overflow-hidden bg-white border border-stone-300 flex items-center justify-center cursor-zoom-in transition-all"
            title={c.t.enlargeImage}
          >
            {product.badge && (
              <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} z-20 bg-stone-900 text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase`}>
                {product.badge}
              </div>
            )}
            {discountPct > 0 && (
              <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-20 bg-amber-800 text-white px-2.5 py-1 text-[10px] font-black tracking-wider`}>
                -{discountPct}%
              </div>
            )}
            <div className={`absolute bottom-4 ${isRtl ? 'left-4' : 'right-4'} z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-stone-900 text-[10px] font-bold tracking-wider uppercase pointer-events-none`}>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{c.t.enlargeImage}</span>
            </div>
            <ProductImage
              fill
              src={c.activeImageUrl}
              alt={product.name}
              eager
              objectFit="cover"
              imgClassName="transition-transform duration-500 group-hover:scale-105"
              fallbackIllustration={
                <FashionIllustration
                  type={product.imageSvgType || 'dress'}
                  accentColor={c.selectedColor.hex || '#2D3748'}
                  className="w-full h-full object-cover"
                />
              }
            />
          </div>
          {c.allImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {c.allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => c.setActiveImageIndex(idx)}
                  className={`relative w-14 h-14 rounded-none overflow-hidden border shrink-0 transition-all cursor-pointer ${
                    c.activeImageIndex === idx ? 'border-amber-800 opacity-100' : 'border-stone-300 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} thumbnail ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + Price — elegant centered */}
        <div className="space-y-3 text-center pt-2">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-amber-800/50" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-amber-800 font-bold">
              {product.category || 'EGASA'}
            </span>
            <span className="h-px w-8 bg-amber-800/50" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-wide leading-snug">
            {product.name}
          </h1>
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
              {c.unitPrice} {c.effectiveCurrency}
            </span>
            {c.unitOriginalPrice > c.unitPrice && (
              <span className="text-sm text-stone-400 line-through tabular-nums">
                {c.unitOriginalPrice} {c.effectiveCurrency}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[10px] text-stone-500 tracking-wide">
            <span className="inline-flex items-center gap-1"><Truck className="w-3 h-3 text-amber-800" />{c.activeLang === 'ar' ? 'توصيل مجاني' : c.activeLang === 'fr' ? 'Livraison gratuite' : 'Free delivery'}</span>
            <span className="w-1 h-1 rounded-full bg-stone-400" />
            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-amber-800" />{c.t.codGuarantee}</span>
            <span className="w-1 h-1 rounded-full bg-stone-400" />
            <span className="inline-flex items-center gap-1"><Gem className="w-3 h-3 text-amber-800" />{c.activeLang === 'ar' ? 'جودة مضمونة' : c.activeLang === 'fr' ? 'Qualité garantie' : 'Quality guaranteed'}</span>
          </div>
        </div>

        {/* Details / Description (فوق الاستمارة) — مخفي عند إلغاء التفعيل */}
        {c.showDetails && (product.description || (product.features && product.features.length > 0)) && (
          <div className="bg-white p-5 sm:p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-center gap-3 pb-3 border-b border-stone-200">
              <span className="h-px w-6 bg-stone-300" />
              <h3 className="font-bold text-stone-900 text-sm tracking-[0.2em] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                <span>{c.t.productDetailsHeading}</span>
              </h3>
              <span className="h-px w-6 bg-stone-300" />
            </div>
            {product.description && <RichDescriptionView content={product.description} />}
            {product.features && product.features.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-800 block mb-3 tracking-wide">{c.t.additionalFeatures}:</span>
                <ul className="space-y-2.5">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-stone-700 text-xs sm:text-sm leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Order Form (top) */}
        <OrderFormBlock
          product={product}
          activeLang={c.activeLang}
          dir={c.dir as 'rtl' | 'ltr'}
          effectiveCurrency={c.effectiveCurrency}
          effectivePlaceholders={c.effectivePlaceholders}
          effectiveCities={c.effectiveCities}
          hasSizes={c.hasSizes}
          hasColors={c.hasColors}
          activeCustomizations={c.activeCustomizations}
          priceCustomizations={c.activePriceCustomizations}
          selectedPriceCustomizationIds={c.selectedPriceCustomizationIds}
          onTogglePriceCustomization={(id) => { c.togglePriceCustomization(id); c.triggerInitiateCheckout(); }}
          priceCustomizationExtra={c.priceCustomizationExtra}
          isBundleEnabled={c.isBundleEnabled}
          bundleLabel={c.bundleLabel}
          bundlePrice={c.bundlePrice}
          bundleOriginalPrice={c.bundleOriginalPrice}
          bundleStickerText={c.bundleStickerText}
          unitPrice={c.unitPrice}
          unitOriginalPrice={c.unitOriginalPrice}
          subtotal={c.subtotal}
          grandTotal={c.grandTotal}
          packageDescription={c.packageDescription}
          selectedSize={c.selectedSize}
          selectedColor={c.selectedColor}
          customizationValues={c.customizationValues}
          selectedPackage={c.selectedPackage}
          quantity={c.quantity}
          customerName={c.customerName}
          phone={c.phone}
          city={c.city}
          address={c.address}
          formError={c.formError}
          isSubmitting={c.isSubmitting}
          onSelectSize={(s) => { c.setSelectedSize(s); c.triggerInitiateCheckout(); }}
          onSelectColor={(col) => { c.setSelectedColor(col); c.triggerInitiateCheckout(); }}
          onCustomizationChange={(id, v) => { c.setCustomizationValues((prev) => ({ ...prev, [id]: v })); c.triggerInitiateCheckout(); }}
          onSelectPackage={(p) => { c.setSelectedPackage(p); c.triggerInitiateCheckout(); }}
          onQuantityChange={(q) => { c.setQuantity(q); c.triggerInitiateCheckout(); }}
          onCustomerNameChange={c.setCustomerName}
          onPhoneChange={c.setPhone}
          onCityChange={c.setCity}
          onAddressChange={c.setAddress}
          onFieldFocus={c.triggerInitiateCheckout}
          onSubmit={c.handleSubmitOrder}
          variant="elegant"
          formIdSuffix="top"
        />

        {/* Reviews */}
        {product.reviewsEnabled !== false && (
          <ProductReviewsSection product={product} currency={settings.currency} language={c.activeLang} />
        )}

        {/* Order Form (bottom) — نفس الحالة المشتركة */}
        {c.showBottomForm && (
          <div className="pt-2">
            <OrderFormBlock
              product={product}
              activeLang={c.activeLang}
              dir={c.dir as 'rtl' | 'ltr'}
              effectiveCurrency={c.effectiveCurrency}
              effectivePlaceholders={c.effectivePlaceholders}
              effectiveCities={c.effectiveCities}
              hasSizes={c.hasSizes}
              hasColors={c.hasColors}
              activeCustomizations={c.activeCustomizations}
              isBundleEnabled={c.isBundleEnabled}
              bundleLabel={c.bundleLabel}
              bundlePrice={c.bundlePrice}
              bundleOriginalPrice={c.bundleOriginalPrice}
              bundleStickerText={c.bundleStickerText}
              unitPrice={c.unitPrice}
              unitOriginalPrice={c.unitOriginalPrice}
              subtotal={c.subtotal}
              grandTotal={c.grandTotal}
              packageDescription={c.packageDescription}
              selectedSize={c.selectedSize}
              selectedColor={c.selectedColor}
              customizationValues={c.customizationValues}
              selectedPackage={c.selectedPackage}
              quantity={c.quantity}
              customerName={c.customerName}
              phone={c.phone}
              city={c.city}
              address={c.address}
              formError={c.formError}
              isSubmitting={c.isSubmitting}
              onSelectSize={(s) => { c.setSelectedSize(s); c.triggerInitiateCheckout(); }}
              onSelectColor={(col) => { c.setSelectedColor(col); c.triggerInitiateCheckout(); }}
              onCustomizationChange={(id, v) => { c.setCustomizationValues((prev) => ({ ...prev, [id]: v })); c.triggerInitiateCheckout(); }}
              onSelectPackage={(p) => { c.setSelectedPackage(p); c.triggerInitiateCheckout(); }}
              onQuantityChange={(q) => { c.setQuantity(q); c.triggerInitiateCheckout(); }}
              onCustomerNameChange={c.setCustomerName}
              onPhoneChange={c.setPhone}
              onCityChange={c.setCity}
              onAddressChange={c.setAddress}
              onFieldFocus={c.triggerInitiateCheckout}
              onSubmit={c.handleSubmitOrder}
              variant="elegant"
              formIdSuffix="bottom"
            />
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-300 px-3 py-2.5 sm:px-4 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5">
          <button
            onClick={() => c.handleSubmitOrder()}
            disabled={c.isSubmitting}
            className="flex-1 py-3 px-3 sm:px-6 bg-stone-900 hover:bg-black text-white font-bold text-sm sm:text-base rounded-none transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 tracking-[0.15em] uppercase disabled:opacity-60"
          >
            {c.isSubmitting ? <span>{c.t.submittingOrder}</span> : <span>{c.t.orderNow}</span>}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-stone-100 border border-stone-300 text-xs">
              <button type="button" onClick={() => { c.setQuantity(c.quantity + 1); c.triggerInitiateCheckout(); }} className="w-8 h-9 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-800 cursor-pointer" aria-label={c.t.increaseQty}>
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-bold font-mono tabular-nums text-xs">{c.quantity}</span>
              <button type="button" onClick={() => { c.setQuantity(Math.max(1, c.quantity - 1)); c.triggerInitiateCheckout(); }} className="w-8 h-9 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-800 cursor-pointer" aria-label={c.t.decreaseQty}>
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={c.handleWhatsAppCall}
              className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label={c.t.directWhatsAppContact}
              title={c.t.directWhatsAppTitle}
            >
              <Phone className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {c.isLightboxOpen && (
        <div onClick={c.handleCloseLightbox} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none" role="dialog" aria-modal="true">
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between gap-4 z-20 pb-2 border-b border-white/10">
            <button onClick={c.handleCloseLightbox} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer">
              <X className="w-4 h-4" />
              <span>{c.t.closeBtn}</span>
            </button>
            <div className="text-center px-2">
              <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{product.name}</h4>
              {c.allImages.length > 1 && <span className="text-[11px] text-white/60 font-mono">{c.t.imageCountOf(c.lightboxIndex + 1, c.allImages.length)}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); c.setZoomScale(Math.min(3, c.zoomScale + 0.3)); }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer" title={c.t.zoomIn}>
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); c.setZoomScale(Math.max(0.8, c.zoomScale - 0.3)); }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer" title={c.t.zoomOut}>
                <ZoomOut className="w-4 h-4" />
              </button>
              {c.zoomScale !== 1 && (
                <button onClick={(e) => { e.stopPropagation(); c.setZoomScale(1); }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer" title={c.t.resetZoom}>
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
            {c.allImages.length > 1 && (
              <button onClick={c.handlePrevLightboxImage} className={`absolute ${isRtl ? 'right-2 sm:right-6' : 'left-2 sm:left-6'} top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 cursor-pointer`} title={c.t.prevImage}>
                {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </button>
            )}
            <div className="max-h-[75vh] max-w-[95vw] sm:max-h-[82vh] flex items-center justify-center transition-transform duration-200" style={{ transform: `scale(${c.zoomScale})` }}>
              {c.allImages[c.lightboxIndex] ? (
                <img src={c.allImages[c.lightboxIndex]} alt={`${product.name} - ${c.t.enlargeImage}`} onError={(e) => { if (c.allImages[c.lightboxIndex] !== c.survetteLocalImg) { e.currentTarget.src = c.survetteLocalImg; } }} className="max-h-[75vh] max-w-[92vw] sm:max-h-[82vh] object-contain shadow-2xl" />
              ) : (
                <div className="w-[85vw] max-w-md aspect-square bg-stone-900 flex items-center justify-center p-6 border border-white/10">
                  <FashionIllustration type={product.imageSvgType} accentColor={c.selectedColor.hex} className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            {c.allImages.length > 1 && (
              <button onClick={c.handleNextLightboxImage} className={`absolute ${isRtl ? 'left-2 sm:left-6' : 'right-2 sm:right-6'} top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 cursor-pointer`} title={c.t.nextImage}>
                {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>
            )}
          </div>
          {c.allImages.length > 1 && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 pt-2 border-t border-white/10 overflow-x-auto z-20">
              {c.allImages.map((img, idx) => (
                <button key={idx} onClick={() => { c.handleOpenLightbox(idx); }} className={`w-12 h-12 overflow-hidden border-2 shrink-0 cursor-pointer ${c.lightboxIndex === idx ? 'border-white scale-105' : 'border-white/30 opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
