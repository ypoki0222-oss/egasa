import React, { useState, useEffect, useRef } from 'react';
import { Product, StoreSettings, Order } from '../types';
import { FashionIllustration } from './FashionIllustration';
import { ProductImage } from './ProductImage';
import survetteLocalImg from '../assets/survette_amelia.png';
import { pixelService } from '../services/pixelService';
import { sendOrderToGoogleSheet } from '../services/googleSheetsService';
import { RichDescriptionView } from './RichDescriptionView';
import { ProductReviewsSection } from './ProductReviewsSection';
import { OrderFormBlock } from './product-templates/OrderFormBlock';
import { TRANSLATIONS, getDirection, getFontFamily, AppLanguage } from '../utils/i18n';
import {
  ShoppingCart,
  Search,
  Phone,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle2,
  Check,
  AlertCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface ProductPageViewProps {
  product: Product;
  settings: StoreSettings;
  cartCount: number;
  onBack: () => void;
  onOpenCart: () => void;
  onOrderSuccess: (order: Order) => Promise<void>;
}

import { resolveProductCities } from '../utils/cities';

export const ProductPageView: React.FC<ProductPageViewProps> = ({
  product,
  settings,
  cartCount,
  onBack,
  onOpenCart,
  onOrderSuccess,
}) => {
  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Active language resolution: product page override first, otherwise store global language
  const activeLang: AppLanguage =
    product.pageLanguageOverride && product.pageLanguageOverride !== 'store'
      ? (product.pageLanguageOverride as AppLanguage)
      : (settings.language || 'ar');
  const t = TRANSLATIONS[activeLang];
  const dir = getDirection(activeLang);
  const font = getFontFamily(activeLang);

  // Effective Currency: product-specific currency override > store settings currency
  const effectiveCurrency = (product.currency && product.currency.trim()) || settings.currency;

  // Effective Placeholders: product override > store-wide override > default language translation
  const effectivePlaceholders = {
    customerName: product.formPlaceholders?.customerName?.trim() || settings.formPlaceholders?.customerName?.trim() || t.customerNamePlaceholder,
    phone: product.formPlaceholders?.phone?.trim() || settings.formPlaceholders?.phone?.trim() || t.phonePlaceholder,
    city: product.formPlaceholders?.city?.trim() || settings.formPlaceholders?.city?.trim() || t.cityPlaceholder,
    address: product.formPlaceholders?.address?.trim() || settings.formPlaceholders?.address?.trim() || t.addressPlaceholder,
  };

  // Effective Cities Config: product-level override > store-wide settings > default Moroccan cities
  const effectiveCitiesConfig = resolveProductCities(product, settings);

  // Dynamic image resolution: merchant custom image, gallery image, or demo initial survette only if it is that specific demo item
  const [imgError, setImgError] = useState(false);
  const primaryImage = imgError
    ? null
    : (product.customImage ||
       (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
       (product.id === 'prod-survette-amelia' && !product.customImage ? survetteLocalImg : null));

  const allImages = [
    ...(primaryImage ? [primaryImage] : []),
    ...(product.galleryImages ? product.galleryImages.filter((img) => img !== primaryImage) : []),
  ];

  // Gallery active thumbnail
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Lightbox / Image Enlarge modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  // Sizes & Colors toggles (تفعيل أو إلغاء المقاسات والألوان)
  const hasSizes = product.sizesEnabled !== false && Array.isArray(product.sizes) && product.sizes.length > 0;
  const hasColors = product.colorsEnabled !== false && Array.isArray(product.colors) && product.colors.length > 0;

  // Active Customizations (إمكانية إضافة أي تخصيص وتفعيله أو لا)
  const activeCustomizations = (product.customizations || []).filter((c) => c.enabled);
  // التخصيصات السعرية (المفعلة) — منفصلة عن customizations العادية
  const activePriceCustomizations = (product.priceCustomizations || []).filter((c) => c.enabled);
  const [selectedPriceCustomizationIds, setSelectedPriceCustomizationIds] = useState<string[]>([]);
  const togglePriceCustomization = (id: string) => {
    setSelectedPriceCustomizationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const selectedPriceCustomizations = activePriceCustomizations.filter((c) =>
    selectedPriceCustomizationIds.includes(c.id)
  );
  const priceCustomizationExtra = selectedPriceCustomizations.reduce(
    (sum, c) => sum + (Number(c.priceDelta) || 0),
    0
  );
  // مفتاحا عرض التفاصيل + الاستمارة السفلية (الافتراضيات تحافظ على السلوك الحالي تماماً)
  const showDetails = product.showDetailsBeforeForm !== false;
  const showBottomForm = product.showBottomOrderForm === true;
  const [customizationValues, setCustomizationValues] = useState<Record<string, string>>({});

  // Variant choices
  const [selectedSize, setSelectedSize] = useState<string>(hasSizes ? product.sizes[0] || '' : '');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>(
    hasColors
      ? product.colors[0] || {
          name: activeLang === 'ar' ? 'افتراضي' : activeLang === 'fr' ? 'Par défaut' : 'Default',
          hex: '#2D3748',
        }
      : { name: '', hex: '' }
  );

  // Bundle offer settings (only if merchant explicitly enabled it)
  const bundleOffer = product.bundleOffer;
  const isBundleEnabled = Boolean(bundleOffer?.enabled);
  const bundleLabel =
    bundleOffer?.label ||
    (activeLang === 'ar'
      ? 'عرض قطعتين (توفير خاص)'
      : activeLang === 'fr'
      ? 'Offre 2 pièces (Pack Spécial)'
      : '2-Piece Offer (Special Savings)');
  const bundlePrice = bundleOffer?.price || Math.round(product.price * 1.75);
  const bundleOriginalPrice =
    bundleOffer?.originalPrice || Math.round((product.originalPrice || product.price * 1.4) * 2);

  // Selected package tier: 'single' | 'double'
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'double'>('single');
  const [quantity, setQuantity] = useState<number>(1);

  // Formulaire fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Ref to track InitiateCheckout event once
  const hasTrackedCheckoutRef = useRef(false);

  // Track ViewContent on mount
  useEffect(() => {
    pixelService.track(
      'ViewContent',
      {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'MAD',
      },
      settings.pixel
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // يعمل فقط عند تغيير المنتج نفسه (product.id) — لا عند كل تحديث بيانات، حتى لا تصعد الصفحة للأعلى لوحدها
  }, [product.id]);

  // Lightbox keyboard controls (ESC, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setZoomScale(1);
      } else if (e.key === 'ArrowRight') {
        // In RTL Arabic, ArrowRight is Previous
        if (allImages.length > 1) {
          setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
          setZoomScale(1);
        }
      } else if (e.key === 'ArrowLeft') {
        // In RTL Arabic, ArrowLeft is Next
        if (allImages.length > 1) {
          setLightboxIndex((prev) => (prev + 1) % allImages.length);
          setZoomScale(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, allImages.length]);

  const triggerInitiateCheckout = () => {
    if (!hasTrackedCheckoutRef.current) {
      hasTrackedCheckoutRef.current = true;
      pixelService.track(
        'InitiateCheckout',
        {
          content_name: product.name,
          content_ids: [product.id],
          content_type: 'product',
          value: product.price,
          currency: 'MAD',
          num_items: quantity,
        },
        settings.pixel
      );
    }
  };

  // Price calculations - Delivery is always free, so no shipping added!
  let unitPrice = product.price;
  let unitOriginalPrice = product.originalPrice || Math.round(product.price * 1.4);
  let packageDescription = t.singlePiece;

  if (selectedPackage === 'double' && isBundleEnabled) {
    unitPrice = bundlePrice;
    unitOriginalPrice = bundleOriginalPrice;
    packageDescription = bundleLabel;
  }

  // إضافة مبلغ التخصيصات السعرية المختارة فوق السعر الأساسي (مع الحفاظ على منطق الباقات)
  unitPrice += priceCustomizationExtra;
  const subtotal = unitPrice * quantity;
  // Delivery is always free: shippingCost = 0
  const shippingCost = 0;
  const grandTotal = subtotal;

  const handleOpenLightbox = (index?: number) => {
    setLightboxIndex(index !== undefined ? index : activeImageIndex);
    setZoomScale(1);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setZoomScale(1);
  };

  const handleNextLightboxImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length > 1) {
      setLightboxIndex((prev) => (prev + 1) % allImages.length);
      setZoomScale(1);
    }
  };

  const handlePrevLightboxImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length > 1) {
      setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      setZoomScale(1);
    }
  };

  const handleToggleZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale((prev) => (prev === 1 ? 1.6 : prev === 1.6 ? 2.2 : 1));
  };

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');
    triggerInitiateCheckout();

    if (!customerName.trim()) {
      setFormError(t.nameRequiredError);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
      nameInputRef.current?.focus();
      return;
    }

    const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8) {
      setFormError(t.phoneRequiredError);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
      phoneInputRef.current?.focus();
      return;
    }

    if (!city.trim()) {
      setFormError(t.cityRequiredError);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
      cityInputRef.current?.focus();
      return;
    }

    if (!address.trim()) {
      setFormError(t.addressRequiredError);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
      addressInputRef.current?.focus();
      return;
    }

    // Validate required customizations
    for (const cust of activeCustomizations) {
      if (cust.required && !customizationValues[cust.id]?.trim()) {
        setFormError(`${t.pleaseSpecifyCust} ${cust.title} *`);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setIsSubmitting(true);

    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const formattedCustomizations = activeCustomizations
      .filter((c) => customizationValues[c.id]?.trim())
      .map((c) => ({
        id: c.id,
        title: c.title,
        value: customizationValues[c.id].trim(),
      }));

    const packagePrefix = activeLang === 'ar' ? 'الباقة' : activeLang === 'fr' ? 'Offre' : 'Package';
    const notesParts: string[] = [`${packagePrefix}: ${packageDescription}`];
    if (hasSizes && selectedSize) notesParts.push(`${t.selectSize}: ${selectedSize}`);
    if (hasColors && selectedColor.name) notesParts.push(`${t.selectColor}: ${selectedColor.name}`);
    if (formattedCustomizations.length > 0) {
      notesParts.push(
        `${t.customizationTitle}: ${formattedCustomizations.map((c) => `${c.title}: ${c.value}`).join(' | ')}`
      );
    }
    if (selectedPriceCustomizations.length > 0) {
      notesParts.push(
        `تخصيصات سعرية: ${selectedPriceCustomizations.map((c) => `${c.name} (+${c.priceDelta} ${effectiveCurrency})`).join(', ')}`
      );
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      notes: notesParts.join(' - '),
      items: [
        {
          productId: product.id,
          productName: `${product.name} (${packageDescription})`,
          price: unitPrice,
          quantity,
          selectedSize: hasSizes ? selectedSize : undefined,
          selectedColor: hasColors ? selectedColor.name : undefined,
          customizations: formattedCustomizations.length > 0 ? formattedCustomizations : undefined,
          selectedPriceCustomizations: selectedPriceCustomizations.length > 0 ? selectedPriceCustomizations : undefined,
          imageSvgType: product.imageSvgType,
        },
      ],
      subtotal,
      shippingCost,
      totalPrice: grandTotal,
      status: 'new',
      syncedToGoogleSheets: false,
    };

    // 1. Fire Pixel Purchase event (Normalized with MAD for ad networks)
    pixelService.track(
      'Purchase',
      {
        content_name: product.name,
        content_ids: [product.id],
        value: grandTotal,
        currency: 'MAD',
        num_items: quantity,
        order_id: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
      },
      settings.pixel
    );

    // 2. Sync to Google Sheets / Webhook if configured
    if (settings.googleSheetsWebhookUrl && settings.googleSheetsAutoSync) {
      try {
        const syncResult = await sendOrderToGoogleSheet(
          newOrder,
          settings.googleSheetsWebhookUrl,
          effectiveCurrency
        );
        newOrder.syncedToGoogleSheets = syncResult.success;
        newOrder.googleSheetsResponse = syncResult.message;
      } catch (err) {
        console.warn('Webhook sync error:', err);
      }
    }

    // 3. Auto-open WhatsApp if merchant enabled this in Store Settings
    if (settings.autoOpenWhatsAppOnOrder && settings.whatsapp.phoneNumber) {
      const cleanStorePhone = settings.whatsapp.phoneNumber.replace(/[^0-9]/g, '');
      let variantText = '';
      if (hasSizes && selectedSize) variantText += `\nالمقاس: ${selectedSize}`;
      if (hasColors && selectedColor.name) variantText += `\nاللون: ${selectedColor.name}`;
      if (formattedCustomizations.length > 0) {
        variantText += `\nالتخصيصات:\n${formattedCustomizations.map((c) => `• ${c.title}: ${c.value}`).join('\n')}`;
      }
      if (selectedPriceCustomizations.length > 0) {
        variantText += `\nالتخصيصات السعرية:\n${selectedPriceCustomizations.map((c) => `• ${c.name} (+${c.priceDelta} ${effectiveCurrency})`).join('\n')}`;
      }
      const waMsg = `🛍️ *طلب جديد من متجر ${settings.storeName}*\nرقم الطلب: ${orderNumber}\nالمنتج: ${product.name} (${packageDescription})\nالكمية: ${quantity}${variantText}\nالمجموع الإجمالي: ${grandTotal} ${effectiveCurrency}\n---\n👤 العميل: ${customerName}\n📱 الهاتف: ${phone}\n📍 المدينة: ${city}\n🏠 العنوان: ${address}`;
      const waUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(waMsg)}`;
      window.open(waUrl, '_blank');
    }

    try {
      await onOrderSuccess(newOrder);
    } catch {
      setFormError(activeLang === 'fr' ? 'Impossible d’enregistrer la commande. Réessayez.' : activeLang === 'en' ? 'Could not save your order. Please try again.' : 'تعذر حفظ الطلب. يرجى المحاولة مجددًا.');
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppCall = () => {
    const cleanPhone = settings.whatsapp.phoneNumber.replace(/[^0-9]/g, '');
    const msg = t.productInquiryWhatsAppMsg(product.name, packageDescription, unitPrice, effectiveCurrency);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const activeImageUrl = allImages.length > 0 ? allImages[activeImageIndex] || allImages[0] : null;

  return (
    <div
      dir={dir}
      style={{ fontFamily: font }}
      className={`min-h-screen bg-white text-stone-900 pb-32 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
    >
      {/* 1. Header (EGASA Brand Top Bar - Customer Facing, No Admin Expose) */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200/90 px-4 py-3 flex items-center justify-between shadow-2xs">
        {/* Left: Cart Icon with Badge & Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative p-1.5 text-stone-800 hover:text-black cursor-pointer transition-transform active:scale-95"
            aria-label={t.cartTitle}
          >
            <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={onBack}
            className="p-1.5 text-stone-800 hover:text-black cursor-pointer transition-transform active:scale-95"
            aria-label={t.searchPlaceholder}
            title={t.searchPlaceholder}
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Right: EGASA Brand Wordmark */}
        <div className="flex items-center gap-2">
          <span
            onClick={onBack}
            className="text-lg sm:text-xl font-bold tracking-[0.25em] text-[#881337] uppercase font-serif cursor-pointer hover:opacity-85 select-none"
          >
            EGASA
          </span>
        </div>
      </header>

      {/* Breadcrumb Bar - Clean, Customer Facing (Private merchant links removed) */}
      <div className="max-w-xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-bold text-stone-700 hover:text-stone-900 cursor-pointer transition-colors"
        >
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{t.backToStore}</span>
        </button>
      </div>

      <main className="max-w-xl mx-auto px-4 py-2 space-y-5">
        {/* 2. Main Product Hero Image - Click to enlarge in full screen */}
        <div
          onClick={() => handleOpenLightbox(activeImageIndex)}
          className="group relative aspect-[16/11] sm:aspect-[4/3] w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center shadow-xs cursor-zoom-in transition-all hover:shadow-md"
          title={t.enlargeImage}
        >
          {product.badge && (
            <div className={`absolute top-3 ${dir === 'rtl' ? 'right-3' : 'left-3'} z-20 bg-stone-900/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs`}>
              {product.badge}
            </div>
          )}

          {/* Zoom hint badge */}
          <div className={`absolute bottom-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} z-20 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 group-hover:bg-black/85 backdrop-blur-xs text-white text-[11px] font-bold rounded-xl shadow-md transition-all group-hover:scale-105 pointer-events-none`}>
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{t.enlargeImage}</span>
          </div>

          <ProductImage
            fill
            src={activeImageUrl}
            alt={product.name}
            eager
            objectFit="cover"
            imgClassName="transition-transform duration-300 group-hover:scale-102"
            fallbackIllustration={
              <FashionIllustration
                type={product.imageSvgType || 'dress'}
                accentColor={selectedColor.hex || '#2D3748'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
            }
          />
        </div>

        {/* Gallery Thumbnails (Only displayed if merchant provided multiple real gallery images) */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            {allImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-teal-700 shadow-sm scale-102'
                    : 'border-stone-200 opacity-75 hover:opacity-100'
                }`}
                title={t.imageCountOf(idx + 1, allImages.length)}
              >
                <img
                  src={imgUrl}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* 3. Product Title & Current Pricing */}
        <div className={`space-y-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {product.name}
          </h1>

          <div className={`flex items-baseline ${dir === 'rtl' ? 'justify-end' : 'justify-start'} gap-3 pt-1`}>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D90429] font-sans tabular-nums">
              {unitPrice} {effectiveCurrency}
            </span>
            {unitOriginalPrice > unitPrice && (
              <span className="text-sm sm:text-base text-stone-400 line-through font-sans tabular-nums">
                {unitOriginalPrice} {effectiveCurrency}
              </span>
            )}
          </div>
        </div>

        {/* 4. Customizable Bundle Packages Selection (Only if enabled) */}
        {isBundleEnabled && (
          <div className="space-y-2.5 pt-1">
            <label className={`block text-xs font-bold text-stone-900 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {t.choosePackage}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Single Tier */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPackage('single');
                  triggerInitiateCheckout();
                }}
                className={`p-3.5 rounded-xl border-2 ${dir === 'rtl' ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                  selectedPackage === 'single'
                    ? 'border-teal-700 bg-teal-50/70 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{t.singlePiece}</span>
                  <span className="font-bold text-teal-800 text-sm">
                    {product.price} {effectiveCurrency}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">{t.standardOrder}</p>
              </button>

              {/* Bundle Tier */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPackage('double');
                  triggerInitiateCheckout();
                }}
                className={`relative p-3.5 rounded-xl border-2 ${dir === 'rtl' ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                  selectedPackage === 'double'
                    ? 'border-red-600 bg-red-50/70 shadow-xs'
                    : 'border-red-200 bg-white hover:border-red-300'
                }`}
              >
                {bundleOffer?.stickerText && (
                  <span className={`absolute -top-2.5 ${dir === 'rtl' ? 'left-3' : 'right-3'} bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs`}>
                    {bundleOffer.stickerText}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900">{bundleLabel}</span>
                  <span className="font-bold text-red-700 text-sm">
                    {bundlePrice} {effectiveCurrency}
                  </span>
                </div>
                <p className="text-[11px] text-red-600/90 mt-0.5 font-medium">
                  {t.saveMoreFreeShipping}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* 4b. Price-affecting customizations (تخصيصات تؤثر على السعر) — تظهر كخيارات إضافية فوق الاستمارة */}
        {activePriceCustomizations.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <label className={`block text-xs font-bold text-stone-900 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {activeLang === 'ar'
                ? 'إضافات وتخصيصات إضافية (تؤثر على السعر)'
                : activeLang === 'fr'
                ? 'Options supplémentaires (impact sur le prix)'
                : 'Extra options (affects price)'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {activePriceCustomizations.map((pc) => {
                const isSelected = selectedPriceCustomizationIds.includes(pc.id);
                return (
                  <button
                    key={pc.id}
                    type="button"
                    onClick={() => {
                      togglePriceCustomization(pc.id);
                      triggerInitiateCheckout();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 ${dir === 'rtl' ? 'text-right' : 'text-left'} transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00AEEF] bg-[#00AEEF]/5 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'bg-[#00AEEF] border-[#00AEEF]' : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="text-xs font-bold text-stone-900">{pc.name}</span>
                    </span>
                    <span className="text-xs font-black text-[#0088bb] tabular-nums">
                      +{pc.priceDelta} {effectiveCurrency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* 5. Variant Selectors (Size, Color & Customizations - Only if enabled for this product) */}
        {(hasSizes || hasColors || activeCustomizations.length > 0) && (
          <div className="space-y-4 pt-1">
            {/* Sizes */}
            {hasSizes && (
              <div className={`space-y-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{t.selectSize}:</span>
                  <span className="text-xs font-bold text-teal-800 font-mono">{selectedSize}</span>
                </div>
                <div className={`flex flex-wrap gap-2 ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSelectedSize(s);
                        triggerInitiateCheckout();
                      }}
                      className={`min-w-[44px] h-10 px-3 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer border ${
                        selectedSize === s
                          ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {hasColors && (
              <div className={`space-y-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{t.selectColor}:</span>
                  <span className="text-xs font-bold text-teal-800">{selectedColor.name}</span>
                </div>
                <div className={`flex flex-wrap gap-2.5 ${dir === 'rtl' ? 'justify-end' : 'justify-start'} items-center`}>
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        triggerInitiateCheckout();
                      }}
                      style={{ backgroundColor: c.hex }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedColor.name === c.name
                          ? 'border-teal-700 scale-110 shadow-xs ring-2 ring-teal-700/30'
                          : 'border-stone-300 hover:scale-105'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Product Customizations (تخصيصات إضافية تظهر طبيعياً كخيارات المنتج في الأعلى) */}
            {activeCustomizations.map((cust) => (
              <div key={cust.id} className={`space-y-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">
                    {cust.title}:
                    {cust.required && <span className="text-red-500 mr-1">*</span>}
                  </span>
                  {customizationValues[cust.id] && (
                    <span className="text-xs font-bold text-teal-800">
                      {customizationValues[cust.id]}
                    </span>
                  )}
                </div>

                {cust.type === 'select' && (
                  <div className={`flex flex-wrap gap-2 ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
                    {cust.options?.map((opt, i) => {
                      const isSelected = customizationValues[cust.id] === opt;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCustomizationValues((prev) => ({
                              ...prev,
                              [cust.id]: opt,
                            }));
                            triggerInitiateCheckout();
                          }}
                          className={`min-w-[44px] h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                            isSelected
                              ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                              : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {cust.type === 'checkbox' && (
                  <div className={`flex flex-wrap gap-2 ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomizationValues((prev) => ({
                          ...prev,
                          [cust.id]: t.withCustomization,
                        }));
                        triggerInitiateCheckout();
                      }}
                      className={`h-10 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                        customizationValues[cust.id] === t.withCustomization || customizationValues[cust.id] === 'نعم'
                          ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                      }`}
                    >
                      {t.withCustomization} {cust.title}
                    </button>
                    {!cust.required && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomizationValues((prev) => ({
                            ...prev,
                            [cust.id]: t.withoutCustomization,
                          }));
                          triggerInitiateCheckout();
                        }}
                        className={`h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                          customizationValues[cust.id] === t.withoutCustomization || customizationValues[cust.id] === 'بدون' || !customizationValues[cust.id]
                            ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                            : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                        }`}
                      >
                        {t.withoutCustomization}
                      </button>
                    )}
                  </div>
                )}

                {cust.type === 'text' && (
                  <input
                    type="text"
                    placeholder={cust.placeholder || (activeLang === 'ar' ? `اكتب ${cust.title} هنا...` : activeLang === 'fr' ? `Saisir ${cust.title} ici...` : `Enter ${cust.title} here...`)}
                    value={customizationValues[cust.id] || ''}
                    onFocus={triggerInitiateCheckout}
                    onChange={(e) =>
                      setCustomizationValues((prev) => ({
                        ...prev,
                        [cust.id]: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs ${
                      dir === 'rtl' ? 'text-right' : 'text-left'
                    } text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-teal-700 transition-all`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 6. Formulaire de Commande (Form with Blue Border as per Moroccan COD standard) */}
        <div
          ref={formRef}
          className={`bg-white p-5 rounded-3xl border-2 border-[#00AEEF] shadow-sm space-y-4 ${
            dir === 'rtl' ? 'text-right' : 'text-left'
          } transition-all`}
        >
          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.orderFormTitle}
            </h2>
            <p className="text-[11px] text-stone-500">
              {t.orderFormSubtitle}
            </p>
          </div>

          {formError && (
            <div className={`p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 ${
              dir === 'rtl' ? 'text-right' : 'text-left'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-3">
            {/* 1. الإسم الكامل */}
            <div>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={customerName}
                onFocus={triggerInitiateCheckout}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={`${effectivePlaceholders.customerName} *`}
                className={`w-full px-4 py-3 bg-white border-2 border-[#00AEEF] rounded-2xl text-xs sm:text-sm ${
                  dir === 'rtl' ? 'text-right' : 'text-left'
                } text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 transition-all`}
              />
            </div>

            {/* 2. رقم الهاتف */}
            <div>
              <input
                ref={phoneInputRef}
                type="tel"
                required
                value={phone}
                onFocus={triggerInitiateCheckout}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={`${effectivePlaceholders.phone} *`}
                className={`w-full px-4 py-3 bg-white border-2 border-[#00AEEF] rounded-2xl text-xs sm:text-sm ${
                  dir === 'rtl' ? 'text-right' : 'text-left'
                } text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 transition-all`}
              />
            </div>

            {/* 3. المدينة */}
            <div>
              <div className="relative">
                <input
                  ref={cityInputRef}
                  list={effectiveCitiesConfig.enabled && effectiveCitiesConfig.cities.length > 0 ? "product-cities-list" : undefined}
                  type="text"
                  required
                  value={city}
                  onFocus={triggerInitiateCheckout}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={`${effectivePlaceholders.city} *`}
                  className={`w-full px-4 py-3 bg-white border-2 border-[#00AEEF] rounded-2xl text-xs sm:text-sm ${
                    dir === 'rtl' ? 'text-right' : 'text-left'
                  } text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 transition-all`}
                />
                {effectiveCitiesConfig.enabled && effectiveCitiesConfig.cities.length > 0 && (
                  <datalist id="product-cities-list">
                    {effectiveCitiesConfig.cities.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>

            {/* 4. العنوان بالتفصيل */}
            <div>
              <input
                ref={addressInputRef}
                type="text"
                required
                value={address}
                onFocus={triggerInitiateCheckout}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`${effectivePlaceholders.address} *`}
                className={`w-full px-4 py-3 bg-white border-2 border-[#00AEEF] rounded-2xl text-xs sm:text-sm ${
                  dir === 'rtl' ? 'text-right' : 'text-left'
                } text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 transition-all`}
              />
            </div>
            {/* Summary Preview - Clean, delivery is always free and not added */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-2 font-sans">
              <div className="flex justify-between items-center text-stone-700">
                <span>{t.productPrice} ({packageDescription}):</span>
                <span className="font-bold tabular-nums text-stone-900">{subtotal - priceCustomizationExtra * quantity} {effectiveCurrency}</span>
              </div>
              {priceCustomizationExtra > 0 && (
                <div className="flex justify-between items-center text-stone-600">
                  <span>{activeLang === 'ar' ? 'الإضافات المختارة' : activeLang === 'fr' ? 'Options sélectionnées' : 'Selected extras'}:</span>
                  <span className="font-bold tabular-nums text-emerald-700">+{priceCustomizationExtra * quantity} {effectiveCurrency}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-stone-900 font-bold border-t border-stone-200 pt-2 text-sm">
                <span>{t.totalCod}:</span>
                <span className="text-red-600 font-black tabular-nums text-base">{grandTotal} {effectiveCurrency}</span>
              </div>
            </div>

            {/* In-form Prominent "Order Now" Button (وسط الاستمارة) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 sm:px-6 bg-[#FF0000] hover:bg-red-700 active:bg-red-800 text-white font-black text-sm sm:text-base rounded-2xl transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 tracking-wide"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.submittingOrder}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t.orderNow}</span>
                  </>
                )}
              </button>
            </div>

            {/* Payment terms guarantee */}
            <div className="pt-1 text-[11px] text-stone-600 flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.codGuarantee}</span>
            </div>
          </form>
        </div>

        {/* Dynamic Product description and features (Rich Word/YouCan-style content) */}
        {showDetails && (product.description || (product.features && product.features.length > 0)) && (
          <div
            className={`space-y-4 transition-all ${
              dir === 'rtl' ? 'text-right' : 'text-left'
            } ${
              product.hasDescriptionBorder === true
                ? 'bg-white p-5 rounded-3xl border border-stone-200 shadow-xs'
                : 'w-full pt-1'
            }`}
          >
            {product.showDescriptionTitle !== false && (
              <div
                className={`pb-2.5 flex items-center justify-between ${
                  product.hasDescriptionBorder === true ? 'border-b border-stone-100' : ''
                }`}
              >
                <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>{t.productDetailsHeading}</span>
                </h3>
              </div>
            )}

            {/* Rich formatted HTML / Text description (with images, headings, callouts) */}
            {product.description && (
              <RichDescriptionView content={product.description} />
            )}

            {/* Bullet features list if present */}
            {product.features && product.features.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-800 block mb-2">{t.additionalFeatures}:</span>
                <ul className="space-y-1.5 list-disc list-inside pr-1 text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {product.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Customer Reviews Section (تفعيل أو إلغاء التقييمات لكل منتج) */}
        {product.reviewsEnabled !== false && (
          <ProductReviewsSection product={product} currency={settings.currency} language={activeLang} />
        )}
        {/* استمارة الطلب السفلية (مكررة بنفس الحالة المشتركة مع الاستمارة العلوية) */}
        {showBottomForm && (
          <div className="pt-3">
            <OrderFormBlock
              product={product}
              activeLang={activeLang}
              dir={dir as 'rtl' | 'ltr'}
              effectiveCurrency={effectiveCurrency}
              effectivePlaceholders={effectivePlaceholders}
              effectiveCities={effectiveCitiesConfig}
              hasSizes={hasSizes}
              hasColors={hasColors}
              activeCustomizations={activeCustomizations}
              priceCustomizations={activePriceCustomizations}
              selectedPriceCustomizationIds={selectedPriceCustomizationIds}
              onTogglePriceCustomization={(id) => { togglePriceCustomization(id); triggerInitiateCheckout(); }}
              priceCustomizationExtra={priceCustomizationExtra}
              isBundleEnabled={isBundleEnabled}
              bundleLabel={bundleLabel}
              bundlePrice={bundlePrice}
              bundleOriginalPrice={bundleOriginalPrice}
              bundleStickerText={bundleOffer?.stickerText}
              unitPrice={unitPrice}
              unitOriginalPrice={unitOriginalPrice}
              subtotal={subtotal}
              grandTotal={grandTotal}
              packageDescription={packageDescription}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              customizationValues={customizationValues}
              selectedPackage={selectedPackage}
              quantity={quantity}
              customerName={customerName}
              phone={phone}
              city={city}
              address={address}
              formError={formError}
              isSubmitting={isSubmitting}
              onSelectSize={(s) => { setSelectedSize(s); triggerInitiateCheckout(); }}
              onSelectColor={(c) => { setSelectedColor(c); triggerInitiateCheckout(); }}
              onCustomizationChange={(id, v) => { setCustomizationValues((prev) => ({ ...prev, [id]: v })); triggerInitiateCheckout(); }}
              onSelectPackage={(p) => { setSelectedPackage(p); triggerInitiateCheckout(); }}
              onQuantityChange={(q) => { setQuantity(q); triggerInitiateCheckout(); }}
              onCustomerNameChange={setCustomerName}
              onPhoneChange={setPhone}
              onCityChange={setCity}
              onAddressChange={setAddress}
              onFieldFocus={triggerInitiateCheckout}
              onSubmit={handleSubmitOrder}
              variant="classic"
              formIdSuffix="bottom"
            />
          </div>
        )}
      </main>

      {/* 7. Sticky Bottom Buy Bar (Matches exact red button layout) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2.5 sm:px-4 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2.5">
          {/* Order Now Red Button */}
          <button
            onClick={() => handleSubmitOrder()}
            disabled={isSubmitting}
            className="flex-1 py-3 px-3 sm:px-6 bg-[#FF0000] hover:bg-red-700 active:bg-red-800 text-white font-black text-sm sm:text-base rounded-md transition-all duration-150 cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 tracking-wide"
          >
            {isSubmitting ? (
              <span>{t.submittingOrder}</span>
            ) : (
              <span>{t.orderNow}</span>
            )}
          </button>

          {/* Quantity Controls & WhatsApp Direct Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setQuantity((q) => q + 1);
                  triggerInitiateCheckout();
                }}
                className="w-8 h-8 rounded-md bg-stone-200 hover:bg-stone-300 active:bg-stone-400 flex items-center justify-center font-bold text-stone-800 cursor-pointer transition-colors"
                aria-label={t.increaseQty}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <span className="w-7 text-center font-bold font-mono text-stone-900 tabular-nums text-xs">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => {
                  setQuantity((q) => Math.max(1, q - 1));
                  triggerInitiateCheckout();
                }}
                className="w-8 h-8 rounded-md bg-stone-200 hover:bg-stone-300 active:bg-stone-400 flex items-center justify-center font-bold text-stone-800 cursor-pointer transition-colors"
                aria-label={t.decreaseQty}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* WhatsApp Direct Button */}
            <button
              onClick={handleWhatsAppCall}
              className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#128C7E] text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label={t.directWhatsAppContact}
              title={t.directWhatsAppTitle}
            >
              <Phone className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 8. Fullscreen Image Lightbox Modal (Click to see full image) */}
      {isLightboxOpen && (
        <div
          onClick={handleCloseLightbox}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-4 z-20 pb-2 border-b border-white/10"
          >
            {/* Close button */}
            <button
              onClick={handleCloseLightbox}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>{t.closeBtn}</span>
            </button>

            {/* Middle: Title & Image counter */}
            <div className="text-center px-2">
              <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                {product.name}
              </h4>
              {allImages.length > 1 && (
                <span className="text-[11px] text-white/60 font-mono">
                  {t.imageCountOf(lightboxIndex + 1, allImages.length)}
                </span>
              )}
            </div>

            {/* Left/Right: Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale((prev) => Math.min(3, prev + 0.3));
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
                title={t.zoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale((prev) => Math.max(0.8, prev - 0.3));
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
                title={t.zoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {zoomScale !== 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomScale(1);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={t.resetZoom}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Center Image Display */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
            {allImages.length > 1 && (
              <button
                onClick={handlePrevLightboxImage}
                className={`absolute ${dir === 'rtl' ? 'right-2 sm:right-6' : 'left-2 sm:left-6'} top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95`}
                title={t.prevImage}
              >
                {dir === 'rtl' ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </button>
            )}

            {/* The Enlargeable Image */}
            <div
              onClick={handleToggleZoom}
              className="max-h-[75vh] max-w-[95vw] sm:max-h-[82vh] flex items-center justify-center transition-transform duration-200 cursor-zoom-in"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {allImages[lightboxIndex] ? (
                <img
                  src={allImages[lightboxIndex]}
                  alt={`${product.name} - ${t.enlargeImage}`}
                  onError={(e) => {
                    if (allImages[lightboxIndex] !== survetteLocalImg) {
                      e.currentTarget.src = survetteLocalImg;
                    }
                  }}
                  className="max-h-[75vh] max-w-[92vw] sm:max-h-[82vh] object-contain rounded-xl shadow-2xl pointer-events-auto"
                />
              ) : (
                <div className="w-[85vw] max-w-md aspect-square bg-stone-900 rounded-2xl flex items-center justify-center p-6 border border-white/10">
                  <FashionIllustration
                    type={product.imageSvgType}
                    accentColor={selectedColor.hex}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <button
                onClick={handleNextLightboxImage}
                className={`absolute ${dir === 'rtl' ? 'left-2 sm:left-6' : 'right-2 sm:right-6'} top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95`}
                title={t.nextImage}
              >
                {dir === 'rtl' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip (if multiple) */}
          {allImages.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 pt-2 border-t border-white/10 overflow-x-auto z-20"
            >
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setZoomScale(1);
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    lightboxIndex === idx
                      ? 'border-white scale-105 shadow-md'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`مصغرة ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
