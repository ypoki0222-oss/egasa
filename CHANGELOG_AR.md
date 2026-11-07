# سجل التعديلات — متجر EGASA على Cloudflare Pages (عرض من الحافة Edge SSR)
التاريخ: 2026-11-06

---

## الجولة الرابعة — إصلاحان: ظهور المنتجات الجديدة خلال دقيقة + القضاء على وميض hydration
**الهدف:** (1) خفض مدة الكاش حتى يظهر منتج جديد خلال دقيقة واحدة للزوار الجدد، مع توثيق Purge Everything للظهور الفوري. (2) القضاء على وميض جزء من الثانية (إطارات البطاقات الثابتة ثم يستبدلها React) عبر hydrateRoot + مطابقة تامة لترميز ProductCard.

### الإصلاح 1 — خفض مدة الكاش
- `functions/[[path]].js`: رأس `Cache-Control` أصبح `public, max-age=10, s-maxage=60, stale-while-revalidate=3600` (كان `s-maxage=300` → تأخر ~5 دقائق). الذاكرة داخل العازلة خُفضت إلى 10s. منتج جديد يظهر خلال دقيقة واحدة كحد أقصى تلقائياً.
- `DEPLOY_CLOUDFLARE_AR.md`: قسم (ب) محدّث — **لظهور فوري**: **Purge Everything** من لوحة Cloudflare (Caching → Configuration → Purge Cache) بضغطة واحدة دون أي نشر. مؤكد صراحة: **لا يوجد زر purge في لوحة التحكم** (يتطلب API token ولم يُطلب).

### الإصلاح 2 — القضاء على وميض hydration
- `src/main.tsx`: استُبدل `createRoot` بـ `hydrateRoot` (يربط React بالـ DOM الموجود بدلاً من استبداله كاملاً). تراجع تلقائي إلى `createRoot` عند غياب اللقطة المضمّنة (`#egasa-published-snapshot` / `window.__EGASA_SNAPSHOT__`) أو فراغ `#root` (وضع التطوير dev)، مع try/catch احتياطي.
- `functions/[[path]].js` — `renderCardsHtml` أُعيدت كتابتها بالكامل لتطابق ProductCard.tsx **تماماً**: نفس عناصر DOM (div وليس `<a>`)، نفس Tailwind classes بالضبط (`group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 ...`، `aspect-square`، `p-3 sm:p-4`، زر `bg-teal-700 ...` مع أيقونة ShoppingBag SVG + النص "أطلب الآن")، نفس حاوية الشبكة (`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5`)، نفس نص السعر الخام `{price} {currency}`. أُزيل العنوان `<h2>منتجاتنا</h2>` (لا يرسمه React). `skeletonCards` أُعيدت بنفس هيكل البطاقة (نفس الأبعاد) حتى الانتقال skeleton→بطاقات حقيقية بلا قفز تخطيط.
- معالج أخطاء الصور في الحافة: أُضيف تفويض حدث `error` (capture phase) حتى تعمل الصور دون سمة `onerror` مضمّنة (تطابق مع صور React التي لا تحمل السمة) — بلا تحذير hydration على الصور.

### نتيجة التحقق (محلياً)
- `npm run build` ✅، `npx tsc --noEmit` ✅ (0 أخطاء). `dist/index.html` محذوف (لا يخفي الـ Function).
- `npx wrangler pages dev dist` + curl:
  - **Cache-Control الجديد مؤكد**: `public, max-age=10, s-maxage=60, stale-while-revalidate=3600`.
  - **TTFB = 0.082s** (أول بايت فوري قبل Firestore)، طلب ثانٍ مخزّن TTFB 16ms. صفحة منتج حقيقية 200.
  - **hydrateRoot موجود في الحزمة** (`grep -c hydrateRoot` = 2).
  - **تطابق الترميز**: 3 منتجات ظاهرة في اللقطة = 3 بطاقات حقيقية مضمّنة (عدد "أطلب الآن" = 3)، أسماء كل المنتجات موجودة في HTML، حاوية الشبكة مطابقة، لا `<h2>` قديم، **لا منتج تجريبي** (`prod-survette-amelia` غائب).
- لوحة التحكم وFirestore واستدعاءات onSnapshot لم تُمس.

---

## الجولة الثالثة — Streaming SSR + كاش حافة أطول + صناديق صور ثابتة + معالج فشل الصور
**الهدف:** أول بايت HTML يصل قبل استجابة Firestore (في بيئة المستخدم Firestore يستجيب ~12s)، مع منع قفز التخطيط (CLS) ومعالجة موحّدة لفشل تحميل الصور.

### ملفات أُضيفت
1. **`src/utils/imageFallback.ts`** (جديد): ثوابت `RELOAD_SVG` (أيقونة إعادة تحميل، لا نص) و`LOGO_SVG` (شعار EGASA مضمّن SVG)، دالة `bustImageSrc(src,n)` (معامل `?retry=N`)، و`EDGE_ONERROR_SCRIPT` (معالج global مضمّن في HTML الحافة).
2. **`src/components/ProductImage.tsx`** (جديد): مكوّن موحّد — حاوية بنسبة ثابتة (aspect-ratio) + `loading="lazy"`/`decoding="async"`/`object-cover` + آلة حالة: تحميل → أول فشل: زر أيقونة SVG reload فقط (لا نص، الضغط يعيد المحاولة بـ `?retry=N`) → ثاني فشل: شعار المتجر SVG بديل دائم. يدعم وضع `fill` ليلأأ حاوية الأب (يحافظ على البادجات المطلقة).

### ملفات عُدّلت
3. **`functions/[[path]].js`** (إعادة كتابة كاملة للـ Streaming SSR):
   - Response بجسم `ReadableStream` (TransformStream). القطعة الأولى تُرسل فوراً (دون انتظار Firestore): `<!doctype><head>` كامل (meta/fonts/CSS asset + معالج أخطاء الصور المضمّن `__egasaImgOnError`) + إطار ثابت داخل `#root` (هيدر + 8 إطارات بطاقات skeleton بنسبة `aspect-ratio:1/1` نابضة، أو skeleton لصفحة المنتج بنسبة 4/5).
   - استعلام Firestore يُطلق دون حظر؛ عند وصوله: القطعة الثانية = حقن اللقطة `#egasa-published-snapshot` + `window.__EGASA_SNAPSHOT__` + سكربت يستبدل الـ slot (`egasa-products-slot`/`egasa-product-slot`) بالبطاقات/محتوى المنتج الحقيقي + تحديث العنوان/اسم المتجر/الإعلان/البانر/canonical/og + وسوم JS asset + إغلاق الوسوم.
   - صور المنتجات في HTML الحافة: حاوية `aspect-ratio:1/1` (بطاقات) و4/5 (صفحة المنتج) مع `onerror="__egasaImgOnError(this)"` و`data-src` — تطابق نسب React لتجنب CLS.
   - رأس الكاش الجديد: `public, max-age=30, s-maxage=300, stale-while-revalidate=86400` + ذاكرة داخل العازلة TTL 30s + `cf:{cacheTtl:60}`.
   - عند فشل Firestore: حالة فارغة أنيقة (لا منتج تجريبي). منتج غير موجود → `noindex` + رسالة.
4. **`src/components/ProductCard.tsx`**: استُبدل `<img onError>` بـ `<ProductImage fill>` (نسبة 1/1 ثابتة، معالج retry→logo). أُزيل حالة `imgError` المحلية.
5. **`src/components/ProductPageView.tsx`** و**`ProductDetailModal.tsx`**: الصورة الرئيسية أصبحت `<ProductImage fill eager>` (نسب 4/5 و3/4 على التوالي، تحافظ على بادجات الزوم).
6. **`src/components/product-templates/ModernProductPage.tsx`** و**`ElegantProductPage.tsx`** (القوالب): الصورة الرئيسية أصبحت `<ProductImage fill eager>`.
7. **`DEPLOY_CLOUDFLARE_AR.md`**: قسم جديد "طرق التعديل السريعة ومسح التخزين المؤقت": (أ) تعديل مباشر في واجهة GitHub → Commit → إعادة نشر تلقائية؛ (ب) مسح الكاش من لوحة Cloudflare (Caching → Purge) دون نشر؛ (ج) تعديل المنتجات/الأسعار حياً من لوحة التحكم دون أي نشر.

### نتيجة التحقق (محلياً)
- `npm run build` ✅، `npx tsc --noEmit` ✅ (0 أخطاء).
- `npx wrangler pages dev dist` + curl: **TTFB (time_starttransfer) = 0.077s** بينما **time_total = 3.29s** (Firestore يستجيب ببطء) — أول بايت يصل قبل Firestore بفارق كبير (وفي بيئة المستخدم ~12s سيبقى TTFB ~77ms). صفحة منتج حقيقية: 200 + canonical/og:title صحيحان.
- رأس Cache-Control: `public, max-age=30, s-maxage=300, stale-while-revalidate=86400` ✅.
- `grep` في `dist/assets/index-*.js`: يحتوي `retry=` و`bustImageSrc`/`data-retry`/`ProductImage` ✅ (المعالج في الحزمة النهائية). معالج `__egasaImgOnError` مضمّن في القطعة الأولى من HTML الحافة.
- المنتجات في اللقطة حقيقية (معرّفات Firestore حقيقية) — لا منتج تجريبي. `INITIAL_PRODUCTS` يبقى في الحزمة فقط لزر استعادة البيانات التجريبية في لوحة التحكم.

---

## الجولة الثانية — عرض من الحافة (Edge SSR) عبر Pages Function: لا إعادة بناء عند إضافة منتج إطلاقاً
**السبب:** فشل الحل الأول (SSG بلقطة ثابتة `data/store_state.json` مخبوزة عند البناء) لأن المستخدم نشر عبر GitHub→Cloudflare Pages ولم يصدّر لقطة، فظل المنتج التجريبي يومضاً. والمستخدم صرّح صراحة بعدم الرغبة بأي إعادة بناء عند إضافة/تعديل منتج.

**الحل:** Pages Function (`functions/[[path]].js`) يستعلم Firestore REST API مباشرة عند كل طلب من حافة Cloudflare، ويعرض HTML كاملاً بمنتجات حقيقية، مع تخزين مؤقت ذكي.

### ملفات أُضيفت
1. **`functions/[[path]].js`** (جديد — الدالة الرئيسية):
   - catch-all يستقبل كل طلب HTML لا يطابق ملفاً ثابتاً (`/`، `/product/<slug>`، وأي مسار HTML آخر).
   - يستعلم عند الطلب: `GET .../documents/products?pageSize=200&orderBy=createdAt desc&key=...` (مع إعادة محاولة بدون `orderBy` عند الفشل) + `GET .../documents/settings/global`.
   - محوّل كامل من قيم Firestore REST (`stringValue/integerValue/doubleValue/booleanValue/arrayValue/mapValue/timestampValue/geoPointValue/referenceValue/bytesValue/nullValue`) إلى كائنات عادية.
   - يقرأ `FIREBASE_PROJECT_ID`/`FIREBASE_API_KEY` من متغيرات البيئة إن وُجدتا، وإلا القيمتان العامتان الثابتتان (لا أسرار، لا service account).
   - يعيد استخدام منطق العرض من `prerender.mjs` (escapeHtml/jsonForScript/productSlug/productImageSrc/formatPrice/renderHome/renderProductPage) — يعرض شريط إعلان + بانر + بطاقات منتجات حقيقية للرئيسية، أو صفحة منتج كاملة بعنوان/وصف/canonical/og:image خاصين.
   - يحقن اللقطة `#egasa-published-snapshot` + `window.__EGASA_SNAPSHOT__` بنفس البنية `{products, settings, builtAt}` التي يقرأها `src/lib/snapshot.ts`.
   - يضمن وسوم الأصول المهشمة من `functions/asset-tags.js` في `<head>`.
   - تخزين مؤقت: رأس `Cache-Control: public, max-age=15, s-maxage=60, stale-while-revalidate=300` + ذاكرة داخل العازلة (isolate) بTTL 20 ثانية لاستجابات Firestore + `cf:{cacheTtl:30}` على استعلامات الشبكة.
   - عند فشل استعلام Firestore (شبكة): حالة فارغة أنيقة — **لا منتج تجريبي أبداً**.
   - منتج غير موجود → HTTP 404 مع shell التطبيق. ملفات أصول ثابتة مفقودة (امتداد معروف) → تُعاد للمعالجة الثابتة (404) لا HTML.
2. **`functions/asset-tags.js`** (مُولّد تلقائياً): `export const ASSET_TAGS = "..."` — وسوم JS/CSS المهشمة المستخرجة من `dist/index.html`.
3. **`scripts/postbuild.mjs`** (جديد): يقرأ `dist/index.html` قبل حذفه، يستخرج وسوم الأصول المرجعية إلى `/assets/`، يكتب `functions/asset-tags.js`، ثم **يحذف `dist/index.html` و `dist/product/`** حتى تسقط المسارات على الدالة (الملفات الثابتة لها الأولوية في Pages). متغير `SKIP_EDGE_CLEANUP=1` يتخطى الحذف للمعاينة الثابتة المحلية.

### ملفات عُدّلت
4. **`package.json`**: `"build": "vite build && node scripts/postbuild.mjs"` (لم يعد يستدعي `prerender.mjs`). أُضيف `build:static-preview` و `preview:edge` (`wrangler pages dev dist`). أُضيف `wrangler` كـ devDependency.
5. **`public/_redirects`**: أُزيل قاعدة `/* /index.html 200` (SPA fallback) — الدالة تتولى كل مسارات HTML. بقي تعليق توثيقي فقط. `_headers` بقي كما هو (أصول ثابتة + رؤوس أمان).
6. **`src/components/admin/ProductsTab.tsx`**: زر "نسخ رابط الإعلان" (`handleCopyAdUrl`) أصبح ينتج `${origin}/product/<slug>` (مطلق) بدلاً من `?p=slug`. النص التعريفي للبانر أُحدّث للصيغة الجديدة مع التنويه بعدم الحاجة لإعادة بناء. عنوان زر "تصدير لقطة النشر" أُحدّث (أصبح نسخة احتياطية اختيارية فقط).
7. **`src/App.tsx`**: `handleOpenProductDetail` يدفع الآن `/product/<slug>` (مع الإبقاء على معاملات الحملات الإعلانية `utm_*`) بدلاً من `?p=`. الإغلاق يعود إلى `/` (كان يعمل ذلك بالفعل). بقية التهيئة من اللقطة المضمّنة واشتراكات `subscribeProducts`/`subscribeSettings` (onSnapshot) محفوظة.
8. **`DEPLOY_CLOUDFLARE_AR.md`**: أعيد كتابته بالكامل للطريقة الجديدة — اكتشاف `functions/` تلقائياً، لا متغيرات سرية إلزامية، **عدم الحاجة لإعادة بناء عند إضافة منتج**، إهمال سير عمل "تصدير لقطة + إعادة بناء"، مع الإبقاء على خطوة Firebase Authorized domains.

### ملفات بقيت كما هي (لم تُمس)
- `scripts/prerender.mjs` و `data/store_state.json`: للمرجع فقط، لا يستدعيهما البناء.
- `src/lib/snapshot.ts`: كما هو (يقرأ اللقطة المضمّنة من الدالة بنفس البنية).
- كل ملفات مورد (mowarid) ومفاتيح Firebase ولوحة التحكم بكامل تبويباتها.

### نتيجة التحقق (محلياً)
- `npm run build`: ينجح. `npx tsc --noEmit`: يمر بدون أخطاء.
- `dist/index.html` و `dist/product/` غير موجودين بعد البناء (لا يخفون الدالة). `functions/asset-tags.js` يحتوي وسمَي JS/CSS المهشمَين.
- `npx wrangler pages dev dist` + curl: `/` → HTTP 200، يحوي `#egasa-published-snapshot` ووسم الأصل المهشم ورأس `Cache-Control` الصحيح و`builtAt` وقت الطلب. `/product/survette-amelia` → 404 أنيق (Firestore غير متاح من بيئة الاختبار). `/assets/*.js` → 200. أصل مفقود بامتداد `.js` → 404 (ليس HTML).
- سجلات wrangler تُظهر `[egasa-edge] querying Firestore at request time (products)...` و`(settings/global)...` عند أول طلب (2079ms) ثم ضربة ذاكرة مؤقتة (10ms) — إثبات الاستعلام عند الطلب + التخزين المؤقت.
- اختبار محاكاة Firestore (node): استجابات وهمية لـ products/settings → HTML الرئيسية وصفحة المنتج يحويان اسم المنتج الحقيقي والسعر و`EGASA REAL STORE`، وcanonical/og:title صحيحان، ومنتج غير موجود → 404. **ALL PASS**.
- عدد المسارات التي يخدمها الـ Function: كل مسارات HTML — الرئيسية `/`، صفحات المنتجات `/product/<slug>` (200 أو 404)، وأي مسار HTML آخر (shell التطبيق) — باستثناء الأصول الثابتة `/assets/*` و`/uploads/*` وامتدادات الملفات المعروفة.

---

## الجولة الأولى — SSG + SWR (مستبدلة بالحل أعلاه، بقت ملفاتها للمرجع)

التاريخ: 2026-11-06
الهدف: متجر سريع بدون وميض (no-flash)، محتوى حقيقي من أول بايت، منشور على Cloudflare Pages، مع الإبقاء على Firebase كخلفية حية (Real-time).

---

## ملفات أُضيفت

### 1. `src/lib/snapshot.ts` (جديد)
وحدة قراءة "لقطة النشر" (Published Snapshot) المضمّنة في HTML عند البناء.
- `getPublishedSnapshot()`: تقرأ `<script type="application/json" id="egasa-published-snapshot">` أو `window.__EGASA_SNAPSHOT__` بشكل متزامن قبل أول رسم لـ React، وتعيد `{products, settings}` مصححة الأنواع، أو `null` في وضع التطوير.
- `hasPublishedSnapshot()`: هل توجد لقطة مضمّنة.
- `getProductSlugFromPath()`: تستخرج slug المنتج من المسار النظيف `/product/<slug>` للتوجيه المباشر.
- تنظيف وتعقيم للبيانات (sanitize) لضمان توافق الأنواع.

### 2. `scripts/prerender.mjs` (جديد)
سكربت توليد ثابت (SSG) يعمل كـ postbuild بعد `vite build`.
- يقرأ `data/store_state.json` (لقطة النشر canonical).
- يحقن اللقطة في `dist/index.html` كـ `<script type="application/json" id="egasa-published-snapshot">` + `window.__EGASA_SNAPSHOT__`.
- يستبدل سبنر التحميل داخل `#root` بمحتوى HTML حقيقي للصفحة الرئيسية (شريط إعلان + بانر + بطاقات منتجات حقيقية بأسماء وأسعار وصور) — لا يظهر السبنر أبداً للمستخدم النهائي.
- يولّد صفحة مستقلة ثابتة لكل منتج: `dist/product/<slug>/index.html` بمحتوى المنتج الكامل (صورة، وصف، مميزات، مقاسات، ألوان، عرض باقة، استمارة طلب بصرية) + عنوان ووصف و canonical و og:image خاصين بالمنتج.
- يمسح مجلد `dist/product` قبل التوليد لتجنب صفحات قديمة لمنتجات حُذفت.
- يطبع ملخصاً بعدد الصفحات المولدة.

### 3. `public/_redirects` (جديد — يُنسخ إلى dist تلقائياً)
- قاعدة صريحة: `/product/:slug → /product/:slug/index.html 200` (الملفات الثابتة لها أولوية أصلاً في Cloudflare Pages).
- SPA fallback: `/* /index.html 200` (للوحة التحكم والروابط القديمة `?p=`).

### 4. `public/_headers` (جديد — يُنسخ إلى dist تلقائياً)
- `Cache-Control: public, max-age=0, must-revalidate` لملفات HTML (لتنتشر تحديثات اللقطة فوراً).
- `Cache-Control: public, max-age=31536000, immutable` لأصول `/assets/*` (المهشمة) و`/uploads/*`.
- رؤوس أمان أساسية: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

---

## ملفات عُدّلت

### 5. `src/App.tsx` (معدّل)
- **تهيئة الحالة من اللقطة أولاً**: `storeSettings` و`products` يقرآن اللقطة المضمّنة قبل localStorage وقبل أي قيمة افتراضية — هذا يلغي وميض المنتج التجريبي/الفراغ.
- **لا منتج تجريبي على واجهة المتجر**: عند غياب اللقطة و localStorage فارغ (وضع تطوير)، يُعرض skeleton نظيف (شبكة بطاقات وهمية) حتى ترد بيانات Firestore، بدلاً من `INITIAL_PRODUCTS`. `INITIAL_PRODUCTS` يبقى متاحاً فقط لزر "استعادة البيانات التجريبية" في لوحة التحكم.
- **حالة `firstDataReceived`**: تُضبط عند أول رد من `subscribeProducts` (onSnapshot) لإخفاء الـ skeleton.
- **توجيه بالمسار النظيف `/product/<slug>`**: أُضيف إلى `getInitialProductFromUrl` و`isRoutePending` وتأثير توجيه URL — بالتوافق مع الصفحات الثابتة المولدة، إلى جانب `?p=` و`?product=` و`?id=` و`#product/slug` القائمين.
- **إغلاق صفحة المنتج**: عند العودة للرئيسية من مسار `/product/<slug>` يُعاد التوجيه إلى `/` بدلاً من الإبقاء على المسار.
- **SWR محفوظ**: اشتراكات `subscribeProducts`/`subscribeSettings` (onSnapshot) تبقى تحدّث الحالة في الخلفية بصمت — تعديلات المشرف تظهر للمستخدمين خلال ثانية دون إعادة نشر.
- **دالة `handleExportSnapshot`**: تنزّل `store_state.json` يحتوي products+orders+settings الحالية من Firestore، وتُمرر للوحة التحكم.

### 6. `src/components/admin/AdminDashboard.tsx` (معدّل)
- أُضيف خاصية `onExportSnapshot?: () => void` ووُصِلت إلى `ProductsTab`.

### 7. `src/components/admin/ProductsTab.tsx` (معدّل)
- أُضيف زر **"تصدير لقطة النشر"** (بلون teal مميز) بجانب "تصدير كود المنتجات"، ينفّذ `onExportSnapshot` لتنزيل `store_state.json`.

### 8. `package.json` (معدّل)
- `"build": "vite build && node scripts/prerender.mjs"` (التوليد الثابت تلقائي بعد البناء).
- أُضيف `"build:cf": "npm run build"` كاسم مستعار للنشر على Cloudflare.
- تبقى `dev` / `preview` / `lint` / `clean` / `deploy` شغالة.

---

## ملفات لم تُمس (وفقاً للقيود الصارمة)
- `firebase-applet-config.json`: مفاتيح Firebase العامة كما هي بدون أي تغيير (projectId `egasa-87fcd`).
- `firebase.json` / `.firebaserc`: تُركت كمرجع.
- `src/lib/firebase.ts` / `src/db/store.ts`: لم تُعدّل — استدعاءات Firestore الحية (`subscribeProducts`/`subscribeSettings`/`onSnapshot`) قائمة.
- مجلد `mowarid` بالكامل: لم يُمس إطلاقاً.
- `src/data/initialData.ts`: `INITIAL_PRODUCTS` باقية لزر استعادة البيانات التجريبية في لوحة التحكم فقط.

---

## نتيجة التحقق
- `npx tsc --noEmit`: يمر بدون أخطاء.
- `npm run build` (من نظيف): ينجح — يولّد `dist/index.html` + `dist/product/<slug>/index.html` لكل منتج.
- `vite preview` + curl: `/` و`/product/<slug>` يعيدان HTTP 200 ويحتويان اسم المنتج الحقيقي والسعر واللقطة المضمّنة في HTML قبل أي جافاسكربت؛ السبنر غير موجود.
- إعدادات Firebase واستدعاءات `onSnapshot`/`subscribeProducts` موجودة في الحزمة النهائية.

---

## الإصدار v5 — إصلاح تضخم بيانات المتصفح (9.9MB → ~1KB)

### المشكلة
كان التطبيق يكتب **كامل المنتجات بما فيها الصور (base64/data:image)** في `localStorage`
بالمفتاح `egasa_store_products_v3`. كل صورة ~100-300KB، فمع إضافة المنتجات ينتفخ حجم
تخزين المتصفح حتى 9.9MB ويقترب من حد المتصفح (5-10MB)، مسبباً أخطاء `QuotaExceeded`
واحتمال تعطّل التطبيق. موقع Mowarid لا يواجه ذلك لأنه يخزّن الصور كروابط (URL) فقط،
فتظل بيانات متصفحه ~1KB.

### الحل (بدون أي تغيير في السلوك المرئي)
1. **تجريد الصور من الكاش**: ملف جديد `src/utils/cacheStrip.ts` يزيل كل سلاسل `data:image/...`
   بشكل متكرر قبل الكتابة في `localStorage` (من المنتجات، الإعدادات، صور البانر، أفاتار التقييمات).
   تبقى النصوص والأسعار والأوصاف للعرض الفوري، والصور تصل من Firestore خلال أقل من ثانية.
2. **رفع إصدار المفاتيح إلى `_v4`**: `egasa_store_products_v4` / `settings_v4` / `orders_v4`.
3. **ترحيل تلقائي لمرة واحدة**: عند أول تحميل بعد التحديث، تُحذف مفاتيح `_v3` القديمة المنتفخة
   تلقائياً (دالة `migrateLegacyCache`) فتتحرر مساحة الـ9.9MB فوراً لكل الزائرين العائدين —
   لا يحتاج أحد إلى مسح بيانات المتصفح يدوياً.
4. **سقف للطلبات في الكاش**: آخر 100 طلب فقط (`MAX_ORDERS_CACHE`) لمنع نمو كاش الطلبات.
5. زر "مسح البيانات المؤقتة" في صفحة الخطأ يمسح الآن مفاتيح v3 وv4 معاً.

### الملفات المعدّلة
- `src/utils/cacheStrip.ts` (جديد)
- `src/App.tsx` (تجريد + ترحيل + سقف الطلبات)
- `src/main.tsx` (زر المسح يشمل v4)
- `src/components/ProductReviewsSection.tsx` (تجريد أفاتار التقييمات)

### التحقق
- `npx tsc --noEmit`: 0 أخطاء.
- `npm run build`: ناجح، `dist/index.html` = 2.22KB فقط (لا base64 مضمّن).
- حجم تخزين المتصفح المتوقع بعد التحديث: بضعة كيلوبايت فقط، مهما كان عدد المنتجات.
