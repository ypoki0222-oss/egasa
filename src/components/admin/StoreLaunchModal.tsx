import React, { useState } from 'react';
import { Sparkles, Trash2, AlertTriangle, CheckCircle2, X, RefreshCw, Rocket, ShieldAlert } from 'lucide-react';

interface StoreLaunchModalProps {
  isOpen: boolean;
  ordersCount: number;
  productsCount: number;
  onClearOrders: () => void;
  onClearProducts: () => void;
  onClearAll: () => void;
  onRestoreDemoData: () => void;
  onClose: () => void;
}

export const StoreLaunchModal: React.FC<StoreLaunchModalProps> = ({
  isOpen,
  ordersCount,
  productsCount,
  onClearOrders,
  onClearProducts,
  onClearAll,
  onRestoreDemoData,
  onClose,
}) => {
  const [confirmStep, setConfirmStep] = useState<'none' | 'orders' | 'products' | 'all'>('none');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleExecute = (action: 'orders' | 'products' | 'all') => {
    if (action === 'orders') {
      onClearOrders();
      setSuccessMessage('تم حذف كافة الطلبات التجريبية بنجاح! سجل الطلبات الآن نظيف (0 طلب).');
    } else if (action === 'products') {
      onClearProducts();
      setSuccessMessage('تم إفراغ كتالوج المنتجات بنجاح! يمكنك الآن إضافة منتجاتك الخاصة.');
    } else if (action === 'all') {
      onClearAll();
      setSuccessMessage('تم تفريغ المتجر بالكامل بنجاح! المتجر مهيأ ونظيف تماماً للإطلاق الرسمي.');
    }
    setConfirmStep('none');
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const handleRestore = () => {
    onRestoreDemoData();
    setSuccessMessage('تمت استعادة البيانات والمنتجات التجريبية بنجاح للمعاينة.');
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تهيئة المتجر للإطلاق الرسمي</h3>
              <p className="text-[11px] text-stone-300">حذف وتفريغ البيانات التجريبية لاستقبال الطلبات الحقيقية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Current State Indicator */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 block">الطلبات المسجلة حالياً</span>
              <strong className="text-xl font-bold font-mono text-stone-900">{ordersCount}</strong>
              <span className="text-[10px] text-stone-400 block">طلب في الذاكرة</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 block">المنتجات في المتجر</span>
              <strong className="text-xl font-bold font-mono text-stone-900">{productsCount}</strong>
              <span className="text-[10px] text-stone-400 block">منتج معروض</span>
            </div>
          </div>

          {/* Active Confirmation View */}
          {confirmStep !== 'none' ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  {confirmStep === 'orders' && 'هل أنت متأكد من مسح جميع الطلبات التجريبية؟'}
                  {confirmStep === 'products' && 'هل أنت متأكد من مسح كافة المنتجات التجريبية؟'}
                  {confirmStep === 'all' && 'تأكيد الحذف الشامل: سيتم تفريغ كافة المنتجات والطلبات معاً!'}
                </span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                لا يمكن التراجع عن هذه العملية بمجرد تنفيذها، وسيتم تحديث المتجر فوراً.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleExecute(confirmStep)}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  نعم، احذف الآن نهائياً
                </button>
                <button
                  onClick={() => setConfirmStep('none')}
                  className="py-2 px-4 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: Clear Orders Only */}
              <div className="p-3.5 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">1. تفريغ سجل الطلبات التجريبية</h4>
                  <p className="text-[11px] text-stone-500">
                    يحذف جميع الطلبات التجريبية ويبدأ العداد من 0 طلب حقيقي.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmStep('orders')}
                  disabled={ordersCount === 0}
                  className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>مسح الطلبات</span>
                </button>
              </div>

              {/* Option 2: Clear Products Only */}
              <div className="p-3.5 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 flex items-center justify-between gap-3 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">2. حذف كافة المنتجات التجريبية</h4>
                  <p className="text-[11px] text-stone-500">
                    يفرغ كتالوج المتجر لتتمكن من إضافة ملابسك وصورك الخاصة فقط.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmStep('products')}
                  disabled={productsCount === 0}
                  className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>مسح المنتجات</span>
                </button>
              </div>

              {/* Option 3: Master Launch (Wipe All) */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Rocket className="w-4 h-4 text-amber-600" />
                    <span>3. تفريغ شامل للمتجر (إطلاق المتجر الرسمي)</span>
                  </div>
                  <p className="text-[11px] text-stone-600 pt-0.5">
                    يحذف جميع المنتجات والطلبات التجريبية معاً بضغطة زر واحدة.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmStep('all')}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تفريغ شامل</span>
                </button>
              </div>
            </div>
          )}

          {/* Fallback / Restore button for testing */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>هل تود إعادة تعبئة البيانات التجريبية للمعاينة لاحقاً؟</span>
            <button
              onClick={handleRestore}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer underline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>استعادة البيانات النموذجية</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
