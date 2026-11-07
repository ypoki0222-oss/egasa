import React, { useCallback, useEffect, useState } from 'react';
import { RELOAD_SVG, LOGO_SVG, bustImageSrc, type ImageStatus } from '../utils/imageFallback';

interface ProductImageProps {
  /** رابط الصورة. إن كان فارغاً يُعرض fallbackIllustration أو الشعار مباشرة. */
  src?: string | null;
  alt: string;
  /** نسبة العرض إلى الارتفاع الثابتة (CSS aspect-ratio)، مثلاً "1 / 1" أو "4 / 5". */
  aspectRatio?: string;
  /** كلاسات إضافية للحاوية (في وضع عدم الملء). */
  containerClassName?: string;
  /** كلاسات إضافية لوسم <img>. */
  imgClassName?: string;
  objectFit?: 'cover' | 'contain';
  /** تحميل فوري (eager) للصورة الرئيسية في صفحة المنتج. */
  eager?: boolean;
  /** وضع الملء: يملأ الحاوية الأب (الأب يجب أن يكون relative بنسبة ثابتة). */
  fill?: boolean;
  onClick?: () => void;
  /** محتوى بديل يعرض عند غياب الصورة تماماً (لا عند فشل التحميل). */
  fallbackIllustration?: React.ReactNode;
}

/**
 * <ProductImage /> — صورة منتج موحّدة بحاوية بنسبة ثابتة (تجنب CLS) ومعالج فشل:
 *  أول فشل → أيقونة SVG لإعادة التحميل فقط (لا نص)؛ الضغط يعيد المحاولة بـ ?retry=N.
 *  ثاني فشل → شعار المتجر (SVG) بديل دائم.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  aspectRatio = '1 / 1',
  containerClassName = '',
  imgClassName = '',
  objectFit = 'cover',
  eager = false,
  fill = false,
  onClick,
  fallbackIllustration,
}) => {
  const [status, setStatus] = useState<ImageStatus>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);

  // عند تغيير الصورة (منتج آخر / لون آخر) نعيد تعيين الحالة.
  useEffect(() => {
    setStatus('loading');
    setRetryCount(0);
    setCurrentSrc(src || null);
  }, [src]);

  const handleError = useCallback(() => {
    setStatus((prev) => (prev === 'loading' ? 'retry' : 'logo'));
  }, []);

  const handleRetry = useCallback(() => {
    if (!src) return;
    const next = retryCount + 1;
    setRetryCount(next);
    setCurrentSrc(bustImageSrc(src, next));
    setStatus('loading');
  }, [retryCount, src]);

  const objectClass = objectFit === 'cover' ? 'object-cover' : 'object-contain';

  const inner = (
    <>
      {status === 'loading' && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={handleError}
          className={`absolute inset-0 w-full h-full ${objectClass} ${imgClassName}`}
        />
      ) : null}
      {status === 'retry' ? (
        <button
          type="button"
          onClick={handleRetry}
          aria-label="إعادة تحميل الصورة"
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer border-0 p-0 m-0"
          dangerouslySetInnerHTML={{ __html: RELOAD_SVG }}
        />
      ) : null}
      {status === 'logo' || (!src && !fallbackIllustration) ? (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-100"
          dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
        />
      ) : null}
      {!src && fallbackIllustration ? <div className="absolute inset-0 w-full h-full">{fallbackIllustration}</div> : null}
    </>
  );

  if (fill) {
    return (
      <div className="relative w-full h-full" onClick={onClick}>
        {inner}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-stone-100 ${containerClassName}`}
      style={{ aspectRatio }}
      onClick={onClick}
    >
      {inner}
    </div>
  );
};
