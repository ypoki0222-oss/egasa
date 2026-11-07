/**
 * قراءة "لقطة النشر" (Published Snapshot) المضمّنة في HTML عند البناء.
 *
 * يضيف سكربت scripts/prerender.mjs بعد البناء وسم:
 *   <script type="application/json" id="egasa-published-snapshot">{ ... }</script>
 * يحتوي على products + settings المستخرجة من data/store_state.json.
 * يقرأه هذا الملف بشكل متزامن (قبل أول رسم لـ React) لتفادي وميض المنتجات التجريبية/الفراغ.
 *
 * في وضع التطوير (npm run dev) لا توجد لقطة مضمّنة — تُرجع الدوال null وعندها
 * يعرض التطبيق skeleton/تحميل حتى يرد Firestore، ولا يعرض المنتج التجريبي أبداً.
 */
import type { Product, StoreSettings } from '../types';
import { INITIAL_STORE_SETTINGS } from '../data/initialData';

export interface PublishedSnapshot {
  products: Product[];
  settings: StoreSettings;
  /** طابع زمني للقطة (عند البناء) — للمعلوماتية فقط */
  builtAt?: string;
}

const SNAPSHOT_SCRIPT_ID = 'egasa-published-snapshot';

function mergeSettingsShape(raw: Partial<StoreSettings> | undefined): StoreSettings {
  if (!raw || typeof raw !== 'object') return { ...INITIAL_STORE_SETTINGS };
  return {
    ...INITIAL_STORE_SETTINGS,
    ...raw,
    announcement: { ...INITIAL_STORE_SETTINGS.announcement, ...(raw.announcement || {}) },
    homeBanner: { ...INITIAL_STORE_SETTINGS.homeBanner, ...(raw.homeBanner || {}) },
    whatsapp: { ...INITIAL_STORE_SETTINGS.whatsapp, ...(raw.whatsapp || {}) },
    pixel: { ...INITIAL_STORE_SETTINGS.pixel, ...(raw.pixel || {}) },
    formPlaceholders: { ...(raw.formPlaceholders ?? {}) },
    searchCategories:
      Array.isArray(raw.searchCategories) && raw.searchCategories.length > 0
        ? raw.searchCategories
        : INITIAL_STORE_SETTINGS.searchCategories,
    cities: raw.cities !== undefined ? raw.cities : INITIAL_STORE_SETTINGS.cities,
  };
}

function sanitizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Product => Boolean(p) && typeof p === 'object' && Boolean((p as Product).id))
    .map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: Array.isArray(p.colors)
        ? p.colors.map((c: unknown) =>
            typeof c === 'string' ? { name: c, hex: '#2D3748' } : { name: (c as { name?: string })?.name || '', hex: (c as { hex?: string })?.hex || '#2D3748' }
          )
        : [],
      fabrics: Array.isArray(p.fabrics) ? p.fabrics : [],
    }));
}

let cached: PublishedSnapshot | null | undefined = undefined;

/**
 * تقرأ اللقطة المضمّنة مرة واحدة وتخزّن النتيجة في ذاكرة التخزين المؤقت.
 * تُرجع null إذا لم توجد (وضع التطوير أو بناء قديم بدون لقطة).
 */
export function getPublishedSnapshot(): PublishedSnapshot | null {
  if (cached !== undefined) return cached;
  cached = readSnapshotFromDom();
  return cached;
}

export function hasPublishedSnapshot(): boolean {
  return getPublishedSnapshot() !== null;
}

/** إعادة تعيين الذاكرة المؤقتة (للاختبارات فقط) */
export function _resetSnapshotCache(): void {
  cached = undefined;
}

function readSnapshotFromDom(): PublishedSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1) متغير عالمي (يضعه سكربت البناء كطبقة احتياطية)
    const winAny = window as unknown as { __EGASA_SNAPSHOT__?: unknown };
    if (winAny.__EGASA_SNAPSHOT__ && typeof winAny.__EGASA_SNAPSHOT__ === 'object') {
      return normalize(winAny.__EGASA_SNAPSHOT__);
    }
    // 2) وسم JSON مضمّن في <head>
    const el = document.getElementById(SNAPSHOT_SCRIPT_ID);
    if (el && el.textContent) {
      const parsed = JSON.parse(el.textContent);
      return normalize(parsed);
    }
  } catch (e) {
    console.warn('[egasa-snapshot] فشل قراءة لقطة النشر المضمّنة:', e);
  }
  return null;
}

function normalize(raw: unknown): PublishedSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { products?: unknown; settings?: unknown; builtAt?: string };
  return {
    products: sanitizeProducts(r.products),
    settings: mergeSettingsShape(r.settings as Partial<StoreSettings> | undefined),
    builtAt: typeof r.builtAt === 'string' ? r.builtAt : undefined,
  };
}

/**
 * يستخرج اسم/معرّف المنتج من المسار النظيف /product/<slug> إن وُجد.
 * يُستخدم في التوجيه المباشر لصفحات المنتجات الثابتة.
 */
export function getProductSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const path = window.location.pathname || '';
    const match = path.match(/\/product\/([^/?#]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1].replace(/\/+$/, '')).trim();
    }
  } catch {
    // ignore
  }
  return null;
}
