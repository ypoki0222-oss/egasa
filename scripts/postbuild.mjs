#!/usr/bin/env node
/**
 * postbuild.mjs — يعمل بعد "vite build".
 *
 * المهام:
 *  1. يقرأ dist/index.html (قبل حذفه) ويستخرج وسوم الأصول المُهشمة
 *     (<script type="module" src="/assets/..."> و <link rel="stylesheet" href="/assets/...">)
 *     ويكتبها في functions/asset-tags.js ليضمنها Pages Function في HTMLه.
 *  2. يحذف dist/index.html و dist/product/ حتى تسقط كل مسارات HTML على
 *     Pages Function (الملفات الثابتة لها الأولوية في Cloudflare Pages وستخفي الدالة).
 *
 * متغير اختياري: SKIP_EDGE_CLEANUP=1 — يتخطى الحذف (للمعاينة الثابتة المحلية عبر vite preview).
 */
import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const INDEX_HTML = join(DIST, 'index.html');
const FUNCTIONS_DIR = join(ROOT, 'functions');
const ASSET_TAGS_PATH = join(FUNCTIONS_DIR, 'asset-tags.js');

if (!existsSync(INDEX_HTML)) {
  console.error('[postbuild] خطأ: dist/index.html غير موجود — تأكد من نجاح vite build.');
  process.exit(1);
}

const indexHtml = readFileSync(INDEX_HTML, 'utf8');

// استخرج كل وسوم <script> و <link> التي تشير إلى /assets/ (مهشمة، تتغير عند كل بناء).
const assetTagRe = /<(script|link)\b[^>]*(?:src|href)="\/assets\/[^"]*"[^>]*>(?:<\/script>)?/gi;
const tags = [];
let m;
while ((m = assetTagRe.exec(indexHtml)) !== null) {
  tags.push(m[0]);
}
if (tags.length === 0) {
  console.warn('[postbuild] تحذير: لم أجد وسوم أصول في dist/index.html — سيبقى ASSET_TAGS فارغاً.');
}

if (!existsSync(FUNCTIONS_DIR)) mkdirSync(FUNCTIONS_DIR, { recursive: true });
writeFileSync(
  ASSET_TAGS_PATH,
  `// مُولّد تلقائياً بواسطة scripts/postbuild.mjs — لا تعدّل يدوياً.
// وسوم الأصول المُهشمة (JS/CSS) المستخرجة من dist/index.html بعد بناء Vite.
export const ASSET_TAGS = ${JSON.stringify(tags.join(''))};
`
);
console.log(`[postbuild] كُتبت ${tags.length} وسم أصل في functions/asset-tags.js`);

const skipCleanup = process.env.SKIP_EDGE_CLEANUP === '1';
if (skipCleanup) {
  console.log('[postbuild] SKIP_EDGE_CLEANUP=1 — تم تخطي حذف dist/index.html و dist/product/ (للمعاينة الثابتة المحلية فقط).');
} else {
  rmSync(INDEX_HTML, { force: true });
  rmSync(join(DIST, 'product'), { recursive: true, force: true });
  console.log('[postbuild] حُذف dist/index.html و dist/product/ — ستخدم Pages Function كل مسارات HTML.');
}
