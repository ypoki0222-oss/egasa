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
  RefreshCw,
} from 'lucide-react';

interface ModernProductPageProps {
  product: Product;
  settings: StoreSettings;
  cartCount: number;
  onBack: () => void;
  onOpenCart: () => void;
  onOrderSuccess: (order: Order) => Promise<void>;
}

export const ModernProductPage: React.FC<ModernProductPageProps> = ({
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
      className={`min-h-screen bg-stone-50 text-stone-900 pb-32 ${isRtl ? 'text-right' : 'text-left'}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative p-1.5 text-stone-800 hover:text-teal-700 cursor-pointer transition-transform active:scale-95"
            aria-label={c.t.cartTitle}
          >
            <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-700 text-white font-bold text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={onBack}
            className="p-1.5 text-stone-800 hover:text-teal-700 cursor-pointer transition-transform active:scale-95"
            aria-label={c.t.searchPlaceholder}
            title={c.t.searchPlaceholder}
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
        <span
          onClick={onBack}
          className="text-lg sm:text-xl font-bold tracking-[0.25em] text-teal-800 uppercase cursor-pointer hover:opacity-85 select-none"
        >
          EGASA
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-bold text-stone-700 hover:text-teal-700 cursor-pointer transition-colors"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{c.t.backToStore}</span>
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-2 space-y-5">
        {/* Hero + Gallery */}
        <div className="space-y-3">
          <div
            onClick={() => c.handleOpenLightbox(c.activeImageIndex)}
            className="group relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-stone-200 flex items-center justify-center shadow-sm cursor-zoom-in transition-all hover:shadow-md"
            title={c.t.enlargeImage}
          >
            {product.badge && (
              <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} z-20 bg-teal-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm`}>
                {product.badge}
              </div>
            )}
            {discountPct > 0 && (
              <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} z-20 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-sm`}>
                -{discountPct}%
              </div>
            )}
            <div className={`absolute bottom-3 ${isRtl ? 'left-3' : 'right-3'} z-20 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 group-hover:bg-black/85 text-white text-[11px] font-bold rounded-xl shadow-md pointer-events-none`}>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{c.t.enlargeImage}</span>
            </div>
            <ProductImage
              fill
              src={c.activeImageUrl}
              alt={product.name}
              eager
              objectFit="cover"
              imgClassName="transition-transform duration-300 group-hover:scale-105"
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
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    c.activeImageIndex === idx ? 'border-teal-700 shadow-sm scale-105' : 'border-stone-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} thumbnail ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + Price */}
        <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight leading-snug">
            {product.name}
          </h1>
          <div className={`flex items-baseline gap-3 ${isRtl ? 'justify-end' : 'justify-start'}`}>
            <span className="text-2xl sm:text-3xl font-black text-teal-700 tabular-nums">
              {c.unitPrice} {c.effectiveCurrency}
            </span>
            {c.unitOriginalPrice > c.unitPrice && (
              <span className="text-sm text-stone-400 line-through tabular-nums">
                {c.unitOriginalPrice} {c.effectiveCurrency}
              </span>
            )}
          </div>
          {/* Trust badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-lg">
              <Truck className="w-3 h-3 text-teal-700" />
              {c.activeLang === 'ar' ? 'توصيل سريع' : c.activeLang === 'fr' ? 'Livraison rapide' : 'Fast delivery'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-lg">
              <ShieldCheck className="w-3 h-3 text-teal-700" />
              {c.t.codGuarantee}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-lg">
              <RefreshCw className="w-3 h-3 text-teal-700" />
              {c.activeLang === 'ar' ? 'إرجاع مجاني' : c.activeLang === 'fr' ? 'Retour gratuit' : 'Free returns'}
            </span>
          </div>
        </div>

        {/* Details / Description (فوق الاستمارة) — مخفي عند إلغاء التفعيل */}
        {c.showDetails && (product.description || (product.features && product.features.length > 0)) && (
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5 border-b border-stone-100 pb-2.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>{c.t.productDetailsHeading}</span>
            </h3>
            {product.description && <RichDescriptionView content={product.description} />}
            {product.features && product.features.length > 0 && (
              <div className="pt-1 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-800 block mb-2">{c.t.additionalFeatures}:</span>
                <ul className="space-y-2">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-stone-700 text-xs sm:text-sm leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
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
          variant="modern"
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
              variant="modern"
              formIdSuffix="bottom"
            />
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2.5 sm:px-4 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5">
          <button
            onClick={() => c.handleSubmitOrder()}
            disabled={c.isSubmitting}
            className="flex-1 py-3 px-3 sm:px-6 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-black text-sm sm:text-base rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 tracking-wide"
          >
            {c.isSubmitting ? <span>{c.t.submittingOrder}</span> : <span>{c.t.orderNow}</span>}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
              <button type="button" onClick={() => { c.setQuantity(c.quantity + 1); c.triggerInitiateCheckout(); }} className="w-8 h-8 rounded-md bg-stone-200 hover:bg-stone-300 flex items-center justify-center font-bold text-stone-800 cursor-pointer" aria-label={c.t.increaseQty}>
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-bold font-mono tabular-nums text-xs">{c.quantity}</span>
              <button type="button" onClick={() => { c.setQuantity(Math.max(1, c.quantity - 1)); c.triggerInitiateCheckout(); }} className="w-8 h-8 rounded-md bg-stone-200 hover:bg-stone-300 flex items-center justify-center font-bold text-stone-800 cursor-pointer" aria-label={c.t.decreaseQty}>
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
                <img src={c.allImages[c.lightboxIndex]} alt={`${product.name} - ${c.t.enlargeImage}`} onError={(e) => { if (c.allImages[c.lightboxIndex] !== c.survetteLocalImg) { e.currentTarget.src = c.survetteLocalImg; } }} className="max-h-[75vh] max-w-[92vw] sm:max-h-[82vh] object-contain rounded-xl shadow-2xl" />
              ) : (
                <div className="w-[85vw] max-w-md aspect-square bg-stone-900 rounded-2xl flex items-center justify-center p-6 border border-white/10">
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
                <button key={idx} onClick={() => { c.handleOpenLightbox(idx); }} className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${c.lightboxIndex === idx ? 'border-white scale-105' : 'border-white/30 opacity-60 hover:opacity-100'}`}>
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
