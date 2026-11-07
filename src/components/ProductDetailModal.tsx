import React, { useState, useEffect } from 'react';
import { Product, StoreSettings, Order } from '../types';
import { FashionIllustration } from './FashionIllustration';
import { ProductImage } from './ProductImage';
import { pixelService } from '../services/pixelService';
import { sendOrderToGoogleSheet } from '../services/googleSheetsService';
import { RichDescriptionView } from './RichDescriptionView';
import { ProductReviewsSection } from './ProductReviewsSection';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  User,
  MapPin,
  FileText,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: {
    product: Product;
    selectedSize: string;
    selectedColor: string;
    selectedFabric?: string;
    quantity: number;
  }) => void;
  onOrderSuccess: (order: Order) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onAddToCart,
  onOrderSuccess,
}) => {
  if (!isOpen || !product) return null;

  // Sizes & Colors toggles (تفعيل أو إلغاء المقاسات والألوان)
  const hasSizes = product.sizesEnabled !== false && Array.isArray(product.sizes) && product.sizes.length > 0;
  const hasColors = product.colorsEnabled !== false && Array.isArray(product.colors) && product.colors.length > 0;

  // Active Customizations (إمكانية إضافة أي تخصيص وتفعيله أو لا)
  const activeCustomizations = (product.customizations || []).filter((c) => c.enabled);
  const [customizationValues, setCustomizationValues] = useState<Record<string, string>>({});

  // Dynamic image resolution
  const displayImage =
    product.customImage ||
    (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
    (product.id === 'prod-survette-amelia' && !product.customImage ? '/uploads/survette_amelia.png' : null);

  // Selected options state
  const [selectedSize, setSelectedSize] = useState<string>(hasSizes ? product.sizes[0] || '' : '');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>(
    hasColors ? product.colors[0] || { name: 'افتراضي', hex: '#2D3748' } : { name: '', hex: '' }
  );
  const [selectedFabric, setSelectedFabric] = useState<string>(product.fabrics?.[0] || '');
  const [quantity, setQuantity] = useState<number>(1);

  // Formulaire fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Track ViewContent on open
  useEffect(() => {
    if (product) {
      pixelService.track(
        'ViewContent',
        {
          content_name: product.name,
          content_ids: [product.id],
          content_type: 'product',
          value: product.price,
          currency: settings.currency,
        },
        settings.pixel
      );
    }
  }, [product, settings]);

  // Pricing calculations - Delivery is always free
  const subtotal = product.price * quantity;
  const shippingCost = 0;
  const grandTotal = subtotal;

  // Track InitiateCheckout when user starts typing
  const handleInputChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    if (!customerName && !phone && val.length > 2) {
      pixelService.track(
        'InitiateCheckout',
        {
          content_name: product.name,
          content_ids: [product.id],
          value: grandTotal,
          currency: settings.currency,
          num_items: quantity,
        },
        settings.pixel
      );
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('يرجى كتابة الاسم الكامل لتأكيد التوصيل.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setFormError('يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد الشحنة.');
      return;
    }
    if (!city.trim()) {
      setFormError('يرجى تحديد المدينة.');
      return;
    }
    if (!address.trim()) {
      setFormError('يرجى كتابة العنوان التفصيلي (الحي، الشارع، أو المعلم).');
      return;
    }

    // Validate required customizations
    for (const cust of activeCustomizations) {
      if (cust.required && !customizationValues[cust.id]?.trim()) {
        setFormError(`يرجى إكمال التخصيص المطلوب: ${cust.title} *`);
        return;
      }
    }

    setIsSubmitting(true);

    const formattedCustomizations = activeCustomizations
      .filter((c) => customizationValues[c.id]?.trim())
      .map((c) => ({
        id: c.id,
        title: c.title,
        value: customizationValues[c.id].trim(),
      }));

    const notesParts: string[] = [];
    if (notes.trim()) notesParts.push(notes.trim());
    if (hasSizes && selectedSize) notesParts.push(`المقاس: ${selectedSize}`);
    if (hasColors && selectedColor.name) notesParts.push(`اللون: ${selectedColor.name}`);
    if (formattedCustomizations.length > 0) {
      notesParts.push(
        `التخصيصات: ${formattedCustomizations.map((c) => `${c.title}: ${c.value}`).join(' | ')}`
      );
    }

    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
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
          productName: product.name,
          price: product.price,
          quantity,
          selectedSize: hasSizes ? selectedSize : undefined,
          selectedColor: hasColors ? selectedColor.name : undefined,
          selectedFabric: selectedFabric || undefined,
          customizations: formattedCustomizations.length > 0 ? formattedCustomizations : undefined,
          imageSvgType: product.imageSvgType,
        },
      ],
      subtotal,
      shippingCost,
      totalPrice: grandTotal,
      status: 'new',
      syncedToGoogleSheets: false,
    };

    // 1. Fire Pixel Purchase event
    pixelService.track(
      'Purchase',
      {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: grandTotal,
        currency: settings.currency,
        num_items: quantity,
        order_id: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
      },
      settings.pixel
    );

    // 2. Sync to Google Sheets if Webhook is configured
    if (settings.googleSheetsWebhookUrl && settings.googleSheetsAutoSync) {
      const syncResult = await sendOrderToGoogleSheet(
        newOrder,
        settings.googleSheetsWebhookUrl,
        settings.currency
      );
      newOrder.syncedToGoogleSheets = syncResult.success;
      newOrder.googleSheetsResponse = syncResult.message;
    }

    try {
      await onOrderSuccess(newOrder);
    } catch {
      setFormError(settings.language === 'fr' ? 'Impossible d’enregistrer la commande. Réessayez.' : settings.language === 'en' ? 'Could not save your order. Please try again.' : 'تعذر حفظ الطلب. يرجى المحاولة مجددًا.');
      return;
    } finally {
      setIsSubmitting(false);
    }
    onClose();
  };

  const handleAddAndClose = () => {
    onAddToCart({
      product,
      selectedSize: hasSizes ? selectedSize : '',
      selectedColor: hasColors ? selectedColor.name : '',
      selectedFabric: selectedFabric || undefined,
      quantity,
    });
    pixelService.track(
      'AddToCart',
      {
        content_name: product.name,
        content_ids: [product.id],
        value: product.price * quantity,
        currency: settings.currency,
        quantity,
      },
      settings.pixel
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 text-right max-h-[92vh] flex flex-col">
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {product.category}
            </span>
            <span aria-hidden="true" className="text-stone-300">
              ·
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              الدفع عند الاستلام
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Visual Preview Left/Top */}
            <div className="lg:col-span-5 space-y-4">
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs relative">
                <ProductImage
                  fill
                  src={displayImage}
                  alt={product.name}
                  eager
                  objectFit="cover"
                  fallbackIllustration={
                    <FashionIllustration
                      type={product.imageSvgType || 'dress'}
                      accentColor={selectedColor.hex || '#2D3748'}
                      className="w-full h-full object-cover"
                    />
                  }
                />

                {product.badge && (
                  <div className="absolute top-3 right-3 bg-[#1E232A] text-white px-3 py-1 rounded text-xs font-semibold">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Quality & Trust Highlights */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>معاينة القطعة وقياسها قبل دفع أي مبلغ للمندوب</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-stone-700 shrink-0" />
                  <span>توصيل مجاني وسريع لجميع الطلبات لباب منزلك</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
                  <span>ضمان استبدال فوري للمقاس خلال 48 ساعة</span>
                </div>
              </div>
            </div>

            {/* Product Details & Variant Selectors Right */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-stone-600 text-xs">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="font-bold text-stone-900 font-mono tabular-nums">{product.rating}</span>
                  <span className="text-stone-400 font-mono">({product.reviewsCount} تقييم حقيقي)</span>
                </div>

                <h2 className="text-2xl font-bold text-stone-900 font-serif leading-snug">
                  {product.name}
                </h2>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-stone-900 font-mono tabular-nums">
                    {product.price} {settings.currency}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-stone-400 line-through font-mono tabular-nums">
                      {product.originalPrice} {settings.currency}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      وفر {product.originalPrice - product.price} {settings.currency}
                    </span>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="py-1">
                  <RichDescriptionView content={product.description} />
                </div>
              )}

              {product.features && product.features.length > 0 && (
                <ul className="space-y-1 list-disc list-inside text-xs text-stone-600 pt-1">
                  {product.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              )}

              {/* Options: Colors (Only if enabled) */}
              {hasColors && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">اللون المختار:</span>
                    <span className="text-stone-600 font-medium">{selectedColor.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor.name === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                              : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300'
                          }`}
                        >
                          <span
                            style={{ backgroundColor: color.hex }}
                            className={`w-3.5 h-3.5 rounded-full border ${
                              isSelected ? 'border-white' : 'border-stone-300'
                            }`}
                          />
                          <span>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Options: Sizes (Only if enabled) */}
              {hasSizes && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">المقاس:</span>
                    <span className="text-stone-500">اختر مقاسك المعتاد</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Options: Fabric if available */}
              {product.fabrics && product.fabrics.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-900">نوع القماش والخامة:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.fabrics.map((fabric) => (
                      <button
                        key={fabric}
                        type="button"
                        onClick={() => setSelectedFabric(fabric)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          selectedFabric === fabric
                            ? 'border-stone-900 bg-stone-100 text-stone-900 font-bold'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {fabric}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Options: Customizations (تظهر كخيارات للمنتج في الأعلى بجانب المقاس واللون) */}
              {activeCustomizations.map((cust) => (
                <div key={cust.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">
                      {cust.title}:
                      {cust.required && <span className="text-red-500 mr-1">*</span>}
                    </span>
                    {customizationValues[cust.id] && (
                      <span className="text-stone-600 font-medium font-mono">
                        {customizationValues[cust.id]}
                      </span>
                    )}
                  </div>

                  {cust.type === 'select' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {cust.options?.map((opt, i) => {
                        const isSelected = customizationValues[cust.id] === opt;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setCustomizationValues((prev) => ({
                                ...prev,
                                [cust.id]: opt,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-xs'
                                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {cust.type === 'checkbox' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomizationValues((prev) => ({
                            ...prev,
                            [cust.id]: 'نعم',
                          }))
                        }
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          customizationValues[cust.id] === 'نعم'
                            ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        نعم، مع {cust.title}
                      </button>
                      {!cust.required && (
                        <button
                          type="button"
                          onClick={() =>
                            setCustomizationValues((prev) => ({
                              ...prev,
                              [cust.id]: 'بدون',
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            customizationValues[cust.id] === 'بدون' || !customizationValues[cust.id]
                              ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                          }`}
                        >
                          بدون
                        </button>
                      )}
                    </div>
                  )}

                  {cust.type === 'text' && (
                    <input
                      type="text"
                      placeholder={cust.placeholder || `اكتب ${cust.title} هنا...`}
                      value={customizationValues[cust.id] || ''}
                      onChange={(e) =>
                        setCustomizationValues((prev) => ({
                          ...prev,
                          [cust.id]: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-right text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 font-['Cairo'] transition-all"
                    />
                  )}
                </div>
              ))}

              {/* Quantity Stepper & Bulk Offer Badge */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-900">الكمية:</span>
                  <div className="inline-flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold font-mono tabular-nums min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddAndClose}
                  className="text-xs font-semibold text-stone-700 hover:text-black flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>إضافة إلى السلة فقط</span>
                </button>
              </div>
            </div>
          </div>

          {/* Formulaire de commande express (COD Direct Order Form) */}
          <div className="border-t-2 border-stone-200 pt-6">
            <div className="bg-gradient-to-br from-stone-50 via-white to-stone-100/60 p-5 sm:p-7 rounded-2xl border border-stone-300 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-stone-800" />
                    <span>نموذج تأكيد الطلب السريع (الدفع عند الاستلام)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    املأ بياناتك وسيصلك اتصال لتأكيد الطلب وشحنه فوراً إلى باب بيتك
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                  لا يتطلب بطاقة بنكية
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>الاسم الكامل *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد محمد الدوسري"
                      value={customerName}
                      onChange={(e) => handleInputChange(setCustomerName, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all text-right"
                    />
                  </div>

                  {/* Phone field */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-500" />
                      <span>رقم الهاتف / الواتساب *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => handleInputChange(setPhone, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all text-right"
                    />
                  </div>

                  {/* City field */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>المدينة / المنطقة *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الرياض، جدة، دبي، الدار البيضاء..."
                      value={city}
                      onChange={(e) => handleInputChange(setCity, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all text-right"
                    />
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>العنوان التفصيلي للتوصيل *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="الحي، اسم الشارع، رقم العمارة أو المنزل"
                      value={address}
                      onChange={(e) => handleInputChange(setAddress, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all text-right"
                    />
                  </div>
                </div>
                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    ملاحظات إضافية للمندوب (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: يرجى التوصيل بعد العصر أو الاتصال مسبقاً"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all text-right"
                  />
                </div>

                {/* Price Summary Breakdown - Delivery is always free */}
                <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>قيمة الطلب ({quantity} قطعة):</span>
                    <span className="font-mono tabular-nums font-bold">
                      {subtotal} {settings.currency}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-extrabold text-stone-900">
                    <span>المبلغ المستحق عند الاستلام:</span>
                    <span className="text-lg font-mono tabular-nums text-red-600 font-bold">
                      {grandTotal} {settings.currency}
                    </span>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-[#1E232A] hover:bg-black text-white font-bold text-base rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري تسجيل وإرسال طلبك...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>تأكيد الطلب الآن (الدفع نقداً عند الاستلام)</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>سنقوم بتجهيز وشحن طلبك فوراً والتواصل معك للمتابعة</span>
                </p>
              </form>

              {/* Customer Reviews Section (if enabled) */}
              {product.reviewsEnabled !== false && (
                <div className="mt-8 pt-6 border-t border-stone-200">
                  <ProductReviewsSection product={product} currency={settings.currency} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
