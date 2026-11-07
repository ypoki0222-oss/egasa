import { Product, Order, StoreSettings } from '../types';

export const DEFAULT_SURVETTE_IMG = '/uploads/survette_amelia.png';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-survette-amelia',
    name: 'سورفيت أميليا (Survette Amélia)',
    slug: 'survette-amelia',
    price: 249,
    originalPrice: 319,
    category: 'أطقم وسورفيتات',
    description: `اكتاشفي Survette Amélia ، اختيار أنيق وعصري كيجمع بين الراحة، الأناقة وسهولة الحركة.
مصنوعة من قماش Montonie Lycra مريح وناعم، مناسبة للاستعمال اليومي وكتعطي لوك مرتب وعصري.

✨ تفاصيل المنتوج:
🧵 القماش: Montonie Lycra
🎨 الألوان المتوفرة: Noir • grona • Ziti • bleu marine • Beige
📏 المقاسات: S • M • L • XL • 2XL • 3XL
🤍 — الراحة بلمسة من الأناقة.`,
    features: [
      'قماش Montonie Lycra تركي ممتاز مريح وناعم ومطاطي',
      'سحاب أمامي أنيق مع حلقة معدنية دائرية عصرية',
      'غطاء رأس مريح (Capuche) مع أربطة متناسقة',
      'أكمام بأزرار عملية لإمكانية التشمير بسهولة',
      'سروال فضفاض بخصر مطاطي مريح للغاية لجميع المقاسات',
      'مناسبة للاستعمال اليومي، الخروج، السفر والراحة التامة',
    ],
    inStock: true,
    badge: 'الأكثر طلباً ✨',
    rating: 4.97,
    reviewsCount: 184,
    sizesEnabled: true,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colorsEnabled: true,
    colors: [
      { name: 'Noir (أسود)', hex: '#1E1E24' },
      { name: 'Grona (عنابي)', hex: '#6A1B29' },
      { name: 'Ziti (أخضر زيتي)', hex: '#4D5638' },
      { name: 'Bleu marine (كحلي)', hex: '#1E293B' },
      { name: 'Beige (بيج)', hex: '#D9CBB7' },
    ],
    fabrics: ['Montonie Lycra'],
    imageSvgType: 'survette',
    customImage: DEFAULT_SURVETTE_IMG,
    galleryImages: [],
    customizations: [],
    bundleOffer: {
      enabled: true,
      label: 'عرض قطعتين (توفير خاص + توصيل مجاني)',
      price: 449,
      originalPrice: 638,
      stickerText: 'عرض قطعتين',
    },
  },
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'EGASA',
  tagline: 'متجر EGASA للأزياء والملابس العصرية',
  currency: 'د.م',
  adminPassword: 'egasa2025',
  autoOpenWhatsAppOnOrder: true,
  freeShippingThreshold: 0,
  standardShippingCost: 0,
  whatsapp: {
    enabled: true,
    phoneNumber: '212600000000',
    position: 'left',
    greetingMessage: 'مرحباً بك في متجر EGASA! يسعدنا مساعدتك في اختيار مقاسك المناسب أو إتمام طلبك.',
    orderPrefillTemplate: 'السلام عليكم EGASA، أود الاستفسار عن طلبي رقم {orderNumber} باسم {customerName}.',
  },
  announcement: {
    enabled: true,
    text: 'توصيل مجاني لجميع الطلبات + الدفع عند الاستلام بعد المعاينة',
    badgeText: 'عرض خاص',
    linkText: 'تسوق الآن',
    showCountdown: true,
    countdownHours: 14,
    bgColor: '#0f766e',
    textColor: '#FFFFFF',
    isMoving: true,
    tickerSpeed: 'normal',
    pauseOnHover: true,
  },
  homeBanner: {
    enabled: true,
    title: 'تخفيضات الموسم الكبرى',
    subtitle: 'أرقى التصاميم والخامات مع توصيل سريع والدفع عند الاستلام',
    discountText: 'خصم يصل إلى 50%',
    ctaText: 'تسوقي الآن',
    bgGradient: 'from-[#FF5E62] via-[#FF6A5B] to-[#FFA07A]',
    imageUrl: '',
    fullWidth: false,
    borderRadius: '2xl',
    languageTarget: 'all',
    enabledLanguages: ['ar', 'fr', 'en'],
  },
  googleSheetsWebhookUrl: '',
  googleSheetsAutoSync: true,
  pixel: {
    facebookPixelId: '123456789012345',
    facebookEnabled: true,
    tiktokPixelId: 'CQ7UD33C77U4U9H13IOG',
    tiktokEnabled: true,
    snapchatPixelId: 'snap-88990011',
    snapchatEnabled: false,
    googleAnalyticsId: 'G-ABC123XYZ',
    googleEnabled: false,
    customHeadScript: '',
    customBodyScript: '',
  },
  enableCategoriesUnderSearch: true,
  searchCategories: [
    'أطقم وسورفيتات',
    'قفاطن وجلابات',
    'عبايات خليجية',
    'فساتين سهرة',
    'بيجامات وملابس بيت',
    'أحذية وحقائب',
  ],
  language: 'ar',
  cities: {
    enabled: true,
    preset: 'morocco',
  },
};
