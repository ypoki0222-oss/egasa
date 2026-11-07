import React from 'react';
import { HomeBannerSettings, AppLanguage } from '../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PromoSliderProps {
  bannerSettings?: HomeBannerSettings;
  currentLang?: AppLanguage;
  onCtaClick: () => void;
}

export const PromoSlider: React.FC<PromoSliderProps> = ({
  bannerSettings,
  currentLang = 'ar',
  onCtaClick,
}) => {
  if (bannerSettings && !bannerSettings.enabled) {
    return null;
  }

  // 1. Language targeting check
  if (bannerSettings) {
    // Check specific language target
    if (
      bannerSettings.languageTarget &&
      bannerSettings.languageTarget !== 'all' &&
      bannerSettings.languageTarget !== currentLang
    ) {
      return null;
    }

    // Check multi-language enabled array if specified
    if (
      Array.isArray(bannerSettings.enabledLanguages) &&
      bannerSettings.enabledLanguages.length > 0 &&
      !bannerSettings.enabledLanguages.includes(currentLang)
    ) {
      return null;
    }
  }

  // 2. Language-specific image resolution:
  const languageSpecificImage = bannerSettings?.imagesByLanguage?.[currentLang];
  const imageUrl =
    languageSpecificImage !== undefined
      ? languageSpecificImage
      : currentLang === 'ar'
      ? bannerSettings?.imageUrl
      : bannerSettings?.imagesByLanguage?.['ar'] || bannerSettings?.imageUrl;

  // 3. Per-language overlay visibility controls
  const isOverlayTextEnabled =
    bannerSettings?.overlayTextByLanguage?.[currentLang] !== undefined
      ? Boolean(bannerSettings.overlayTextByLanguage[currentLang])
      : bannerSettings?.showOverlayText !== undefined
      ? Boolean(bannerSettings.showOverlayText)
      : true;

  const isOverlayButtonEnabled =
    bannerSettings?.overlayButtonByLanguage?.[currentLang] !== undefined
      ? Boolean(bannerSettings.overlayButtonByLanguage[currentLang])
      : bannerSettings?.showOverlayButton !== undefined
      ? Boolean(bannerSettings.showOverlayButton)
      : true;

  // Language-specific text resolution (No automatic injection of unwanted French text):
  const title =
    bannerSettings?.titlesByLanguage?.[currentLang] !== undefined
      ? bannerSettings.titlesByLanguage[currentLang]
      : currentLang === 'ar'
      ? bannerSettings?.title || ''
      : '';

  const subtitle =
    bannerSettings?.subtitlesByLanguage?.[currentLang] !== undefined
      ? bannerSettings.subtitlesByLanguage[currentLang]
      : currentLang === 'ar'
      ? bannerSettings?.subtitle || ''
      : '';

  const discount =
    bannerSettings?.discountsByLanguage?.[currentLang] !== undefined
      ? bannerSettings.discountsByLanguage[currentLang]
      : currentLang === 'ar'
      ? bannerSettings?.discountText || ''
      : '';

  const ctaText =
    bannerSettings?.ctaTextsByLanguage?.[currentLang] ||
    (currentLang === 'ar'
      ? bannerSettings?.ctaText || 'تسوق الآن'
      : currentLang === 'fr'
      ? 'Acheter maintenant'
      : 'Shop Now');

  const bgGradient = bannerSettings?.bgGradient || 'from-[#FF5E62] via-[#FF6A5B] to-[#FFA07A]';

  const isFullWidth = Boolean(bannerSettings?.fullWidth);
  const radiusSetting = bannerSettings?.borderRadius || (isFullWidth ? 'none' : '2xl');

  // Resolve border radius classes
  let radiusClass = 'rounded-2xl sm:rounded-3xl';
  if (radiusSetting === 'none') {
    radiusClass = 'rounded-none';
  } else if (radiusSetting === 'sm') {
    radiusClass = 'rounded-sm';
  } else if (radiusSetting === 'md') {
    radiusClass = 'rounded-lg';
  } else if (radiusSetting === 'lg') {
    radiusClass = 'rounded-xl';
  } else if (radiusSetting === '2xl') {
    radiusClass = 'rounded-2xl sm:rounded-3xl';
  } else if (radiusSetting === '3xl') {
    radiusClass = 'rounded-3xl';
  }

  const isRtl = currentLang === 'ar';
  const hasAnyOverlay =
    (isOverlayTextEnabled && Boolean(title || subtitle || discount)) ||
    (isOverlayButtonEnabled && Boolean(ctaText));

  return (
    <div
      className={`w-full ${
        isFullWidth ? 'px-0 pt-0 pb-3' : 'max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-2'
      } font-['Cairo',sans-serif]`}
    >
      <div
        onClick={!hasAnyOverlay ? onCtaClick : undefined}
        className={`relative overflow-hidden ${radiusClass} ${
          isFullWidth ? 'shadow-sm' : 'shadow-lg'
        } ${
          imageUrl ? 'bg-stone-900' : `bg-gradient-to-r ${bgGradient}`
        } text-white p-6 sm:p-9 transition-all duration-300 min-h-[190px] sm:min-h-[220px] flex items-center ${
          !hasAnyOverlay ? 'cursor-pointer' : ''
        }`}
      >
        {/* Custom Uploaded Background Image if set */}
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="بانر المتجر"
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Dark gradient overlay for contrast only if text or button is visible */}
            {hasAnyOverlay && (
              <div
                className={`absolute inset-0 ${
                  isRtl
                    ? 'bg-gradient-to-r from-black/85 via-black/60 to-black/30'
                    : 'bg-gradient-to-l from-black/85 via-black/60 to-black/30'
                } pointer-events-none`}
              />
            )}
          </>
        ) : (
          <>
            {/* Playful geometric shapes in background when gradient is used */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-300/30 rounded-full blur-xl pointer-events-none transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-2 left-6 w-28 h-28 bg-emerald-400/30 rounded-2xl rotate-12 blur-lg pointer-events-none" />
            <div className="absolute top-4 left-1/3 w-16 h-16 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute bottom-4 right-1/4 w-8 h-8 bg-yellow-300/40 rounded-full pointer-events-none" />
          </>
        )}

        {hasAnyOverlay && (
          <div
            className={`relative z-10 flex flex-col items-center ${
              isRtl ? 'sm:items-start text-center sm:text-right' : 'sm:items-start text-center sm:text-left'
            } space-y-2.5 max-w-xl ${isFullWidth ? 'sm:px-6' : ''}`}
          >
            {/* Text Overlay Section */}
            {isOverlayTextEnabled && (
              <>
                {/* Title */}
                {title && (
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md font-['Cairo']">
                    {title}
                  </h2>
                )}

                {/* Subtitle if set */}
                {subtitle && (
                  <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-xs leading-relaxed">
                    {subtitle}
                  </p>
                )}

                {/* Big Discount Tag */}
                {discount && (
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md text-white font-['Cairo'] py-0.5">
                    {discount}
                  </div>
                )}
              </>
            )}

            {/* Action Button */}
            {isOverlayButtonEnabled && ctaText && (
              <div className="pt-2">
                <button
                  onClick={onCtaClick}
                  className="px-7 py-2.5 sm:px-8 sm:py-3 bg-white text-stone-900 font-extrabold text-xs sm:text-sm rounded-full shadow-md hover:bg-stone-50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 font-['Cairo']"
                >
                  <span>{ctaText}</span>
                  {isRtl ? (
                    <ArrowLeft className="w-4 h-4 text-stone-900" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-stone-900" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

