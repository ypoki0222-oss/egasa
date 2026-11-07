/**
 * imageFallback.ts — معالج موحّد لفشل تحميل صور المنتجات.
 *
 * السلوك (متطلب صريح):
 *  - أول فشل تحميل (onerror): تُستبدل الصورة بأيقونة SVG لإعادة التحميل فقط
 *    (دون أي نص بجانبها). الضغط عليها يعيد محاولة تحميل نفس الصورة مع
 *    معامل cache-bust `?retry=N`.
 *  - ثاني فشل: تُستبدل دائماً بشعار المتجر (logo) كصورة بديلة دائمة (SVG مضمّن).
 *
 * يُستخدم من:
 *  - مكوّن React <ProductImage /> (في الواجهة وصفحات المنتج والقوالب).
 *  - HTML المُعاد رسمه من الحافة (Edge SSR) عبر معالج global مضمّن (EDGE_ONERROR_SCRIPT).
 */

/** أيقونة إعادة التحميل (SVG فقط — لا نص). */
export const RELOAD_SVG =
  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:34px;height:34px;stroke:#78716c;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>';

/** شعار المتجر الدائم (SVG مضمّن — لا يحتاج ملف خارجي). */
export const LOGO_SVG =
  '<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:62%;max-width:160px;height:auto;opacity:0.55;"><rect x="6" y="14" width="52" height="52" rx="12" fill="#0f766e"/><path d="M20 54 L32 26 L44 54 M24 46 H40" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="70" y="52" font-family="Cairo, system-ui, sans-serif" font-size="30" font-weight="900" fill="#0f766e" letter-spacing="2">EGASA</text></svg>';

/** يضيف معامل cache-bust ?retry=N إلى رابط الصورة (يحذف المعامل القديم إن وجد). */
export function bustImageSrc(src: string, retry: number): string {
  if (!src) return src;
  const clean = src.replace(/[?&]retry=\d+/g, '');
  const sep = clean.includes('?') ? '&' : '?';
  return `${clean}${sep}retry=${retry}`;
}

export type ImageStatus = 'loading' | 'retry' | 'logo';

/**
 * معالج global مضمّن في HTML الحافة (Edge SSR) — يُحقن كـ <script> في <head>.
 * ينفّذ نفس السلوك أعلاه على صور HTML الثابتة (عبر onerror="__egasaImgOnError(this)").
 * لا يعتمد على React أو أي مكتبة خارجية.
 */
export const EDGE_ONERROR_SCRIPT = `(function(){
  var RELOAD='${RELOAD_SVG.replace(/'/g, "\\'")}';
  var LOGO='${LOGO_SVG.replace(/'/g, "\\'")}';
  function bust(src,n){var c=src.replace(/[?&]retry=\\d+/g,'');return c+(c.indexOf('?')>=0?'&':'?')+'retry='+n;}
  window.__egasaImgOnError=function(img){
    try{
      var n=parseInt(img.getAttribute('data-retry')||'0',10)+1;
      img.setAttribute('data-retry',String(n));
      if(n>=2){
        var s=document.createElement('span');
        s.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f5f5f4;';
        s.innerHTML=LOGO;
        if(img.parentNode) img.parentNode.replaceChild(s,img);
        return;
      }
      var btn=document.createElement('button');
      btn.type='button';
      btn.setAttribute('aria-label','إعادة تحميل الصورة');
      btn.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;border:0;margin:0;padding:0;background:#f5f5f4;cursor:pointer;';
      btn.innerHTML=RELOAD;
      (function(im,count){
        btn.addEventListener('click',function(){
          im.src=bust(im.getAttribute('data-src')||im.src,count);
          if(btn.parentNode) btn.parentNode.replaceChild(im,btn);
        });
      })(img,n);
      if(!img.getAttribute('data-src')) img.setAttribute('data-src',img.src);
      if(img.parentNode) img.parentNode.replaceChild(btn,img);
    }catch(e){}
  };
})();`;
