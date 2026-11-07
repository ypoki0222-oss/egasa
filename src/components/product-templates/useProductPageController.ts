import { useState, useEffect, useRef } from 'react';
import { Product, StoreSettings, Order, ProductCustomization, PriceCustomization } from '../../types';
import { pixelService } from '../../services/pixelService';
import { sendOrderToGoogleSheet } from '../../services/googleSheetsService';
import { resolveProductCities } from '../../utils/cities';
import { TRANSLATIONS, getDirection, getFontFamily, AppLanguage } from '../../utils/i18n';
import survetteLocalImg from '../../assets/survette_amelia.png';

export interface SelectedColor {
  name: string;
  hex: string;
}

export function useProductPageController(
  product: Product,
  settings: StoreSettings,
  onOrderSuccess: (order: Order) => Promise<void>
) {
  // Active language resolution: product page override first, otherwise store global language
  const activeLang: AppLanguage =
    product.pageLanguageOverride && product.pageLanguageOverride !== 'store'
      ? (product.pageLanguageOverride as AppLanguage)
      : (settings.language || 'ar');
  const t = TRANSLATIONS[activeLang];
  const dir = getDirection(activeLang);
  const font = getFontFamily(activeLang);

  const effectiveCurrency = (product.currency && product.currency.trim()) || settings.currency;
  const effectivePlaceholders = {
    customerName: product.formPlaceholders?.customerName?.trim() || settings.formPlaceholders?.customerName?.trim() || t.customerNamePlaceholder,
    phone: product.formPlaceholders?.phone?.trim() || settings.formPlaceholders?.phone?.trim() || t.phonePlaceholder,
    city: product.formPlaceholders?.city?.trim() || settings.formPlaceholders?.city?.trim() || t.cityPlaceholder,
    address: product.formPlaceholders?.address?.trim() || settings.formPlaceholders?.address?.trim() || t.addressPlaceholder,
  };
  const effectiveCities = resolveProductCities(product, settings);

  // Images
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  const hasSizes = product.sizesEnabled !== false && Array.isArray(product.sizes) && product.sizes.length > 0;
  const hasColors = product.colorsEnabled !== false && Array.isArray(product.colors) && product.colors.length > 0;
  const activeCustomizations: ProductCustomization[] = (product.customizations || []).filter((c) => c.enabled);
  // التخصيصات السعرية (المفعلة فقط) — منفصلة عن customizations العادية
  const activePriceCustomizations: PriceCustomization[] = (product.priceCustomizations || []).filter((c) => c.enabled);
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
  const [customizationValues, setCustomizationValues] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState<string>(hasSizes ? product.sizes[0] || '' : '');
  const [selectedColor, setSelectedColor] = useState<SelectedColor>(
    hasColors
      ? product.colors[0] || { name: activeLang === 'ar' ? 'افتراضي' : activeLang === 'fr' ? 'Par défaut' : 'Default', hex: '#2D3748' }
      : { name: '', hex: '' }
  );

  const bundleOffer = product.bundleOffer;
  const isBundleEnabled = Boolean(bundleOffer?.enabled);
  const bundleLabel =
    bundleOffer?.label ||
    (activeLang === 'ar' ? 'عرض قطعتين (توفير خاص)' : activeLang === 'fr' ? 'Offre 2 pièces (Pack Spécial)' : '2-Piece Offer (Special Savings)');
  const bundlePrice = bundleOffer?.price || Math.round(product.price * 1.75);
  const bundleOriginalPrice = bundleOffer?.originalPrice || Math.round((product.originalPrice || product.price * 1.4) * 2);
  const bundleStickerText = bundleOffer?.stickerText;
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'double'>('single');
  const [quantity, setQuantity] = useState<number>(1);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const hasTrackedCheckoutRef = useRef(false);

  useEffect(() => {
    pixelService.track(
      'ViewContent',
      { content_name: product.name, content_ids: [product.id], content_type: 'product', value: product.price, currency: 'MAD' },
      settings.pixel
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // يعمل فقط عند تغيير المنتج نفسه (product.id) — لا عند كل تحديث بيانات، حتى لا تصعد الصفحة للأعلى لوحدها
  }, [product.id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsLightboxOpen(false); setZoomScale(1); }
      else if (e.key === 'ArrowRight') {
        if (allImages.length > 1) { setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length); setZoomScale(1); }
      } else if (e.key === 'ArrowLeft') {
        if (allImages.length > 1) { setLightboxIndex((prev) => (prev + 1) % allImages.length); setZoomScale(1); }
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
        { content_name: product.name, content_ids: [product.id], content_type: 'product', value: product.price, currency: 'MAD', num_items: quantity },
        settings.pixel
      );
    }
  };

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
  const shippingCost = 0;
  const grandTotal = subtotal;

  const handleOpenLightbox = (index?: number) => {
    setLightboxIndex(index !== undefined ? index : activeImageIndex);
    setZoomScale(1);
    setIsLightboxOpen(true);
  };
  const handleCloseLightbox = () => { setIsLightboxOpen(false); setZoomScale(1); };
  const handleNextLightboxImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length > 1) { setLightboxIndex((prev) => (prev + 1) % allImages.length); setZoomScale(1); }
  };
  const handlePrevLightboxImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length > 1) { setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length); setZoomScale(1); }
  };

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');
    triggerInitiateCheckout();
    if (!customerName.trim()) { setFormError(t.nameRequiredError); return; }
    const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8) { setFormError(t.phoneRequiredError); return; }
    if (!city.trim()) { setFormError(t.cityRequiredError); return; }
    if (!address.trim()) { setFormError(t.addressRequiredError); return; }
    for (const cust of activeCustomizations) {
      if (cust.required && !customizationValues[cust.id]?.trim()) {
        setFormError(`${t.pleaseSpecifyCust} ${cust.title} *`);
        return;
      }
    }
    setIsSubmitting(true);
    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedCustomizations = activeCustomizations
      .filter((c) => customizationValues[c.id]?.trim())
      .map((c) => ({ id: c.id, title: c.title, value: customizationValues[c.id].trim() }));
    const packagePrefix = activeLang === 'ar' ? 'الباقة' : activeLang === 'fr' ? 'Offre' : 'Package';
    const notesParts: string[] = [`${packagePrefix}: ${packageDescription}`];
    if (hasSizes && selectedSize) notesParts.push(`${t.selectSize}: ${selectedSize}`);
    if (hasColors && selectedColor.name) notesParts.push(`${t.selectColor}: ${selectedColor.name}`);
    if (formattedCustomizations.length > 0) {
      notesParts.push(`${t.customizationTitle}: ${formattedCustomizations.map((c) => `${c.title}: ${c.value}`).join(' | ')}`);
    }
    if (selectedPriceCustomizations.length > 0) {
      notesParts.push(`تخصيصات سعرية: ${selectedPriceCustomizations.map((c) => `${c.name} (+${c.priceDelta} ${effectiveCurrency})`).join(', ')}`);
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
      items: [{
        productId: product.id,
        productName: `${product.name} (${packageDescription})`,
        price: unitPrice,
        quantity,
        selectedSize: hasSizes ? selectedSize : undefined,
        selectedColor: hasColors ? selectedColor.name : undefined,
        customizations: formattedCustomizations.length > 0 ? formattedCustomizations : undefined,
        selectedPriceCustomizations: selectedPriceCustomizations.length > 0 ? selectedPriceCustomizations : undefined,
        imageSvgType: product.imageSvgType,
      }],
      subtotal,
      shippingCost,
      totalPrice: grandTotal,
      status: 'new',
      syncedToGoogleSheets: false,
    };
    pixelService.track(
      'Purchase',
      { content_name: product.name, content_ids: [product.id], value: grandTotal, currency: 'MAD', num_items: quantity, order_id: orderNumber, customer_name: customerName.trim(), customer_phone: phone.trim() },
      settings.pixel
    );
    if (settings.googleSheetsWebhookUrl && settings.googleSheetsAutoSync) {
      try {
        const syncResult = await sendOrderToGoogleSheet(newOrder, settings.googleSheetsWebhookUrl, effectiveCurrency);
        newOrder.syncedToGoogleSheets = syncResult.success;
        newOrder.googleSheetsResponse = syncResult.message;
      } catch (err) {
        console.warn('Webhook sync error:', err);
      }
    }
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

  const showDetails = product.showDetailsBeforeForm !== false;
  const showBottomForm = product.showBottomOrderForm === true;

  return {
    activeLang, t, dir, font,
    effectiveCurrency, effectivePlaceholders, effectiveCities,
    imgError, setImgError, primaryImage, allImages,
    activeImageIndex, setActiveImageIndex, activeImageUrl,
    isLightboxOpen, lightboxIndex, zoomScale, setZoomScale,
    handleOpenLightbox, handleCloseLightbox, handleNextLightboxImage, handlePrevLightboxImage,
    hasSizes, hasColors, activeCustomizations,
    activePriceCustomizations, selectedPriceCustomizationIds, togglePriceCustomization,
    selectedPriceCustomizations, priceCustomizationExtra,
    customizationValues, setCustomizationValues,
    selectedSize, setSelectedSize, selectedColor, setSelectedColor,
    isBundleEnabled, bundleLabel, bundlePrice, bundleOriginalPrice, bundleStickerText,
    selectedPackage, setSelectedPackage, quantity, setQuantity,
    customerName, setCustomerName, phone, setPhone, city, setCity, address, setAddress,
    isSubmitting, formError, setFormError,
    unitPrice, unitOriginalPrice, packageDescription, subtotal, shippingCost, grandTotal,
    triggerInitiateCheckout, handleSubmitOrder, handleWhatsAppCall,
    showDetails, showBottomForm,
    survetteLocalImg,
  };
}
