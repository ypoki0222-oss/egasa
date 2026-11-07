import React, { useState } from 'react';
import { StoreSettings, Product } from '../../types';
import { Save, Store, Megaphone, MessageCircle, Truck, Sparkles, Check, Eye, EyeOff, Layers, Plus, X, RotateCcw, Download, Play, Clock, Globe, Coins, FileText, MapPin, Languages, Image as ImageIcon } from 'lucide-react';
import { ALL_CURRENCIES } from '../../utils/currencies';
import { CITY_PRESETS, DEFAULT_MOROCCAN_CITIES } from '../../utils/cities';

interface StoreSettingsTabProps {
  settings: StoreSettings;
  products?: Product[];
  onSave: (settings: StoreSettings) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'أطقم وسورفيتات',
  'قفاطن وجلابات',
  'عبايات خليجية',
  'فساتين سهرة',
  'بيجامات وملابس بيت',
  'أحذية وحقائب',
];

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({ settings, products = [], onSave }) => {
  const [localSettings, setLocalSettings] = useState<StoreSettings>({
    ...settings,
    enableCategoriesUnderSearch: settings.enableCategoriesUnderSearch !== false,
    searchCategories: settings.searchCategories || DEFAULT_CATEGORIES,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [bannerActiveLangTab, setBannerActiveLangTab] = useState<'ar' | 'fr' | 'en'>('ar');
  const [announcementActiveLangTab, setAnnouncementActiveLangTab] = useState<'ar' | 'fr' | 'en'>('ar');

  const handleChange = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const current = localSettings.searchCategories || DEFAULT_CATEGORIES;
    if (current.includes(trimmed)) {
      setNewCategoryName('');
      return;
    }
    const updated = [...current, trimmed];
    handleChange('searchCategories', updated);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    const current = localSettings.searchCategories || DEFAULT_CATEGORIES;
    const updated = current.filter((c) => c !== catToRemove);
    handleChange('searchCategories', updated);
  };

  const handleImportCategoriesFromProducts = () => {
    const current = new Set(localSettings.searchCategories || DEFAULT_CATEGORIES);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        current.add(p.category.trim());
      }
    });
    handleChange('searchCategories', Array.from(current));
  };

  const handleResetCategories = () => {
    handleChange('searchCategories', [...DEFAULT_CATEGORIES]);
  };

  const handleAnnouncementChange = (field: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        [field]: value,
      },
    }));
  };

  const handleWhatsAppChange = (field: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      whatsapp: {
        ...prev.whatsapp,
        [field]: value,
      },
    }));
  };

  const handleHomeBannerChange = (field: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      homeBanner: {
        ...prev.homeBanner,
        [field]: value,
      },
    }));
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleHomeBannerChange('imageUrl', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageForLanguageUpload = (
    lang: 'ar' | 'fr' | 'en',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const val = reader.result;
          setLocalSettings((prev) => ({
            ...prev,
            homeBanner: {
              ...prev.homeBanner,
              ...(lang === 'ar' ? { imageUrl: val } : {}),
              imagesByLanguage: {
                ...(prev.homeBanner?.imagesByLanguage || {}),
                [lang]: val,
              },
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageUrlChange = (lang: 'ar' | 'fr' | 'en', url: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      homeBanner: {
        ...prev.homeBanner,
        ...(lang === 'ar' ? { imageUrl: url } : {}),
        imagesByLanguage: {
          ...(prev.homeBanner?.imagesByLanguage || {}),
          [lang]: url,
        },
      },
    }));
  };

  const handleRemoveBannerImageForLanguage = (lang: 'ar' | 'fr' | 'en') => {
    setLocalSettings((prev) => ({
      ...prev,
      homeBanner: {
        ...prev.homeBanner,
        ...(lang === 'ar' ? { imageUrl: '' } : {}),
        imagesByLanguage: {
          ...(prev.homeBanner?.imagesByLanguage || {}),
          [lang]: '',
        },
      },
    }));
  };

  const handleBannerTextForLanguageChange = (
    field: 'titlesByLanguage' | 'subtitlesByLanguage' | 'discountsByLanguage' | 'ctaTextsByLanguage',
    lang: 'ar' | 'fr' | 'en',
    val: string
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      homeBanner: {
        ...prev.homeBanner,
        ...(lang === 'ar' && field === 'titlesByLanguage' ? { title: val } : {}),
        ...(lang === 'ar' && field === 'discountsByLanguage' ? { discountText: val } : {}),
        ...(lang === 'ar' && field === 'ctaTextsByLanguage' ? { ctaText: val } : {}),
        ...(lang === 'ar' && field === 'subtitlesByLanguage' ? { subtitle: val } : {}),
        [field]: {
          ...(prev.homeBanner?.[field] || {}),
          [lang]: val,
        },
      },
    }));
  };

  const handleBannerOverlayToggle = (
    field: 'overlayTextByLanguage' | 'overlayButtonByLanguage',
    lang: 'ar' | 'fr' | 'en',
    enabled: boolean
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      homeBanner: {
        ...prev.homeBanner,
        [field]: {
          ...(prev.homeBanner?.[field] || {}),
          [lang]: enabled,
        },
      },
    }));
  };

  const handleAnnouncementLangToggle = (lang: 'ar' | 'fr' | 'en', enabled: boolean) => {
    setLocalSettings((prev) => {
      const currentList: string[] = prev.announcement?.enabledLanguages || ['ar', 'fr', 'en'];
      const updatedList = enabled
        ? Array.from(new Set([...currentList, lang]))
        : currentList.filter((x) => x !== lang);

      return {
        ...prev,
        announcement: {
          ...prev.announcement,
          enabledLanguages: updatedList as ('ar' | 'fr' | 'en')[],
          enabledByLanguage: {
            ...(prev.announcement?.enabledByLanguage || {}),
            [lang]: enabled,
          },
        },
      };
    });
  };

  const handleAnnouncementTextForLanguage = (
    field: 'textsByLanguage' | 'badgeTextsByLanguage' | 'linkTextsByLanguage',
    lang: 'ar' | 'fr' | 'en',
    val: string
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        ...(lang === 'ar' && field === 'textsByLanguage' ? { text: val } : {}),
        ...(lang === 'ar' && field === 'badgeTextsByLanguage' ? { badgeText: val } : {}),
        ...(lang === 'ar' && field === 'linkTextsByLanguage' ? { linkText: val } : {}),
        [field]: {
          ...(prev.announcement?.[field] || {}),
          [lang]: val,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    setSaveError('');
    try {
      await onSave(localSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setSaveError('تعذر حفظ التعديلات على الخادم. تحقق من الاتصال وحاول مجددًا.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-right max-w-4xl">
      {saveError && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{saveError}</p>}
      {/* Top action confirmation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="text-sm font-bold text-stone-900">تخصيص الهوية والشريط العلوي والواتساب</h3>
          <p className="text-xs text-stone-500">عدل إعدادات المتجر والعروض الترويجية وستظهر فوراً في الواجهة</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'جاري الحفظ…' : isSaved ? 'تم حفظ التعديلات!' : 'حفظ الإعدادات'}</span>
        </button>
      </div>

      {/* 1. General Brand & Currency */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
          <Store className="w-4 h-4 text-stone-700" />
          <span>اسم المتجر والعملة والشحن</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">اسم المتجر *</label>
            <input
              type="text"
              required
              value={localSettings.storeName}
              onChange={(e) => handleChange('storeName', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">شعار / وصف المتجر</label>
            <input
              type="text"
              value={localSettings.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>عملة المتجر الأساسية</span>
              </span>
              <span className="text-[10px] text-stone-500 font-normal">تطبق تلقائياً على كل المنتجات</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={ALL_CURRENCIES.some(c => c.symbol === localSettings.currency || c.code === localSettings.currency) ? localSettings.currency : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    handleChange('currency', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold bg-white text-stone-800"
              >
                <optgroup label="العملات الشائعة والافتراضية">
                  <option value="د.م">درهم مغربي (د.م - MAD)</option>
                  <option value="د.ج">دينار جزائري (د.ج - DZD)</option>
                  <option value="د.ت">دينار تونسي (د.ت - TND)</option>
                  <option value="ج.م">جنيه مصري (ج.م - EGP)</option>
                  <option value="ر.س">ريال سعودي (ر.س - SAR)</option>
                  <option value="د.إ">درهم إماراتي (د.إ - AED)</option>
                  <option value="$">دولار أمريكي ($ - USD)</option>
                  <option value="€">يورو (€ - EUR)</option>
                </optgroup>
                <optgroup label="كافة العملات العربية والعالمية">
                  {ALL_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.symbol}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <option value="__custom__">عملة مخصصة أخرى...</option>
              </select>
              <input
                type="text"
                placeholder="أو اكتب رمز العملة يدوياً هنا..."
                value={localSettings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-stone-900 text-right bg-stone-50/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">حد الشحن المجاني</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={localSettings.freeShippingThreshold}
                onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-stone-900 text-right"
              />
              <span className="text-xs text-stone-500 font-mono shrink-0">{localSettings.currency}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">سعر الشحن الافتراضي</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={localSettings.standardShippingCost}
                onChange={(e) => handleChange('standardShippingCost', Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-stone-900 text-right"
              />
              <span className="text-xs text-stone-500 font-mono shrink-0">{localSettings.currency}</span>
            </div>
          </div>

          {/* Store Market Language */}
          <div className="sm:col-span-2 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
            <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>لغة وسوق المتجر الأساسي (Store Language & Market)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleChange('language', 'ar')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  (!localSettings.language || localSettings.language === 'ar')
                    ? 'border-blue-600 bg-white text-blue-900 shadow-xs ring-2 ring-blue-500/30'
                    : 'border-stone-200 bg-white/70 text-stone-700 hover:bg-white'
                }`}
              >
                <span>العربية (المغرب / الشرق الأوسط)</span>
                <span className="text-[10px] text-stone-500 font-normal">RTL • اتجاه من اليمين لليسار</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('language', 'fr')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  localSettings.language === 'fr'
                    ? 'border-blue-600 bg-white text-blue-900 shadow-xs ring-2 ring-blue-500/30'
                    : 'border-stone-200 bg-white/70 text-stone-700 hover:bg-white'
                }`}
              >
                <span>Français (Marché Français)</span>
                <span className="text-[10px] text-stone-500 font-normal">LTR • De gauche à droite</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('language', 'en')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  localSettings.language === 'en'
                    ? 'border-blue-600 bg-white text-blue-900 shadow-xs ring-2 ring-blue-500/30'
                    : 'border-stone-200 bg-white/70 text-stone-700 hover:bg-white'
                }`}
              >
                <span>English (Global Market)</span>
                <span className="text-[10px] text-stone-500 font-normal">LTR • Left-to-Right layout</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-600 mt-2">
              عند اختيار أي لغة، يتم تحديث واجهة المتجر بالكامل، اتجاهات الصفحة وعناصرها، وتصفية المنتجات حسب لغة السوق المحددة.
            </p>
          </div>
        </div>
      </div>

      {/* 1.5. Custom Checkout Form Placeholders (تخصيص الخانات التوضيحية للاستمارة) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-700" />
            <span>نصوص الخانات التوضيحية للاستمارة (Placeholders) للمتجر كامل</span>
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            حدد النص التوضيحي الذي يظهر داخل حقول استمارة الطلب السريع. إذا تركت أي حقل فارغاً يتم استخدام النص الافتراضي للغة. كما يمكنك تخصيص نصوص مختلفة لكل منتج على حدة من نافذة تعديل المنتج.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">خانة الاسم واللقب</label>
            <input
              type="text"
              placeholder="مثال: الاسم الكامل (محمد أو سارة...)"
              value={localSettings.formPlaceholders?.customerName || ''}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  formPlaceholders: { ...prev.formPlaceholders, customerName: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">خانة رقم الهاتف</label>
            <input
              type="text"
              placeholder="مثال: رقم هاتفك لتأكيد الطلب واستلامه..."
              value={localSettings.formPlaceholders?.phone || ''}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  formPlaceholders: { ...prev.formPlaceholders, phone: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">خانة المدينة / الإقليم</label>
            <input
              type="text"
              placeholder="مثال: مدينتك (الدار البيضاء، الرباط، طنجة...)"
              value={localSettings.formPlaceholders?.city || ''}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  formPlaceholders: { ...prev.formPlaceholders, city: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">خانة العنوان بالتفصيل</label>
            <input
              type="text"
              placeholder="مثال: الحي، اسم الشارع، رقم المنزل أو أي علامة مميزة..."
              value={localSettings.formPlaceholders?.address || ''}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  formPlaceholders: { ...prev.formPlaceholders, address: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>
        </div>
      </div>

      {/* 1.6. City Options & Selection Settings (خيارات وقائمة المدن في الاستمارة) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>خيارات وقائمة المدن في استمارة الطلب (City Selection Settings)</span>
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              تحكم في قائمة المدن المقترحة التي تظهر للزبائن في الاستمارة أو قم بإلغائها بالكامل لجعل خانة المدينة حقل كتابة حر (مناسب عند العمل على أسواق أجنبية أو خارج المغرب).
            </p>
          </div>

          {/* Enable / Disable Switch */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-bold text-stone-800">
              {localSettings.cities?.enabled !== false ? 'قائمة المدن مفعّلة' : 'حقل كتابة حر (ملغاة)'}
            </span>
            <input
              type="checkbox"
              checked={localSettings.cities?.enabled !== false}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  cities: {
                    ...(prev.cities || { preset: 'morocco', customCities: DEFAULT_MOROCCAN_CITIES }),
                    enabled: e.target.checked,
                  },
                }))
              }
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600 cursor-pointer"
            />
          </label>
        </div>

        {localSettings.cities?.enabled !== false ? (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  اختيار قائمة مدن جاهزة لدولة معينة (Preset):
                </label>
                <select
                  value={localSettings.cities?.preset || 'morocco'}
                  onChange={(e) => {
                    const presetKey = e.target.value;
                    const presetData = CITY_PRESETS[presetKey];
                    setLocalSettings((prev) => ({
                      ...prev,
                      cities: {
                        ...(prev.cities || { enabled: true }),
                        preset: presetKey as any,
                        customCities: presetData ? [...presetData.cities] : prev.cities?.customCities || DEFAULT_MOROCCAN_CITIES,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800 font-medium"
                >
                  <option value="morocco">🇲🇦 المغرب (المملكة المغربية)</option>
                  <option value="saudi">🇸🇦 المملكة العربية السعودية</option>
                  <option value="uae">🇦🇪 الإمارات العربية المتحدة</option>
                  <option value="algeria">🇩🇿 الجزائر</option>
                  <option value="tunisia">🇹🇳 تونس</option>
                  <option value="egypt">🇪🇬 مصر</option>
                  <option value="france">🇫🇷 فرنسا (France)</option>
                  <option value="custom">✏️ قائمة مدن مخصصة يدوياً...</option>
                </select>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  يمكنك تعديل أي مدينة أو إضافة مدن إضافية في الخانة المجاورة.
                </span>
              </div>

              {/* Current Cities Count & Quick Reset */}
              <div className="flex flex-col justify-between">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  معاينة عدد المدن:
                </label>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between text-xs text-stone-700">
                  <span>
                    عدد المدن المسجلة حالياً:{' '}
                    <strong className="text-emerald-700 font-mono">
                      {(localSettings.cities?.customCities || DEFAULT_MOROCCAN_CITIES).length}
                    </strong>{' '}
                    مدينة
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings((prev) => ({
                        ...prev,
                        cities: {
                          enabled: true,
                          preset: 'morocco',
                          customCities: [...DEFAULT_MOROCCAN_CITIES],
                        },
                      }));
                    }}
                    className="text-[11px] text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    استعادة مدن المغرب الافتراضية
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Cities Textarea */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                قائمة المدن (يمكنك كتابة أو مسح أو تعديل أي مدينة، افصل بين المدن بسطر جديد أو فاصلة):
              </label>
              <textarea
                rows={5}
                dir="auto"
                value={(localSettings.cities?.customCities || DEFAULT_MOROCCAN_CITIES).join('\n')}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(/[\n,،]+/)
                    .map((c) => c.trim())
                    .filter(Boolean);
                  setLocalSettings((prev) => ({
                    ...prev,
                    cities: {
                      ...(prev.cities || { enabled: true }),
                      preset: 'custom',
                      customCities: arr,
                    },
                  }));
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 leading-relaxed font-sans"
                placeholder="الدار البيضاء&#10;الرباط&#10;مراكش..."
              />
              <p className="text-[11px] text-stone-500 mt-1">
                * ملاحظة: إذا قمت بتخصيص مدن خاصة بأي منتج في صفحة تعديل المنتج، سيتم اعتماد مدن ذلك المنتج تلقائياً، وإلا ستعتمد كافة المنتجات هذه القائمة العامة.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>تم إلغاء قائمة المدن التلقائية (حقل حر)</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              ستظهر خانة المدينة في استمارة الطلب كخانة كتابة فارغة وعادية يكتب فيها الزبون اسم مدينته بحرية كاملة دون ظهور أي اقتراحات إجبارية لمدن المغرب.
            </p>
          </div>
        )}
      </div>

      {/* 2. Search Bar & Horizontal Swipeable Categories (تصنيفات شريط البحث) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>تصنيفات تحت شريط البحث (Search Bar Categories)</span>
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              أزرار تصنيفات المنتجات التي تظهر تحت شريط البحث مباشرة وتسحب يميناً ويساراً (Swipeable) لتسهيل التصفح
            </p>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0">
            <span className="text-xs font-bold text-stone-800">تفعيل التصنيفات:</span>
            <input
              type="checkbox"
              checked={localSettings.enableCategoriesUnderSearch !== false}
              onChange={(e) => handleChange('enableCategoriesUnderSearch', e.target.checked)}
              className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
            />
          </label>
        </div>

        {/* Categories Manager */}
        {localSettings.enableCategoriesUnderSearch !== false ? (
          <div className="space-y-4">
            {/* Add New Category Input */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                إضافة تصنيف جديد إلى شريط البحث
              </label>
              <div className="flex items-center gap-2 max-w-lg">
                <input
                  type="text"
                  placeholder="مثال: عبايات، قفاطن، فساتين كاجوال..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 text-right"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {/* Existing Categories List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700">
                  التصنيفات المفعلة حالياً ({localSettings.searchCategories?.length || 0}):
                </span>
                <div className="flex items-center gap-2">
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={handleImportCategoriesFromProducts}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      title="استيراد تصنيفات من المنتجات المسجلة في المتجر"
                    >
                      <Download className="w-3 h-3" />
                      <span>استيراد من المنتجات</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>الافتراضية</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-stone-50 border border-stone-200/80 rounded-xl min-h-[50px]">
                {/* Fixed 'الكل' tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 text-stone-800 rounded-lg text-xs font-bold cursor-default select-none">
                  <span>الكل (افتراضي وثابت)</span>
                </div>

                {/* Configured Categories */}
                {(!localSettings.searchCategories || localSettings.searchCategories.length === 0) ? (
                  <p className="text-xs text-stone-400 py-1">لا توجد تصنيفات إضافية حالياً، أضف تصنيفاً من الحقل أعلاه.</p>
                ) : (
                  localSettings.searchCategories.map((cat) => (
                    <div
                      key={cat}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 hover:border-teal-600 rounded-lg text-xs font-semibold text-stone-800 transition-colors shadow-2xs"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                        title={`حذف تصنيف "${cat}"`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Visual Preview */}
            <div className="pt-2 border-t border-stone-100">
              <span className="block text-[11px] font-bold text-stone-500 mb-2">
                معاينة حية لشريط البحث والتصنيفات كما يراها الزبون (قابلة للسحب يميناً ويساراً):
              </span>
              <div className="bg-stone-100/70 p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-400 text-right">
                  ابحث من هنا
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  <span className="shrink-0 px-3 py-1 bg-teal-800 text-white rounded-lg text-[11px] font-bold">
                    الكل ({products.length})
                  </span>
                  {(localSettings.searchCategories || DEFAULT_CATEGORIES).map((c, i) => (
                    <span
                      key={i}
                      className="shrink-0 px-3 py-1 bg-white border border-stone-200 text-stone-700 rounded-lg text-[11px] font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center">
            <p className="text-xs text-stone-500">تم إلغاء تفعيل التصنيفات. سيظهر شريط البحث فقط بدون تصنيفات تحته في المتجر.</p>
          </div>
        )}
      </div>

      {/* قسم: القالب الافتراضي لصفحات المنتجات (Default Product Page Template) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
          <Layers className="w-4 h-4 text-teal-700" />
          <span>القالب الافتراضي لصفحات المنتجات (Default Product Page Template)</span>
        </h4>
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            قالب عرض صفحة المنتج الافتراضي للمتجر كاملاً:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: 'classic', label: 'كلاسيكي', desc: 'التصميم الحالي (افتراضي)' },
              { key: 'modern', label: 'عصري', desc: 'تصميم حديث وبسيط' },
              { key: 'elegant', label: 'أنيق', desc: 'تصميم فاخر وهادئ' },
            ].map((tpl) => {
              const isSelected = (localSettings.defaultProductTemplate || 'classic') === tpl.key;
              return (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => handleChange('defaultProductTemplate', tpl.key as any)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/80 text-teal-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="text-xs font-bold">{tpl.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 font-normal">{tpl.desc}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-stone-500 mt-1.5">
            يُطبق هذا القالب على كل المنتجات التي لم يُحدد لها قالب خاص في إعداداتها. المنتجات القديمة ستستمر بالعمل بشكل طبيعي مع القالب الكلاسيكي.
          </p>
        </div>
      </div>

      {/* 3. Top Announcement Bar */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-stone-700" />
            <span>شريط العروض والإعلانات في الأعلى (Top Announcement Bar)</span>
          </h4>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-stone-600 font-semibold">تفعيل الشريط:</span>
            <input
              type="checkbox"
              checked={localSettings.announcement.enabled}
              onChange={(e) => handleAnnouncementChange('enabled', e.target.checked)}
              className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-4">
          {/* Multi-language Tabs for Announcement Bar */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-amber-700" />
                <span>التحكم في شريط العروض حسب لغة الموقع (Per-Language Settings)</span>
              </h5>
              <span className="text-[11px] text-amber-800">
                تفعيل أو إلغاء الشريط لكل لغة وتخصيص النص المناسب لها
              </span>
            </div>

            {/* Language Switch Tabs */}
            <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2 overflow-x-auto pt-1">
              {[
                { id: 'ar', label: '🇲🇦 العربية (ar)' },
                { id: 'fr', label: '🇫🇷 Français (fr)' },
                { id: 'en', label: '🇬🇧 English (en)' },
              ].map((tab) => {
                const active = announcementActiveLangTab === tab.id;
                const isEnabledForLang =
                  localSettings.announcement.enabledByLanguage?.[tab.id as 'ar' | 'fr' | 'en'] !== undefined
                    ? Boolean(localSettings.announcement.enabledByLanguage[tab.id as 'ar' | 'fr' | 'en'])
                    : Array.isArray(localSettings.announcement.enabledLanguages) && localSettings.announcement.enabledLanguages.length > 0
                    ? localSettings.announcement.enabledLanguages.includes(tab.id as any)
                    : true;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAnnouncementActiveLangTab(tab.id as 'ar' | 'fr' | 'en')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isEnabledForLang
                          ? active
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                          : active
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isEnabledForLang ? 'مفعّل ✓' : 'ملغى ✕'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Announcement Language Content */}
            {(() => {
              const lang = announcementActiveLangTab;
              const isRtl = lang === 'ar';
              const isLangEnabled =
                localSettings.announcement.enabledByLanguage?.[lang] !== undefined
                  ? Boolean(localSettings.announcement.enabledByLanguage[lang])
                  : Array.isArray(localSettings.announcement.enabledLanguages) && localSettings.announcement.enabledLanguages.length > 0
                  ? localSettings.announcement.enabledLanguages.includes(lang)
                  : true;

              const currentText =
                localSettings.announcement.textsByLanguage?.[lang] !== undefined
                  ? localSettings.announcement.textsByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.announcement.text || '') : '');

              const currentBadge =
                localSettings.announcement.badgeTextsByLanguage?.[lang] !== undefined
                  ? localSettings.announcement.badgeTextsByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.announcement.badgeText || '') : '');

              const currentLink =
                localSettings.announcement.linkTextsByLanguage?.[lang] !== undefined
                  ? localSettings.announcement.linkTextsByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.announcement.linkText || '') : '');

              return (
                <div className="space-y-3 pt-1">
                  {/* Enable toggle for this specific language */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-stone-200">
                    <div>
                      <span className="text-xs font-bold text-stone-800">
                        ظهور شريط العروض باللغة ({lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'})
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {isLangEnabled
                          ? `شريط العروض يظهر حالياً عندما تكون لغة المتجر ${lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}`
                          : `شريط العروض مخفي تماماً عندما تكون لغة المتجر ${lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}`}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-300 shrink-0">
                      <input
                        type="checkbox"
                        checked={isLangEnabled}
                        onChange={(e) => handleAnnouncementLangToggle(lang, e.target.checked)}
                        className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-stone-800">
                        {isLangEnabled ? 'مفعّل في هذه اللغة' : 'ملغى في هذه اللغة'}
                      </span>
                    </label>
                  </div>

                  {/* Text fields for this language */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      نص الإعلان أو العرض باللغة {lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'} *
                    </label>
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => handleAnnouncementTextForLanguage('textsByLanguage', lang, e.target.value)}
                      className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${isRtl ? 'text-right' : 'text-left'}`}
                      placeholder={
                        lang === 'fr'
                          ? 'Ex: Livraison gratuite + Réduction de 20% pour une durée limitée !'
                          : lang === 'en'
                          ? 'Ex: Free delivery + 20% off for a limited time!'
                          : 'مثال: خصم 20% لكافة الطلبات + شحن مجاني لفترة محدودة!'
                      }
                      dir={isRtl ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        شارة العرض (Badge) ({lang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={currentBadge}
                        onChange={(e) => handleAnnouncementTextForLanguage('badgeTextsByLanguage', lang, e.target.value)}
                        className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs ${isRtl ? 'text-right' : 'text-left'}`}
                        placeholder={lang === 'fr' ? 'Offre Spéciale' : lang === 'en' ? 'Special Offer' : 'عرض الموسم'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        نص الرابط (Call to Action) ({lang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={currentLink}
                        onChange={(e) => handleAnnouncementTextForLanguage('linkTextsByLanguage', lang, e.target.value)}
                        className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs ${isRtl ? 'text-right' : 'text-left'}`}
                        placeholder={lang === 'fr' ? 'Voir les offres' : lang === 'en' ? 'Shop Deals' : 'تسوق الآن'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-stone-800 mb-1">عداد تنازلي (ساعة)</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localSettings.announcement.showCountdown}
                onChange={(e) => handleAnnouncementChange('showCountdown', e.target.checked)}
                className="w-4 h-4 cursor-pointer"
                id="countdown-check"
              />
              <label htmlFor="countdown-check" className="text-xs text-stone-700 cursor-pointer">
                تفعيل العداد التنازلي في شريط العروض
              </label>
            </div>
          </div>

          {/* Movement & Ticker Settings (حركة وتمرير شريط العروض) */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
              <div>
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5 cursor-pointer">
                  <Play className="w-3.5 h-3.5 text-teal-700 fill-teal-700" />
                  <span>تحريك شريط العروض تلقائياً (شريط إعلاني متحرك / Marquee)</span>
                </label>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  جعل نص العرض والتخفيضات يمر ويتحرك بشكل سلس ومستمر لشد انتباه الزبون وزيادة المبيعات
                </p>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-white border border-stone-300 px-3 py-1.5 rounded-lg hover:border-teal-600 transition-colors shrink-0">
                <input
                  type="checkbox"
                  checked={localSettings.announcement.isMoving !== false}
                  onChange={(e) => handleAnnouncementChange('isMoving', e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-800">
                  {localSettings.announcement.isMoving !== false ? 'متحرك ومستمر' : 'ثابت بدون حركة'}
                </span>
              </label>
            </div>

            {localSettings.announcement.isMoving !== false && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Speed Controls */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    سرعة حركة وتمرير الشريط:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'slow', label: 'بطيء', desc: 'هادئ ومريح' },
                      { key: 'normal', label: 'متوسط', desc: 'موصى به' },
                      { key: 'fast', label: 'سريع', desc: 'عروض خاطفة' },
                    ].map((s) => {
                      const isSelected = (localSettings.announcement.tickerSpeed || 'normal') === s.key;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => handleAnnouncementChange('tickerSpeed', s.key as any)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{s.label}</div>
                          <div className="text-[10px] opacity-75">{s.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pause on hover */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    خيارات تفاعل الزائر:
                  </label>
                  <label className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-stone-200 cursor-pointer hover:border-stone-300">
                    <input
                      type="checkbox"
                      checked={localSettings.announcement.pauseOnHover !== false}
                      onChange={(e) => handleAnnouncementChange('pauseOnHover', e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-800">إيقاف الحركة عند تمرير الماوس</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        يتوقف الشريط مؤقتاً عند وضع الماوس فوقه ليتمكن الزائر من القراءة أو الضغط على الرابط بسهولة
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* حجم شريط الإعلانات (Small / Medium / Large) — medium = المظهر الحالي بالضبط */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 space-y-2">
            <div>
              <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <span>حجم شريط الإعلانات (Announcement Bar Size):</span>
              </label>
              <p className="text-[11px] text-stone-500 mt-0.5">متوسط = المظهر الحالي بالضبط (بدون أي تغيير)</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'small', label: 'صغير', desc: 'أصغر وأنحف' },
                { key: 'medium', label: 'متوسط', desc: 'المظهر الحالي' },
                { key: 'large', label: 'كبير', desc: 'أكبر وأكثر بروزاً' },
              ].map((sz) => {
                const isSelected = (localSettings.announcement.size || 'medium') === sz.key;
                return (
                  <button
                    key={sz.key}
                    type="button"
                    onClick={() => handleAnnouncementChange('size', sz.key as any)}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{sz.label}</div>
                    <div className="text-[10px] opacity-75">{sz.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">لون خلفية الشريط</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.announcement.bgColor}
                  onChange={(e) => handleAnnouncementChange('bgColor', e.target.value)}
                  className="w-9 h-8 rounded border border-stone-300 p-0 cursor-pointer"
                />
                <span className="font-mono text-xs text-stone-600">{localSettings.announcement.bgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">لون الخط</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.announcement.textColor}
                  onChange={(e) => handleAnnouncementChange('textColor', e.target.value)}
                  className="w-9 h-8 rounded border border-stone-300 p-0 cursor-pointer"
                />
                <span className="font-mono text-xs text-stone-600">{localSettings.announcement.textColor}</span>
              </div>
            </div>
          </div>

          {/* Live Preview in Admin */}
          <div className="pt-2 border-t border-stone-100">
            <span className="block text-[11px] font-bold text-stone-500 mb-2">
              معاينة حية لشريط العروض كما سيظهر للزبون في أعلى المتجر:
            </span>
            <div
              className="rounded-xl overflow-hidden py-2.5 px-4 text-xs font-medium relative border border-black/10 shadow-inner"
              style={{
                backgroundColor: localSettings.announcement.bgColor,
                color: localSettings.announcement.textColor,
              }}
            >
              {localSettings.announcement.isMoving !== false ? (
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`animate-ticker-continuous flex shrink-0 items-center ${
                      localSettings.announcement.pauseOnHover !== false ? 'pause-hover' : ''
                    }`}
                    style={{
                      ['--ticker-duration' as string]:
                        localSettings.announcement.tickerSpeed === 'fast'
                          ? '14s'
                          : localSettings.announcement.tickerSpeed === 'slow'
                          ? '38s'
                          : '24s',
                    }}
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="inline-flex items-center gap-3 px-3 shrink-0">
                        {localSettings.announcement.badgeText && (
                          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                            {localSettings.announcement.badgeText}
                          </span>
                        )}
                        <span className="whitespace-nowrap font-semibold">
                          {localSettings.announcement.text || 'نص العرض الترويجي'}
                        </span>
                        {localSettings.announcement.showCountdown && (
                          <span className="inline-flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            14:42:18
                          </span>
                        )}
                        {localSettings.announcement.linkText && (
                          <span className="underline underline-offset-2 font-bold text-[11px] bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                            {localSettings.announcement.linkText}
                          </span>
                        )}
                        <span className="opacity-40 text-[10px] mx-1">✦</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-center flex-wrap">
                  {localSettings.announcement.badgeText && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      {localSettings.announcement.badgeText}
                    </span>
                  )}
                  <span className="font-semibold">
                    {localSettings.announcement.text || 'نص العرض الترويجي'}
                  </span>
                  {localSettings.announcement.showCountdown && (
                    <span className="inline-flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      <Clock className="w-2.5 h-2.5" />
                      14:42:18
                    </span>
                  )}
                  {localSettings.announcement.linkText && (
                    <span className="underline underline-offset-2 font-bold text-[11px] bg-white/10 px-1.5 py-0.5 rounded">
                      {localSettings.announcement.linkText}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Home Hero Banner Settings */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>البانر الترويجي في الصفحة الرئيسية (Home Hero Banner)</span>
          </h4>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-stone-600 font-semibold">تفعيل البانر:</span>
            <input
              type="checkbox"
              checked={localSettings.homeBanner?.enabled ?? true}
              onChange={(e) => handleHomeBannerChange('enabled', e.target.checked)}
              className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-5">
          {/* Global Layout & Style Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Banner Full-Width & Edge-to-Edge Control */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/80">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-900 block">
                  ملء الشاشة من الجانبين بالكامل (Full-Width بدون بياض جانبي)
                </span>
                <span className="text-[11px] text-stone-500 block leading-relaxed">
                  عند التفعيل يمتد البانر لملء عرض الشاشة كاملاً في الهاتف والكمبيوتر بدون أي هوامش بيضاء على الجانبين، تماماً كالمتاجر العالمية.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(localSettings.homeBanner?.fullWidth)}
                  onChange={(e) => handleHomeBannerChange('fullWidth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
              </label>
            </div>

            {/* Banner Border Radius (Shape) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                شكل وتدوير حواف البانر (Border Radius)
              </label>
              <select
                value={localSettings.homeBanner?.borderRadius || (localSettings.homeBanner?.fullWidth ? 'none' : '2xl')}
                onChange={(e) => handleHomeBannerChange('borderRadius', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
              >
                <option value="none">حواف مستقيمة حادة (0px - بدون تدوير / ملء تام)</option>
                <option value="sm">تدوير خفيف جداً (4px)</option>
                <option value="md">تدوير متوسط (8px)</option>
                <option value="lg">تدوير بارز (12px)</option>
                <option value="2xl">تدوير كبير ناعم (24px - الافتراضي)</option>
                <option value="3xl">تدوير فائق النعومة (32px)</option>
              </select>
              <p className="text-[10px] text-stone-500 mt-1">
                اختر "حواف مستقيمة حادة (0px)" مع تفعيل ملء الشاشة للحصول على مظهر متصل بالكامل بدون أي زوايا منحنية.
              </p>
            </div>

            {/* Fallback Gradient */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                لون التدرج الاحتياطي (عند عدم توفر صورة)
              </label>
              <select
                value={localSettings.homeBanner?.bgGradient || 'from-[#FF5E62] via-[#FF6A5B] to-[#FFA07A]'}
                onChange={(e) => handleHomeBannerChange('bgGradient', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
              >
                <option value="from-[#FF5E62] via-[#FF6A5B] to-[#FFA07A]">وردي مرجاني مشرق</option>
                <option value="from-[#0f766e] via-[#115e59] to-[#134e4a]">تيل زمردي أنيق</option>
                <option value="from-[#881337] via-[#9f1239] to-[#be123c]">عنابي ملكي فخم</option>
                <option value="from-[#18181b] via-[#27272a] to-[#3f3f46]">أسود مودرن راقٍ</option>
                <option value="from-[#1e3a8a] via-[#1d4ed8] to-[#3b82f6]">أزرق ملكي عصري</option>
              </select>
            </div>

            {/* Banner Language Targeting */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                سوق ولغة ظهور البانر (Market & Language Visibility)
              </label>
              <select
                value={localSettings.homeBanner?.languageTarget || 'all'}
                onChange={(e) => handleHomeBannerChange('languageTarget', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
              >
                <option value="all">الظهور في جميع اللغات والأسواق (العربية + الفرنسية + الإنجليزية)</option>
                <option value="ar">الظهور فقط في السوق العربي (العربية)</option>
                <option value="fr">الظهور فقط في السوق الفرنسي (Français)</option>
                <option value="en">الظهور فقط في السوق الإنجليزي (English)</option>
              </select>
            </div>

            {/* Multi-language checkboxes */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                اللغات المتاح فيها البانر:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ar', label: 'العربية' },
                  { id: 'fr', label: 'الفرنسية' },
                  { id: 'en', label: 'الإنجليزية' },
                ].map((l) => {
                  const currentList: string[] = localSettings.homeBanner?.enabledLanguages || ['ar', 'fr', 'en'];
                  const isChecked = currentList.includes(l.id);
                  return (
                    <label key={l.id} className="flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let updated: ('ar' | 'fr' | 'en')[];
                          if (e.target.checked) {
                            updated = Array.from(new Set([...currentList, l.id])) as ('ar' | 'fr' | 'en')[];
                          } else {
                            updated = currentList.filter((x) => x !== l.id) as ('ar' | 'fr' | 'en')[];
                          }
                          handleHomeBannerChange('enabledLanguages', updated);
                        }}
                        className="w-3.5 h-3.5 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                      />
                      <span>{l.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dedicated Multi-Market Per-Language Banner Section */}
          <div className="pt-4 border-t border-stone-200 space-y-4">
            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl">
              <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-amber-700" />
                <span>تحديد صورة ونصوص مخصصة لكل لغة وسوق (Multi-Market Per-Language)</span>
              </h5>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                حدد صورة مختلفة لكل لغة: زائر السوق الفرنسي يجد صورة البانر الفرنسية، وزائر السوق العربي يجد صورة البانر العربية، وزائر السوق الإنجليزي يجد الصورة المخصصة للإنجليزية.
              </p>
            </div>

            {/* Language Switch Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5 overflow-x-auto">
              {[
                { id: 'ar', label: '🇲🇦 السوق العربي (العربية)', langTitle: 'العربية' },
                { id: 'fr', label: '🇫🇷 Marché Français (Français)', langTitle: 'الفرنسية' },
                { id: 'en', label: '🇬🇧 English Market (English)', langTitle: 'الإنجليزية' },
              ].map((tab) => {
                const active = bannerActiveLangTab === tab.id;
                const imgForTab =
                  tab.id === 'ar'
                    ? (localSettings.homeBanner?.imagesByLanguage?.ar || localSettings.homeBanner?.imageUrl)
                    : localSettings.homeBanner?.imagesByLanguage?.[tab.id as 'fr' | 'en'];
                const hasImage = Boolean(imgForTab);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBannerActiveLangTab(tab.id as 'ar' | 'fr' | 'en')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {hasImage ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        ✓ صورة محددة
                      </span>
                    ) : (
                      <span className={`text-[10px] ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                        (بدون صورة)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Language Tab Content */}
            {(() => {
              const lang = bannerActiveLangTab;
              const isRtl = lang === 'ar';
              const currentImg =
                lang === 'ar'
                  ? (localSettings.homeBanner?.imagesByLanguage?.ar || localSettings.homeBanner?.imageUrl || '')
                  : (localSettings.homeBanner?.imagesByLanguage?.[lang] || '');

              const currentTitle =
                localSettings.homeBanner?.titlesByLanguage?.[lang] !== undefined
                  ? localSettings.homeBanner.titlesByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.homeBanner?.title || '') : '');

              const currentDiscount =
                localSettings.homeBanner?.discountsByLanguage?.[lang] !== undefined
                  ? localSettings.homeBanner.discountsByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.homeBanner?.discountText || '') : '');

              const currentCta =
                localSettings.homeBanner?.ctaTextsByLanguage?.[lang] !== undefined
                  ? localSettings.homeBanner.ctaTextsByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.homeBanner?.ctaText || '') : '');

              const currentSubtitle =
                localSettings.homeBanner?.subtitlesByLanguage?.[lang] !== undefined
                  ? localSettings.homeBanner.subtitlesByLanguage[lang]
                  : (lang === 'ar' ? (localSettings.homeBanner?.subtitle || '') : '');

              return (
                <div className="space-y-4 bg-stone-50/60 p-4 rounded-xl border border-stone-200/80">
                  {/* Image Upload Area for This Specific Language */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-stone-900">
                        صورة البانر لسوق ({lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}) *
                      </label>
                      <span className="text-[11px] text-stone-500">
                        تظهر تلقائياً عندما يتصفح العميل المتجر باللغة {lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                        <ImageIcon className="w-4 h-4 text-white" />
                        <span>📁 رفع صورة {lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBannerImageForLanguageUpload(lang, e)}
                          className="hidden"
                        />
                      </label>

                      <span className="text-xs text-stone-400">أو رابط:</span>

                      <input
                        type="url"
                        placeholder={`https://example.com/banner_${lang}.jpg`}
                        value={currentImg}
                        onChange={(e) => handleBannerImageUrlChange(lang, e.target.value)}
                        className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 text-left font-mono"
                        dir="ltr"
                      />

                      {currentImg && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBannerImageForLanguage(lang)}
                          className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          إزالة الصورة
                        </button>
                      )}
                    </div>

                    {/* Preview with Active Border Radius */}
                    {currentImg ? (
                      <div className={`relative mt-2 overflow-hidden border border-stone-200 aspect-[21/9] max-h-48 bg-stone-100 ${
                        localSettings.homeBanner?.borderRadius === 'none' ? 'rounded-none' : 'rounded-xl'
                      }`}>
                        <img
                          src={currentImg}
                          alt={`معاينة بانر ${lang}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded">
                          صورة البانر لسوق ({lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : 'English'})
                        </span>
                      </div>
                    ) : (
                      <div className="py-4 px-3 border border-dashed border-stone-300 rounded-xl bg-white text-center">
                        <p className="text-xs text-stone-500">
                          لم يتم تحديد صورة مخصصة لهذا السوق بعد. عند زيارة العميل باللغة ({lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}) سيتم عرض خلفية التدرج اللوني.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Overlay Controls for this language (Text & Button Toggles) */}
                  {(() => {
                    const isOverlayTextActive =
                      localSettings.homeBanner?.overlayTextByLanguage?.[lang] !== undefined
                        ? Boolean(localSettings.homeBanner.overlayTextByLanguage[lang])
                        : true;

                    const isOverlayButtonActive =
                      localSettings.homeBanner?.overlayButtonByLanguage?.[lang] !== undefined
                        ? Boolean(localSettings.homeBanner.overlayButtonByLanguage[lang])
                        : true;

                    return (
                      <div className="space-y-2 pt-2 border-t border-stone-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-stone-200">
                          <div>
                            <span className="text-xs font-bold text-stone-800">
                              إظهار النصوص فوق البانر لسوق ({lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'})
                            </span>
                            <p className="text-[11px] text-stone-500">
                              {isOverlayTextActive
                                ? 'العنوان والخصم يظهران حالياً فوق صورة البانر'
                                : 'تم إلغاء النصوص التلقائية تماماً (ستظهر صورتك نظيفة بدون أي كتابة فوقها)'}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-300 shrink-0">
                            <input
                              type="checkbox"
                              checked={isOverlayTextActive}
                              onChange={(e) => handleBannerOverlayToggle('overlayTextByLanguage', lang, e.target.checked)}
                              className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-stone-800">
                              {isOverlayTextActive ? 'النصوص مفعّلة' : 'النصوص ملغاة'}
                            </span>
                          </label>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-stone-200">
                          <div>
                            <span className="text-xs font-bold text-stone-800">
                              إظهار زر الإجراء (CTA) فوق البانر لسوق ({lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'})
                            </span>
                            <p className="text-[11px] text-stone-500">
                              {isOverlayButtonActive
                                ? 'زر الشراء/التصفح يظهر فوق البانر'
                                : 'تم إلغاء الزر (يمكن للزبون الضغط مباشرة على صورة البانر)'}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-300 shrink-0">
                            <input
                              type="checkbox"
                              checked={isOverlayButtonActive}
                              onChange={(e) => handleBannerOverlayToggle('overlayButtonByLanguage', lang, e.target.checked)}
                              className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-stone-800">
                              {isOverlayButtonActive ? 'الزر مفعّل' : 'الزر ملغى'}
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Texts for this language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-200">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        عنوان البانر الرئيسي ({lang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => handleBannerTextForLanguageChange('titlesByLanguage', lang, e.target.value)}
                        className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${isRtl ? 'text-right' : 'text-left'}`}
                        placeholder={lang === 'fr' ? 'Ex: Grande Vente de Saison' : lang === 'en' ? 'Ex: Grand Season Sale' : 'مثال: تخفيضات الموسم الكبرى'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        نص الخصم البارز ({lang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={currentDiscount}
                        onChange={(e) => handleBannerTextForLanguageChange('discountsByLanguage', lang, e.target.value)}
                        className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${isRtl ? 'text-right' : 'text-left'}`}
                        placeholder={lang === 'fr' ? 'Ex: Jusqu’à -50%' : lang === 'en' ? 'Ex: Up to 50% Off' : 'مثال: خصم يصل إلى 50%'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        نص زر الإجراء ({lang.toUpperCase()} CTA)
                      </label>
                      <input
                        type="text"
                        value={currentCta}
                        onChange={(e) => handleBannerTextForLanguageChange('ctaTextsByLanguage', lang, e.target.value)}
                        className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${isRtl ? 'text-right' : 'text-left'}`}
                        placeholder={lang === 'fr' ? 'Ex: Acheter maintenant' : lang === 'en' ? 'Ex: Shop Now' : 'مثال: تسوقي الآن'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        نص فرعي توضيحي ({lang.toUpperCase()} - اختياري)
                      </label>
                      <input
                        type="text"
                        value={currentSubtitle}
                        onChange={(e) => handleBannerTextForLanguageChange('subtitlesByLanguage', lang, e.target.value)}
                        className={`w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 ${isRtl ? 'text-right' : 'text-left'}`}
                        placeholder={lang === 'fr' ? 'Ex: Livraison rapide & Paiement à la livraison' : lang === 'en' ? 'Ex: Cash on delivery & fast shipping' : 'مثال: أرقى التصاميم مع توصيل سريع'}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 4. Bundle Offers Global Guide */}
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-2">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-stone-700" />
          <span>عروض الكميات والباقات الإضافية</span>
        </h4>
        <p className="text-xs text-stone-600 leading-relaxed">
          يمكنك تخصيص وتفعيل عروض الشراء (مثل باقة قطعتين) لأي منتج بشكل اختياري عبر تبويب <strong>المنتجات</strong> ثم الضغط على <strong>تعديل</strong>. لا يتم فرض أي شارات فوق المنتجات إلا إذا قمت بتفعيلها بنفسك.
        </p>
      </div>

      {/* 5. WhatsApp Floating Button Settings */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>زر الواتساب العائم في المتجر (WhatsApp Floating Button)</span>
          </h4>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-stone-600 font-semibold">تفعيل زر الواتساب:</span>
            <input
              type="checkbox"
              checked={localSettings.whatsapp.enabled}
              onChange={(e) => handleWhatsAppChange('enabled', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">رقم هاتف الواتساب (مع رمز الدولة) *</label>
              <input
                type="text"
                dir="ltr"
                placeholder="مثال: 966501234567"
                value={localSettings.whatsapp.phoneNumber}
                onChange={(e) => handleWhatsAppChange('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-stone-900 text-left"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                أدخل الرقم بدون علامة + أو أصفار دولية في البداية
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">موضع الزر في الشاشة</label>
              <select
                value={localSettings.whatsapp.position}
                onChange={(e) => handleWhatsAppChange('position', e.target.value as 'left' | 'right')}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800 font-medium"
              >
                <option value="left">أسفل اليسار (موصى به في الواجهة العربية)</option>
                <option value="right">أسفل اليمين</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">رسالة الترحيب الافتراضية</label>
            <textarea
              rows={2}
              value={localSettings.whatsapp.greetingMessage}
              onChange={(e) => handleWhatsAppChange('greetingMessage', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
              placeholder="مرحباً بك! يسعدنا مساعدتك في اختيار مقاسك المناسب أو الإجابة على أي استفسار."
            />
          </div>
        </div>
      </div>

      {/* 6. Admin Security & Password Settings */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-xs">🔐</span>
            <span>حماية لوحة التحكم وكلمة المرور (Admin Password)</span>
          </h4>
          <span className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
            لوحة الإدارة مخفية عن الزوار
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          تم إخفاء لوحة التحكم بالكامل عن زوار المتجر العاديين. للوصول إليها، يمكنك النقر على رابط الإدارة الخفي في أسفل الموقع أو استخدام المعلمة <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">?admin</code> مع إدخال كلمة المرور.
        </p>

        <div className="max-w-md">
          <label className="block text-xs font-bold text-stone-800 mb-1">
            تعيين كلمة مرور جديدة للوحة التحكم *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={localSettings.adminPassword || 'egasa2025'}
              onChange={(e) => handleChange('adminPassword', e.target.value)}
              className="w-full pr-3 pl-10 py-2 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-stone-900 text-right"
              placeholder="أدخل كلمة مرور قوية..."
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-2.5 top-2 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
              title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[10px] text-stone-500 mt-1 block">
            احرص على حفظ كلمة المرور في مكان آمن وعدم مشاركتها مع أي شخص.
          </span>
        </div>
      </div>

      {/* 7. EdgeOne Orders & Static Deployment Settings */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-mono font-bold">EO</span>
            <span>استلام الطلبات ونشر الموقع على EdgeOne</span>
          </h4>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
            Static / Edge Ready
          </span>
        </div>

        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 space-y-2 leading-relaxed">
          <p className="font-bold">كيف يضمن المتجر استلام كافة الطلبات بعد رفعه على EdgeOne؟</p>
          <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px] pr-1">
            <li><strong>تخزين الطلبات محلياً:</strong> كل طلب يقدمه العميل يحفظ فوراً في ذاكرة المتصفح.</li>
            <li><strong>المزامنة التلقائية مع Google Sheets:</strong> عند تفعيل ربط Google Sheets، يتم إرسال بيانات كل طلب فورا إلى جدولك السحابي بدون الحاجة لخادم Node.js.</li>
            <li><strong>تأكيد الواتساب المباشر:</strong> يظهر للعميل زر فوري لإرسال تفاصيل طلبه إلى رقم الواتساب الخاص بك بنقرة واحدة.</li>
          </ul>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(localSettings.autoOpenWhatsAppOnOrder)}
              onChange={(e) => handleChange('autoOpenWhatsAppOnOrder', e.target.checked)}
              className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
            />
            <span className="text-xs font-bold text-stone-800">
              توجيه العميل تلقائياً إلى الواتساب بعد الضغط على "أطلب الان" (موصى به في التجارة الإلكترونية بالمغرب)
            </span>
          </label>
        </div>
      </div>
    </form>
  );
};
