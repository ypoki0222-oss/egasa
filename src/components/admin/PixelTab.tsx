import React, { useState, useEffect } from 'react';
import { PixelSettings, PixelEventLog } from '../../types';
import { pixelService } from '../../services/pixelService';
import {
  Activity,
  Save,
  Check,
  Zap,
  Code,
  ShieldCheck,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface PixelTabProps {
  settings: PixelSettings;
  currency: string;
  onSave: (settings: PixelSettings) => Promise<void>;
}

export const PixelTab: React.FC<PixelTabProps> = ({ settings, currency, onSave }) => {
  const [localSettings, setLocalSettings] = useState<PixelSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [logs, setLogs] = useState<PixelEventLog[]>(pixelService.getLogs());
  const [testEventCode, setTestEventCode] = useState<string>(() => pixelService.getTestEventCode());
  const [testFeedback, setTestFeedback] = useState<string>('');

  useEffect(() => {
    const unsubscribe = pixelService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const handleChange = <K extends keyof PixelSettings>(key: K, value: PixelSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestEventCodeChange = (val: string) => {
    setTestEventCode(val);
    pixelService.setTestEventCode(val);
  };

  const handleFireSpecificTikTokEvent = (
    eventType: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
  ) => {
    const mockOrderNum = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    pixelService.track(
      eventType,
      {
        content_name: 'سورفيت أميليا (Survette Amélia)',
        content_id: 'prod-survette-amelia',
        content_type: 'product',
        value: 249,
        quantity: 1,
        currency: 'MAD',
        order_id: eventType === 'Purchase' ? mockOrderNum : undefined,
        customer_name: 'زبون تجريبي',
        customer_phone: '0629875531',
        test_event_code: testEventCode.trim() || undefined,
      },
      localSettings
    );

    const labels: Record<string, string> = {
      PageView: 'Page (زيارة صفحة)',
      ViewContent: 'ViewContent (مشاهدة تفاصيل المنتج)',
      AddToCart: 'AddToCart (إضافة إلى السلة)',
      InitiateCheckout: 'InitiateCheckout (بدء الطلب)',
      Purchase: `CompletePayment (إتمام شراء برقم ${mockOrderNum})`,
    };

    setTestFeedback(`تم إطلاق الحدث (${labels[eventType]}) بنجاح إلى TikTok Pixel!`);
    setTimeout(() => setTestFeedback(''), 4500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    setSaveError('');
    try {
      await onSave(localSettings);
      pixelService.syncPixels(localSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setSaveError('تعذر حفظ التعديلات على الخادم. تحقق من الاتصال وحاول مجددًا.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEvent = () => {
    handleFireSpecificTikTokEvent('ViewContent');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-right max-w-4xl">
      {saveError && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{saveError}</p>}
      {/* Top Banner and Save Action */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>ربط بكسل المنصات الإعلانية (Pixel Tracking)</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            اربط معرف البكسل لتتبع الزيارات، إضافة للسلة، ونموذج الطلب (Purchase) تلقائياً.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestEvent}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال إشارة تجريبية</span>
          </button>
          <button
            type="submit"
          disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'جاري الحفظ…' : isSaved ? 'تم الحفظ والتطبيق!' : 'حفظ الإعدادات'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Major Ad Pixels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* 1. Meta / Facebook Pixel */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                f
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Facebook / Meta Pixel</h4>
                <span className="text-[10px] text-stone-400">فيسبوك وإنستغرام</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.facebookEnabled}
                onChange={(e) => handleChange('facebookEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">Pixel ID *</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345"
              dir="ltr"
              value={localSettings.facebookPixelId}
              onChange={(e) => handleChange('facebookPixelId', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-600 text-left"
            />
          </div>
          <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg leading-relaxed">
            يتتبع تلقائياً الأحداث القياسية: <strong>PageView, ViewContent, AddToCart, InitiateCheckout, Purchase</strong>
          </div>
        </div>

        {/* 2. TikTok Pixel */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                TT
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>TikTok Pixel</span>
                  {localSettings.tiktokEnabled && localSettings.tiktokPixelId && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      مفعّل ومتصل
                    </span>
                  )}
                </h4>
                <span className="text-[10px] text-stone-400">تيك توك للأعمال (TikTok For Business)</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.tiktokEnabled}
                onChange={(e) => handleChange('tiktokEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-black cursor-pointer"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">TikTok Pixel ID *</label>
            <input
              type="text"
              placeholder="مثال: CQ7UD33C77U4U9H13IOG"
              dir="ltr"
              value={localSettings.tiktokPixelId}
              onChange={(e) => handleChange('tiktokPixelId', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-black text-left font-semibold"
            />
          </div>

          <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg leading-relaxed space-y-1">
            <div className="font-semibold text-stone-700">الأحداث المدعومة تلقائياً:</div>
            <div className="text-stone-600 font-mono text-[10px]">
              Page • ViewContent • AddToCart • InitiateCheckout • CompletePayment (Purchase)
            </div>
          </div>

          {/* Interactive TikTok Pixel Testing Box */}
          <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-black" />
                <span>أداة اختبار بكسل تيك توك المباشرة</span>
              </span>
              <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">
                {localSettings.tiktokPixelId || 'لم يتم التعيين'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-stone-600">
                رمز اختبار الأحداث (TikTok Test Event Code - اختياري من مدير الأحداث):
              </label>
              <input
                type="text"
                placeholder="مثال: TEST12345 (إن وجد في شاشة Test Events)"
                dir="ltr"
                value={testEventCode}
                onChange={(e) => handleTestEventCodeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs font-mono bg-white text-left placeholder:text-stone-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-stone-700">إطلاق حدث تجريبي فوري إلى تيك توك:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFireSpecificTikTokEvent('PageView')}
                  className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-[11px] font-medium rounded border border-stone-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>1. Page (تصفح)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFireSpecificTikTokEvent('ViewContent')}
                  className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-[11px] font-medium rounded border border-stone-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>2. ViewContent (مشاهدة)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFireSpecificTikTokEvent('AddToCart')}
                  className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-[11px] font-medium rounded border border-stone-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>3. AddToCart (سلة)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFireSpecificTikTokEvent('Purchase')}
                  className="px-2.5 py-1.5 bg-black hover:bg-stone-800 text-white text-[11px] font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>4. CompletePayment (طلب)</span>
                </button>
              </div>
            </div>

            {testFeedback && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-lg font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{testFeedback}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Snapchat Pixel */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-xs">
                Snap
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Snapchat Pixel</h4>
                <span className="text-[10px] text-stone-400">سناب شات إعلانات</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.snapchatEnabled}
                onChange={(e) => handleChange('snapchatEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 cursor-pointer"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">Snap Pixel ID *</label>
            <input
              type="text"
              placeholder="مثال: snap-xxxxxxxx-xxxx"
              dir="ltr"
              value={localSettings.snapchatPixelId}
              onChange={(e) => handleChange('snapchatPixelId', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 text-left"
            />
          </div>
          <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg leading-relaxed">
            يدعم أحداث سناب شات: <strong>PAGE_VIEW, VIEW_CONTENT, ADD_CART, PURCHASE</strong>
          </div>
        </div>

        {/* 4. Google Analytics / Ads */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center font-bold text-xs">
                G
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Google Analytics / Ads (GA4)</h4>
                <span className="text-[10px] text-stone-400">تحليلات وإعلانات غوغل</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.googleEnabled}
                onChange={(e) => handleChange('googleEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-red-500 cursor-pointer"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">Measurement ID *</label>
            <input
              type="text"
              placeholder="مثال: G-XXXXXXXXXX أو AW-XXXXX"
              dir="ltr"
              value={localSettings.googleAnalyticsId}
              onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-red-500 text-left"
            />
          </div>
          <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg leading-relaxed">
            يدعم أحداث التجارة الإلكترونية: <strong>page_view, view_item, add_to_cart, purchase</strong>
          </div>
        </div>
      </div>

      {/* Custom Script Injection */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
          <Code className="w-4 h-4 text-stone-700" />
          <span>أكواد برمجية مخصصة (Custom Scripts & Tracking Tags)</span>
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              كود مخصص في أعلى الصفحة (Header &lt;head&gt;)
            </label>
            <textarea
              rows={3}
              dir="ltr"
              placeholder="<!-- الصق أي كود تتبع إضافي هنا مثل Pinterest, Twitter, أو Microsoft Clarity -->"
              value={localSettings.customHeadScript}
              onChange={(e) => handleChange('customHeadScript', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-stone-50 focus:ring-1 focus:ring-stone-900 text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              كود مخصص في نهاية الصفحة (&lt;body&gt;)
            </label>
            <textarea
              rows={2}
              dir="ltr"
              placeholder="<!-- الصق أي كود إضافي يتم تشغيله قبل إغلاق الوسم body -->"
              value={localSettings.customBodyScript}
              onChange={(e) => handleChange('customBodyScript', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono bg-stone-50 focus:ring-1 focus:ring-stone-900 text-left"
            />
          </div>
        </div>
      </div>

      {/* Live Pixel Inspector (Verifies real events in real-time) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-stone-900">
              سجل تفاعل البكسل اللحظي (Live Pixel Event Inspector)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => pixelService.clearLogs()}
            className="text-stone-400 hover:text-rose-600 p-1 text-xs flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل</span>
          </button>
        </div>

        <p className="text-xs text-stone-500">
          يعرض هذا السجل كل حدث إعلاني تم إطلاقه أثناء تصفح الزوار للمتجر وإرسالهم لنماذج الطلب لتتأكد بنفسك من عمل البكسل بنجاح:
        </p>

        {logs.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300 text-stone-400 text-xs">
            لا توجد أحداث مسجلة بعد. تصفح المتجر أو اضغط "إرسال إشارة تجريبية" في الأعلى لفحص التفاعل.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 font-mono">{log.eventName}</span>
                    <span className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                      {log.pixelType}
                    </span>
                  </div>
                  <pre
                    dir="ltr"
                    className="text-[11px] font-mono text-stone-600 bg-white p-2 rounded border border-stone-200 overflow-x-auto max-w-lg"
                  >
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
                <span className="text-[11px] font-mono text-stone-400 whitespace-nowrap">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};
