import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  Order,
  StoreSettings,
  OrderStatus,
  PixelSettings,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_STORE_SETTINGS,
} from './data/initialData';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { PromoSlider } from './components/PromoSlider';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { BottomNav } from './components/BottomNav';
import { ProductPageView } from './components/ProductPageView';
import { ModernProductPage } from './components/product-templates/ModernProductPage';
import { ElegantProductPage } from './components/product-templates/ElegantProductPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminPasswordModal } from './components/admin/AdminPasswordModal';
import { SearchBarWithCategories } from './components/SearchBarWithCategories';
import { pixelService } from './services/pixelService';
import { apiService } from './services/apiService';
import {
  getPublishedSnapshot,
  hasPublishedSnapshot,
  getProductSlugFromPath,
} from './lib/snapshot';
import { useAuth } from './context/AuthContext';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import { TRANSLATIONS, getDirection, getFontFamily, AppLanguage } from './utils/i18n';
import { stripDataUrlsDeep, migrateLegacyCache, MAX_ORDERS_CACHE } from './utils/cacheStrip';

const DEMO_PRODUCT_IDS = new Set([
  'prod-caftan-1',
  'prod-djellaba-1',
  'prod-blazer-1',
  'prod-dress-1',
  'prod-coat-1',
  'prod-suit-1',
  'prod-shirt-1',
  'prod-abaya-1',
]);

// Helper to resolve product from URL synchronously on initial render
function getInitialProductFromUrl(pool: Product[]): Product | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const productParam =
      url.searchParams.get('p') ||
      url.searchParams.get('product') ||
      url.searchParams.get('id');

    let hashParam: string | null = null;
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#\/?/, '');
      if (cleanHash.startsWith('product/')) {
        hashParam = cleanHash.replace('product/', '');
      } else if (cleanHash.startsWith('p/')) {
        hashParam = cleanHash.replace('p/', '');
      }
    }

    // المسار النظيف /product/<slug> — يتوافق مع الصفحات الثابتة المولدة عند البناء (SSG)
    const pathSlug = getProductSlugFromPath();

    const target = productParam || hashParam || pathSlug;
    if (!target) return null;

    const cleanTarget = decodeURIComponent(target).trim().toLowerCase();
    const matched =
      pool.find(
        (p) =>
          p.slug.toLowerCase() === cleanTarget ||
          p.id.toLowerCase() === cleanTarget ||
          decodeURIComponent(p.slug).trim().toLowerCase() === cleanTarget ||
          (p.slug.toLowerCase().includes('survette') && cleanTarget.includes('survette')) ||
          p.name.toLowerCase() === cleanTarget
      ) || null;
    // المنتج المخفي (مسودة) لا يُعرض للزوار حتى عبر رابط مباشر
    if (matched && matched.hidden) return null;
    return matched;
  } catch {
    return null;
  }
}

export default function App() {
  // Load stored state or fallback to defaults with deep fallback merging
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    // 1) لقطة النشر المضمّنة في HTML (SSG) — أولوية قصوى لتفادي الوميض
    const snap = getPublishedSnapshot();
    if (snap && snap.settings) return snap.settings;
    try {
      const stored = localStorage.getItem('egasa_store_settings_v4');
      if (stored) {
        const parsed = JSON.parse(stored!);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_STORE_SETTINGS,
            ...parsed,
            announcement: { ...INITIAL_STORE_SETTINGS.announcement, ...(parsed.announcement || {}) },
            homeBanner: { ...INITIAL_STORE_SETTINGS.homeBanner, ...(parsed.homeBanner || {}) },
            whatsapp: { ...INITIAL_STORE_SETTINGS.whatsapp, ...(parsed.whatsapp || {}) },
            pixel: { ...INITIAL_STORE_SETTINGS.pixel, ...(parsed.pixel || {}) },
            enableCategoriesUnderSearch: parsed.enableCategoriesUnderSearch !== undefined
              ? parsed.enableCategoriesUnderSearch
              : INITIAL_STORE_SETTINGS.enableCategoriesUnderSearch,
            searchCategories: Array.isArray(parsed.searchCategories) && parsed.searchCategories.length > 0
              ? parsed.searchCategories
              : INITIAL_STORE_SETTINGS.searchCategories,
            cities: parsed.cities !== undefined ? parsed.cities : INITIAL_STORE_SETTINGS.cities,
          };
        }
      }
      return INITIAL_STORE_SETTINGS;
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    // 1) لقطة النشر المضمّنة في HTML (SSG) — أولوية قصوى لتفادي الوميض
    const snap = getPublishedSnapshot();
    if (snap && Array.isArray(snap.products) && snap.products.length > 0) {
      return snap.products;
    }
    try {
      if (localStorage.getItem('egasa_store_cleared') === 'true') {
        return [];
      }
      const stored = localStorage.getItem('egasa_store_products_v4');
      if (stored !== null) {
        const parsed = JSON.parse(stored!);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .filter((p: any) => p && typeof p === 'object' && p.id && !DEMO_PRODUCT_IDS.has(p.id))
            .map((p: any) => ({
              ...p,
              features: Array.isArray(p.features) ? p.features : [],
              sizes: Array.isArray(p.sizes) ? p.sizes : [],
              colors: Array.isArray(p.colors)
                ? p.colors.map((c: any) =>
                    typeof c === 'string'
                      ? { name: c, hex: '#2D3748' }
                      : { name: c?.name || '', hex: c?.hex || '#2D3748' }
                  )
                : [],
              fabrics: Array.isArray(p.fabrics) ? p.fabrics : [],
              customizations: Array.isArray(p.customizations) ? p.customizations : [],
              galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages : [],
            }));
          return sanitized;
        }
      }
      return []; // لا نعرض منتجات تجريبية افتراضياً — ننتظر بيانات السحابة
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      if (localStorage.getItem('egasa_orders_cleared') === 'true') {
        return [];
      }
      const stored =
        localStorage.getItem('egasa_store_orders_v4') ||
        localStorage.getItem('egasa_store_orders');
      if (stored !== null) {
        const parsed = JSON.parse(stored!);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // UI state - Synchronously resolve product from URL if visiting a direct product link
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    return getInitialProductFromUrl(products);
  });

  // If a product param exists in the URL but was not matched immediately in initial cache, hold view until backend responds
  const [isRoutePending, setIsRoutePending] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const url = new URL(window.location.href);
      const pathSlug = getProductSlugFromPath();
      const target =
        url.searchParams.get('p') ||
        url.searchParams.get('product') ||
        url.searchParams.get('id') ||
        pathSlug ||
        (window.location.hash && (window.location.hash.startsWith('#product/') || window.location.hash.startsWith('#p/')));
      return Boolean(target && !getInitialProductFromUrl(products));
    } catch {
      return false;
    }
  });

  // هل وصلت أول دفعة بيانات من Firestore (onSnapshot)؟
  // يُستخدم لعرض skeleton/تحميل في وضع التطوير (بدون لقطة نشر) بدلاً من صفحة فارغة.
  const [firstDataReceived, setFirstDataReceived] = useState<boolean>(() => hasPublishedSnapshot());

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'categories' | 'favorites'>('home');

  // Visitor session language (e.g. inherited when arriving from an external product ad with specific language)
  const [activeVisitorLang, setActiveVisitorLang] = useState<AppLanguage | null>(() => {
    try {
      const initialProd = getInitialProductFromUrl(products);
      if (initialProd) {
        if (initialProd.pageLanguageOverride && initialProd.pageLanguageOverride !== 'store') {
          return initialProd.pageLanguageOverride;
        }
        if (initialProd.language && initialProd.language !== 'all') {
          return initialProd.language;
        }
      }
      const stored = sessionStorage.getItem('egasa_visitor_lang');
      if (stored === 'ar' || stored === 'fr' || stored === 'en') {
        return stored as AppLanguage;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Visitor session currency (inherited when arriving from a product link with either custom or default store currency)
  const [activeVisitorCurrency, setActiveVisitorCurrency] = useState<string | null>(() => {
    try {
      const initialProd = getInitialProductFromUrl(products);
      if (initialProd) {
        const effectiveCurr = (initialProd.currency && initialProd.currency.trim()) || storeSettings.currency;
        if (effectiveCurr && effectiveCurr.trim()) {
          const cleanCurr = effectiveCurr.trim();
          try {
            sessionStorage.setItem('egasa_visitor_currency', cleanCurr);
          } catch {}
          return cleanCurr;
        }
      }
      const stored = sessionStorage.getItem('egasa_visitor_currency');
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Cart items
  const [cartItems, setCartItems] = useState<
    {
      product: Product;
      selectedSize: string;
      selectedColor: string;
      selectedFabric?: string;
      quantity: number;
    }[]
  >([]);

  // Search & Category Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const syncRevision = useRef(0);
  const { user } = useAuth();

  // Persist state changes
  // ملاحظة مهمة: لا نكتب الصور (data:image/base64) في localStorage أبداً —
  // نكتب النصوص فقط، فتظل بيانات المتصفح ~1KB مثل مواقع الجيل الجديد (مثل Mowarid).
  // الصور تصل من Firestore خلال أقل من ثانية وتُعرض مباشرة دون تخزين محلي.
  useEffect(() => {
    migrateLegacyCache();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('egasa_store_settings_v4', JSON.stringify(stripDataUrlsDeep(storeSettings)));
    } catch {
      // ignore
    }
  }, [storeSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('egasa_store_products_v4', JSON.stringify(stripDataUrlsDeep(products)));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      const recentOrders = Array.isArray(orders) ? orders.slice(0, MAX_ORDERS_CACHE) : [];
      localStorage.setItem('egasa_store_orders_v4', JSON.stringify(stripDataUrlsDeep(recentOrders)));
    } catch {
      // ignore
    }
  }, [orders]);

  // مزامنة فورية عبر Firestore onSnapshot — تحل محل الاستطلاع كل 15 ثانية.
  // التعديلات من أي جهاز تصل فوراً (أقل من ثانية) إلى كل الأجهزة المتصلة.
  useEffect(() => {
    let active = true;
    let cloudProductsReceived = false;

    const unsubProducts = apiService.subscribeProducts((prods) => {
      if (!active) return;
      setFirstDataReceived(true); // وصلت أول بيانات حية من Firestore — نخفي الـ skeleton

      const applyProducts = (list: Product[]) => {
        if (!active) return;
        setProducts(list);
        // لا نمسح isRoutePending هنا — نبقيه حتى يُعثر على المنتج المطلوب (أو مهلة 2.5 ثانية) حتى لا تومض الصفحة الرئيسية
        setSelectedProduct((current) => {
          if (!current) return getInitialProductFromUrl(list);
          const fresh = list.find(
            (p) => p.id === current.id || p.slug.toLowerCase() === current.slug.toLowerCase()
          );
          return fresh || current;
        });
        try {
          if (list.length === 0) {
            localStorage.setItem('egasa_store_cleared', 'true');
          } else {
            localStorage.removeItem('egasa_store_cleared');
          }
        } catch {
          // ignore
        }
      };

      if (prods.length > 0) {
        cloudProductsReceived = true;
        applyProducts(prods);
        return;
      }
      // قائمة فارغة: إما أن المتجر لم يُهيأ بعد (نبقي البيانات المحلية) أو أن المشرف أفرغها فعلاً
      if (cloudProductsReceived) {
        applyProducts(prods);
        return;
      }
      apiService
        .isStoreSeeded()
        .then((seeded) => {
          if (!active) return;
          if (seeded) {
            applyProducts(prods); // أفرغها المشرف فعلاً
          } else {
            setIsRoutePending(false); // لم يُهيأ بعد — نبقي الافتراضي المحلي
          }
        })
        .catch(() => {
          if (active) setIsRoutePending(false);
        });
    });

    const unsubSettings = apiService.subscribeSettings((freshSettings) => {
      if (!active) return;
      if (freshSettings === null) return; // لم يُهيأ بعد — نبقي الإعدادات المحلية
      const merged: StoreSettings = {
        ...INITIAL_STORE_SETTINGS,
        ...freshSettings,
        announcement: { ...INITIAL_STORE_SETTINGS.announcement, ...(freshSettings.announcement || {}) },
        homeBanner: { ...INITIAL_STORE_SETTINGS.homeBanner, ...(freshSettings.homeBanner || {}) },
        whatsapp: { ...INITIAL_STORE_SETTINGS.whatsapp, ...(freshSettings.whatsapp || {}) },
        pixel: { ...INITIAL_STORE_SETTINGS.pixel, ...(freshSettings.pixel || {}) },
      };
      setStoreSettings(merged);
      try {
        localStorage.setItem('egasa_store_settings_v4', JSON.stringify(stripDataUrlsDeep(merged)));
      } catch {
        // ignore
      }
    });

    // أمان: مهلة طويلة تناسب بطء الشبكة — عند الدخول من رابط منتج لا نرجع للرئيسية قبل 10 ثوانٍ
    const routeTimeout = setTimeout(() => {
      if (active) setIsRoutePending(false);
    }, 10000);

    return () => {
      active = false;
      clearTimeout(routeTimeout);
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // اشتراك الطلبات الفوري — يعمل فقط عندما يكون المشرف مسجلاً دخوله
  // (قواعد Firestore لا تسمح بقراءة الطلبات إلا للمصادق عليهم)
  useEffect(() => {
    if (!user) return;
    let active = true;
    const unsubOrders = apiService.subscribeOrders((ords) => {
      if (!active) return;
      setOrders(ords);
      try {
        if (ords.length === 0) {
          localStorage.setItem('egasa_orders_cleared', 'true');
        } else {
          localStorage.removeItem('egasa_orders_cleared');
        }
      } catch {
        // ignore
      }
    });
    return () => {
      active = false;
      unsubOrders();
    };
  }, [user]);

  // فور العثور على المنتج المطلوب (عبر رابط مباشر)، نلغي حالة الانتظار فتظهر صفحة المنتج مباشرة دون وميض للرئيسية
  useEffect(() => {
    if (selectedProduct) setIsRoutePending(false);
  }, [selectedProduct]);

  // Keep selectedProduct in sync with the latest products data (e.g. when merchant edits price)
  useEffect(() => {
    if (selectedProduct) {
      const match = products.find(
        (p) => p.id === selectedProduct.id || p.slug.toLowerCase() === selectedProduct.slug.toLowerCase()
      );
      if (
        match &&
        (match.price !== selectedProduct.price ||
          match.name !== selectedProduct.name ||
          match.customImage !== selectedProduct.customImage ||
          match.originalPrice !== selectedProduct.originalPrice)
      ) {
        setSelectedProduct(match);
      }
    }
  }, [products]);

  // Sync pixels and track PageView on initial mount
  useEffect(() => {
    pixelService.syncPixels(storeSettings.pixel);
    pixelService.track(
      'PageView',
      {
        page_title: `متجر ${storeSettings.storeName}`,
        page_location: window.location.href,
      },
      storeSettings.pixel
    );
  }, [storeSettings.pixel, storeSettings.storeName]);

  // Request Admin access (Hidden from visitors, protected by password)
  const handleRequestAdmin = () => {
    let isAuthed = false;
    try {
      isAuthed = sessionStorage.getItem('egasa_admin_auth') === 'true';
    } catch {
      isAuthed = false;
    }

    if (isAuthed) {
      setIsAdminOpen(true);
    } else {
      setIsAdminPasswordModalOpen(true);
    }
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('egasa_admin_auth');
    } catch {
      // ignore
    }
    setIsAdminOpen(false);
    setActiveMobileTab('home');
  };

  // Dedicated URL routing for product ads (?p=slug or ?product=slug or ?id=id) and EdgeOne compatibility
  useEffect(() => {
    const checkUrlRoute = () => {
      try {
        const url = new URL(window.location.href);
        const productParam =
          url.searchParams.get('p') ||
          url.searchParams.get('product') ||
          url.searchParams.get('id');

        let hashParam: string | null = null;
        if (window.location.hash) {
          const cleanHash = window.location.hash.replace(/^#\/?/, '');
          if (cleanHash.startsWith('product/')) {
            hashParam = cleanHash.replace('product/', '');
          } else if (cleanHash.startsWith('p/')) {
            hashParam = cleanHash.replace('p/', '');
          } else if (cleanHash === 'admin') {
            handleRequestAdmin();
          }
        }

        const targetSlugOrId = productParam || hashParam || getProductSlugFromPath();

        if (targetSlugOrId) {
          const cleanTarget = decodeURIComponent(targetSlugOrId).trim().toLowerCase();
          const matched = products.find(
            (p) =>
              p.slug.toLowerCase() === cleanTarget ||
              p.id.toLowerCase() === cleanTarget ||
              decodeURIComponent(p.slug).trim().toLowerCase() === cleanTarget ||
              (p.slug.toLowerCase().includes('survette') && cleanTarget.includes('survette')) ||
              p.name.toLowerCase() === cleanTarget
          );
          // منتج مخفي (مسودة) — إعادة توجيه الزائر للرئيسية وتنظيف الرابط
          if (matched && matched.hidden) {
            setSelectedProduct(null);
            setIsRoutePending(false);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('p');
              url.searchParams.delete('product');
              url.searchParams.delete('id');
              const cleanPath = /^\/product\//i.test(url.pathname) ? '/' : url.pathname;
      window.history.pushState({}, '', cleanPath + (url.search ? url.search : ''));
              document.title = `${storeSettings.storeName} - ${storeSettings.tagline}`;
            } catch {
              // ignore
            }
            return;
          }
          if (matched) {
            setSelectedProduct(matched);
            setIsRoutePending(false);
            document.title = `${matched.name} | ${storeSettings.storeName}`;

            // Sync visitor language if this product was reached with an enforced language
            const pLang: AppLanguage | null =
              matched.pageLanguageOverride && matched.pageLanguageOverride !== 'store'
                ? matched.pageLanguageOverride
                : matched.language && matched.language !== 'all'
                ? matched.language
                : null;
            if (pLang) {
              setActiveVisitorLang(pLang);
              try {
                sessionStorage.setItem('egasa_visitor_lang', pLang);
              } catch {}
            }

            // Sync visitor currency from this product (custom or default store currency)
            const pCurr = (matched.currency && matched.currency.trim()) || storeSettings.currency;
            if (pCurr && pCurr.trim()) {
              const cleanCurr = pCurr.trim();
              setActiveVisitorCurrency(cleanCurr);
              try {
                sessionStorage.setItem('egasa_visitor_currency', cleanCurr);
              } catch {}
            }
            return;
          }
        } else {
          setIsRoutePending(false);
        }

        if (url.searchParams.has('admin')) {
          handleRequestAdmin();
        }
      } catch {
        // ignore url parse error
      }
    };

    checkUrlRoute();

    const handlePopState = () => {
      checkUrlRoute();
    };

    window.addEventListener('popstate', handlePopState);

    // Keyboard shortcut: Ctrl + Shift + A opens admin login modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handleRequestAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products, storeSettings.storeName]);

  const currentLang: AppLanguage = activeVisitorLang || storeSettings.language || 'ar';
  const t = TRANSLATIONS[currentLang];
  const dir = getDirection(currentLang);
  const font = getFontFamily(currentLang);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;
  }, [dir, currentLang]);

  // المنتجات الظاهرة للزوار فقط (المخفية/المسودة تُستثنى من واجهة الزائر)
  const visibleProducts = products.filter((p) => !p.hidden);
  const filteredProducts = visibleProducts.filter((p) => {
    // 1. Language market filtering:
    const matchesLanguage = !p.language || p.language === 'all' || p.language === currentLang;
    if (!matchesLanguage) return false;

    // 2. Currency market filtering (when visitor entered from a product with an enforced currency):
    if (activeVisitorCurrency) {
      const pCurrency = (p.currency && p.currency.trim()) || storeSettings.currency;
      if (pCurrency.trim().toLowerCase() !== activeVisitorCurrency.trim().toLowerCase()) {
        return false;
      }
    }

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' ||
      (p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Handlers for product navigation with direct URL updating
  const handleOpenProductDetail = (prod: Product) => {
    setSelectedProduct(prod);
    setIsRoutePending(false);
    setIsDetailModalOpen(false);

    // Sync visitor language if this product specifies a target language
    const pLang: AppLanguage | null =
      prod.pageLanguageOverride && prod.pageLanguageOverride !== 'store'
        ? prod.pageLanguageOverride
        : prod.language && prod.language !== 'all'
        ? prod.language
        : null;
    if (pLang) {
      setActiveVisitorLang(pLang);
      try {
        sessionStorage.setItem('egasa_visitor_lang', pLang);
      } catch {}
    }

    // Sync visitor currency from this product (custom or default store currency)
    const pCurr = (prod.currency && prod.currency.trim()) || storeSettings.currency;
    if (pCurr && pCurr.trim()) {
      const cleanCurr = pCurr.trim();
      setActiveVisitorCurrency(cleanCurr);
      try {
        sessionStorage.setItem('egasa_visitor_currency', cleanCurr);
      } catch {}
    }

    try {
      const url = new URL(window.location.href);
      // المسار النظيف /product/<slug> — يخدمه Pages Function من الحافة.
      // نحذف معاملات المنتج القديمة ونبقي معاملات الحملات الإعلانية (utm_*...).
      url.searchParams.delete('p');
      url.searchParams.delete('product');
      url.searchParams.delete('id');
      const slug = encodeURIComponent(prod.slug || prod.id);
      window.history.pushState({ productId: prod.id }, '', `/product/${slug}${url.search}`);
      document.title = `${prod.name} | ${storeSettings.storeName}`;
    } catch {
      // ignore
    }
  };

  const handleCloseProductView = () => {
    // When returning from a product that had a specific language, maintain that language for the store session
    if (selectedProduct) {
      const pLang: AppLanguage | null =
        selectedProduct.pageLanguageOverride && selectedProduct.pageLanguageOverride !== 'store'
          ? selectedProduct.pageLanguageOverride
          : selectedProduct.language && selectedProduct.language !== 'all'
          ? selectedProduct.language
          : null;
      if (pLang) {
        setActiveVisitorLang(pLang);
        try {
          sessionStorage.setItem('egasa_visitor_lang', pLang);
        } catch {}
      }

      // Maintain visitor currency when returning from a product (custom or default store currency)
      const pCurr = (selectedProduct.currency && selectedProduct.currency.trim()) || storeSettings.currency;
      if (pCurr && pCurr.trim()) {
        const cleanCurr = pCurr.trim();
        setActiveVisitorCurrency(cleanCurr);
        try {
          sessionStorage.setItem('egasa_visitor_currency', cleanCurr);
        } catch {}
      }
    }

    setSelectedProduct(null);
    setIsRoutePending(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('p');
      url.searchParams.delete('product');
      url.searchParams.delete('id');
      const cleanPath = /^\/product\//i.test(url.pathname) ? '/' : url.pathname;
      window.history.pushState({}, '', cleanPath + (url.search ? url.search : ''));
      document.title = `${storeSettings.storeName} - ${storeSettings.tagline}`;
    } catch {
      // ignore
    }
  };

  const handleAddToCart = (newItem: {
    product: Product;
    selectedSize: string;
    selectedColor: string;
    selectedFabric?: string;
    quantity: number;
  }) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.product.id === newItem.product.id &&
          i.selectedSize === newItem.selectedSize &&
          i.selectedColor === newItem.selectedColor
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCartItems((prev) => {
        const updated = [...prev];
        updated[index].quantity = newQty;
        return updated;
      });
    }
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrderSuccess = async (newOrder: Order): Promise<void> => {
    syncRevision.current++;
    const saved = await apiService.createOrder(newOrder);
    syncRevision.current++;
    setOrders((prev) => [saved, ...prev.filter((order) => order.id !== saved.id)]);
    setCompletedOrder(saved);
    setCartItems([]);
  };

  // Background auto-sync for any orders created while store backend was offline
  useEffect(() => {
    const syncOfflineQueue = async () => {
      try {
        const queueStr = localStorage.getItem('egasa_pending_sync_orders');
        if (!queueStr) return;
        const queue: Order[] = JSON.parse(queueStr);
        if (!Array.isArray(queue) || queue.length === 0) return;

        const remaining: Order[] = [];
        for (const pendingOrder of queue) {
          try {
            await apiService.createOrder(pendingOrder);
          } catch {
            remaining.push(pendingOrder);
          }
        }
        if (remaining.length > 0) {
          localStorage.setItem('egasa_pending_sync_orders', JSON.stringify(remaining));
        } else {
          localStorage.removeItem('egasa_pending_sync_orders');
        }
      } catch {
        // ignore
      }
    };

    syncOfflineQueue();
    window.addEventListener('online', syncOfflineQueue);
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      syncRevision.current++;
      await apiService.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch {
      window.alert('تعذر حفظ حالة الطلب على الخادم. يرجى المحاولة مجددًا.');
    }
  };

  const handleSaveProduct = async (product: Product): Promise<void> => {
    syncRevision.current++;
    const saved = await apiService.saveProduct(product);
    syncRevision.current++;
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => p.id === saved.id ? saved : p) : [saved, ...prev];
    });
    setSelectedProduct((prev) => prev?.id === saved.id ? saved : prev);
    localStorage.removeItem('egasa_store_cleared');
  };

  const handleDuplicateProduct = async (sourceProduct: Product): Promise<Product> => {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newSlug = `${sourceProduct.slug || 'product'}-copy-${randomSuffix}`;
    const newName = `${sourceProduct.name} (نسخة)`;

    const duplicatedProduct: Product = {
      ...JSON.parse(JSON.stringify(sourceProduct)),
      id: newId,
      slug: newSlug,
      name: newName,
      customReviews: sourceProduct.customReviews?.map((r, i) => ({
        ...r,
        id: `rev-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        productId: newId,
      })),
    };

    await handleSaveProduct(duplicatedProduct);
    return duplicatedProduct;
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      syncRevision.current++;
      await apiService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      window.alert('تعذر حذف المنتج من الخادم. يرجى المحاولة مجددًا.');
    }
  };

  const handleRefreshSync = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, syncedToGoogleSheets: true } : o))
    );
  };

  const handleClearOrders = async () => {
    try {
      syncRevision.current++;
      await apiService.clearAllOrders();
      setOrders([]);
    } catch {
      window.alert('تعذر حذف الطلبات من الخادم. يرجى المحاولة مجددًا.');
    }
  };

  const handleClearProducts = async () => {
    try {
      syncRevision.current++;
      await apiService.clearAllProducts();
      setProducts([]);
    } catch {
      window.alert('تعذر حذف المنتجات من الخادم. يرجى المحاولة مجددًا.');
    }
  };

  const handleClearAllDemoData = () => {
    handleClearOrders();
    handleClearProducts();
  };

  const handleRestoreDemoData = () => {
    apiService
      .restoreDemoData()
      .then((res) => {
        setProducts(res.products);
        setOrders(res.orders);
        try {
          localStorage.removeItem('egasa_store_cleared');
          localStorage.removeItem('egasa_orders_cleared');
          localStorage.setItem('egasa_store_products_v4', JSON.stringify(stripDataUrlsDeep(res.products)));
          localStorage.setItem('egasa_store_orders_v4', JSON.stringify(stripDataUrlsDeep((res.orders || []).slice(0, MAX_ORDERS_CACHE))));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        window.alert('تعذرت استعادة البيانات على الخادم. يرجى المحاولة مجددًا.');
      });
  };

  // تصدير "لقطة النشر" الحالية (products + settings + orders) كملف store_state.json
  // ليستبدل المستخدم به data/store_state.json ثم يعيد البناء/النشر على Cloudflare Pages.
  const handleExportSnapshot = () => {
    try {
      const payload = {
        products,
        orders,
        settings: storeSettings,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store_state.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      window.alert('تعذر تصدير لقطة النشر. يرجى المحاولة مجددًا.');
    }
  };

  const handleSaveStoreSettings = async (newSettings: StoreSettings): Promise<void> => {
    syncRevision.current++;
    const saved = await apiService.saveSettings(newSettings);
    syncRevision.current++;
    setStoreSettings(saved);
    if (saved.language) {
      setActiveVisitorLang(saved.language);
      try { sessionStorage.setItem('egasa_visitor_lang', saved.language); } catch {}
    }
  };

  const handleMobileTabChange = (tab: 'home' | 'categories' | 'favorites') => {
    setActiveMobileTab(tab);
    if (tab === 'categories') {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If Admin panel is open, show full admin dashboard
  if (isAdminOpen) {
    return (
      <div className="font-['Cairo',sans-serif]">
        <AdminDashboard
          products={products}
          orders={orders}
          settings={storeSettings}
          onClose={() => {
            setIsAdminOpen(false);
            setActiveMobileTab('home');
          }}
          onLogout={handleAdminLogout}
          onViewProduct={(prod) => {
            setIsAdminOpen(false);
            handleOpenProductDetail(prod);
          }}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onSaveProduct={handleSaveProduct}
          onDuplicateProduct={handleDuplicateProduct}
          onDeleteProduct={handleDeleteProduct}
          onSaveStoreSettings={handleSaveStoreSettings}
          onSavePixelSettings={(pixel) =>
            handleSaveStoreSettings({ ...storeSettings, pixel })
          }
          onSaveGoogleSheets={(url, autoSync) =>
            handleSaveStoreSettings({
              ...storeSettings,
              googleSheetsWebhookUrl: url,
              googleSheetsAutoSync: autoSync,
            })
          }
          onRefreshSync={handleRefreshSync}
          onClearOrders={handleClearOrders}
          onClearProducts={handleClearProducts}
          onClearAllDemoData={handleClearAllDemoData}
          onRestoreDemoData={handleRestoreDemoData}
          onExportSnapshot={handleExportSnapshot}
        />
      </div>
    );
  }

  // If a direct product route is requested (?p=... or ?id=...) but is still resolving from the backend, show clean loading view
  if (isRoutePending && !selectedProduct) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center font-['Cairo',sans-serif] px-4">
        <div className="w-10 h-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-stone-800">جاري تحميل تفاصيل المنتج...</p>
        <p className="text-xs text-stone-500 mt-1">لحظات قليلة ونكون معك</p>
      </div>
    );
  }

  // If viewing a product, show the dedicated ProductPageView layout matching the user's design
  if (selectedProduct) {
    return (
      <div dir={dir} style={{ fontFamily: font }} className="font-['Cairo',sans-serif]">
        {/* شريط الإعلانات — يظهر أيضاً في صفحة المنتج */}
        <AnnouncementBar settings={storeSettings.announcement} currentLang={currentLang} />
        {(() => {
          // قالب صفحة المنتج: تخصيص المنتج أولاً، ثم الافتراضي العام للمتجر، ثم 'classic' (السلوك الحالي)
          const template = selectedProduct.pageTemplate ?? storeSettings.defaultProductTemplate ?? 'classic';
          const commonProps = {
            product: selectedProduct,
            settings: storeSettings,
            cartCount: totalCartCount,
            onBack: handleCloseProductView,
            onOpenCart: () => setIsCartOpen(true),
            onOrderSuccess: handleOrderSuccess,
          };
          if (template === 'modern') return <ModernProductPage {...commonProps} />;
          if (template === 'elegant') return <ElegantProductPage {...commonProps} />;
          return <ProductPageView {...commonProps} />;
        })()}

        {/* Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          items={cartItems}
          settings={storeSettings}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onOrderSuccess={handleOrderSuccess}
        />

        {/* Order Success Modal */}
        <OrderSuccessModal
          order={completedOrder}
          currency={storeSettings.currency}
          whatsappSettings={storeSettings.whatsapp}
          onClose={() => {
            setCompletedOrder(null);
            handleCloseProductView();
          }}
        />

        {/* Admin Password Modal */}
        <AdminPasswordModal
          isOpen={isAdminPasswordModalOpen}
          correctPassword={storeSettings.adminPassword || 'egasa2025'}
          onSuccess={() => {
            setIsAdminPasswordModalOpen(false);
            setIsAdminOpen(true);
          }}
          onClose={() => setIsAdminPasswordModalOpen(false)}
        />
      </div>
    );
  }

  // وضع التطوير / أول زيارة بدون لقطة نشر مضمّنة: عرض skeleton نظيف حتى تصل بيانات
  // Firestore (onSnapshot) — بدلاً من صفحة فارغة أو منتج تجريبي.
  if (products.length === 0 && !firstDataReceived) {
    return (
      <div dir="rtl" style={{ fontFamily: "'Cairo', system-ui, sans-serif", background: '#F8F9FA', minHeight: '100vh', color: '#1E232A' }}>
        <div style={{ background: '#0f766e', color: '#fff', padding: '8px 16px', fontSize: '12px', textAlign: 'center' }}>
          جاري تحميل المتجر...
        </div>
        <div style={{ maxWidth: 80, height: 8, background: '#e7e5e4', borderRadius: 4, margin: '20px auto' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}>
          <div style={{ height: 140, background: 'linear-gradient(135deg,#FF5E62,#FFA07A)', borderRadius: 16, marginBottom: 24, opacity: 0.35 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 12, border: '1px solid #e7e5e4' }}>
                <div style={{ height: 160, background: '#f5f5f4', borderRadius: 12, marginBottom: 10 }} />
                <div style={{ height: 12, background: '#e7e5e4', borderRadius: 4, width: '70%', marginBottom: 8 }} />
                <div style={{ height: 10, background: '#f5f5f4', borderRadius: 4, width: '40%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      style={{ fontFamily: font }}
      className={`min-h-screen bg-[#F8F9FA] text-[#1E232A] flex flex-col pb-16 sm:pb-0 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      {/* 1. Top Announcement Bar */}
      <AnnouncementBar settings={storeSettings.announcement} currentLang={currentLang} />

      {/* 2. Top Bar Navigation (With Brand EGASA, Search, Language Switcher, and Cart) */}
      <Navbar
        storeName={storeSettings.storeName}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onSearchClick={() => {
          searchInputRef.current?.focus();
          document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Promo Slider (Controlled via Admin) */}
      <PromoSlider
        bannerSettings={storeSettings.homeBanner}
        currentLang={currentLang}
        onCtaClick={() => {
          document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 4. Products Section */}
      <section id="products-section" className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full flex-1">
        {/* Search Bar with Horizontal Swipeable Categories (located specifically with search bar) */}
        <SearchBarWithCategories
          inputRef={searchInputRef}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoriesEnabled={storeSettings.enableCategoriesUnderSearch !== false}
          categories={storeSettings.searchCategories}
          products={visibleProducts}
          language={currentLang}
        />

        {/* Products Grid (2 columns on mobile) */}
        {products.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-4 max-w-lg mx-auto shadow-2xs">
            <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto text-teal-700">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">المتجر مفرغ وجاهز لإضافة منتجاتك</h3>
              <p className="text-xs text-stone-500 mt-1">تم مسح المنتجات والبيانات التجريبية بنجاح. المتجر نظيف تماماً ويمكنك البدء بإضافة منتجاتك الحقيقية من لوحة التحكم.</p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsAdminPasswordModalOpen(true)}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                الدخول للوحة التحكم وإضافة منتجات
              </button>
              <button
                onClick={handleRestoreDemoData}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                استعادة المنتجات التجريبية للمعاينة
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">
              {currentLang === 'fr'
                ? 'Aucun produit ne correspond à vos critères'
                : currentLang === 'en'
                ? 'No products match your criteria'
                : 'لا توجد نتائج مطابقة للتصفية الحالية'}
            </h3>
            <p className="text-xs text-stone-500">
              {selectedCategory !== 'all'
                ? (currentLang === 'fr'
                    ? `Aucun produit disponible dans la catégorie "${selectedCategory}".`
                    : currentLang === 'en'
                    ? `No products currently available in category "${selectedCategory}".`
                    : `لا تتوفر منتجات حالياً ضمن تصنيف "${selectedCategory}".`)
                : (currentLang === 'fr'
                    ? 'Essayez une autre recherche ou affichez tous les produits.'
                    : currentLang === 'en'
                    ? 'Try searching with another keyword or view all products.'
                    : 'جرب البحث بكلمة أخرى أو عرض كافة المنتجات.')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-teal-800 transition-colors"
            >
              {currentLang === 'fr'
                ? 'Afficher tous les produits'
                : currentLang === 'en'
                ? 'View all products'
                : 'عرض كافة المنتجات'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={storeSettings.currency}
                onSelect={handleOpenProductDetail}
                onQuickOrder={handleOpenProductDetail}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Guarantees & COD Confidence */}
      <section className="bg-white border-y border-stone-200/80 py-10 my-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-3 p-4 bg-teal-50/60 rounded-xl border border-teal-100">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">{t.codGuarantee}</h3>
                <p className="text-[11px] text-stone-600">
                  {currentLang === 'fr'
                    ? 'Inspectez votre colis avant de régler le montant au livreur'
                    : currentLang === 'en'
                    ? 'Inspect your items before paying cash upon delivery'
                    : 'عاين طلبك وتأكد من جودته قبل تسليم المبلغ للمندوب'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-teal-50/60 rounded-xl border border-teal-100">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">{t.fastDelivery}</h3>
                <p className="text-[11px] text-stone-600">{t.fastDeliveryDesc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-teal-50/60 rounded-xl border border-teal-100">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">{t.easyReturn}</h3>
                <p className="text-[11px] text-stone-600">{t.easyReturnDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer (Discreet, Professional - Admin button hidden behind discreet link & password) */}
      <footer className="bg-[#1C1917] text-stone-400 text-xs py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider font-serif">
                {storeSettings.storeName}
              </h3>
              <p className="text-stone-400 text-xs mt-1">
                {storeSettings.tagline}
              </p>
            </div>

            {/* Discreet Admin Entrance for store owner only */}
            <button
              onClick={handleRequestAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-500 hover:text-stone-300 text-[11px] font-medium transition-colors cursor-pointer border border-stone-800 hover:border-stone-700"
              title="دخول الإدارة (محمي بكلمة مرور)"
            >
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>دخول الإدارة</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
            <p>© {new Date().getFullYear()} {storeSettings.storeName}. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-3">
              <span>الدفع عند الاستلام</span>
              <span>·</span>
              <span>شحن سريع ومجاني</span>
              <span>·</span>
              <span>ضمان المعاينة والجودة</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp
        settings={storeSettings.whatsapp}
        storeName={storeSettings.storeName}
      />

      {/* Mobile Bottom Navigation Bar (No admin tab, clean shopper tabs) */}
      <BottomNav
        activeTab={activeMobileTab}
        cartCount={totalCartCount}
        language={currentLang}
        onTabChange={handleMobileTabChange}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        settings={storeSettings}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAddToCart={handleAddToCart}
        onOrderSuccess={handleOrderSuccess}
      />

      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        settings={storeSettings}
        language={currentLang}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderSuccessModal
        order={completedOrder}
        currency={storeSettings.currency}
        whatsappSettings={storeSettings.whatsapp}
        language={currentLang}
        onClose={() => setCompletedOrder(null)}
      />

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        correctPassword={storeSettings.adminPassword || 'egasa2025'}
        onSuccess={() => {
          setIsAdminPasswordModalOpen(false);
          setIsAdminOpen(true);
        }}
        onClose={() => setIsAdminPasswordModalOpen(false)}
      />
    </div>
  );
}
