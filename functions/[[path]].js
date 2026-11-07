/**
 * Cloudflare Pages Function — عرض متدفق من الحافة (Streaming SSR) لمتجر EGASA.
 *
 * الجولة الثالثة: أرجع Response بجسم ReadableStream.
 *  - القطعة الأولى تُرسل فوراً (دون انتظار Firestore): <head> كاملاً (meta/CSS/preconnect
 *    + معالج أخطاء الصور المضمّن) + إطار الصفحة الثابتة داخل #root (هيدر + إطارات بطاقات
 *    بنسبة عرض/ارتفاع ثابتة 1/1 skeleton) — فأول بايت يصل قبل استجابة Firestore بكل تأكيد.
 *  - استعلام Firestore يُطلق دون حظر. عند وصول products+settings تُرسل القطعة الثانية:
 *    حقن اللقطة window.__EGASA_SNAPSHOT__ + سكربت يستبدل الـ skeleton بالمحتوى الحقيقي
 *    (بطاقات منتجات حقيقية أو صفحة منتج كاملة) + تحديث العنوان/الcanonical/og، ثم وسوم
 *    الأصول (JS module) ثم إغلاق الوسوم.
 *  - React (createRoot) يحل محل #root بالكامل لاحقاً — لا hydration mismatch.
 *
 * التخزين المؤقت: Cache-Control: public, max-age=30, s-maxage=300, stale-while-revalidate=86400
 * + ذاكرة داخل العازلة (isolate) بTTL 30s. عند فشل Firestore: حالة فارغة أنيقة (لا منتج تجريبي).
 */
import { ASSET_TAGS } from './asset-tags.js'; // مُولّد تلقائياً بعد البناء

const DEFAULT_PROJECT_ID = 'egasa-87fcd';
const DEFAULT_API_KEY = 'AIzaSyB7FUjcHOY2ymiIederc-NIRAKDjPEPvkg';

const CACHE_TTL_MS = 10000;
let cache = { ts: 0, products: null, settings: null };

const BRAND = {
  bg: '#F8F9FA',
  text: '#1E232A',
  teal: '#0f766e',
  tealDark: '#115e59',
  cardBg: '#ffffff',
  border: '#e7e5e4',
  muted: '#78716c',
  accentGradient: 'linear-gradient(135deg,#FF5E62 0%,#FF6A5B 50%,#FFA07A 100%)',
};

const FONTS_TAGS =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
  '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />';

// معالج فشل تحميل الصور المضمّن (يعمل على صور HTML الثابتة من الحافة قبل تحميل React).
// أول فشل → أيقونة SVG reload فقط (لا نص)؛ الضغط يعيد المحاولة بـ ?retry=N. ثاني فشل → شعار EGASA.
const EDGE_ONERROR_SCRIPT = `<script>(function(){
var RELOAD='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:34px;height:34px;stroke:#78716c;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>';
var LOGO='<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:62%;max-width:160px;height:auto;opacity:0.55;"><rect x="6" y="14" width="52" height="52" rx="12" fill="#0f766e"/><path d="M20 54 L32 26 L44 54 M24 46 H40" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="70" y="52" font-family="Cairo, system-ui, sans-serif" font-size="30" font-weight="900" fill="#0f766e" letter-spacing="2">EGASA</text></svg>';
function bust(src,n){var c=src.replace(/[?&]retry=\\d+/g,'');return c+(c.indexOf('?')>=0?'&':'?')+'retry='+n;}
window.__egasaImgOnError=function(img){try{
var n=parseInt(img.getAttribute('data-retry')||'0',10)+1;
img.setAttribute('data-retry',String(n));
if(n>=2){var s=document.createElement('span');s.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f5f5f4;';s.innerHTML=LOGO;if(img.parentNode)img.parentNode.replaceChild(s,img);return;}
var btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-label','إعادة تحميل الصورة');
btn.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;border:0;margin:0;padding:0;background:#f5f5f4;cursor:pointer;position:absolute;inset:0;';
btn.innerHTML=RELOAD;
(function(im,count){btn.addEventListener('click',function(){im.src=bust(im.getAttribute('data-src')||im.src,count);if(btn.parentNode)btn.parentNode.replaceChild(im,btn);});})(img,n);
if(!img.getAttribute('data-src'))img.setAttribute('data-src',img.src);
if(img.parentNode)img.parentNode.replaceChild(btn,img);
}catch(e){}};
document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&!t.__egasaSeen){t.__egasaSeen=true;window.__egasaImgOnError(t);}},true);
})();</script>`;

// تقسيم ASSET_TAGS: CSS يُرسل في القطعة الأولى (head)، JS module في الأخيرة.
function splitAssetTags(tags) {
  const css = (tags.match(/<link[^>]*rel="stylesheet"[^>]*>/gi) || []).join('');
  const js = (tags.match(/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi) || []).join('');
  return { css, js };
}

// ---------- أدوات مساعدة ----------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function jsonForScript(obj) { return JSON.stringify(obj).replace(/</g, '\\u003c'); }
function productSlug(p) { const s = (p.slug || p.id || 'product').trim(); return s.replace(/\//g, '-').replace(/\s+/g, '-'); }
function productImageSrc(p) { if (p.customImage && typeof p.customImage === 'string' && p.customImage.trim()) return p.customImage.trim(); return ''; }
function formatPrice(n, currency) { const num = Number.isFinite(Number(n)) ? Number(n) : 0; return `${num} ${currency || ''}`.trim(); }

// صورة منتج بحاوية بنسبة ثابتة (تطابق React) + معالج فشل مضمّن.
function productImageHtml(p, storeName, ratio) {
  const aspect = ratio || '1 / 1';
  const img = productImageSrc(p);
  if (!img) {
    return `<div style="position:relative;width:100%;aspect-ratio:${aspect};background:#f5f5f4;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#a8a29e;font-size:13px;font-weight:700;overflow:hidden;">${escapeHtml(storeName)}</div>`;
  }
  return `<div style="position:relative;width:100%;aspect-ratio:${aspect};background:#f5f5f4;border-radius:12px;overflow:hidden;">
    <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" data-src="${escapeHtml(img)}" onerror="__egasaImgOnError(this)" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" />
  </div>`;
}

// ---------- محوّل قيم Firestore ----------
function convertFirestoreValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) { const n = Number(v.integerValue); return Number.isFinite(n) ? n : v.integerValue; }
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) { const t = Date.parse(v.timestampValue); return Number.isFinite(t) ? t : v.timestampValue; }
  if ('bytesValue' in v) return v.bytesValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return { latitude: v.geoPointValue.latitude, longitude: v.geoPointValue.longitude };
  if ('arrayValue' in v) { const vals = v.arrayValue && v.arrayValue.values ? v.arrayValue.values : []; return vals.map((x) => convertFirestoreValue(x)); }
  if ('mapValue' in v) { const fields = v.mapValue && v.mapValue.fields ? v.mapValue.fields : {}; const out = {}; for (const k of Object.keys(fields)) out[k] = convertFirestoreValue(fields[k]); return out; }
  return null;
}
function convertFirestoreDoc(doc) {
  if (!doc || typeof doc !== 'object') return {};
  const out = {};
  if (doc.name) { const parts = String(doc.name).split('/'); out.id = parts[parts.length - 1]; }
  if (doc.fields) { for (const k of Object.keys(doc.fields)) out[k] = convertFirestoreValue(doc.fields[k]); }
  return out;
}

async function fetchStore(env) {
  const now = Date.now();
  if (cache.products && now - cache.ts < CACHE_TTL_MS) return { products: cache.products, settings: cache.settings, cached: true };
  const projectId = (env && env.FIREBASE_PROJECT_ID) || DEFAULT_PROJECT_ID;
  const apiKey = (env && env.FIREBASE_API_KEY) || DEFAULT_API_KEY;
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  let products = []; let settings = {};
  try {
    console.log('[egasa-edge] streaming — querying Firestore at request time (products)...');
    let url = `${base}/products?pageSize=200&orderBy=createdAt%20desc&key=${encodeURIComponent(apiKey)}`;
    let res = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok) { url = `${base}/products?pageSize=200&key=${encodeURIComponent(apiKey)}`; res = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } }); }
    if (res.ok) { const data = await res.json(); products = (Array.isArray(data.documents) ? data.documents : []).map(convertFirestoreDoc); products.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)); }
    else console.warn('[egasa-edge] products fetch status', res.status);
  } catch (e) { console.error('[egasa-edge] products fetch failed — empty state:', e && e.message); }
  try {
    console.log('[egasa-edge] streaming — querying Firestore at request time (settings/global)...');
    const res = await fetch(`${base}/settings/global?key=${encodeURIComponent(apiKey)}`, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (res.ok) { const data = await res.json(); settings = convertFirestoreDoc(data); } else console.warn('[egasa-edge] settings fetch status', res.status, '(defaults)');
  } catch (e) { console.error('[egasa-edge] settings fetch failed — defaults:', e && e.message); }
  cache = { ts: Date.now(), products, settings };
  return { products, settings, cached: false };
}

// ---------- إطار الصفحة الثابت (القطعة الأولى، داخل #root) ----------
function skeletonCards(count) {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += `<div class="group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs text-right" style="font-family:'Cairo',sans-serif;">
      <div class="relative aspect-square w-full overflow-hidden bg-stone-100 p-2"><div class="w-full h-full rounded-xl" style="background:#eceae6;animation:egasa-pulse 1.4s ease-in-out infinite;"></div></div>
      <div class="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <div style="height:14px;background:#eceae6;border-radius:6px;margin-bottom:10px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
          <div style="height:18px;width:55%;background:#eceae6;border-radius:6px;margin-bottom:12px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
        </div>
        <div style="height:34px;background:#0f766e33;border-radius:12px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
      </div>
    </div>`;
  }
  return out;
}
function homeShell(storeName) {
  return `<div dir="rtl" style="min-height:100vh;background:${BRAND.bg};color:${BRAND.text};font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;">
    <div id="egasa-announcement" style="display:none;"></div>
    <header style="background:#fff;border-bottom:1px solid ${BRAND.border};padding:14px 16px;">
      <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div id="egasa-store-name" style="font-size:20px;font-weight:900;letter-spacing:1px;color:${BRAND.tealDark};">${escapeHtml(storeName)}</div>
          <div id="egasa-store-tagline" style="font-size:11px;color:${BRAND.muted};font-weight:600;margin-top:2px;"></div>
        </div>
        <a href="/#admin" style="font-size:11px;color:${BRAND.muted};text-decoration:none;font-weight:700;border:1px solid ${BRAND.border};padding:6px 12px;border-radius:8px;">لوحة التحكم</a>
      </div>
    </header>
    <div id="egasa-hero" style="display:none;"></div>
    <section id="egasa-products-slot" style="max-width:1100px;margin:28px auto 40px;padding:0 16px;">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">${skeletonCards(8)}</div>
    </section>
    <div style="background:#fff;border-top:1px solid ${BRAND.border};padding:24px 16px;margin-top:20px;">
      <div style="max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:24px;text-align:center;">
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;">🛡️ الدفع عند الاستلام بعد المعاينة</div>
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;">🚚 توصيل سريع لجميع المدن</div>
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;">↩️ إمكانية الإرجاع والاستبدال</div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:11px;color:#a8a29e;">© ${escapeHtml(storeName)} — جميع الحقوق محفوظة</div>
    </div>
  </div>`;
}
function productShell(storeName) {
  return `<div dir="rtl" style="min-height:100vh;background:${BRAND.bg};color:${BRAND.text};font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;">
    <div id="egasa-announcement" style="display:none;"></div>
    <header style="background:#fff;border-bottom:1px solid ${BRAND.border};padding:12px 16px;">
      <div style="max-width:1000px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="font-size:18px;font-weight:900;letter-spacing:1px;color:${BRAND.tealDark};text-decoration:none;">${escapeHtml(storeName)}</a>
        <a href="/" style="font-size:12px;color:${BRAND.muted};text-decoration:none;font-weight:700;border:1px solid ${BRAND.border};padding:6px 12px;border-radius:8px;">← العودة للمتجر</a>
      </div>
    </header>
    <main id="egasa-product-slot" style="max-width:1000px;margin:24px auto 40px;padding:0 16px;">
      <div style="width:100%;aspect-ratio:4/5;max-height:420px;background:#eceae6;border-radius:16px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
      <div style="height:22px;width:70%;background:#eceae6;border-radius:6px;margin:18px 0 10px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
      <div style="height:26px;width:30%;background:#eceae6;border-radius:6px;margin-bottom:18px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
      <div style="height:200px;background:#eceae6;border-radius:16px;animation:egasa-pulse 1.4s ease-in-out infinite;"></div>
    </main>
    <div style="background:#fff;border-top:1px solid ${BRAND.border};padding:20px 16px;text-align:center;font-size:11px;color:#a8a29e;">© ${escapeHtml(storeName)} — جميع الحقوق محفوظة</div>
  </div>`;
}

// ---------- محتوى حقيقي (القطعة الثانية، يُحقن عبر سكربت يستبدل الـ slot) ----------
function renderCardsHtml(products, settings) {
  const currency = settings.currency || 'د.م';
  const visible = products.filter((p) => !p.hidden);
  if (!visible.length) {
    return `<p style="color:#78716c;font-size:14px;text-align:center;padding:40px 0;">لا توجد منتجات بعد — ستظهر فور إضافتها من لوحة التحكم.</p>`;
  }
  const SHOPPING_BAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  const cards = visible.map((p) => {
    const effCurr = (p.currency && String(p.currency).trim()) || currency;
    const imgSrc = p.customImage || (p.galleryImages && p.galleryImages.length ? p.galleryImages[0] : '');
    const img = imgSrc
      ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" data-src="${escapeHtml(imgSrc)}" class="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"/>`
      : `<div class="absolute inset-0 flex items-center justify-center bg-stone-100"><svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:62%;max-width:160px;height:auto;opacity:0.55;"><rect x="6" y="14" width="52" height="52" rx="12" fill="#0f766e"/><path d="M20 54 L32 26 L44 54 M24 46 H40" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="70" y="52" font-family="Cairo, system-ui, sans-serif" font-size="30" font-weight="900" fill="#0f766e" letter-spacing="2">EGASA</text></svg></div>`;
    const badge = p.badge ? `<div class="absolute top-2 right-2 bg-stone-900/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-xs">${escapeHtml(p.badge)}</div>` : '';
    const orig = p.originalPrice ? `<span class="text-xs text-stone-400 line-through font-mono tabular-nums">${p.originalPrice} ${effCurr}</span>` : '';
    return `<div class="group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 text-right font-['Cairo',sans-serif]">
      <div class="relative aspect-square w-full overflow-hidden bg-stone-100 cursor-pointer p-2">
        <div class="relative w-full h-full">${img}</div>
        ${badge}
      </div>
      <div class="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 class="text-xs sm:text-sm font-bold text-stone-900 hover:text-teal-800 transition-colors cursor-pointer line-clamp-1 mb-1.5" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm sm:text-base font-extrabold text-[#701a75] font-mono tabular-nums">${p.price} ${effCurr}</span>
            ${orig}
          </div>
        </div>
        <button type="button" class="w-full py-2 sm:py-2.5 px-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98">
          ${SHOPPING_BAG_SVG}
          <span>أطلب الآن</span>
        </button>
      </div>
    </div>`;
  }).join('\n');
  // نفس حاوية الشبكة التي يرسمها App.tsx تماماً (grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5)
  return `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">${cards}</div>`;
}
function announcementHtml(settings) {
  const ann = settings.announcement || {};
  if (!ann.enabled) return '';
  return `<div style="background:${ann.bgColor || BRAND.teal};color:${ann.textColor || '#ffffff'};text-align:center;padding:9px 16px;font-size:13px;font-weight:700;letter-spacing:0.2px;">
    <span style="display:inline-block;background:${ann.textColor || '#fff'};color:${ann.bgColor || BRAND.teal};border-radius:6px;padding:1px 8px;margin-left:8px;font-size:11px;">${escapeHtml(ann.badgeText || 'عرض خاص')}</span>${escapeHtml(ann.text || '')}</div>`;
}
function heroHtml(settings) {
  const banner = settings.homeBanner || {};
  if (!banner.enabled) return '';
  return `<section style="max-width:1100px;margin:20px auto 0;padding:0 16px;">
    <div style="background:${BRAND.accentGradient};border-radius:20px;padding:36px 28px;color:#fff;text-align:center;box-shadow:0 10px 30px rgba(255,94,98,0.25);">
      <div style="display:inline-block;background:rgba(255,255,255,0.22);border-radius:999px;padding:4px 14px;font-size:12px;font-weight:800;margin-bottom:10px;">${escapeHtml(banner.discountText || 'خصم خاص')}</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;line-height:1.3;">${escapeHtml(banner.title || 'تخفيضات الموسم')}</h1>
      <p style="margin:0 0 16px;font-size:14px;opacity:0.95;font-weight:500;">${escapeHtml(banner.subtitle || '')}</p>
      <a href="#egasa-products-slot" style="display:inline-block;background:#fff;color:#E11D48;font-weight:800;font-size:14px;padding:11px 28px;border-radius:12px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">${escapeHtml(banner.ctaText || 'تسوق الآن')}</a>
    </div></section>`;
}
function renderProductContent(product, settings) {
  const currency = product.currency || settings.currency || 'د.م';
  const storeName = settings.storeName || 'EGASA';
  const img = productImageSrc(product);
  const imgHtml = img
    ? `<div style="position:relative;width:100%;aspect-ratio:4/5;max-height:420px;background:#f5f5f4;border-radius:16px;overflow:hidden;">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}" loading="eager" decoding="async" data-src="${escapeHtml(img)}" onerror="__egasaImgOnError(this)" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;" />
      </div>`
    : `<div style="width:100%;aspect-ratio:4/5;max-height:420px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#f5f5f4;color:#a8a29e;font-weight:700;">${escapeHtml(storeName)}</div>`;
  const original = product.originalPrice && Number(product.originalPrice) > Number(product.price) ? `<span style="text-decoration:line-through;color:${BRAND.muted};font-size:15px;margin-right:10px;">${formatPrice(product.originalPrice, currency)}</span>` : '';
  const badge = product.badge ? `<span style="display:inline-block;background:${BRAND.teal};color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:8px;margin-bottom:10px;">${escapeHtml(product.badge)}</span>` : '';
  const features = Array.isArray(product.features) && product.features.length ? `<ul style="margin:14px 0;padding:0;list-style:none;">${product.features.map((f) => `<li style="padding:6px 0;font-size:13px;color:#44403c;border-bottom:1px dashed #e7e5e4;">✅ ${escapeHtml(f)}</li>`).join('')}</ul>` : '';
  const description = product.description ? `<div style="margin-top:14px;background:#fff;border:1px solid ${BRAND.border};border-radius:14px;padding:16px;"><h3 style="margin:0 0 8px;font-size:15px;font-weight:900;color:${BRAND.text};">تفاصيل ومواصفات المنتج</h3><p style="margin:0;font-size:13px;line-height:1.9;color:#44403c;white-space:pre-wrap;">${escapeHtml(product.description)}</p>${features}</div>` : '';
  const sizes = product.sizesEnabled !== false && Array.isArray(product.sizes) && product.sizes.length ? `<div style="margin-bottom:14px;"><div style="font-size:13px;font-weight:800;margin-bottom:8px;color:${BRAND.text};">المقاس:</div><div style="display:flex;flex-wrap:wrap;gap:8px;">${product.sizes.map((s) => `<span style="border:1.5px solid ${BRAND.border};border-radius:10px;padding:6px 14px;font-size:12px;font-weight:700;color:#57534e;background:#fff;">${escapeHtml(s)}</span>`).join('')}</div></div>` : '';
  const colors = product.colorsEnabled !== false && Array.isArray(product.colors) && product.colors.length ? `<div style="margin-bottom:14px;"><div style="font-size:13px;font-weight:800;margin-bottom:8px;color:${BRAND.text};">اللون:</div><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">${product.colors.map((c) => `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#57534e;font-weight:700;"><span style="width:22px;height:22px;border-radius:50%;background:${escapeHtml(c.hex || '#ccc')};border:2px solid #fff;box-shadow:0 0 0 1px ${BRAND.border};display:inline-block;"></span>${escapeHtml(c.name || '')}</span>`).join('')}</div></div>` : '';
  const bundle = product.bundleOffer && product.bundleOffer.enabled ? `<div style="margin:14px 0;background:#fef3c7;border:1.5px dashed #f59e0b;border-radius:12px;padding:12px 14px;"><div style="font-size:13px;font-weight:900;color:#92400e;">🎁 ${escapeHtml(product.bundleOffer.label || 'عرض خاص')}</div><div style="margin-top:4px;font-size:14px;font-weight:900;color:${BRAND.tealDark};">${formatPrice(product.bundleOffer.price, currency)} ${product.bundleOffer.originalPrice ? `<span style="text-decoration:line-through;color:#a8a29e;font-size:12px;margin-right:6px;font-weight:600;">${formatPrice(product.bundleOffer.originalPrice, currency)}</span>` : ''}</div></div>` : '';
  const orderForm = `<div style="background:#fff;border:1px solid ${BRAND.border};border-radius:16px;padding:18px;margin-top:18px;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    <h3 style="margin:0 0 14px;font-size:16px;font-weight:900;color:${BRAND.text};text-align:center;">أكمل طلبك الآن — الدفع عند الاستلام</h3>
    ${sizes}${colors}${bundle}
    <div style="display:grid;gap:10px;">
      <input type="text" placeholder="الاسم الكامل" style="width:100%;padding:12px;border:1.5px solid ${BRAND.border};border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;" />
      <input type="tel" placeholder="رقم الهاتف" style="width:100%;padding:12px;border:1.5px solid ${BRAND.border};border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;" />
      <input type="text" placeholder="المدينة" style="width:100%;padding:12px;border:1.5px solid ${BRAND.border};border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;" />
      <input type="text" placeholder="العنوان الكامل" style="width:100%;padding:12px;border:1.5px solid ${BRAND.border};border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;" />
      <button type="button" style="width:100%;padding:14px;background:${BRAND.teal};color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:900;font-family:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(15,118,110,0.35);">تأكيد الطلب — ${formatPrice(product.price, currency)}</button>
      <div style="text-align:center;font-size:11px;color:${BRAND.muted};font-weight:700;">🔒 بياناتك آمنة — الدفع عند الاستلام فقط</div>
    </div></div>`;
  return `<div style="display:grid;grid-template-columns:1fr;gap:20px;">
    <div style="display:grid;grid-template-columns:1fr;gap:20px;">
      <div>${imgHtml}</div>
      <div>${badge}<h1 style="margin:0 0 8px;font-size:22px;font-weight:900;line-height:1.4;color:${BRAND.text};">${escapeHtml(product.name)}</h1>
        <div style="margin-bottom:14px;display:flex;align-items:center;flex-wrap:wrap;"><span style="font-size:24px;font-weight:900;color:${BRAND.tealDark};">${formatPrice(product.price, currency)}</span>${original}</div>
        ${orderForm}</div>
    </div>${description}</div>`;
}

// ---------- بناء القطعة الثانية (حقن اللقطة + المحتوى الحقيقي + أصول JS) ----------
function buildSecondChunk({ kind, products, settings, product, origin }) {
  const storeName = settings.storeName || 'EGASA';
  const tagline = settings.tagline || '';
  const snapshotPayload = { products, settings, builtAt: new Date().toISOString() };
  const snapshotJson = jsonForScript(snapshotPayload);
  const ann = announcementHtml(settings);
  const hero = heroHtml(settings);

  let injectJs = '';
  let title = `${storeName}${tagline ? ' — ' + tagline : ''}`;
  let canonical = `${origin}/`;
  let ogImage = '';
  let metaRobots = '';

  if (kind === 'product') {
    if (product && !product.hidden) {
      const slug = productSlug(product);
      title = `${product.name} | ${storeName}`;
      canonical = `${origin}/product/${encodeURIComponent(slug)}`;
      ogImage = productImageSrc(product) || '';
      const contentHtml = renderProductContent(product, settings);
      injectJs = `var ps=document.getElementById('egasa-product-slot');if(ps){ps.innerHTML=${JSON.stringify(contentHtml)};}`;
    } else {
      title = `المنتج غير موجود | ${storeName}`;
      metaRobots = '<meta name="robots" content="noindex" />';
      const notFound = `<div style="min-height:50vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 16px;"><h1 style="font-size:22px;font-weight:900;color:#1E232A;margin:0 0 8px;">المنتج غير موجود</h1><p style="color:#78716c;font-size:14px;margin:0 0 20px;">ربما تمت إزالته أو تغيير رابطه.</p><a href="/" style="background:#0f766e;color:#fff;font-weight:800;font-size:14px;padding:11px 28px;border-radius:12px;text-decoration:none;">العودة إلى المتجر</a></div>`;
      injectJs = `var ps=document.getElementById('egasa-product-slot');if(ps){ps.innerHTML=${JSON.stringify(notFound)};}`;
    }
  } else {
    const cardsHtml = renderCardsHtml(products, settings);
    injectJs = `var slot=document.getElementById('egasa-products-slot');if(slot){slot.innerHTML=${JSON.stringify(cardsHtml)};}`;
  }

  const updateShellJs =
    `document.title=${JSON.stringify(title)};` +
    `var sn=document.getElementById('egasa-store-name');if(sn)sn.textContent=${JSON.stringify(storeName)};` +
    `var st=document.getElementById('egasa-store-tagline');if(st)st.textContent=${JSON.stringify(tagline)};` +
    `var an=document.getElementById('egasa-announcement');if(an){if(${JSON.stringify(ann)}){an.style.display='block';an.innerHTML=${JSON.stringify(ann)};}}` +
    `var he=document.getElementById('egasa-hero');if(he){if(${JSON.stringify(hero)}){he.style.display='block';he.innerHTML=${JSON.stringify(hero)};}}`;

  const ogTags =
    `<meta property="og:title" content="${escapeHtml(title)}" />` +
    `<meta property="og:type" content="website" />` +
    `<meta property="og:url" content="${escapeHtml(canonical)}" />` +
    (ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : '');

  return (
    `<script type="application/json" id="egasa-published-snapshot">${snapshotJson}</script>` +
    `<script>window.__EGASA_SNAPSHOT__=JSON.parse(document.getElementById('egasa-published-snapshot').textContent);</script>` +
    `<script>${injectJs}${updateShellJs}</script>` +
    `<link rel="canonical" href="${escapeHtml(canonical)}" />` +
    metaRobots +
    ogTags
  );
}

const STATIC_EXT_RE = /\.(js|mjs|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|map|json|txt|xml|webmanifest)$/i;

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);

  if (STATIC_EXT_RE.test(pathname)) return next();

  const { css: CSS_TAGS, js: JS_TAGS } = splitAssetTags(ASSET_TAGS);
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/i);
  const kind = productMatch ? 'product' : 'home';
  const slug = productMatch ? productMatch[1].trim().toLowerCase() : null;

  // أطلق استعلام Firestore دون حظر (يُنتظر بعد إرسال القطعة الأولى).
  const storePromise = fetchStore(env);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const write = (chunk) => writer.write(encoder.encode(chunk));

  // القطعة الأولى — فورية (قبل Firestore): head كامل + إطار ثابت داخل #root.
  const firstChunk =
    `<!doctype html>\n<html lang="ar" dir="rtl">\n<head>` +
    `<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />` +
    `<title>EGASA — متجر الدفع عند الاستلام</title>` +
    `<meta name="description" content="متجر إلكتروني متكامل بنظام الدفع عند الاستلام." />` +
    FONTS_TAGS +
    CSS_TAGS +
    EDGE_ONERROR_SCRIPT +
    `<style>@keyframes egasa-pulse{0%,100%{opacity:1}50%{opacity:0.55}}</style>` +
    `</head>\n<body class="bg-[#FAF9F6] text-[#1E232A] antialiased">` +
    `<div id="root">${kind === 'product' ? productShell('EGASA') : homeShell('EGASA')}</div>`;

  // استجابة متدفقة — الرؤوس تُرسل فوراً مع أول قطعة.
  const response = new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=10, s-maxage=60, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });

  // اكتب القطعة الأولى فوراً ثم انتظر Firestore، ثم أرسل القطعة الثانية وأغلق.
  (async () => {
    try {
      await write(firstChunk);
      let products = [], settings = {}, product = null;
      try {
        const store = await storePromise;
        products = store.products || [];
        settings = store.settings || {};
        if (kind === 'product' && slug) {
          product = products.find((p) => String(p.slug || '').toLowerCase() === slug || String(p.id || '').toLowerCase() === slug) || null;
        }
      } catch (e) {
        console.error('[egasa-edge] stream data error — empty state:', e && e.message);
      }
      const secondChunk = buildSecondChunk({ kind, products, settings, product, origin: url.origin }) + JS_TAGS + `</body>\n</html>`;
      await write(secondChunk);
    } catch (e) {
      console.error('[egasa-edge] stream fatal error:', e && e.message);
      try { await write(JS_TAGS + `</body></html>`); } catch (_) {}
    } finally {
      try { await writer.close(); } catch (_) {}
    }
  })();

  return response;
}
