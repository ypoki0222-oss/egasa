/**
 * أدوات منع تضخم تخزين المتصفح (localStorage).
 *
 * المشكلة: الصور تُخزَّن كنص base64 (data:image/...) داخل مستندات المنتج في Firestore.
 * عند تحميل المنتجات، كان التطبيق يكتبها كاملةً — مع الصور — في localStorage،
 * فينتفخ حجم التخزين إلى ~10MB ويقترب من حد المتصفح (5-10MB)، ما يسبب أخطاء
 * QuotaExceeded وتعطّل التطبيق. موقع Mowarid لا يفعل ذلك لأنه يخزّن الصور كروابط
 * فقط، فيبقى حجم تخزين المتصفح لديه ~1KB.
 *
 * الحل: قبل الكتابة في localStorage، نزيل كل سلاسل data:image/... بشكل متكرر
 * (من المنتجات، الإعدادات، تقييمات العملاء، صور البانر...). تبقى النصوص والأسعار
 * والأوصاف للعرض الفوري، وتصل الصور من Firestore خلال أقل من ثانية.
 */

const DATA_URL_PREFIX = 'data:image';

function isDataUrl(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith(DATA_URL_PREFIX);
}

/**
 * تُرجع نسخة عميقة من القيمة مع إزالة كل سلاسل صور data:image/...
 * - في الكائنات: تُحذف الخاصية التي تحتوي صورة data URL.
 * - في المصفوفات: تُستبعد عناصر الصور (data URL) وتُعالج العناصر المركبة بشكل متكرر.
 * - أي قيمة أخرى تُرجع كما هي.
 */
export function stripDataUrlsDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      if (isDataUrl(item)) continue; // استبعد صورة المصفوفة (مثل galleryImages)
      out.push(stripDataUrlsDeep(item));
    }
    return out as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isDataUrl(v)) continue; // احذف خاصية الصورة (مثل customImage / avatarUrl / imageUrl)
      out[k] = stripDataUrlsDeep(v);
    }
    return out as T;
  }
  return value;
}

/** أقصى عدد طلبات نحتفظ بها في ذاكرة التخزين المؤقت (لمنع نموها غير المحدود). */
export const MAX_ORDERS_CACHE = 100;

/**
 * ترحيل لمرة واحدة: حذف مفاتيح التخزين القديمة المنتفخة (v3) لتحرير المساحة فوراً
 * للزائرين العائدين. تُستدعى عند تحميل التطبيق وهي آمنة التكرار.
 */
export function migrateLegacyCache(): void {
  try {
    if (localStorage.getItem('egasa_cache_migrated_v4') === '1') return;
    localStorage.removeItem('egasa_store_settings_v3');
    localStorage.removeItem('egasa_store_products_v3');
    localStorage.removeItem('egasa_store_orders_v3');
    localStorage.removeItem('egasa_store_orders'); // مفتاح قديم جداً
    localStorage.setItem('egasa_cache_migrated_v4', '1');
  } catch {
    // تجاهل أي خطأ (وضع التصفح الخاص / حصار التخزين)
  }
}
