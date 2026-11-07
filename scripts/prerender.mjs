#!/usr/bin/env node
/**
 * prerender.mjs — توليد ثابت (SSG) بعد بناء Vite.
 *
 * يُنفّذ كـ postbuild: "vite build && node scripts/prerender.mjs"
 *
 * المهام:
 *  1. يقرأ data/store_state.json (لقطة النشر canonical: products + settings).
 *  2. يحقن اللقطة في dist/index.html كـ <script type="application/json" id="egasa-published-snapshot">
 *     + window.__EGASA_SNAPSHOT__ (طبقة احتياطية) — ليقرأها العميل بشكل متزامن قبل أول رسم.
 *  3. يستبدل محتوى #root (السبنر) بمحتوى HTML حقيقي للصفحة الرئيسية (شريط إعلان + بانر + بطاقات منتجات حقيقية)
 *     بحيث تظهر أسماء/أسعار/صور المنتجات من أول بايت، ولا يظهر السبنر أبداً للمستخدم النهائي.
 *  4. يولّد صفحة مستقلة ثابتة لكل منتج: dist/product/<slug>/index.html بمحتوى المنتج الكامل.
 *  5. يحافظ على روابط الأصول المطلقة (/assets/...) لتعمل من المسارات الفرعية.
 *
 * لا يضيف أي إطار عمل جديد — يعالج ملفات dist الناتجة عن Vite مباشرة.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SNAPSHOT_PATH = join(ROOT, 'data', 'store_state.json');
const INDEX_HTML = join(DIST, 'index.html');

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

// ---------- أدوات مساعدة ----------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON آمن للحاق داخل وسم <script> — يهرب </script> و < الناشئة. */
function jsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function productSlug(p) {
  const s = (p.slug || p.id || 'product').trim();
  return s.replace(/\//g, '-').replace(/\s+/g, '-');
}

function productImageSrc(p) {
  if (p.customImage && typeof p.customImage === 'string' && p.customImage.trim()) {
    return p.customImage.trim();
  }
  return '';
}

function formatPrice(n, currency) {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  return `${num} ${currency || ''}`.trim();
}

// ---------- بناء اللقطة المضمّنة ----------
function buildSnapshotPayload(state) {
  return {
    products: Array.isArray(state.products) ? state.products : [],
    settings: state.settings || {},
    builtAt: new Date().toISOString(),
  };
}

function snapshotScriptTag(payload) {
  const json = jsonForScript(payload);
  return (
    `<script type="application/json" id="egasa-published-snapshot">${json}</script>` +
    `<script>window.__EGASA_SNAPSHOT__=JSON.parse(document.getElementById('egasa-published-snapshot').textContent);</script>`
  );
}

// ---------- المحتوى الثابت للصفحة الرئيسية ----------
function renderHomeStatic(state) {
  const settings = state.settings || {};
  const products = (Array.isArray(state.products) ? state.products : []).filter((p) => !p.hidden);
  const currency = settings.currency || 'د.م';
  const ann = settings.announcement || {};
  const banner = settings.homeBanner || {};
  const storeName = settings.storeName || 'EGASA';
  const tagline = settings.tagline || '';

  const announcementBar = ann.enabled
    ? `<div style="background:${ann.bgColor || BRAND.teal};color:${ann.textColor || '#ffffff'};text-align:center;padding:9px 16px;font-size:13px;font-weight:700;letter-spacing:0.2px;">
         <span style="display:inline-block;background:${ann.textColor || '#fff'};color:${ann.bgColor || BRAND.teal};border-radius:6px;padding:1px 8px;margin-left:8px;font-size:11px;">${escapeHtml(ann.badgeText || 'عرض خاص')}</span>
         ${escapeHtml(ann.text || '')}
       </div>`
    : '';

  const hero = banner.enabled
    ? `<section style="max-width:1100px;margin:20px auto 0;padding:0 16px;">
         <div style="background:${BRAND.accentGradient};border-radius:20px;padding:36px 28px;color:#fff;text-align:center;box-shadow:0 10px 30px rgba(255,94,98,0.25);">
           <div style="display:inline-block;background:rgba(255,255,255,0.22);border-radius:999px;padding:4px 14px;font-size:12px;font-weight:800;margin-bottom:10px;">${escapeHtml(banner.discountText || 'خصم خاص')}</div>
           <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;line-height:1.3;">${escapeHtml(banner.title || 'تخفيضات الموسم')}</h1>
           <p style="margin:0 0 16px;font-size:14px;opacity:0.95;font-weight:500;">${escapeHtml(banner.subtitle || '')}</p>
           <a href="#products-section" style="display:inline-block;background:#fff;color:#E11D48;font-weight:800;font-size:14px;padding:11px 28px;border-radius:12px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">${escapeHtml(banner.ctaText || 'تسوق الآن')}</a>
         </div>
       </section>`
    : '';

  const cards = products
    .map((p) => {
      const slug = productSlug(p);
      const img = productImageSrc(p);
      const imgHtml = img
        ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" style="width:100%;height:190px;object-fit:cover;border-radius:12px;display:block;background:#f5f5f4;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
           <div style="display:none;width:100%;height:190px;border-radius:12px;align-items:center;justify-content:center;background:#f5f5f4;color:#a8a29e;font-size:13px;font-weight:700;">${escapeHtml(storeName)}</div>`
        : `<div style="width:100%;height:190px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#f5f5f4;color:#a8a29e;font-size:13px;font-weight:700;">${escapeHtml(storeName)}</div>`;
      const original = p.originalPrice && Number(p.originalPrice) > Number(p.price)
        ? `<span style="text-decoration:line-through;color:${BRAND.muted};font-size:12px;margin-right:6px;">${formatPrice(p.originalPrice, currency)}</span>`
        : '';
      const badge = p.badge
        ? `<span style="position:absolute;top:10px;right:10px;background:${BRAND.teal};color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:8px;z-index:2;">${escapeHtml(p.badge)}</span>`
        : '';
      return `<a href="/product/${encodeURIComponent(slug)}" style="text-decoration:none;color:inherit;display:block;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:16px;padding:10px;position:relative;transition:transform .15s,box-shadow .15s;">
        ${badge}
        <div style="position:relative;">${imgHtml}</div>
        <h3 style="margin:10px 4px 6px;font-size:14px;font-weight:800;line-height:1.4;color:${BRAND.text};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px;">${escapeHtml(p.name)}</h3>
        <div style="margin:0 4px 8px;display:flex;align-items:center;flex-wrap:wrap;">
          <span style="font-size:16px;font-weight:900;color:${BRAND.tealDark};">${formatPrice(p.price, currency)}</span>
          ${original}
        </div>
        <div style="margin:0 4px;text-align:center;background:${BRAND.teal};color:#fff;font-size:12px;font-weight:800;padding:8px;border-radius:10px;">اطلب الآن — الدفع عند الاستلام</div>
      </a>`;
    })
    .join('\n');

  const grid = products.length
    ? `<section id="products-section" style="max-width:1100px;margin:28px auto 40px;padding:0 16px;">
         <h2 style="font-size:20px;font-weight:900;margin:0 0 16px;text-align:center;color:${BRAND.text};">منتجاتنا</h2>
         <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">${cards}</div>
       </section>`
    : `<section style="max-width:600px;margin:60px auto;padding:0 16px;text-align:center;">
         <p style="color:${BRAND.muted};font-size:14px;">لا توجد منتجات بعد — ستظهر فور إضافتها من لوحة التحكم.</p>
       </section>`;

  const trustBar = `<div style="background:#fff;border-top:1px solid ${BRAND.border};padding:24px 16px;margin-top:20px;">
      <div style="max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:24px;text-align:center;">
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;">🛡️ الدفع عند الاستلام بعد المعاينة</div>
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;">🚚 توصيل سريع لجميع المدن</div>
        <div style="font-size:12px;color:${BRAND.muted};font-weight:700;">↩️ إمكانية الإرجاع والاستبدال</div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:11px;color:#a8a29e;">© ${escapeHtml(storeName)} — جميع الحقوق محفوظة</div>
    </div>`;

  return `<div dir="rtl" style="min-height:100vh;background:${BRAND.bg};color:${BRAND.text};font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;">
    ${announcementBar}
    <header style="background:#fff;border-bottom:1px solid ${BRAND.border};padding:14px 16px;">
      <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:20px;font-weight:900;letter-spacing:1px;color:${BRAND.tealDark};">${escapeHtml(storeName)}</div>
          <div style="font-size:11px;color:${BRAND.muted};font-weight:600;margin-top:2px;">${escapeHtml(tagline)}</div>
        </div>
        <a href="/#admin" style="font-size:11px;color:${BRAND.muted};text-decoration:none;font-weight:700;border:1px solid ${BRAND.border};padding:6px 12px;border-radius:8px;">لوحة التحكم</a>
      </div>
    </header>
    ${hero}
    ${grid}
    ${trustBar}
  </div>`;
}

// ---------- المحتوى الثابت لصفحة المنتج ----------
function renderProductStatic(product, state) {
  const settings = state.settings || {};
  const currency = product.currency || settings.currency || 'د.م';
  const ann = settings.announcement || {};
  const storeName = settings.storeName || 'EGASA';
  const slug = productSlug(product);
  const img = productImageSrc(product);

  const announcementBar = ann.enabled
    ? `<div style="background:${ann.bgColor || BRAND.teal};color:${ann.textColor || '#ffffff'};text-align:center;padding:9px 16px;font-size:13px;font-weight:700;">
         <span style="display:inline-block;background:${ann.textColor || '#fff'};color:${ann.bgColor || BRAND.teal};border-radius:6px;padding:1px 8px;margin-left:8px;font-size:11px;">${escapeHtml(ann.badgeText || 'عرض خاص')}</span>
         ${escapeHtml(ann.text || '')}
       </div>`
    : '';

  const imgHtml = img
    ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}" style="width:100%;border-radius:16px;display:block;background:#f5f5f4;max-height:420px;object-fit:contain;" onerror="this.style.display='none';" />`
    : `<div style="width:100%;height:300px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#f5f5f4;color:#a8a29e;font-weight:700;">${escapeHtml(storeName)}</div>`;

  const original = product.originalPrice && Number(product.originalPrice) > Number(product.price)
    ? `<span style="text-decoration:line-through;color:${BRAND.muted};font-size:15px;margin-right:10px;">${formatPrice(product.originalPrice, currency)}</span>`
    : '';

  const badge = product.badge
    ? `<span style="display:inline-block;background:${BRAND.teal};color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:8px;margin-bottom:10px;">${escapeHtml(product.badge)}</span>`
    : '';

  const features = Array.isArray(product.features) && product.features.length
    ? `<ul style="margin:14px 0;padding:0;list-style:none;">
         ${product.features.map((f) => `<li style="padding:6px 0;font-size:13px;color:#44403c;border-bottom:1px dashed #e7e5e4;">✅ ${escapeHtml(f)}</li>`).join('')}
       </ul>`
    : '';

  const description = product.description
    ? `<div style="margin-top:14px;background:#fff;border:1px solid ${BRAND.border};border-radius:14px;padding:16px;">
         <h3 style="margin:0 0 8px;font-size:15px;font-weight:900;color:${BRAND.text};">تفاصيل ومواصفات المنتج</h3>
         <p style="margin:0;font-size:13px;line-height:1.9;color:#44403c;white-space:pre-wrap;">${escapeHtml(product.description)}</p>
         ${features}
       </div>`
    : '';

  const sizes = product.sizesEnabled !== false && Array.isArray(product.sizes) && product.sizes.length
    ? `<div style="margin-bottom:14px;">
         <div style="font-size:13px;font-weight:800;margin-bottom:8px;color:${BRAND.text};">المقاس:</div>
         <div style="display:flex;flex-wrap:wrap;gap:8px;">
           ${product.sizes.map((s) => `<span style="border:1.5px solid ${BRAND.border};border-radius:10px;padding:6px 14px;font-size:12px;font-weight:700;color:#57534e;background:#fff;">${escapeHtml(s)}</span>`).join('')}
         </div>
       </div>`
    : '';

  const colors = product.colorsEnabled !== false && Array.isArray(product.colors) && product.colors.length
    ? `<div style="margin-bottom:14px;">
         <div style="font-size:13px;font-weight:800;margin-bottom:8px;color:${BRAND.text};">اللون:</div>
         <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
           ${product.colors.map((c) => `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#57534e;font-weight:700;"><span style="width:22px;height:22px;border-radius:50%;background:${escapeHtml(c.hex || '#ccc')};border:2px solid #fff;box-shadow:0 0 0 1px ${BRAND.border};display:inline-block;"></span>${escapeHtml(c.name || '')}</span>`).join('')}
         </div>
       </div>`
    : '';

  const bundle = product.bundleOffer && product.bundleOffer.enabled
    ? `<div style="margin:14px 0;background:#fef3c7;border:1.5px dashed #f59e0b;border-radius:12px;padding:12px 14px;">
         <div style="font-size:13px;font-weight:900;color:#92400e;">🎁 ${escapeHtml(product.bundleOffer.label || 'عرض خاص')}</div>
         <div style="margin-top:4px;font-size:14px;font-weight:900;color:${BRAND.tealDark};">${formatPrice(product.bundleOffer.price, currency)} ${product.bundleOffer.originalPrice ? `<span style="text-decoration:line-through;color:#a8a29e;font-size:12px;margin-right:6px;font-weight:600;">${formatPrice(product.bundleOffer.originalPrice, currency)}</span>` : ''}</div>
       </div>`
    : '';

  // استمارة طلب ثابتة (بصرية فقط) — ستستبدلها React باستمارة وظيفية فور التحميل
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
    </div>
  </div>`;

  return `<div dir="rtl" style="min-height:100vh;background:${BRAND.bg};color:${BRAND.text};font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;">
    ${announcementBar}
    <header style="background:#fff;border-bottom:1px solid ${BRAND.border};padding:12px 16px;">
      <div style="max-width:1000px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="font-size:18px;font-weight:900;letter-spacing:1px;color:${BRAND.tealDark};text-decoration:none;">${escapeHtml(storeName)}</a>
        <a href="/" style="font-size:12px;color:${BRAND.muted};text-decoration:none;font-weight:700;border:1px solid ${BRAND.border};padding:6px 12px;border-radius:8px;">← العودة للمتجر</a>
      </div>
    </header>
    <main style="max-width:1000px;margin:0 auto;padding:20px 16px 50px;">
      <div style="display:grid;grid-template-columns:1fr;gap:20px;align-items:start;">
        <div style="background:#fff;border:1px solid ${BRAND.border};border-radius:16px;padding:14px;">${imgHtml}</div>
        <div>
          ${badge}
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;line-height:1.4;color:${BRAND.text};">${escapeHtml(product.name)}</h1>
          <div style="margin-bottom:12px;font-size:12px;color:#a8a29e;font-weight:700;">${escapeHtml(product.category || '')} ${product.rating ? ` • ⭐ ${Number(product.rating).toFixed(1)} (${product.reviewsCount || 0} تقييم)` : ''}</div>
          <div style="display:flex;align-items:center;margin-bottom:14px;">
            <span style="font-size:26px;font-weight:900;color:${BRAND.tealDark};">${formatPrice(product.price, currency)}</span>
            ${original}
          </div>
          ${orderForm}
        </div>
      </div>
      ${description}
    </main>
    <div style="background:#fff;border-top:1px solid ${BRAND.border};padding:18px 16px;text-align:center;font-size:11px;color:#a8a29e;">© ${escapeHtml(storeName)} — جميع الحقوق محفوظة</div>
  </div>`;
}

// ---------- حقن اللقطة والمحتوى في HTML الأساسي ----------
/**
 * يستبدل محتوى <div id="root">...</div> بـ rootContent، ويحقن وسم اللقطة قبل </head>.
 * يحدّث title و meta og إن وُجدت.
 */
function injectIntoHtml(baseHtml, { rootContent, snapshotTag, title, description, canonical, ogImage }) {
  let html = baseHtml;

  // 1) حقن لقطة النشر قبل إغلاق </head>
  if (snapshotTag) {
    html = html.replace('</head>', `${snapshotTag}\n</head>`);
  }

  // 2) تحديث العنوان والوصف إن طُلب (لصفحات المنتجات)
  if (title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(description || title)}" />`);
    html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
    html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description || title)}" />`);
    if (canonical) {
      const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
      if (!html.includes('rel="canonical"')) {
        html = html.replace('</head>', `${canonicalTag}\n</head>`);
      }
    }
    if (ogImage) {
      const ogImgTag = `<meta property="og:image" content="${escapeHtml(ogImage)}" />`;
      if (!html.includes('property="og:image"')) {
        html = html.replace('</head>', `${ogImgTag}\n</head>`);
      }
    }
  }

  // 3) استبدال محتوى #root (السبنر) بالمحتوى الثابت الحقيقي.
  //    Vite يضع <script type="module"> داخل <head>، لذا نرتكز على </body> كمركب نهائي.
  //    النمط: <div id="root"> ... </div>  متبوع بـ </body>
  const rootRe = /(<div id="root">)([\s\S]*?)(<\/div>\s*<\/body>)/;
  if (!rootRe.test(html)) {
    throw new Error('تعذّر العثور على <div id="root"> متبوع بـ </body> في dist/index.html');
  }
  html = html.replace(rootRe, (_m, open, _inner, closeBody) => `${open}${rootContent}${closeBody}`);

  return html;
}

// ---------- التنفيذ الرئيسي ----------
function main() {
  if (!existsSync(INDEX_HTML)) {
    console.error('[prerender] خطأ: dist/index.html غير موجود — شغّل vite build أولاً.');
    process.exit(1);
  }
  if (!existsSync(SNAPSHOT_PATH)) {
    console.error('[prerender] خطأ: data/store_state.json غير موجود.');
    process.exit(1);
  }

  const state = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  const baseHtml = readFileSync(INDEX_HTML, 'utf8');
  const payload = buildSnapshotPayload(state);
  const snapTag = snapshotScriptTag(payload);

  // 1) الصفحة الرئيسية
  const homeHtml = injectIntoHtml(baseHtml, {
    rootContent: renderHomeStatic(state),
    snapshotTag: snapTag,
  });
  writeFileSync(INDEX_HTML, homeHtml, 'utf8');
  console.log(`[prerender] ✅ dist/index.html — لقطة ${payload.products.length} منتج مضمّنة + محتوى ثابت.`);

  // 2) صفحات المنتجات المستقلة — نمسح المجلد أولاً لتجنب صفحات قديمة لمنتجات حُذفت.
  const products = (Array.isArray(state.products) ? state.products : []).filter((p) => !p.hidden);
  const productRoot = join(DIST, 'product');
  if (existsSync(productRoot)) rmSync(productRoot, { recursive: true, force: true });
  let generated = 0;
  for (const p of products) {
    const slug = productSlug(p);
    const dir = join(DIST, 'product', slug);
    mkdirSync(dir, { recursive: true });
    const currency = p.currency || state.settings?.currency || 'د.م';
    const productHtml = injectIntoHtml(baseHtml, {
      rootContent: renderProductStatic(p, state),
      snapshotTag: snapTag,
      title: `${p.name} | ${state.settings?.storeName || 'EGASA'}`,
      description: (p.description || '').slice(0, 160),
      canonical: `/product/${encodeURIComponent(slug)}`,
      ogImage: productImageSrc(p) || undefined,
    });
    writeFileSync(join(dir, 'index.html'), productHtml, 'utf8');
    generated++;
    console.log(`[prerender] ✅ dist/product/${slug}/index.html — ${p.name} (${formatPrice(p.price, currency)})`);
  }

  console.log(`\n[prerender] اكتمل التوليد: 1 صفحة رئيسية + ${generated} صفحة منتج ثابتة.`);
  console.log('[prerender] اربط مجلد dist بـ Cloudflare Pages (Build command: npm run build, Output: dist).');
}

main();
