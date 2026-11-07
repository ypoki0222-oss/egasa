import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductReview, Product } from '../types';
import { TRANSLATIONS, getDirection, getFontFamily, AppLanguage } from '../utils/i18n';
import { stripDataUrlsDeep } from '../utils/cacheStrip';
import {
  Star,
  User,
  Check,
  ThumbsUp,
  MessageSquare,
  Upload,
  X,
  Camera,
  Plus,
} from 'lucide-react';

interface ProductReviewsSectionProps {
  product: Product;
  currency?: string;
  language?: AppLanguage;
}

// Preset Visitor Avatars with language-aware initials
const VISITOR_AVATARS_BY_LANG: Record<AppLanguage, { id: string; bgColor: string; initial: string }[]> = {
  ar: [
    { id: 'visitor-teal', bgColor: 'bg-teal-100 text-teal-800', initial: 'ز' },
    { id: 'visitor-rose', bgColor: 'bg-rose-100 text-rose-800', initial: 'س' },
    { id: 'visitor-amber', bgColor: 'bg-amber-100 text-amber-800', initial: 'م' },
    { id: 'visitor-indigo', bgColor: 'bg-indigo-100 text-indigo-800', initial: 'ف' },
    { id: 'visitor-emerald', bgColor: 'bg-emerald-100 text-emerald-800', initial: 'ع' },
  ],
  fr: [
    { id: 'visitor-teal', bgColor: 'bg-teal-100 text-teal-800', initial: 'S' },
    { id: 'visitor-rose', bgColor: 'bg-rose-100 text-rose-800', initial: 'C' },
    { id: 'visitor-amber', bgColor: 'bg-amber-100 text-amber-800', initial: 'M' },
    { id: 'visitor-indigo', bgColor: 'bg-indigo-100 text-indigo-800', initial: 'V' },
    { id: 'visitor-emerald', bgColor: 'bg-emerald-100 text-emerald-800', initial: 'E' },
  ],
  en: [
    { id: 'visitor-teal', bgColor: 'bg-teal-100 text-teal-800', initial: 'J' },
    { id: 'visitor-rose', bgColor: 'bg-rose-100 text-rose-800', initial: 'S' },
    { id: 'visitor-amber', bgColor: 'bg-amber-100 text-amber-800', initial: 'A' },
    { id: 'visitor-indigo', bgColor: 'bg-indigo-100 text-indigo-800', initial: 'E' },
    { id: 'visitor-emerald', bgColor: 'bg-emerald-100 text-emerald-800', initial: 'M' },
  ],
};

const SEED_REVIEWS_BY_LANG: Record<AppLanguage, ProductReview[]> = {
  ar: [
    {
      id: 'rev-seed-ar-1',
      productId: '',
      userName: 'سناء بناني (الدار البيضاء)',
      avatarType: 'visitor',
      visitorAvatarId: 'visitor-teal',
      rating: 5,
      comment: 'القطعة جاتني ممتازة وتوب رطب والتوصيل سريع جداً في 24 ساعة. شكراً لكم!',
      date: 'منذ يومين',
      verifiedPurchase: true,
      likesCount: 8,
    },
    {
      id: 'rev-seed-ar-2',
      productId: '',
      userName: 'فاطمة الزهراء (الرباط)',
      avatarType: 'visitor',
      visitorAvatarId: 'visitor-rose',
      rating: 5,
      comment: 'المقاس مضبوط بالتمام ونفس الصورة تماماً مع إمكانية المعاينة قبل الدفع عند الاستلام.',
      date: 'منذ 4 أيام',
      verifiedPurchase: true,
      likesCount: 5,
    },
  ],
  fr: [
    {
      id: 'rev-seed-fr-1',
      productId: '',
      userName: 'Sarah B. (Paris)',
      avatarType: 'visitor',
      visitorAvatarId: 'visitor-teal',
      rating: 5,
      comment: 'Qualité exceptionnelle, tissu très doux et confortable. Livraison rapide en 24h à domicile. Merci !',
      date: 'Il y a 2 jours',
      verifiedPurchase: true,
      likesCount: 9,
    },
    {
      id: 'rev-seed-fr-2',
      productId: '',
      userName: 'Sophie L. (Lyon)',
      avatarType: 'visitor',
      visitorAvatarId: 'visitor-rose',
      rating: 5,
      comment: 'Taille parfaitement ajustée, conforme aux photos avec vérification avant paiement à la livraison.',
      date: 'Il y a 4 jours',
      verifiedPurchase: true,
      likesCount: 6,
    },
  ],
  en: [
    {
      id: 'rev-seed-en-1',
      productId: '',
      userName: 'Emily R. (London)',
      avatarType: 'visitor',
      visitorAvatarId: 'visitor-teal',
      rating: 5,
      comment: 'Superb quality, very soft and comfortable fabric. Fast delivery in 24 hours. Highly recommend!',
      date: '2 days ago',
      verifiedPurchase: true,
      likesCount: 8,
    },
    {
      id: 'rev-seed-en-2',
      productId: '',
      userName: 'Jessica M. (New York)',
      avatarType: 'visitor',
      visitorAvatarId: 'visitor-rose',
      rating: 5,
      comment: 'True to size and exactly as shown in the photos. Great cash-on-delivery service.',
      date: '4 days ago',
      verifiedPurchase: true,
      likesCount: 5,
    },
  ],
};

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  language = 'ar',
}) => {
  const storageKey = `egasa_reviews_${product.id}_${language}`;
  const t = TRANSLATIONS[language] || TRANSLATIONS.ar;
  const dir = getDirection(language);
  const font = getFontFamily(language);
  const visitorAvatars = VISITOR_AVATARS_BY_LANG[language] || VISITOR_AVATARS_BY_LANG.ar;

  // Reviews state: combines merchant-configured custom reviews and customer submissions
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    // 1. If merchant added reviews in Product Edit settings, use them
    if (Array.isArray(product.customReviews)) {
      return product.customReviews;
    }
    // 2. Otherwise load from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    // 3. Fallback to clean short default reviews for the active language
    const seed = SEED_REVIEWS_BY_LANG[language] || SEED_REVIEWS_BY_LANG.ar;
    return seed.map((r) => ({ ...r, productId: product.id }));
  });

  // Re-sync if product.customReviews or language changes
  useEffect(() => {
    if (Array.isArray(product.customReviews)) {
      setReviews(product.customReviews);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(parsed);
          return;
        }
      }
    } catch {}
    const seed = SEED_REVIEWS_BY_LANG[language] || SEED_REVIEWS_BY_LANG.ar;
    setReviews(seed.map((r) => ({ ...r, productId: product.id })));
  }, [language, product.id, product.customReviews, storageKey]);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [avatarMode, setAvatarMode] = useState<'visitor' | 'custom'>('visitor');
  const [selectedVisitorAvatarId, setSelectedVisitorAvatarId] = useState('visitor-teal');
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stripDataUrlsDeep(reviews)));
    } catch {
      // ignore
    }
  }, [reviews, storageKey]);

  // Average rating
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  // Handle image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError(t.imageTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomAvatarPreview(event.target?.result as string);
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit new review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setFormError(t.enterNameError);
      return;
    }

    const cleanComment = comment.trim();
    if (!cleanComment) {
      setFormError(t.enterReviewError);
      return;
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      userName: cleanName,
      avatarType: avatarMode,
      avatarUrl: avatarMode === 'custom' ? (customAvatarPreview || undefined) : undefined,
      visitorAvatarId: avatarMode === 'visitor' ? selectedVisitorAvatarId : undefined,
      rating,
      comment: cleanComment,
      date: t.justNow,
      verifiedPurchase: true,
      likesCount: 1,
    };

    setReviews((prev) => [newReview, ...prev]);
    setSuccessMessage(t.reviewSuccessMessage);
    setName('');
    setComment('');
    setRating(5);
    setCustomAvatarPreview(null);
    setIsFormOpen(false);

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleToggleLike = (reviewId: string) => {
    const isLiked = likedReviews[reviewId];
    setLikedReviews((prev) => ({ ...prev, [reviewId]: !isLiked }));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, likesCount: (r.likesCount || 0) + (isLiked ? -1 : 1) } : r
      )
    );
  };

  return (
    <div
      dir={dir}
      style={{ fontFamily: font }}
      className={`w-full mt-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
    >
      {/* 1. Concise, Minimalist Header (سهل وقصير بدون حشو) */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <h4 className="text-base sm:text-lg font-bold text-stone-900">
            {t.reviewsHeading}
          </h4>
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-900">
            <span>{averageRating}</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-stone-400 font-normal">({reviews.length})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setFormError(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          {isFormOpen ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>{t.closeBtn}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addReviewBtn}</span>
            </>
          )}
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Compact Add Review Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="my-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3.5"
        >
          <div className="font-bold text-xs text-stone-800">
            {t.writeReviewHeading}
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold">
              {formError}
            </div>
          )}

          {/* User Name */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              {t.userNameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.userNamePlaceholder}
              className={`w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 ${
                dir === 'rtl' ? 'text-right' : 'text-left'
              }`}
            />
          </div>

          {/* User Photo or Visitor Avatar */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-700">
              {t.avatarOrVisitor}
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAvatarMode('visitor')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  avatarMode === 'visitor'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                {t.visitorPhotoBtn}
              </button>

              <button
                type="button"
                onClick={() => setAvatarMode('custom')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  avatarMode === 'custom'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                {t.uploadPhotoBtn}
              </button>
            </div>

            {avatarMode === 'visitor' ? (
              <div className="flex items-center gap-2 pt-1">
                {visitorAvatars.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedVisitorAvatarId(av.id)}
                    className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      av.bgColor
                    } ${
                      selectedVisitorAvatarId === av.id
                        ? 'ring-2 ring-stone-900 ring-offset-1 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {av.initial}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                {customAvatarPreview ? (
                  <img
                    src={customAvatarPreview}
                    alt="preview"
                    className="w-10 h-10 rounded-full object-cover border border-stone-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="compact-rev-upload"
                />
                <label
                  htmlFor="compact-rev-upload"
                  className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {customAvatarPreview ? t.changePhoto : t.choosePhoto}
                </label>
              </div>
            )}
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              {t.starRatingLabel}
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      s <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Written Review */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              {t.reviewCommentLabel}
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.reviewCommentPlaceholder}
              className={`w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none ${
                dir === 'rtl' ? 'text-right' : 'text-left'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              {t.closeBtn}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
            >
              {t.submitReviewBtn}
            </button>
          </div>
        </form>
      )}

      {/* 3. Short & Clean Reviews List */}
      <div className="space-y-3 mt-4">
        {reviews.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">{t.noReviewsYet}</p>
        ) : (
          reviews.map((rev) => {
            const visitorAvatar =
              visitorAvatars.find((v) => v.id === rev.visitorAvatarId) || visitorAvatars[0];
            const isLiked = likedReviews[rev.id];

            return (
              <div
                key={rev.id}
                className="bg-white border border-stone-200/80 rounded-2xl p-3.5 space-y-2 hover:border-stone-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {rev.avatarType === 'custom' && rev.avatarUrl ? (
                      <img
                        src={rev.avatarUrl}
                        alt={rev.userName}
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${visitorAvatar.bgColor}`}
                      >
                        {visitorAvatar.initial}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                        <span>{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                            {t.verifiedPurchaseBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">{rev.date}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <p
                  className={`text-xs text-stone-700 leading-relaxed ${
                    dir === 'rtl' ? 'text-right' : 'text-left'
                  }`}
                >
                  {rev.comment}
                </p>

                {/* Helpful button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(rev.id)}
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      isLiked ? 'text-teal-700 font-bold bg-teal-50' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <ThumbsUp className="w-2.5 h-2.5" />
                    <span>{t.helpfulBtn} ({rev.likesCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
