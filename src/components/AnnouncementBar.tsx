import React, { useState, useEffect } from 'react';
import { AnnouncementSettings, AppLanguage, AnnouncementBarSize } from '../types';
import { Clock } from 'lucide-react';
interface AnnouncementBarProps {
  settings: AnnouncementSettings;
  currentLang?: AppLanguage;
}
export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings, currentLang = 'ar' }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: settings.countdownHours || 14,
    minutes: 42,
    seconds: 18,
  });
  useEffect(() => {
    if (!settings.showCountdown) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.showCountdown]);
  // Check if enabled globally and specifically for this active language
  const isEnabledForLang =
    settings.enabledByLanguage?.[currentLang] !== undefined
      ? Boolean(settings.enabledByLanguage[currentLang])
      : Array.isArray(settings.enabledLanguages) && settings.enabledLanguages.length > 0
      ? settings.enabledLanguages.includes(currentLang)
      : settings.enabled;
  if (!settings.enabled || !isEnabledForLang) return null;
  // Resolve language-specific texts
  const activeText =
    settings.textsByLanguage?.[currentLang] !== undefined && settings.textsByLanguage[currentLang] !== ''
      ? settings.textsByLanguage[currentLang]
      : settings.text;
  const activeBadgeText =
    settings.badgeTextsByLanguage?.[currentLang] !== undefined
      ? settings.badgeTextsByLanguage[currentLang]
      : settings.badgeText;
  const activeLinkText =
    settings.linkTextsByLanguage?.[currentLang] !== undefined
      ? settings.linkTextsByLanguage[currentLang]
      : settings.linkText;
  // Determine movement duration for desktop
  const getTickerDuration = () => {
    switch (settings.tickerSpeed) {
      case 'slow':
        return '26s';
      case 'fast':
        return '11s';
      case 'normal':
      default:
        return '17s';
    }
  };
  // Determine faster, continuous movement duration for mobile phones to prevent delay
  const getTickerDurationMobile = () => {
    switch (settings.tickerSpeed) {
      case 'slow':
        return '14s';
      case 'fast':
        return '6.5s';
      case 'normal':
      default:
        return '9.5s';
    }
  };
  const isMoving = settings.isMoving !== false;
  const pauseOnHover = settings.pauseOnHover !== false;
  // حجم الشريط — medium = المظهر الحالي بالضبط (بدون أي تغيير)
  const size: AnnouncementBarSize = settings.size ?? 'medium';
  const SIZE_CLASSES: Record<AnnouncementBarSize, {
    container: string;
    itemGap: string;
    badge: string;
    text: string;
    countdown: string;
    link: string;
    clockIcon: string;
    separator: string;
  }> = {
    small: {
      container: 'text-[10px] py-1',
      itemGap: 'gap-1 sm:gap-1.5 px-1 sm:px-2',
      badge: 'text-[9px] px-1 py-px',
      text: 'text-[10px]',
      countdown: 'text-[9px] px-1 py-px',
      link: 'text-[9px] px-1 py-px',
      clockIcon: 'w-2.5 h-2.5',
      separator: 'text-[9px] mx-0.5 sm:mx-1',
    },
    medium: {
      container: 'text-xs py-2',
      itemGap: 'gap-2 sm:gap-3 px-2 sm:px-4',
      badge: 'text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5',
      text: 'text-[11px] sm:text-xs',
      countdown: 'text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5',
      link: 'text-[10px] sm:text-xs px-1.5 py-0.5',
      clockIcon: 'w-3 h-3',
      separator: 'text-[10px] mx-1 sm:mx-1.5',
    },
    large: {
      container: 'text-sm py-3',
      itemGap: 'gap-3 sm:gap-4 px-3 sm:px-5',
      badge: 'text-xs sm:text-sm px-2.5 sm:px-3 py-1',
      text: 'text-sm sm:text-base',
      countdown: 'text-xs sm:text-sm px-2.5 sm:px-3 py-1',
      link: 'text-xs sm:text-sm px-2 py-1',
      clockIcon: 'w-4 h-4',
      separator: 'text-xs mx-1.5 sm:mx-2',
    },
  };
  const sz = SIZE_CLASSES[size];
  // Single announcement item chunk (repeated inside ticker track for seamless infinite scroll)
  const renderAnnouncementItem = (keyPrefix: string) => (
    <div
      key={keyPrefix}
      dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
      className={`inline-flex items-center ${sz.itemGap} shrink-0`}
    >
      {activeBadgeText && (
        <span className={`bg-white/20 ${sz.badge} rounded font-bold tracking-wide shadow-xs shrink-0`}>
          {activeBadgeText}
        </span>
      )}
      <span className={`font-semibold tracking-wide whitespace-nowrap ${sz.text}`}>
        {activeText}
      </span>
      {settings.showCountdown && (
        <div className={`inline-flex items-center gap-1 bg-black/25 ${sz.countdown} rounded font-mono tabular-nums font-bold shrink-0`}>
          <Clock className={`${sz.clockIcon} opacity-90`} />
          <span>
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      )}
      {activeLinkText && (
        <a
          href="#products-section"
          className={`underline underline-offset-4 font-bold hover:opacity-85 transition-opacity whitespace-nowrap ${sz.link} bg-white/10 rounded shrink-0`}
        >
          {activeLinkText}
        </a>
      )}
      {/* Decorative separator between repetitions */}
      <span className={`opacity-40 select-none ${sz.separator}`}>✦</span>
    </div>
  );
  return (
    <div
      style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
      className={`relative z-40 transition-all duration-200 border-b border-black/10 ${sz.container} overflow-hidden select-none`}
    >
      {isMoving ? (
        /* Animated Infinite Moving Ribbon / Ticker (Seamless Never-ending loop on phones & desktop) */
        <div className="relative w-full overflow-hidden flex items-center">
          {/* Subtle edge fade gradients for ultra-smooth appearance */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-16 z-10"
            style={{
              background: `linear-gradient(to left, ${settings.bgColor}, transparent)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-16 z-10"
            style={{
              background: `linear-gradient(to right, ${settings.bgColor}, transparent)`,
            }}
          />
          {/* Continuous Ticker Track with explicit LTR track to ensure 100% stable infinite loop */}
          <div
            className={`animate-ticker-continuous flex shrink-0 items-center ${
              pauseOnHover ? 'pause-hover' : ''
            }`}
            style={{
              direction: 'ltr',
              ['--ticker-duration' as string]: getTickerDuration(),
              ['--ticker-duration-mobile' as string]: getTickerDurationMobile(),
            }}
          >
            {/* Group 1 (Primary track) */}
            <div className="flex shrink-0 items-center">
              {renderAnnouncementItem('g1-1')}
              {renderAnnouncementItem('g1-2')}
              {renderAnnouncementItem('g1-3')}
              {renderAnnouncementItem('g1-4')}
              {renderAnnouncementItem('g1-5')}
            </div>
            {/* Group 2 (Identical mirror for 100% gapless never-ending loop) */}
            <div className="flex shrink-0 items-center" aria-hidden="true">
              {renderAnnouncementItem('g2-1')}
              {renderAnnouncementItem('g2-2')}
              {renderAnnouncementItem('g2-3')}
              {renderAnnouncementItem('g2-4')}
              {renderAnnouncementItem('g2-5')}
            </div>
          </div>
        </div>
      ) : (
        /* Static Centered Announcement Bar (Without X button) */
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-center px-4 flex-wrap" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
          {activeBadgeText && (
            <span className={`bg-white/15 ${sz.badge} rounded font-medium tracking-wide`}>
              {activeBadgeText}
            </span>
          )}
          <p className={`font-medium tracking-wide ${sz.text}`}>{activeText}</p>
          {settings.showCountdown && (
            <div className={`inline-flex items-center gap-1.5 bg-black/25 ${sz.countdown} rounded font-mono tabular-nums`}>
              <Clock className={`${sz.clockIcon} opacity-80`} />
              <span>
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}
          {activeLinkText && (
            <a
              href="#products-section"
              className={`underline underline-offset-4 font-semibold hover:opacity-80 transition-opacity whitespace-nowrap ${sz.text}`}
            >
              {activeLinkText}
            </a>
          )}
        </div>
      )}
    </div>
  );
};
