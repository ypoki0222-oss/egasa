import React from 'react';
import { ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { FashionIllustration } from './FashionIllustration';

interface HeroBannerProps {
  onExploreClick: () => void;
  onFeaturedClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick, onFeaturedClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F3EF] to-[#FAF9F6] border-b border-[#E7E5E4] py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-right">
            {/* Clean unboxed kicker metadata */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#78716C] uppercase">
              <span>تشكيلة الموسم الفاخرة</span>
              <span aria-hidden="true">·</span>
              <span>خياطة استثنائية</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-bold">الدفع عند الاستلام</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1C1917] leading-[1.2] font-serif text-balance">
              أناقة لا تتكرر، مصممة بحرفية لتلهم حضورك.
            </h1>

            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-2xl">
              اكتشف أرقى خطوط الموضة والأزياء الراقية بخامات طبيعية فاخرة. اطلب الآن بكل ثقة وادفع نقداً عند استلام طلبك بعد المعاينة التامة.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-white bg-[#1E232A] rounded-xl hover:bg-[#292524] transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>تصفح المجموعة والطلب</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onFeaturedClick}
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-[#1C1917] bg-white border border-[#D6D3D1] rounded-xl hover:bg-[#F5F5F4] transition-colors cursor-pointer"
              >
                القطع الأكثر مبيعاً
              </button>
            </div>

            {/* Proof metrics & Guarantees */}
            <div className="pt-8 border-t border-[#E7E5E4] grid grid-cols-3 gap-4 text-center sm:text-right">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAE8E3] flex items-center justify-center text-[#1C1917] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1917]">دفع عند الاستلام</h4>
                  <p className="text-[11px] text-[#78716C]">عاين القطعة قبل السداد</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAE8E3] flex items-center justify-center text-[#1C1917] shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1917]">توصيل سريع</h4>
                  <p className="text-[11px] text-[#78716C]">خلال 24 إلى 48 ساعة</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAE8E3] flex items-center justify-center text-[#1C1917] shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1917]">استبدال سلس</h4>
                  <p className="text-[11px] text-[#78716C]">خدمة عملاء على مدار الساعة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* Outer decorative subtle frame */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
                <FashionIllustration type="blazer" accentColor="#C2844A" className="w-full h-full" />
                
                {/* Floating highlight badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-stone-200/80">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">قطعة الأسبوع</div>
                  <div className="text-xs font-bold text-stone-900">بليزر كتان نخب أول</div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-[#1E232A]/90 backdrop-blur-md text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-stone-300">سعر الإطلاق الحصري</p>
                    <p className="text-base font-bold font-mono">340 ر.س</p>
                  </div>
                  <button
                    onClick={onFeaturedClick}
                    className="px-3.5 py-1.5 text-xs font-bold bg-white text-[#1E232A] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    طلب فوري
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
