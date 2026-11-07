import React from 'react';
import { Order, WhatsAppSettings } from '../types';
import { TRANSLATIONS, getDirection, getFontFamily, AppLanguage } from '../utils/i18n';
import { CheckCircle2, MessageCircle, ArrowRight, ArrowLeft, Package, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  currency: string;
  whatsappSettings: WhatsAppSettings;
  language?: AppLanguage;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  currency,
  whatsappSettings,
  language = 'ar',
  onClose,
}) => {
  if (!order) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.ar;
  const dir = getDirection(language);
  const font = getFontFamily(language);

  const handleWhatsAppContact = () => {
    const msg = t.orderWhatsAppMsg(order.orderNumber, order.customerName, order.totalPrice, currency);
    const cleanPhone = whatsappSettings.phoneNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      dir={dir}
      style={{ fontFamily: font }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden ${
          dir === 'rtl' ? 'text-right' : 'text-left'
        } animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Success Header banner */}
        <div className="bg-[#1E232A] text-white p-6 text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase tracking-widest text-stone-300 font-semibold">
            {t.orderReceivedSuccess}
          </span>
          <h3 className="text-2xl font-bold font-serif">{t.thankYouOrder}</h3>
          <p className="text-xs text-stone-300 font-mono">
            {t.yourOrderNumber} <span className="font-bold text-white text-sm">{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-5">
          {/* Status Note */}
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t.paymentMethodCod}</p>
              <p className="text-emerald-700 mt-0.5">
                {t.deliveryNotice}
              </p>
            </div>
          </div>

          {/* Sync indicator */}
          {order.syncedToGoogleSheets && (
            <div className="text-[11px] text-stone-500 flex items-center justify-between bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
              <span>{t.orderSyncedSheets}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          )}

          {/* Order Summary Itemized */}
          <div className="space-y-2 border border-stone-200 rounded-xl p-3.5 bg-stone-50/50 text-xs">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-2">
              <Package className="w-4 h-4 text-stone-600" />
              <span>{t.itemsDetails}</span>
            </h4>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-stone-700 py-1">
                <div>
                  <span className="font-semibold text-stone-900">{item.productName}</span>
                  {(item.selectedSize || item.selectedColor) && (
                    <span className={`text-stone-500 font-mono ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>
                      ({[item.selectedSize, item.selectedColor].filter(Boolean).join(' / ')} × {item.quantity})
                    </span>
                  )}
                  {item.selectedPriceCustomizations && item.selectedPriceCustomizations.length > 0 && (
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex flex-wrap gap-1">
                      {item.selectedPriceCustomizations.map((pc, i) => (
                        <span key={i} className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {pc.name} (+{pc.priceDelta} {currency})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-mono font-bold">{item.price * item.quantity} {currency}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between font-bold text-stone-900">
              <span>{t.totalAmountDue}</span>
              <span className="text-base text-emerald-800 font-mono tabular-nums">{order.totalPrice} {currency}</span>
            </div>
          </div>

          {/* Customer delivery info */}
          <div className="text-xs text-stone-600 space-y-1 bg-white p-3 rounded-xl border border-stone-100">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>{t.registeredPhone} <strong dir="ltr">{order.phone}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{t.deliveryAddress} {order.city} - {order.address}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {whatsappSettings.enabled && (
              <button
                onClick={handleWhatsAppContact}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.followOrderOnWhatsApp}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t.continueShoppingStore}</span>
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
