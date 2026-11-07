import React, { useState } from 'react';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  testWebhook,
} from '../../services/googleSheetsService';
import { apiService } from '../../services/apiService';
import {
  FileSpreadsheet,
  Save,
  Check,
  Copy,
  ExternalLink,
  Zap,
  HelpCircle,
  Table,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface GoogleSheetsTabProps {
  webhookUrl: string;
  autoSync: boolean;
  onSave: (url: string, autoSync: boolean) => Promise<void>;
}

export const GoogleSheetsTab: React.FC<GoogleSheetsTabProps> = ({
  webhookUrl,
  autoSync,
  onSave,
}) => {
  const [url, setUrl] = useState(webhookUrl);
  const [sync, setSync] = useState(autoSync);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [syncAllResult, setSyncAllResult] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestWebhook = async () => {
    if (!url.trim()) {
      setTestResult({ loading: false, success: false, message: 'يرجى إدخال الرابط أولاً للاختبار.' });
      return;
    }

    setTestResult({ loading: true });
    // First save the URL if it changed so the backend can use it
    if (url.trim() !== webhookUrl) {
      try {
        await onSave(url.trim(), sync);
      } catch {
        setTestResult({ loading: false, success: false, message: 'تعذر حفظ الإعدادات على الخادم.' });
        return;
      }
    }
    const result = await testWebhook(url);
    setTestResult({ loading: false, success: result.success, message: result.message });
  };

  const handleSyncAllOrders = async () => {
    if (!url.trim()) {
      setSyncAllResult({ loading: false, success: false, message: 'يرجى إدخال رابط Webhook وحفظه أولاً.' });
      return;
    }

    setSyncAllResult({ loading: true });
    try {
      const res = await apiService.syncAllOrdersToSheets();
      setSyncAllResult({
        loading: false,
        success: res.success,
        message: res.message || 'تمت مزامنة جميع الطلبات بنجاح!',
      });
    } catch (err: any) {
      setSyncAllResult({
        loading: false,
        success: false,
        message: err?.message || 'فشلت عملية المزامنة.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    setSaveError('');
    try {
      await onSave(url.trim(), sync);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setSaveError('تعذر حفظ التعديلات على الخادم. تحقق من الاتصال وحاول مجددًا.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-right max-w-4xl">
      {saveError && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{saveError}</p>}
      {/* Top Banner & Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>ربط وتزامن الطلبات مع Google Sheets تلقائياً</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            يستقبل جدولك في غوغل شيت كل تفاصيل الطلب (العميل، الهاتف، المقاسات، الألوان، الباقة، العنوان) لحظة ضغط العميل على تأكيد الطلب.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="submit"
          disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'جاري الحفظ…' : isSaved ? 'تم الحفظ بنجاح!' : 'حفظ الإعدادات'}</span>
          </button>
        </div>
      </div>

      {/* Webhook URL Input & Test */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>رابط تطبيق الويب (Google Web App URL / Webhook)</span>
          </h4>
          {url.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>الرابط مُعرّف</span>
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            رابط تطبيق الويب المنسوخ من غوغل شيت (Web app URL) *
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-stone-900 focus:border-stone-900 text-left bg-stone-50 transition-all"
            />
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testResult?.loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 border border-stone-300 disabled:opacity-60"
            >
              <Send className={`w-3.5 h-3.5 ${testResult?.loading ? 'animate-spin' : ''}`} />
              <span>{testResult?.loading ? 'جاري الفحص...' : 'فحص الاتصال (Test)'}</span>
            </button>
          </div>
          <span className="text-[11px] text-stone-500 mt-1.5 block">
            ينتهي الرابط دائماً بـ <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">/exec</code>. يتم إرسال الطلبات مباشرة من الخادم لضمان وصولها بنسبة 100%.
          </span>
        </div>

        {/* Test Result Message */}
        {testResult && !testResult.loading && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{testResult.message}</span>
          </div>
        )}

        {/* Auto Sync Toggle & Bulk Sync */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-stone-100">
          <div>
            <div className="text-xs font-bold text-stone-900">المزامنة التلقائية الفورية</div>
            <p className="text-[11px] text-stone-500">
              إرسال كل طلب فوراً وبشكل تلقائي بمجرد قيام الزبون بتأكيد الطلب
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={sync}
              onChange={(e) => setSync(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Bulk Sync Pending Orders Button */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-stone-700" />
              <span>مزامنة الطلبات السابقة دفعة واحدة</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              هل استلمت طلبات قبل ربط غوغل شيت؟ اضغط هنا لإرسال جميع الطلبات غير المسجلة للشيت الآن.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncAllOrders}
            disabled={syncAllResult?.loading || !url.trim()}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncAllResult?.loading ? 'animate-spin' : ''}`} />
            <span>{syncAllResult?.loading ? 'جاري المزامنة...' : 'مزامنة الطلبات السابقة للشيت'}</span>
          </button>
        </div>

        {syncAllResult && !syncAllResult.loading && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              syncAllResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {syncAllResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncAllResult.message}</span>
          </div>
        )}
      </div>

      {/* 60-Second Setup Guide */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-stone-900">
              طريقة التفعيل في 60 ثانية (بسيطة جداً وبدون خبرة)
            </h4>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'تم نسخ الكود!' : 'نسخ كود الربط بالكامل'}</span>
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-3.5 text-xs text-stone-700 list-decimal list-inside pr-1 leading-relaxed">
          <li className="font-medium">
            افتح{' '}
            <a
              href="https://sheets.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 underline font-bold inline-flex items-center gap-1"
            >
              جدول بيانات غوغل جديد (Google Sheet) <ExternalLink className="w-3 h-3 inline" />
            </a>
          </li>
          <li className="font-medium">
            من القائمة العلوية للجدول اضغط على: <strong>الإضافات (Extensions)</strong> ثم <strong>Apps Script</strong>.
          </li>
          <li className="font-medium">
            امسح أي كود موجود في الصفحة، ثم اضغط على زر <strong>"نسخ كود الربط بالكامل"</strong> أعلاه والصقه مكانه.
          </li>
          <li className="font-medium">
            اضغط على زر <strong>نشر (Deploy)</strong> الأزرق في الزاوية العلوية ثم <strong>نشر جديد (New deployment)</strong>.
          </li>
          <li className="font-medium">
            اختر نوع النشر: <strong>تطبيق ويب (Web app)</strong>، وفي خيار <em>من يملك حق الوصول (Who has access)</em> اختر: <strong>أي شخص (Anyone)</strong> (هذه الخطوة مهمة جداً لكي يتمكن المتجر من إرسال الطلبات للشيت).
          </li>
          <li className="font-medium">
            اضغط <strong>نشر (Deploy)</strong>، وامنح الصلاحية لمرة واحدة، ثم انسخ رابط <strong>Web app URL</strong> والصقه في خانة الرابط بالأعلى واضغط حفظ!
          </li>
        </ol>

        {/* Script Code Preview Box */}
        <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900">
          <div className="px-4 py-2.5 bg-stone-950 flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800">
            <span className="font-semibold text-stone-300">كود Google Apps Script المحدّث (Code.gs)</span>
            <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              جاهز ومحدّث v2
            </span>
          </div>
          <pre
            dir="ltr"
            className="p-4 text-[11px] font-mono text-stone-300 max-h-56 overflow-y-auto overflow-x-auto text-left leading-relaxed select-all"
          >
            {GOOGLE_APPS_SCRIPT_TEMPLATE}
          </pre>
        </div>

        {/* Data Schema Columns preview */}
        <div className="pt-2">
          <h5 className="text-xs font-bold text-stone-800 mb-2.5 flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-stone-500" />
            <span>الأعمدة الـ 15 التي يُنشئها وينسقها السكربت تلقائياً في جدولك:</span>
          </h5>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-700">
            {[
              'تاريخ ووقت الطلب',
              'رقم الطلب',
              'اسم العميل',
              'رقم الهاتف',
              'المدينة',
              'العنوان بالتفصيل',
              'المنتجات والكمية',
              'المقاس',
              'اللون',
              'الخيارات والتخصيص',
              'الباقة / العرض',
              'المبلغ الإجمالي',
              'العملة',
              'حالة الطلب',
              'ملاحظات إضافية',
            ].map((col, idx) => (
              <span
                key={idx}
                className="bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1 rounded-md transition-colors"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};
