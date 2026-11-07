import React from 'react';
import { ShoppingCart, Plus, Minus, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { Product, ProductCustomization, PriceCustomization } from '../../types';
import { TRANSLATIONS, AppLanguage } from '../../utils/i18n';

export type OrderFormVariant = 'classic' | 'modern' | 'elegant';

interface SelectedColor {
  name: string;
  hex: string;
}

interface OrderFormBlockProps {
  product: Product;
  activeLang: AppLanguage;
  dir: 'rtl' | 'ltr';
  effectiveCurrency: string;
  effectivePlaceholders: { customerName: string; phone: string; city: string; address: string };
  effectiveCities: { enabled: boolean; cities: string[] };
  // Derived flags
  hasSizes: boolean;
  hasColors: boolean;
  activeCustomizations: ProductCustomization[];
  // التخصيصات السعرية (المفعلة) — تظهر كخيارات إضافية تؤثر على السعر
  priceCustomizations?: PriceCustomization[];
  selectedPriceCustomizationIds?: string[];
  onTogglePriceCustomization?: (id: string) => void;
  priceCustomizationExtra?: number;
  isBundleEnabled: boolean;
  bundleLabel: string;
  bundlePrice: number;
  bundleOriginalPrice: number;
  bundleStickerText?: string;
  // Pricing
  unitPrice: number;
  unitOriginalPrice: number;
  subtotal: number;
  grandTotal: number;
  packageDescription: string;
  // State values
  selectedSize: string;
  selectedColor: SelectedColor;
  customizationValues: Record<string, string>;
  selectedPackage: 'single' | 'double';
  quantity: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  formError: string;
  isSubmitting: boolean;
  // Setters / handlers
  onSelectSize: (s: string) => void;
  onSelectColor: (c: SelectedColor) => void;
  onCustomizationChange: (id: string, value: string) => void;
  onSelectPackage: (p: 'single' | 'double') => void;
  onQuantityChange: (q: number) => void;
  onCustomerNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onFieldFocus: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  // Presentation
  variant?: OrderFormVariant;
  formIdSuffix?: string; // لضمان عدم تكرار معرف datalist عند وجود استمارتين
  showQuantity?: boolean;
  title?: string;
  subtitle?: string;
}

const VARIANT_STYLES: Record<OrderFormVariant, {
  container: string;
  input: string;
  submit: string;
  summary: string;
  heading: string;
  priceCustSelected: string;
  priceCustAccent: string;
}> = {
  classic: {
    container: 'bg-white p-5 rounded-3xl border-2 border-[#00AEEF] shadow-sm',
    input: 'border-2 border-[#00AEEF] rounded-2xl focus:ring-2 focus:ring-[#00AEEF]/40',
    submit: 'bg-[#FF0000] hover:bg-red-700 active:bg-red-800',
    summary: 'bg-stone-50 border-stone-200',
    heading: 'text-stone-900',
    priceCustSelected: 'border-[#00AEEF] bg-[#00AEEF]/5 shadow-xs',
    priceCustAccent: 'text-[#0088bb]',
  },
  modern: {
    container: 'bg-white p-5 sm:p-6 rounded-2xl border border-teal-100 shadow-lg shadow-teal-900/5',
    input: 'border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600',
    submit: 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900',
    summary: 'bg-teal-50/60 border-teal-100',
    heading: 'text-stone-900',
    priceCustSelected: 'border-teal-700 bg-teal-50/70 shadow-xs',
    priceCustAccent: 'text-teal-800',
  },
  elegant: {
    container: 'bg-white p-5 sm:p-6 rounded-none border border-stone-200 shadow-sm',
    input: 'border-b-2 border-stone-300 rounded-none focus:border-amber-700 focus:ring-0 bg-transparent px-1',
    submit: 'bg-stone-900 hover:bg-black active:bg-stone-800',
    summary: 'bg-stone-50 border border-stone-200',
    heading: 'text-stone-900',
    priceCustSelected: 'border-amber-700 bg-amber-50/70 shadow-xs',
    priceCustAccent: 'text-amber-800',
  },
};

export const OrderFormBlock: React.FC<OrderFormBlockProps> = ({
  product,
  activeLang,
  dir,
  effectiveCurrency,
  effectivePlaceholders,
  effectiveCities,
  hasSizes,
  hasColors,
  activeCustomizations,
  priceCustomizations = [],
  selectedPriceCustomizationIds = [],
  onTogglePriceCustomization,
  priceCustomizationExtra = 0,
  isBundleEnabled,
  bundleLabel,
  bundlePrice,
  bundleOriginalPrice,
  bundleStickerText,
  unitPrice,
  unitOriginalPrice,
  subtotal,
  grandTotal,
  packageDescription,
  selectedSize,
  selectedColor,
  customizationValues,
  selectedPackage,
  quantity,
  customerName,
  phone,
  city,
  address,
  formError,
  isSubmitting,
  onSelectSize,
  onSelectColor,
  onCustomizationChange,
  onSelectPackage,
  onQuantityChange,
  onCustomerNameChange,
  onPhoneChange,
  onCityChange,
  onAddressChange,
  onFieldFocus,
  onSubmit,
  variant = 'classic',
  formIdSuffix = '',
  showQuantity = true,
  title,
  subtitle,
}) => {
  const t = TRANSLATIONS[activeLang];
  const styles = VARIANT_STYLES[variant];
  const isRtl = dir === 'rtl';
  const datalistId = `product-cities-list${formIdSuffix ? `-${formIdSuffix}` : ''}`;
  const alignCls = isRtl ? 'text-right' : 'text-left';
  const justifyCls = isRtl ? 'justify-end' : 'justify-start';
  // السعر الأساسي (بدون الإضافات السعرية) لعرض تفصيل واضح في الملخص
  const priceCustomizationExtraTotal = priceCustomizationExtra * quantity;
  const baseSubtotal = subtotal - priceCustomizationExtraTotal;

  return (
    <div className={`${styles.container} space-y-4 ${alignCls} transition-all`}>
      {/* Form Header */}
      <div className="space-y-1">
        <h2 className={`text-lg sm:text-xl font-bold ${styles.heading}`}>
          {title || t.orderFormTitle}
        </h2>
        {subtitle !== '' && (
          <p className="text-[11px] text-stone-500">
            {subtitle !== undefined ? subtitle : t.orderFormSubtitle}
          </p>
        )}
      </div>

      {formError && (
        <div className={`p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 ${alignCls}`}>
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Price-affecting customizations (تخصيصات تؤثر على السعر) — تظهر فوق الاستمارة وبجوار السعر */}
        {priceCustomizations.length > 0 && onTogglePriceCustomization && (
          <div className="space-y-2.5 pt-1">
            <label className={`block text-xs font-bold text-stone-900 ${alignCls}`}>
              {activeLang === 'ar'
                ? 'إضافات وتخصيصات إضافية (تؤثر على السعر)'
                : activeLang === 'fr'
                ? 'Options supplémentaires (impact sur le prix)'
                : 'Extra options (affects price)'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {priceCustomizations.map((pc) => {
                const isSelected = selectedPriceCustomizationIds.includes(pc.id);
                return (
                  <button
                    key={pc.id}
                    type="button"
                    onClick={() => onTogglePriceCustomization(pc.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 ${alignCls} transition-all cursor-pointer ${
                      isSelected ? styles.priceCustSelected : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? variant === 'classic'
                              ? 'bg-[#00AEEF] border-[#00AEEF]'
                              : variant === 'modern'
                              ? 'bg-teal-700 border-teal-700'
                              : 'bg-amber-700 border-amber-700'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="text-xs font-bold text-stone-900">{pc.name}</span>
                    </span>
                    <span className={`text-xs font-black ${styles.priceCustAccent} tabular-nums`}>
                      +{pc.priceDelta} {effectiveCurrency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Bundle Packages */}
        {isBundleEnabled && (
          <div className="space-y-2.5 pt-1">
            <label className={`block text-xs font-bold text-stone-900 ${alignCls}`}>
              {t.choosePackage}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectPackage('single')}
                className={`p-3.5 rounded-xl border-2 ${alignCls} transition-all cursor-pointer ${
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
              <button
                type="button"
                onClick={() => onSelectPackage('double')}
                className={`relative p-3.5 rounded-xl border-2 ${alignCls} transition-all cursor-pointer ${
                  selectedPackage === 'double'
                    ? 'border-red-600 bg-red-50/70 shadow-xs'
                    : 'border-red-200 bg-white hover:border-red-300'
                }`}
              >
                {bundleStickerText && (
                  <span className={`absolute -top-2.5 ${isRtl ? 'left-3' : 'right-3'} bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs`}>
                    {bundleStickerText}
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

        {/* Variants: Size / Color / Customizations */}
        {(hasSizes || hasColors || activeCustomizations.length > 0) && (
          <div className="space-y-4 pt-1">
            {hasSizes && (
              <div className={`space-y-2 ${alignCls}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{t.selectSize}:</span>
                  <span className="text-xs font-bold text-teal-800 font-mono">{selectedSize}</span>
                </div>
                <div className={`flex flex-wrap gap-2 ${justifyCls}`}>
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSelectSize(s)}
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

            {hasColors && (
              <div className={`space-y-2 ${alignCls}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{t.selectColor}:</span>
                  <span className="text-xs font-bold text-teal-800">{selectedColor.name}</span>
                </div>
                <div className={`flex flex-wrap gap-2.5 ${justifyCls} items-center`}>
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSelectColor(c)}
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

            {activeCustomizations.map((cust) => (
              <div key={cust.id} className={`space-y-2 ${alignCls}`}>
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
                  <div className={`flex flex-wrap gap-2 ${justifyCls}`}>
                    {cust.options?.map((opt, i) => {
                      const isSelected = customizationValues[cust.id] === opt;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onCustomizationChange(cust.id, opt)}
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
                  <div className={`flex flex-wrap gap-2 ${justifyCls}`}>
                    <button
                      type="button"
                      onClick={() => onCustomizationChange(cust.id, t.withCustomization)}
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
                        onClick={() => onCustomizationChange(cust.id, t.withoutCustomization)}
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
                    onFocus={onFieldFocus}
                    onChange={(e) => onCustomizationChange(cust.id, e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs ${alignCls} text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-teal-700 transition-all`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quantity Stepper */}
        {showQuantity && (
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-bold text-stone-900">{activeLang === 'ar' ? 'الكمية' : activeLang === 'fr' ? 'Quantité' : 'Quantity'}:</span>
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
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
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-md bg-stone-200 hover:bg-stone-300 active:bg-stone-400 flex items-center justify-center font-bold text-stone-800 cursor-pointer transition-colors"
                aria-label={t.decreaseQty}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Four fields */}
        <div>
          <input
            type="text"
            required
            value={customerName}
            onFocus={onFieldFocus}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder={`${effectivePlaceholders.customerName} *`}
            className={`w-full px-4 py-3 bg-white ${styles.input} text-xs sm:text-sm ${alignCls} text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all`}
          />
        </div>
        <div>
          <input
            type="tel"
            required
            value={phone}
            onFocus={onFieldFocus}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={`${effectivePlaceholders.phone} *`}
            className={`w-full px-4 py-3 bg-white ${styles.input} text-xs sm:text-sm ${alignCls} text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all`}
          />
        </div>
        <div>
          <div className="relative">
            <input
              list={effectiveCities.enabled && effectiveCities.cities.length > 0 ? datalistId : undefined}
              type="text"
              required
              value={city}
              onFocus={onFieldFocus}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder={`${effectivePlaceholders.city} *`}
              className={`w-full px-4 py-3 bg-white ${styles.input} text-xs sm:text-sm ${alignCls} text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all`}
            />
            {effectiveCities.enabled && effectiveCities.cities.length > 0 && (
              <datalist id={datalistId}>
                {effectiveCities.cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
          </div>
        </div>
        <div>
          <input
            type="text"
            required
            value={address}
            onFocus={onFieldFocus}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder={`${effectivePlaceholders.address} *`}
            className={`w-full px-4 py-3 bg-white ${styles.input} text-xs sm:text-sm ${alignCls} text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all`}
          />
        </div>

        {/* Summary */}
        <div className={`${styles.summary} p-3.5 rounded-2xl text-xs space-y-2 font-sans`}>
          <div className="flex justify-between items-center text-stone-700">
            <span>{t.productPrice} ({packageDescription}):</span>
            <span className="font-bold tabular-nums text-stone-900">{baseSubtotal} {effectiveCurrency}</span>
          </div>
          {priceCustomizationExtraTotal > 0 && (
            <div className="flex justify-between items-center text-stone-600">
              <span>
                {activeLang === 'ar' ? 'الإضافات المختارة' : activeLang === 'fr' ? 'Options sélectionnées' : 'Selected extras'}:
              </span>
              <span className="font-bold tabular-nums text-emerald-700">+{priceCustomizationExtraTotal} {effectiveCurrency}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-stone-900 font-bold border-t border-stone-200/70 pt-2 text-sm">
            <span>{t.totalCod}:</span>
            <span className="text-red-600 font-black tabular-nums text-base">{grandTotal} {effectiveCurrency}</span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-4 sm:px-6 ${styles.submit} text-white font-black text-sm sm:text-base rounded-2xl transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 tracking-wide`}
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

        {/* COD guarantee */}
        <div className="pt-1 text-[11px] text-stone-600 flex items-center justify-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t.codGuarantee}</span>
        </div>
      </form>
    </div>
  );
};
