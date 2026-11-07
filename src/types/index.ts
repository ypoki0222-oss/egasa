export type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
export type ProductPageTemplate = 'classic' | 'modern' | 'elegant';
export type AnnouncementBarSize = 'small' | 'medium' | 'large';

export interface ProductOptionColor {
  name: string;
  hex: string;
}

export interface ProductBundleOffer {
  enabled: boolean;
  label: string; // e.g. "عرض قطعتين (توفير خاص + شحن مجاني)"
  price: number; // e.g. 299
  originalPrice?: number; // e.g. 450
  stickerText: string; // e.g. "عرض حبتين"
  tier3Enabled?: boolean;
  tier3Label?: string;
  tier3Price?: number;
  tier3OriginalPrice?: number;
  tier3StickerText?: string;
}

export interface ProductCustomization {
  id: string;
  title: string; // e.g. "كتابة الاسم على القطعة", "إضافة تغليف هدايا", "نوع الملحق الإضافي"
  type: 'text' | 'select' | 'checkbox';
  options?: string[]; // choices for select type
  placeholder?: string;
  required?: boolean;
  enabled: boolean; // إمكانية تفعيله أو إلغائه
}
// تخصيصات تؤثر على السعر (منفصلة عن customizations العادية لتجنب التداخل)
export interface PriceCustomization {
  id: string;
  name: string; // e.g. "قماش ملكي", "إضافة كوفيه"
  priceDelta: number; // مبلغ إضافي بالعملة (>= 0)
  enabled: boolean; // إمكانية تفعيله أو إلغائه
}

export type AppLanguage = 'ar' | 'fr' | 'en';
export type ProductLanguageTarget = 'all' | 'ar' | 'fr' | 'en';

export interface FormPlaceholders {
  customerName?: string;
  phone?: string;
  city?: string;
  address?: string;
}

export interface CityOptionsConfig {
  enabled: boolean; // تفعيل قائمة اختيارات المدن أو جعلها حقل كتابة حر
  preset?: 'morocco' | 'saudi' | 'uae' | 'algeria' | 'tunisia' | 'egypt' | 'france' | 'custom';
  customCities?: string[]; // قائمة المدن المخصصة
}

export interface ProductCityConfig {
  mode: 'store' | 'custom' | 'disabled'; // الاعتماد على المتجر، أو تخصيص مدن لهذا المنتج، أو إلغاء القائمة
  preset?: 'morocco' | 'saudi' | 'uae' | 'algeria' | 'tunisia' | 'egypt' | 'france' | 'custom';
  customCities?: string[]; // المدن الخاصة بهذا المنتج تحديداً
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  features: string[];
  inStock: boolean;
  badge?: string;
  rating: number;
  reviewsCount: number;
  sizesEnabled?: boolean; // تفعيل أو إلغاء المقاسات
  sizes: string[];
  colorsEnabled?: boolean; // تفعيل أو إلغاء الألوان
  colors: ProductOptionColor[];
  fabrics: string[];
  imageSvgType: 'blazer' | 'dress' | 'coat' | 'shirt' | 'abaya' | 'suit' | 'caftan' | 'djellaba' | 'survette';
  customImage?: string;
  galleryImages?: string[];
  bundleOffer?: ProductBundleOffer;
  customizations?: ProductCustomization[]; // إمكانية إضافة أي تخصيص وتفعيله أو لا
  priceCustomizations?: PriceCustomization[]; // تخصيصات تؤثر على السعر (إضافة مبلغ لكل خيار) — الافتراضي [] = لا تغيير في السعر
  hidden?: boolean; // إخفاء المنتج من المتجر (مسودة) — الافتراضي false = ظاهر للزوار
  hasDescriptionBorder?: boolean; // تفعيل إطار تفاصيل المنتج أو تركه مدمجاً بدون إطار يملأ الشاشة
  showDescriptionTitle?: boolean; // تفعيل أو إلغاء نص "تفاصيل ومواصفات المنتج" والأيقونة
  reviewsEnabled?: boolean; // تفعيل أو إلغاء التقييمات لهذا المنتج
  customReviews?: ProductReview[]; // تقييمات مضافة ومعدلة يدوياً من إعدادات المنتج
  language?: ProductLanguageTarget; // لغة المنتج وسوقه المستهدف ('all' | 'ar' | 'fr' | 'en')
  pageLanguageOverride?: 'store' | 'ar' | 'fr' | 'en'; // تخصيص لغة صفحة هذا المنتج بشكل منفصل
  currency?: string; // تخصيص عملة هذا المنتج تحديداً دون الحاجة لتغيير عملة المتجر كاملة
  formPlaceholders?: FormPlaceholders; // تخصيص نصوص الحقول التوضيحية (Placeholders) لاستمارة هذا المنتج
  citiesConfig?: ProductCityConfig; // خيارات وقائمة المدن الخاصة بهذا المنتج
  showDetailsBeforeForm?: boolean; // إظهار تفاصيل ووصف المنتج فوق استمارة الطلب (الافتراضي true = السلوك الحالي)
  showBottomOrderForm?: boolean; // إظهار استمارة الطلب مرة أخرى في أسفل الصفحة (الافتراضي false = السلوك الحالي)
  pageTemplate?: ProductPageTemplate; // قالب صفحة المنتج (classic/modern/elegant) — غير محدد = يعتمد الافتراضي العام
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  avatarType: 'visitor' | 'custom';
  avatarUrl?: string; // custom image url or base64
  visitorAvatarId?: string; // e.g. 'avatar-1', 'avatar-2'
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
  likesCount?: number;
}

export interface OrderItemCustomization {
  id?: string;
  title: string;
  value: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedFabric?: string;
  customizations?: OrderItemCustomization[];
  selectedPriceCustomizations?: Array<{ id: string; name: string; priceDelta: number }>; // التخصيصات السعرية المختارة (تؤثر على السعر)
  imageSvgType: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  status: OrderStatus;
  syncedToGoogleSheets: boolean;
  googleSheetsResponse?: string;
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  pixelType: 'facebook' | 'tiktok' | 'snapchat' | 'google' | 'custom';
  eventName: string;
  payload: Record<string, any>;
}

export interface PixelSettings {
  facebookPixelId: string;
  facebookEnabled: boolean;
  tiktokPixelId: string;
  tiktokEnabled: boolean;
  snapchatPixelId: string;
  snapchatEnabled: boolean;
  googleAnalyticsId: string;
  googleEnabled: boolean;
  customHeadScript: string;
  customBodyScript: string;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  badgeText: string;
  linkText?: string;
  showCountdown: boolean;
  countdownHours: number;
  bgColor: string;
  textColor: string;
  isMoving?: boolean; // تفعيل حركة الشريط (Ticker / Marquee)
  tickerSpeed?: 'slow' | 'normal' | 'fast'; // سرعة الحركة (بطيء، متوسط، سريع)
  pauseOnHover?: boolean; // إيقاف الحركة عند تمرير مؤشر الفأرة
  enabledLanguages?: ('ar' | 'fr' | 'en')[]; // اللغات المتاح فيها شريط العروض
  enabledByLanguage?: {
    ar?: boolean;
    fr?: boolean;
    en?: boolean;
  };
  textsByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  badgeTextsByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  linkTextsByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  size?: AnnouncementBarSize; // حجم شريط الإعلانات (small/medium/large) — الافتراضي medium = المظهر الحالي
}

export interface WhatsAppSettings {
  enabled: boolean;
  phoneNumber: string; // e.g. "966501234567"
  position: 'left' | 'right';
  greetingMessage: string;
  orderPrefillTemplate: string;
}

export interface HomeBannerSettings {
  enabled: boolean;
  title: string;
  subtitle?: string;
  discountText: string;
  ctaText: string;
  bgGradient: string;
  imageUrl?: string;
  fullWidth?: boolean; // When true: fills screen edge-to-edge without white padding
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | '2xl' | '3xl'; // Sharp 0px vs rounded
  languageTarget?: 'all' | 'ar' | 'fr' | 'en'; // Target language
  enabledLanguages?: ('ar' | 'fr' | 'en')[]; // Target languages list
  // Overlay control:
  showOverlayText?: boolean; // إظهار النصوص فوق البانر (العنوان، الخصم، النص الفرعي)
  showOverlayButton?: boolean; // إظهار زر الإجراء فوق البانر
  overlayTextByLanguage?: {
    ar?: boolean;
    fr?: boolean;
    en?: boolean;
  };
  overlayButtonByLanguage?: {
    ar?: boolean;
    fr?: boolean;
    en?: boolean;
  };
  // Per-language banner image & content support:
  imagesByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  titlesByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  subtitlesByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  discountsByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
  ctaTextsByLanguage?: {
    ar?: string;
    fr?: string;
    en?: string;
  };
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  currency: string;
  adminPassword?: string;
  autoOpenWhatsAppOnOrder?: boolean;
  freeShippingThreshold: number;
  standardShippingCost: number;
  whatsapp: WhatsAppSettings;
  announcement: AnnouncementSettings;
  homeBanner: HomeBannerSettings;
  googleSheetsWebhookUrl: string;
  googleSheetsAutoSync: boolean;
  pixel: PixelSettings;
  enableCategoriesUnderSearch?: boolean; // تفعيل أو إلغاء التصنيفات تحت السيرش بار
  searchCategories?: string[]; // قائمة التصنيفات القابلة للإضافة والتعديل والحذف
  language?: AppLanguage; // لغة المتجر العامة ('ar' | 'fr' | 'en')
  formPlaceholders?: FormPlaceholders; // تخصيص نصوص الحقول التوضيحية للاستمارة على مستوى المتجر كامل
  cities?: CityOptionsConfig; // إعدادات وخيارات المدن العامة للمتجر
  defaultProductTemplate?: ProductPageTemplate; // القالب الافتراضي لصفحات المنتجات (classic/modern/elegant)
}
