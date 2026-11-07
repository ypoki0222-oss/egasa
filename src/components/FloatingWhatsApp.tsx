import React, { useState } from 'react';
import { WhatsAppSettings } from '../types';
import { MessageCircle, X, Send } from 'lucide-react';

interface FloatingWhatsAppProps {
  settings: WhatsAppSettings;
  storeName: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ settings, storeName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  if (!settings.enabled || !settings.phoneNumber) return null;

  const handleSend = (textToSend?: string) => {
    const text = textToSend || customMsg || settings.greetingMessage;
    const cleanPhone = settings.phoneNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setCustomMsg('');
  };

  const isLeft = settings.position === 'left';

  return (
    <div
      className={`fixed bottom-6 z-40 flex flex-col ${
        isLeft ? 'left-6 items-start' : 'right-6 items-end'
      }`}
    >
      {/* WhatsApp Mini Popup Card */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-right animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#128C7E] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold">{storeName}</h4>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  متصل الآن لمساعدتك
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat bubble body */}
          <div className="p-3.5 bg-[#EFEAE2] space-y-2.5">
            <div className="bg-white p-3 rounded-xl rounded-tr-none text-xs text-stone-800 shadow-2xs max-w-[90%] leading-relaxed">
              <p>{settings.greetingMessage}</p>
              <span className="text-[9px] text-stone-400 block mt-1 text-left font-mono">الآن</span>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={() => handleSend('مرحباً، أود المساعدة في اختيار المقاس المناسب لي.')}
                className="text-right text-[11px] bg-white/90 hover:bg-white p-2 rounded-lg border border-stone-200 text-stone-700 transition-colors cursor-pointer shadow-2xs"
              >
                👗 مساعدة في اختيار المقاس
              </button>
              <button
                onClick={() => handleSend('مرحباً، أود الاستفسار عن مدة التوصيل وتفاصيل الدفع عند الاستلام.')}
                className="text-right text-[11px] bg-white/90 hover:bg-white p-2 rounded-lg border border-stone-200 text-stone-700 transition-colors cursor-pointer shadow-2xs"
              >
                🚚 استفسار عن التوصيل والدفع عند الاستلام
              </button>
            </div>
          </div>

          {/* Input field */}
          <div className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="اكتب رسالتك هنا..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-1.5 bg-stone-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-right"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="إرسال"
            >
              <Send className="w-3.5 h-3.5 transform rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
        aria-label="تواصل عبر واتساب"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping absolute -top-0.5 -right-0.5" />
        <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
        <span className="hidden sm:inline font-semibold">تواصل معنا واتساب</span>
      </button>
    </div>
  );
};
