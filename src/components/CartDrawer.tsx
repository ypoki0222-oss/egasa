import React, { useState } from 'react';
import { Product, StoreSettings, Order, OrderItem } from '../types';
import { FashionIllustration } from './FashionIllustration';
import { pixelService } from '../services/pixelService';
import { sendOrderToGoogleSheet } from '../services/googleSheetsService';
import { resolveProductCities } from '../utils/cities';
import { TRANSLATIONS, getDirection, getFontFamily, AppLanguage } from '../utils/i18n';
import { X, Trash2, ShoppingBag, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  items: {
    product: Product;
    selectedSize: string;
    selectedColor: string;
    selectedFabric?: string;
    quantity: number;
  }[];
  settings: StoreSettings;
  language?: AppLanguage;
  onClose: () => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onOrderSuccess: (order: Order) => Promise<void>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  settings,
  language,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOrderSuccess,
}) => {
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const activeLang: AppLanguage = language || settings.language || 'ar';
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.ar;
  const dir = getDirection(activeLang);
  const font = getFontFamily(activeLang);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = 0;
  const grandTotal = subtotal;
  const cartCityConfig = resolveProductCities(items[0]?.product, settings);

  const effectivePlaceholders = {
    customerName: settings.formPlaceholders?.customerName?.trim() || t.customerNamePlaceholder,
    phone: settings.formPlaceholders?.phone?.trim() || t.phonePlaceholder,
    city: settings.formPlaceholders?.city?.trim() || t.cityPlaceholder,
    address: settings.formPlaceholders?.address?.trim() || t.addressPlaceholder,
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      setFormError(t.fillAllFieldsError);
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      selectedSize: i.selectedSize,
      selectedColor: i.selectedColor,
      selectedFabric: i.selectedFabric,
      imageSvgType: i.product.imageSvgType,
    }));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      notes: notes.trim(),
      items: orderItems,
      subtotal,
      shippingCost,
      totalPrice: grandTotal,
      status: 'new',
      syncedToGoogleSheets: false,
    };

    // Track Pixel Purchase
    pixelService.track(
      'Purchase',
      {
        value: grandTotal,
        currency: settings.currency,
        num_items: items.length,
        order_id: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
      },
      settings.pixel
    );

    // Sync to Google Sheets if configured
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
      setFormError(activeLang === 'fr' ? 'Impossible d’enregistrer la commande. Réessayez.' : activeLang === 'en' ? 'Could not save your order. Please try again.' : 'تعذر حفظ الطلب. يرجى المحاولة مجددًا.');
      return;
    } finally {
      setIsSubmitting(false);
    }
    onClose();
  };

  return (
    <div
      dir={dir}
      style={{ fontFamily: font }}
      className={`fixed inset-0 z-50 flex ${dir === 'rtl' ? 'justify-end' : 'justify-start'} bg-black/50 backdrop-blur-xs`}
    >
      <div className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-800" />
            <h3 className="text-base font-bold text-stone-900">{t.cartTitle}</h3>
            <span className="text-xs font-mono text-stone-500">
              ({items.length} {t.cartItemsCount})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-500 hover:text-black rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free delivery banner */}
        {items.length > 0 && (
          <div className="p-2.5 bg-emerald-50 border-b border-emerald-100 text-xs">
            <p className="text-emerald-700 font-bold flex items-center gap-1.5 justify-center text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.freeShippingBanner}</span>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-stone-500">
              <ShoppingBag className="w-12 h-12 text-stone-300" />
              <p className="text-base font-bold text-stone-800">{t.emptyCart}</p>
              <p className="text-xs">{t.emptyCartSubtitle}</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              >
                {t.browseProducts}
              </button>
            </div>
          ) : !showCheckoutForm ? (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${index}`}
                  className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-white">
                    <FashionIllustration
                      type={item.product.imageSvgType}
                      accentColor="#2D3748"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{item.product.name}</h4>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.selectedSize && <span>{t.selectSize}: {item.selectedSize}</span>}
                      {item.selectedSize && item.selectedColor && <span>·</span>}
                      {item.selectedColor && <span>{t.selectColor}: {item.selectedColor}</span>}
                    </div>
                    <div className="text-xs font-bold font-mono text-stone-900 mt-1">
                      {item.product.price} {settings.currency}
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-stone-300 rounded bg-white text-xs">
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-stone-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="px-2 py-0.5 hover:bg-stone-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        aria-label={t.closeBtn}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fast Formulaire in Cart */
            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h4 className="text-xs font-bold text-stone-900">{t.deliveryInfoCod}</h4>
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(false)}
                  className="text-xs text-stone-500 hover:underline cursor-pointer"
                >
                  {t.editItems}
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.customerNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={`${effectivePlaceholders.customerName} *`}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${
                    dir === 'rtl' ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  placeholder={`${effectivePlaceholders.phone} *`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${
                    dir === 'rtl' ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.cityLabel}</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list={cartCityConfig.enabled && cartCityConfig.cities.length > 0 ? "cart-cities-list" : undefined}
                    placeholder={`${effectivePlaceholders.city} *`}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${
                      dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  />
                  {cartCityConfig.enabled && cartCityConfig.cities.length > 0 && (
                    <datalist id="cart-cities-list">
                      {cartCityConfig.cities.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.addressLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={`${effectivePlaceholders.address} *`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${
                    dir === 'rtl' ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.notesLabel}</label>
                <input
                  type="text"
                  placeholder={t.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${
                    dir === 'rtl' ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#1E232A] hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <span>{t.orderConfirmationInProgress}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.confirmOrderWithTotal(grandTotal, settings.currency)}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && !showCheckoutForm && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>{t.productsPriceLabel}</span>
                <span className="font-mono tabular-nums font-bold">{subtotal} {settings.currency}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-extrabold text-stone-900">
                <span>{t.cartTotal}</span>
                <span className="text-base text-red-600 font-mono tabular-nums font-black">{grandTotal} {settings.currency}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCheckoutForm(true)}
              className="w-full py-3.5 bg-[#1E232A] hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t.proceedToConfirmCod}</span>
              {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
