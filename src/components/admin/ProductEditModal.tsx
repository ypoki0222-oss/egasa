import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductOptionColor,
  ProductCustomization,
  PriceCustomization,
  ProductReview,
  ProductLanguageTarget,
  FormPlaceholders,
  ProductPageTemplate,
} from '../../types';
import { apiService } from '../../services/apiService';
import { RichTextEditor } from './RichTextEditor';
import { ALL_CURRENCIES } from '../../utils/currencies';
import { CITY_PRESETS, DEFAULT_MOROCCAN_CITIES } from '../../utils/cities';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Sliders,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Star,
  MessageSquare,
  Globe,
  Coins,
  FileText,
  MapPin,
  Files,
} from 'lucide-react';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  onDuplicate?: (product: Product) => Promise<void>;
  availableCategories?: string[];
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onDuplicate,
  availableCategories = [],
}) => {

  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price || 250);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(
    product?.originalPrice || (product ? undefined : 350)
  );
  const [productCurrency, setProductCurrency] = useState<string>(product?.currency || '');
  const [formPlaceholders, setFormPlaceholders] = useState<FormPlaceholders>(
    product?.formPlaceholders ? { ...product.formPlaceholders } : {}
  );
  const [citySelectionMode, setCitySelectionMode] = useState<'store' | 'custom' | 'disabled'>(
    product?.citiesConfig?.mode || 'store'
  );
  const [cityPreset, setCityPreset] = useState<string>(
    product?.citiesConfig?.preset || 'morocco'
  );
  const [customCitiesText, setCustomCitiesText] = useState<string>(
    product?.citiesConfig?.customCities
      ? product.citiesConfig.customCities.join('\n')
      : (product?.citiesConfig?.preset && CITY_PRESETS[product.citiesConfig.preset]
          ? CITY_PRESETS[product.citiesConfig.preset].cities.join('\n')
          : '')
  );
  const [category, setCategory] = useState(product?.category || 'أزياء');
  const [badge, setBadge] = useState(product?.badge || '');
  const [description, setDescription] = useState(product?.description || '');
  const [inStock, setInStock] = useState(product ? product.inStock : true);
  const [imageSvgType, setImageSvgType] = useState<Product['imageSvgType']>(
    product?.imageSvgType || 'dress'
  );

  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Main Image (from device or URL)
  const [customImage, setCustomImage] = useState(product?.customImage || '');

  // Gallery Images (from device or URL)
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.galleryImages || []);

  // Description Features (Bullet Points) - Completely dynamic
  const [features, setFeatures] = useState<string[]>(
    product?.features ? [...product.features] : []
  );
  const [newFeatureText, setNewFeatureText] = useState('');

  // Sizes Enabled Toggle & Options
  const [sizesEnabled, setSizesEnabled] = useState<boolean>(
    product?.sizesEnabled !== undefined ? product.sizesEnabled : true
  );
  const [sizes, setSizes] = useState<string[]>(
    product?.sizes ? [...product.sizes] : ['S', 'M', 'L', 'XL', '2XL']
  );
  const [newSize, setNewSize] = useState('');

  // Colors Enabled Toggle & Options
  const [colorsEnabled, setColorsEnabled] = useState<boolean>(
    product?.colorsEnabled !== undefined ? product.colorsEnabled : true
  );
  const [colors, setColors] = useState<ProductOptionColor[]>(
    product?.colors ? [...product.colors] : [
      { name: 'أسود', hex: '#1E1E24' },
      { name: 'عنابي', hex: '#6A1B29' },
      { name: 'أخضر زيتي', hex: '#4D5638' },
      { name: 'بيج', hex: '#D9CBB7' },
    ]
  );
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#1E1E24');

  // Customizations (إمكانية إضافة أي تخصيص وتفعيله أو لا)
  const [customizations, setCustomizations] = useState<ProductCustomization[]>(
    product?.customizations ? JSON.parse(JSON.stringify(product.customizations)) : []
  );
  // إخفاء المنتج من المتجر (مسودة) — الافتراضي false = ظاهر
  const [hidden, setHidden] = useState<boolean>(product?.hidden === true);
  // التخصيصات السعرية (تؤثر على السعر) — منفصلة عن customizations العادية
  const [priceCustomizations, setPriceCustomizations] = useState<PriceCustomization[]>(
    product?.priceCustomizations ? JSON.parse(JSON.stringify(product.priceCustomizations)) : []
  );
  const [showAddCustomization, setShowAddCustomization] = useState(false);
  const [newCustTitle, setNewCustTitle] = useState('');
  const [newCustType, setNewCustType] = useState<'text' | 'select' | 'checkbox'>('text');
  const [newCustOptions, setNewCustOptions] = useState('');
  const [newCustPlaceholder, setNewCustPlaceholder] = useState('');
  const [newCustRequired, setNewCustRequired] = useState(false);

  // Bundle Offer
  const [bundleEnabled, setBundleEnabled] = useState(product?.bundleOffer?.enabled ?? false);
  const [bundleStickerText, setBundleStickerText] = useState(
    product?.bundleOffer?.stickerText || 'عرض قطعتين'
  );
  const [bundleLabel, setBundleLabel] = useState(
    product?.bundleOffer?.label || 'عرض قطعتين (توفير خاص + توصيل مجاني)'
  );
  const [bundlePrice, setBundlePrice] = useState(
    product?.bundleOffer?.price || Math.round((product?.price || price) * 1.75)
  );
  const [bundleOriginalPrice, setBundleOriginalPrice] = useState<number | undefined>(
    product?.bundleOffer?.originalPrice || Math.round(((product?.originalPrice || originalPrice) || price * 1.4) * 2)
  );

  // Description Border Box Toggle (تفعيل الإطار أو عرضه مدمجاً بدون إطار يملأ الشاشة)
  const [hasDescriptionBorder, setHasDescriptionBorder] = useState<boolean>(
    product?.hasDescriptionBorder === true
  );

  // Description Title & Star icon Toggle (امكانية تفعيل ذلك النص "تفاصيل ومواصفات المنتج" والنجمة أو لا)
  const [showDescriptionTitle, setShowDescriptionTitle] = useState<boolean>(
    product?.showDescriptionTitle !== false
  );

  // Target Market Language filter ('all' | 'ar' | 'fr' | 'en')
  const [productLanguage, setProductLanguage] = useState<ProductLanguageTarget>(
    product?.language || 'all'
  );

  // Single Product Page Language Override ('store' | 'ar' | 'fr' | 'en')
  const [pageLanguageOverride, setPageLanguageOverride] = useState<'store' | 'ar' | 'fr' | 'en'>(
    product?.pageLanguageOverride || 'store'
  );

  // Reviews Enabled Toggle (تفعيل أو إلغاء التقييمات لهذا المنتج)
  const [reviewsEnabled, setReviewsEnabled] = useState<boolean>(
    product?.reviewsEnabled !== false
  );
  // إظهار تفاصيل ووصف المنتج فوق استمارة الطلب (الافتراضي true = السلوك الحالي)
  const [showDetailsBeforeForm, setShowDetailsBeforeForm] = useState<boolean>(
    product?.showDetailsBeforeForm !== false
  );
  // إظهار استمارة الطلب مرة أخرى في أسفل الصفحة (الافتراضي false = السلوك الحالي)
  const [showBottomOrderForm, setShowBottomOrderForm] = useState<boolean>(
    product?.showBottomOrderForm === true
  );
  // قالب صفحة المنتج (classic/modern/elegant) — فارغ = يعتمد الافتراضي العام للمتجر ثم classic
  const [pageTemplate, setPageTemplate] = useState<ProductPageTemplate | ''>(
    product?.pageTemplate || ''
  );

  // Custom Reviews list for this product (إمكانية كتابة وإدارة التقييمات بنفسك)
  const [customReviews, setCustomReviews] = useState<ProductReview[]>(() => {
    if (Array.isArray(product?.customReviews)) {
      return [...product.customReviews];
    }
    if (product?.id) {
      try {
        const saved = localStorage.getItem(`egasa_reviews_${product.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // State for adding a new review from admin
  const [showAddReview, setShowAddReview] = useState(false);
  const [newRevName, setNewRevName] = useState('');
  const [newRevRating, setNewRevRating] = useState<number>(5);
  const [newRevComment, setNewRevComment] = useState('');
  const [newRevAvatarType, setNewRevAvatarType] = useState<'visitor' | 'custom'>('visitor');
  const [newRevAvatarId, setNewRevAvatarId] = useState('visitor-teal');

  // Sync state whenever editing product changes or modal is opened
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price);
      setOriginalPrice(product.originalPrice);
      setCategory(product.category || 'أزياء');
      setBadge(product.badge || '');
      setDescription(product.description || '');
      setFeatures(product.features ? [...product.features] : []);
      setInStock(product.inStock !== false);
      setImageSvgType(product.imageSvgType || 'dress');
      setCustomImage(product.customImage || '');
      setGalleryImages(product.galleryImages ? [...product.galleryImages] : []);
      setSizesEnabled(product.sizesEnabled !== false);
      setSizes(product.sizes ? [...product.sizes] : []);
      setColorsEnabled(product.colorsEnabled !== false);
      setColors(product.colors ? [...product.colors] : []);
      setCustomizations(product.customizations ? JSON.parse(JSON.stringify(product.customizations)) : []);
      setHidden(product.hidden === true);
      setPriceCustomizations(product.priceCustomizations ? JSON.parse(JSON.stringify(product.priceCustomizations)) : []);
      setHasDescriptionBorder(product.hasDescriptionBorder === true);
      setShowDescriptionTitle(product.showDescriptionTitle !== false);
      setProductLanguage(product.language || 'all');
      setPageLanguageOverride(product.pageLanguageOverride || 'store');
      setReviewsEnabled(product.reviewsEnabled !== false);
      setShowDetailsBeforeForm(product.showDetailsBeforeForm !== false);
      setShowBottomOrderForm(product.showBottomOrderForm === true);
      setPageTemplate(product.pageTemplate || '');
      setProductCurrency(product.currency || '');
      setFormPlaceholders(product.formPlaceholders ? { ...product.formPlaceholders } : {});
      if (Array.isArray(product.customReviews)) {
        setCustomReviews([...product.customReviews]);
      } else if (product.id) {
        try {
          const saved = localStorage.getItem(`egasa_reviews_${product.id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setCustomReviews(parsed);
          }
        } catch {}
      }
      if (product.bundleOffer) {
        setBundleEnabled(product.bundleOffer.enabled);
        setBundleStickerText(product.bundleOffer.stickerText || '');
        setBundleLabel(product.bundleOffer.label || 'عرض قطعتين (توفير خاص + توصيل مجاني)');
        setBundlePrice(product.bundleOffer.price);
        setBundleOriginalPrice(product.bundleOffer.originalPrice);
      } else {
        setBundleEnabled(false);
      }
    } else {
      // New product defaults
      setName('');
      setPrice(250);
      setOriginalPrice(350);
      setProductCurrency('');
      setFormPlaceholders({});
      setCategory('أزياء');
      setBadge('');
      setDescription('');
      setFeatures([]);
      setInStock(true);
      setImageSvgType('dress');
      setCustomImage('');
      setGalleryImages([]);
      setSizesEnabled(true);
      setSizes(['S', 'M', 'L', 'XL', '2XL']);
      setColorsEnabled(true);
      setColors([
        { name: 'أسود', hex: '#1E1E24' },
        { name: 'بيج', hex: '#D9CBB7' },
      ]);
      setCustomizations([]);
      setHidden(false);
      setPriceCustomizations([]);
      setBundleEnabled(false);
      setHasDescriptionBorder(false);
      setShowDescriptionTitle(true);
      setProductLanguage('all');
      setPageLanguageOverride('store');
      setReviewsEnabled(true);
      setShowDetailsBeforeForm(true);
      setShowBottomOrderForm(false);
      setPageTemplate('');
      setCustomReviews([]);
    }
  }, [product, isOpen]);

  // Helper to optimize and compress uploaded images
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleMainImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingMain(true);
      try {
        const compressed = await compressImageFile(file);
        if (compressed) {
          const serverUrl = await apiService.uploadImage(compressed);
          setCustomImage(serverUrl);
        }
      } catch (err) {
        console.error('Failed to upload main image:', err);
      } finally {
        setIsUploadingMain(false);
      }
    }
  };

  const handleGalleryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingGallery(true);
      try {
        const promises = Array.from(files).map((f) => compressImageFile(f));
        const compressedList = await Promise.all(promises);
        const uploadPromises = compressedList.filter(Boolean).map((data) => apiService.uploadImage(data));
        const uploadedUrls = await Promise.all(uploadPromises);
        const valid = uploadedUrls.filter(Boolean);
        setGalleryImages((prev) => [...prev, ...valid]);
      } catch (err) {
        console.error('Failed to upload gallery images:', err);
      } finally {
        setIsUploadingGallery(false);
      }
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Features handlers
  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setFeatures([...features, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Sizes handlers
  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setSizes(sizes.filter((s) => s !== sizeToRemove));
  };

  // Colors handlers
  const handleAddColor = () => {
    if (newColorName.trim()) {
      setColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
      setNewColorName('');
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // Customizations handlers
  const handleToggleCustomization = (id: string) => {
    setCustomizations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleRemoveCustomization = (id: string) => {
    setCustomizations((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddNewCustomization = () => {
    if (!newCustTitle.trim()) return;

    let parsedOptions: string[] | undefined = undefined;
    if (newCustType === 'select') {
      parsedOptions = newCustOptions
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsedOptions.length === 0) {
        parsedOptions = ['الخيار الأول', 'الخيار الثاني'];
      }
    }

    const newCust: ProductCustomization = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newCustTitle.trim(),
      type: newCustType,
      options: parsedOptions,
      placeholder: newCustPlaceholder.trim() || undefined,
      required: newCustRequired,
      enabled: true, // Enabled by default
    };

    setCustomizations([...customizations, newCust]);
    setNewCustTitle('');
    setNewCustType('text');
    setNewCustOptions('');
    setNewCustPlaceholder('');
    setNewCustRequired(false);
    setShowAddCustomization(false);
  };

  // ===== Price Customizations handlers (تخصيصات تؤثر على السعر) =====
  const handleAddPriceCustomization = () => {
    const newPc: PriceCustomization = {
      id: `pc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      priceDelta: 0,
      enabled: true,
    };
    setPriceCustomizations((prev) => [...prev, newPc]);
  };
  const handleUpdatePriceCustomization = (id: string, field: keyof PriceCustomization, value: string | number | boolean) => {
    setPriceCustomizations((prev) =>
      prev.map((pc) => (pc.id === id ? { ...pc, [field]: value } : pc))
    );
  };
  const handleTogglePriceCustomization = (id: string) => {
    setPriceCustomizations((prev) =>
      prev.map((pc) => (pc.id === id ? { ...pc, enabled: !pc.enabled } : pc))
    );
  };
  const handleRemovePriceCustomization = (id: string) => {
    setPriceCustomizations((prev) => prev.filter((pc) => pc.id !== id));
  };

  const handleAddReviewFromAdmin = () => {
    if (!newRevName.trim() || !newRevComment.trim()) return;
    const review: ProductReview = {
      id: `rev-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product?.id || `prod-temp`,
      userName: newRevName.trim(),
      avatarType: newRevAvatarType,
      visitorAvatarId: newRevAvatarType === 'visitor' ? newRevAvatarId : undefined,
      rating: newRevRating,
      comment: newRevComment.trim(),
      date: 'الآن',
      verifiedPurchase: true,
      likesCount: 1,
    };
    setCustomReviews((prev) => [review, ...prev]);
    setNewRevName('');
    setNewRevComment('');
    setNewRevRating(5);
    setShowAddReview(false);
  };

  const handleRemoveReviewFromAdmin = (reviewId: string) => {
    setCustomReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const buildCurrentProduct = (overrideId?: string, overrideSlug?: string, overrideName?: string): Product => {
    return {
      id: overrideId || product?.id || `prod-${Date.now()}`,
      name: (overrideName || name).trim(),
      slug: (overrideSlug || product?.slug || name.toLowerCase().replace(/\s+/g, '-')).trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: category.trim(),
      description: description.trim(),
      features,
      inStock,
      badge: badge.trim() || undefined,
      rating: product?.rating || 4.97,
      reviewsCount: customReviews.length > 0 ? customReviews.length : (product?.reviewsCount || 184),
      sizesEnabled,
      sizes,
      colorsEnabled,
      colors,
      fabrics: product?.fabrics || [],
      imageSvgType: imageSvgType || 'dress',
      customImage: customImage.trim() ? customImage.trim() : undefined,
      galleryImages: galleryImages, // دائماً مضمون (حتى لو فارغ) حتى يتم حذف الصور القديمة فعلياً
      bundleOffer: {
        enabled: bundleEnabled,
        stickerText: bundleStickerText.trim(),
        label: bundleLabel.trim() || 'عرض قطعتين (توفير خاص + توصيل مجاني)',
        price: Number(bundlePrice),
        originalPrice: bundleOriginalPrice ? Number(bundleOriginalPrice) : undefined,
      },
      customizations,
      priceCustomizations,
      hidden,
      hasDescriptionBorder,
      showDescriptionTitle,
      language: productLanguage,
      pageLanguageOverride,
      reviewsEnabled,
      customReviews,
      currency: productCurrency.trim() || undefined,
      formPlaceholders: (formPlaceholders.customerName?.trim() || formPlaceholders.phone?.trim() || formPlaceholders.city?.trim() || formPlaceholders.address?.trim()) ? formPlaceholders : undefined,
      citiesConfig: citySelectionMode === 'store' ? undefined : {
        mode: citySelectionMode,
        preset: citySelectionMode === 'custom' ? (cityPreset as any) : undefined,
        customCities: citySelectionMode === 'custom'
          ? customCitiesText
              .split(/[\n,،]+/)
              .map((c) => c.trim())
              .filter(Boolean)
          : undefined,
      },
      showDetailsBeforeForm,
      showBottomOrderForm,
      pageTemplate: pageTemplate || undefined,
    };
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    // فحص حجم الصور قبل الحفظ — حد Firestore 1MB لكل مستند، وbase64 يزيد الحجم ~37%
    const allImages = [customImage, ...galleryImages].filter(Boolean) as string[];
    const totalImgChars = allImages.reduce((sum, s) => sum + (s?.length || 0), 0);
    if (totalImgChars > 750000) {
      setSaveError('حجم الصور كبير جداً! احذف بعض الصور أو قلل عددها (الحد الآمن حوالي 4-5 صور). تعديلاتك ما زالت هنا.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      await onSave(buildCurrentProduct());
      onClose();
    } catch {
      setSaveError('تعذر حفظ المنتج على الخادم. غالباً بسبب كثرة/كبر الصور — احذف بعضها وحاول مجددًا. تعديلاتك ما زالت هنا.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateFromModal = async () => {
    if (!onDuplicate || isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await onDuplicate(buildCurrentProduct());
      onClose();
    } catch {
      setSaveError('تعذر حفظ نسخة المنتج على الخادم. حاول مجددًا.');
    } finally { setIsSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-black hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-stone-900">
            {isEditing ? 'تعديل بيانات المنتج وتخصيصاته' : 'إضافة منتج جديد إلى المتجر'}
          </h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {saveError && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{saveError}</p>}
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">اسم المنتج *</label>
            <input
              type="text"
              required
              placeholder="مثال: فستان سهرة مخملي راقي"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          {/* Pricing & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">سعر البيع الحالي *</label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 font-mono text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">السعر قبل الخصم (اختياري)</label>
              <input
                type="number"
                min="0"
                value={originalPrice !== undefined ? originalPrice : ''}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="بدون شطب"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 font-mono text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">التصنيف</label>
              <input
                type="text"
                placeholder="مثال: فساتين، أطقم، عبايات..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
              />
              {availableCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-stone-400">اختر سريعاً:</span>
                  {availableCategories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        category === c
                          ? 'bg-teal-700 text-white border-teal-700 font-bold'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Specific Currency Override */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>عملة هذا المنتج (مستقلة عن باقي المتجر)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-normal">
                {productCurrency ? `مخصصة: ${productCurrency}` : 'تعتمد عملة المتجر الافتراضية'}
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <select
                value={productCurrency ? (ALL_CURRENCIES.some(c => c.symbol === productCurrency || c.code === productCurrency) ? productCurrency : '__custom__') : ''}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setProductCurrency('');
                  } else if (e.target.value !== '__custom__') {
                    setProductCurrency(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold bg-white text-stone-800"
              >
                <option value="">تلقائي (اعتماد عملة المتجر العامة)</option>
                <optgroup label="العملات الشائعة">
                  <option value="د.م">درهم مغربي (د.م - MAD)</option>
                  <option value="د.ج">دينار جزائري (د.ج - DZD)</option>
                  <option value="د.ت">دينار تونسي (د.ت - TND)</option>
                  <option value="ج.م">جنيه مصري (ج.م - EGP)</option>
                  <option value="ر.س">ريال سعودي (ر.س - SAR)</option>
                  <option value="د.إ">درهم إماراتي (د.إ - AED)</option>
                  <option value="$">دولار أمريكي ($ - USD)</option>
                  <option value="€">يورو (€ - EUR)</option>
                </optgroup>
                <optgroup label="كافة العملات">
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
                placeholder="أو اكتب رمز عملة مخصص للمنتج هنا..."
                value={productCurrency}
                onChange={(e) => setProductCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-stone-900 text-right bg-white"
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              اتركها فارغة أو اختر "تلقائي" ليعتمد المنتج العملة العامة للمتجر، أو اختر عملة معينة إذا كنت تبيع هذا المنتج بعملة خاصة دون تغيير عملة المتجر.
            </p>
          </div>

          {/* 1. SECTION: Product Image (NOT Static - Dynamic and fully editable) */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-stone-700" />
                <span>صورة المنتج الرئيسية (غير ثابتة - قابلة للتغيير والرفع)</span>
              </label>
              {customImage && (
                <button
                  type="button"
                  onClick={() => setCustomImage('')}
                  className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الصورة الحالية</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* File Upload Button */}
              <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                {isUploadingMain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>جاري معالجة الصورة...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>اختر صورة من جهازك</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingMain}
                  onChange={handleMainImageFileUpload}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-stone-400">أو رابط مباشر:</span>

              <input
                type="url"
                placeholder="https://example.com/product-image.jpg"
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                className="flex-1 w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-left font-mono"
                dir="ltr"
              />
            </div>

            {/* Main Image Preview */}
            {customImage && (
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-teal-600 bg-white shadow-xs mx-auto sm:mx-0">
                <img
                  src={customImage}
                  alt="معاينة صورة المنتج"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Section: Additional Gallery Images */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  صور إضافية لمعرض المنتج (تظهر كمصغرات في صفحة المنتج)
                </h4>
                <p className="text-[11px] text-stone-500">
                  يمكنك رفع صور لزوايا مختلفة من جهازك
                </p>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                {isUploadingGallery ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                    <span>جاري الرفع...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صور</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploadingGallery}
                  onChange={handleGalleryImagesUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery Thumbnails List */}
            {galleryImages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-300 bg-white group">
                    <img src={img} alt={`مصغرة ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      title="حذف هذه الصورة"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. SECTION: Product Description & Features (Rich Word/YouCan-style WYSIWYG Editor) */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <label className="block text-xs font-bold text-stone-900">
                  وصف وصفحة المنتج (محرر مرئي شبيه بالوورد مثل يوكان و Storeep)
                </label>
                <p className="text-[11px] text-stone-500">
                  يمكنك كتابة نصوص وتنسيقها، إضافة صور من جهازك مباشرة، جداول، وصناديق مميزات
                </p>
              </div>
              <span className="self-start sm:self-auto text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                محرر نصوص وصور تفاعلي
              </span>
            </div>

            {/* The Rich Text / Word-style Editor */}
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="اكتب وصفاً جذاباً، أضف صوراً توضيحية لمنتجك، ونسق النصوص بكل سهولة..."
              minHeight="220px"
            />

            {/* Features / Bullet Points */}
            <div className="space-y-2 pt-1 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-900">
                نقاط مميزات ومواصفات المنتج (تظهر كنقاط أسفل الوصف):
              </label>

              {features.length > 0 ? (
                <div className="space-y-1.5">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white border border-stone-200 rounded-lg text-xs">
                      <span className="text-stone-800 flex-1">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="حذف هذه النقطة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-400">لا توجد نقاط محددة (سيعتمد العرض على نص الوصف أعلاه).</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="أضف ميزة جديدة (مثال: قماش قطني 100% عالي الجودة)"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  إضافة ميزة
                </button>
              </div>
            </div>

            {/* Description Border Box Style (تفعيل الإطار أو تركه عادي يملأ الشاشة بدون إطار) */}
            <div className="pt-2.5 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-900">
                  شكل ومظهر صندوق التفاصيل في صفحة المنتج:
                </label>
                <p className="text-[11px] text-stone-500">
                  يمكنك إزالة الإطار ليملأ العرض بانسيابية كجزء طبيعي من الموقع، أو وضعه في بطاقة بيضاء محددة
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setHasDescriptionBorder(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !hasDescriptionBorder
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  مدمج بدون إطار (يملأ الشاشة)
                </button>

                <button
                  type="button"
                  onClick={() => setHasDescriptionBorder(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hasDescriptionBorder
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  صندوق بإطار محدد
                </button>
              </div>
            </div>

            {/* Description Title & Star Icon Toggle (امكانية تفعيل ذلك النص "تفاصيل ومواصفات المنتج" والنجمة أو لا) */}
            <div className="pt-2.5 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-900">
                  عنوان وأيقونة "تفاصيل ومواصفات المنتج":
                </label>
                <p className="text-[11px] text-stone-500">
                  يمكنك إخفاء العنوان وأيقونة النجمة ليظهر محتوى الوصف والصور مباشرة أمام الزائر بدون فواصل
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDescriptionTitle(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    showDescriptionTitle
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  إظهار العنوان والنجمة
                </button>

                <button
                  type="button"
                  onClick={() => setShowDescriptionTitle(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !showDescriptionTitle
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  إخفاء العنوان تماماً
                </button>
              </div>
            </div>
          </div>

          {/* SECTION: تخطيط وتصميم صفحة المنتج (قالب الصفحة + تفاصيل فوق الاستمارة + استمارة سفلية) */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-700" />
                  <span>تخطيط وتصميم صفحة المنتج (قالب الصفحة وعرض التفاصيل)</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  تحكم في قالب عرض صفحة هذا المنتج، وفي إظهار التفاصيل فوق استمارة الطلب، وفي تكرار الاستمارة في أسفل الصفحة
                </p>
              </div>
            </div>

            {/* قالب صفحة المنتج */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                قالب صفحة المنتج (Product Page Template):
              </label>
              <select
                value={pageTemplate}
                onChange={(e) => setPageTemplate(e.target.value as ProductPageTemplate | '')}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold bg-white text-stone-800 focus:ring-1 focus:ring-teal-700"
              >
                <option value="">الافتراضي العام للمتجر (كلاسيكي إن لم يُحدد)</option>
                <option value="classic">كلاسيكي (الافتراضي — نفس التصميم الحالي)</option>
                <option value="modern">عصري (Modern — تصميم حديث وبسيط)</option>
                <option value="elegant">أنيق (Elegant — تصميم فاخر وهادئ)</option>
              </select>
              <p className="text-[10px] text-stone-500 mt-1">
                اتركه على "الافتراضي العام" ليعتمد قالب المتجر الموحد، أو اختر قالباً خاصاً بهذا المنتج فقط. يمكنك العودة للكلاسيكي متى شئت.
              </p>
            </div>

            {/* Toggle: إظهار التفاصيل فوق استمارة الطلب */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-stone-200/80">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-stone-900">إظهار تفاصيل ووصف المنتج فوق استمارة الطلب</div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  عند إلغاء التفعيل يُخفى قسم التفاصيل والمواصفات والمميزات والوصف وتصبح استمارة الطلب بارزة مباشرة (مفعل افتراضياً = السلوك الحالي)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showDetailsBeforeForm}
                  onChange={(e) => setShowDetailsBeforeForm(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                <span className="mr-2 text-xs font-bold text-stone-800">
                  {showDetailsBeforeForm ? 'مفعل' : 'معطل'}
                </span>
              </label>
            </div>

            {/* Toggle: استمارة الطلب في أسفل الصفحة */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-200/80">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-stone-900">إظهار استمارة الطلب مرة أخرى في أسفل الصفحة</div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  عند التفعيل تظهر نفس استمارة الطلب (مع الاسم والهاتف والمدينة والعنوان والكمية والمقاس واللون والتخصيصات) في أسفل الصفحة بعد التقييمات، وتتزامن مع الاستمارة العلوية بنفس الحالة (معطل افتراضياً = السلوك الحالي)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showBottomOrderForm}
                  onChange={(e) => setShowBottomOrderForm(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                <span className="mr-2 text-xs font-bold text-stone-800">
                  {showBottomOrderForm ? 'مفعل' : 'معطل'}
                </span>
              </label>
            </div>
          </div>

          {/* 3. SECTION: Sizes Toggle & Options (تفعيل أو إلغاء المقاسات) */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/60 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-stone-700" />
                  <span>تفعيل أو إلغاء خيار المقاسات</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  {sizesEnabled
                    ? 'المقاسات مفعلة وسيتمكن العميل من اختيار مقاسه.'
                    : 'المقاسات ملغاة ولن يظهر حقل اختيار المقاس للعميل.'}
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sizesEnabled}
                  onChange={(e) => setSizesEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                <span className="mr-2 text-xs font-bold text-stone-800">
                  {sizesEnabled ? 'مفعل' : 'معطل'}
                </span>
              </label>
            </div>

            {sizesEnabled ? (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-stone-800">
                  المقاسات المتوفرة لهذا المنتج:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {sizes.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-white border border-stone-300 px-2.5 py-1 rounded text-xs font-bold font-mono"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(s)}
                        className="text-stone-400 hover:text-rose-600 cursor-pointer"
                        title="حذف هذا المقاس"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {sizes.length === 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      يرجى إضافة مقاس واحد على الأقل أو إلغاء تفعيل المقاسات أعلاه
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="أضف مقاس جديد (مثلاً: L أو 42 أو موحد)"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSize();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    إضافة مقاس
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-stone-100 rounded-lg text-xs text-stone-500 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                <span>تم إلغاء المقاسات: سيتوفر المنتج بدون تحديد مقاس (مناسب للحقائب، الإكسسوارات، أو المقاس الموحد).</span>
              </div>
            )}
          </div>

          {/* 4. SECTION: Colors Toggle & Options (تفعيل أو إلغاء الألوان) */}
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/60 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-stone-700" />
                  <span>تفعيل أو إلغاء خيار الألوان</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  {colorsEnabled
                    ? 'الألوان مفعلة وسيتمكن العميل من اختيار اللون المفضل.'
                    : 'الألوان ملغاة ولن يظهر اختيار اللون للعميل.'}
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={colorsEnabled}
                  onChange={(e) => setColorsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                <span className="mr-2 text-xs font-bold text-stone-800">
                  {colorsEnabled ? 'مفعل' : 'معطل'}
                </span>
              </label>
            </div>

            {colorsEnabled ? (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-stone-800">
                  الألوان المتوفرة لهذا المنتج:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-white border border-stone-300 px-2.5 py-1 rounded text-xs font-medium"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-stone-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(i)}
                        className="text-stone-400 hover:text-rose-600 cursor-pointer mr-1"
                        title="حذف هذا اللون"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {colors.length === 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      يرجى إضافة لون واحد على الأقل أو إلغاء تفعيل الألوان أعلاه
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="اسم اللون (مثلاً: أزرق سماوي)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColor();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                  />
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-300 p-0 cursor-pointer shrink-0"
                    title="اختر درجة اللون"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    إضافة لون
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-stone-100 rounded-lg text-xs text-stone-500 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                <span>تم إلغاء الألوان: سيتوفر المنتج بلون موحد ولن يُطلب من العميل اختيار لون.</span>
              </div>
            )}
          </div>

          {/* 5. SECTION: Customizations (إمكانية إضافة أي تخصيص وتفعيله أو لا) */}
          <div className="border border-stone-200 rounded-xl p-4 bg-teal-50/40 border-teal-200 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200/80 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>تخصيصات المنتج الإضافية (إضافة أي تخصيص وتفعيله أو لا)</span>
                </h4>
                <p className="text-[11px] text-teal-800/80">
                  يمكنك إضافة أي خيار مخصص تريده للعميل (مثل: كتابة الاسم، نوع التطريز، إضافة تغليف هدايا، اختيار موديل) والتحكم في تفعيله أو إلغائه بنقرة زر.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomization(!showAddCustomization)}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة تخصيص</span>
              </button>
            </div>

            {/* List of existing customizations */}
            {customizations.length > 0 ? (
              <div className="space-y-2.5">
                {customizations.map((cust) => (
                  <div
                    key={cust.id}
                    className={`p-3 rounded-xl border transition-all ${
                      cust.enabled
                        ? 'bg-white border-teal-300 shadow-2xs'
                        : 'bg-stone-100 border-stone-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Toggle switch for each customization */}
                        <button
                          type="button"
                          onClick={() => handleToggleCustomization(cust.id)}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            cust.enabled ? 'bg-teal-700' : 'bg-stone-300'
                          }`}
                          title={cust.enabled ? 'اضغط للإلغاء/التعطيل' : 'اضغط للتفعيل'}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              cust.enabled ? 'translate-x-0' : '-translate-x-4'
                            }`}
                          />
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900 truncate">
                              {cust.title}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                cust.enabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {cust.enabled ? 'مفعل' : 'معطل'}
                            </span>
                            {cust.required && (
                              <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded font-bold">
                                إجباري
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-stone-500 mt-0.5">
                            النوع:{' '}
                            <span className="font-medium text-stone-700">
                              {cust.type === 'text' && 'حقل نصي يكتبه العميل'}
                              {cust.type === 'select' && `قائمة خيارات (${cust.options?.join(', ')})`}
                              {cust.type === 'checkbox' && 'خيار تحديد (نعم / لا)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomization(cust.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer shrink-0"
                        title="حذف هذا التخصيص نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-teal-900/70 text-center py-2">
                لا توجد تخصيصات مضافة حالياً. اضغط على <strong>"إضافة تخصيص"</strong> لإتاحة خيارات مخصصة لزبائنك.
              </p>
            )}

            {/* Subform to add a new customization */}
            {showAddCustomization && (
              <div className="p-4 bg-white rounded-xl border-2 border-teal-500/70 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h5 className="text-xs font-bold text-teal-900">إضافة تخصيص جديد لهذا المنتج</h5>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomization(false)}
                    className="text-stone-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-800 mb-1">
                      عنوان التخصيص *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: الاسم المراد تطريزه، نوع التغليف، نوع الحزام..."
                      value={newCustTitle}
                      onChange={(e) => setNewCustTitle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1">
                        نوع التخصيص
                      </label>
                      <select
                        value={newCustType}
                        onChange={(e) => setNewCustType(e.target.value as any)}
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                      >
                        <option value="text">حقل نصي (يكتب فيه العميل نصاً أو اسماً)</option>
                        <option value="select">قائمة خيارات (يختار منها العميل خياراً)</option>
                        <option value="checkbox">خيار تفعيل نعم/لا (مثل: إضافة تغليف هدايا)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1">
                        إجباري أم اختياري؟
                      </label>
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCustRequired}
                          onChange={(e) => setNewCustRequired(e.target.checked)}
                          className="w-4 h-4 rounded text-teal-700"
                        />
                        <span className="text-xs text-stone-700">مطلوب من الزبون قبل تأكيد الطلب</span>
                      </label>
                    </div>
                  </div>

                  {newCustType === 'text' && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1">
                        نص إرشادي داخل الحقل (Placeholder اختياري)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: اكتب الحروف أو الاسم المطلوب هنا..."
                        value={newCustPlaceholder}
                        onChange={(e) => setNewCustPlaceholder(e.target.value)}
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                      />
                    </div>
                  )}

                  {newCustType === 'select' && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1">
                        الخيارات المتاحة (افصل بينها بفواصل)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: ذهبي، فضي، برونزي"
                        value={newCustOptions}
                        onChange={(e) => setNewCustOptions(e.target.value)}
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomization(false)}
                      className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewCustomization}
                      disabled={!newCustTitle.trim()}
                      className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      إضافة وتفعيل
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Badge & Illustration fallback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                شارة نصية على بطاقة المنتج (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: الأكثر طلباً، عرض خاص..."
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                رسمة توضيحية بديلة (تظهر فقط عند عدم وجود صورة)
              </label>
              <select
                value={imageSvgType}
                onChange={(e) => setImageSvgType(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
              >
                <option value="dress">فستان أنيق</option>
                <option value="caftan">قفطان مغربي</option>
                <option value="djellaba">جلابة</option>
                <option value="survette">طقم سورفيت</option>
                <option value="blazer">بليزر / سترة رسمية</option>
                <option value="abaya">عباية مطرزة</option>
                <option value="coat">معطف شتوي</option>
                <option value="shirt">قميص ناصع</option>
                <option value="suit">بدلة رسمية</option>
              </select>
            </div>
          </div>

          {/* Price-affecting Customizations Editor (تخصيصات تؤثر على السعر) — منفصلة عن التخصيصات العادية */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  تخصيصات تؤثر على السعر (إضافات مدفوعة)
                </h5>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  كل خيار يضيف مبلغاً إضافياً إلى سعر المنتج عند اختياره من قبل الزبون (يظهر كخانات اختيار في صفحة المنتج)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPriceCustomization}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة تخصيص سعري
              </button>
            </div>

            {priceCustomizations.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-stone-400 bg-white rounded-lg border border-dashed border-stone-200">
                لا توجد إضافات مدفوعة لهذا المنتج. السعر الحالي ثابت بدون خيارات إضافية.
              </div>
            ) : (
              <div className="space-y-2">
                {priceCustomizations.map((pc) => (
                  <div
                    key={pc.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                      pc.enabled ? 'bg-white border-amber-300 shadow-2xs' : 'bg-stone-100 border-stone-200 opacity-70'
                    }`}
                  >
                    {/* Enable/Disable toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePriceCustomization(pc.id)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        pc.enabled ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                      title={pc.enabled ? 'اضغط للتعطيل' : 'اضغط للتفعيل'}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          pc.enabled ? 'translate-x-0' : '-translate-x-4'
                        }`}
                      />
                    </button>

                    {/* Name input */}
                    <input
                      type="text"
                      value={pc.name}
                      onChange={(e) => handleUpdatePriceCustomization(pc.id, 'name', e.target.value)}
                      placeholder="اسم الإضافة (مثال: قماش ملكي)"
                      className="flex-1 min-w-0 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />

                    {/* Price delta input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={pc.priceDelta}
                        onChange={(e) =>
                          handleUpdatePriceCustomization(pc.id, 'priceDelta', Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-20 px-2 py-2 bg-white border border-stone-300 rounded-lg text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="0"
                      />
                      <span className="text-[10px] text-stone-500 font-bold">{productCurrency.trim() || 'درهم'}</span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePriceCustomization(pc.id)}
                      className="text-stone-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer shrink-0"
                      title="حذف هذا التخصيص نهائياً"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Bundle Offer Customizer */}
          <div className="border border-stone-200 bg-stone-50/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>تفعيل باقة عرض قطعتين (اختياري)</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  يتيح للزبون خيار طلب قطعتين بسعر مخفض وشحن مجاني
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-stone-800">تفعيل:</span>
                <input
                  type="checkbox"
                  checked={bundleEnabled}
                  onChange={(e) => setBundleEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                />
              </label>
            </div>

            {bundleEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    تسمية الباقة
                  </label>
                  <input
                    type="text"
                    value={bundleLabel}
                    onChange={(e) => setBundleLabel(e.target.value)}
                    placeholder="مثال: عرض قطعتين (توفير خاص)"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    سعر الباقة المخفض *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    السعر الأصلي للباقة قبل الخصم
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bundleOriginalPrice !== undefined ? bundleOriginalPrice : ''}
                    onChange={(e) => setBundleOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    شارة فوق الباقة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={bundleStickerText}
                    onChange={(e) => setBundleStickerText(e.target.value)}
                    placeholder="مثال: عرض حبتين"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-right"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION: Product Reviews Settings & Custom Reviews Manager (تفعيل التقييمات وكتابة تقييمات بنفسك) */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>تقييمات وآراء العملاء لهذا المنتج</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  يمكنك تفعيل أو إلغاء التقييمات لهذا المنتج، وكتابة تقييمات بنفسك لتظهر في أسفل صفحة المنتج
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white border border-stone-300 px-3 py-1.5 rounded-lg hover:border-teal-600 transition-colors shrink-0">
                <input
                  type="checkbox"
                  checked={reviewsEnabled}
                  onChange={(e) => setReviewsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-800">
                  {reviewsEnabled ? 'التقييمات مفعّلة' : 'التقييمات ملغاة'}
                </span>
              </label>
            </div>

            {reviewsEnabled && (
              <div className="space-y-3 pt-1">
                {/* Header & Add Button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    التقييمات المسجلة ({customReviews.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddReview(!showAddReview)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>كتابة تقييم جديد للمنتج</span>
                  </button>
                </div>

                {/* Sub-form to write review in admin */}
                {showAddReview && (
                  <div className="p-3.5 bg-white border border-teal-300 rounded-xl space-y-2.5 shadow-2xs">
                    <div className="font-bold text-xs text-stone-900">
                      إضافة تقييم جديد للمنتج:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">اسم العميل *</label>
                        <input
                          type="text"
                          placeholder="مثال: مريم العلمي، سارة..."
                          value={newRevName}
                          onChange={(e) => setNewRevName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">عدد النجوم</label>
                        <select
                          value={newRevRating}
                          onChange={(e) => setNewRevRating(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5 نجوم - ممتاز)</option>
                          <option value="4">⭐⭐⭐⭐ (4 نجوم - رائع)</option>
                          <option value="3">⭐⭐⭐ (3 نجوم - جيد)</option>
                          <option value="2">⭐⭐ (نجمتان)</option>
                          <option value="1">⭐ (نجمة واحدة)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">نص التقييم والملاحظات *</label>
                      <textarea
                        rows={2}
                        placeholder="اكتب تجربة العميل ورأيه بالمنتج..."
                        value={newRevComment}
                        onChange={(e) => setNewRevComment(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs text-right resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddReview(false)}
                        className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleAddReviewFromAdmin}
                        disabled={!newRevName.trim() || !newRevComment.trim()}
                        className="px-3.5 py-1 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        حفظ ونشر التقييم
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Reviews List */}
                {customReviews.length === 0 ? (
                  <p className="text-[11px] text-stone-400 py-1">
                    لا توجد تقييمات مكتوبة مسبقاً. يمكنك كتابة تقييمات من الزر أعلاه لتظهر مباشرة للزبائن.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {customReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="flex items-center justify-between gap-2 p-2 bg-white border border-stone-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-bold text-stone-900 shrink-0">{rev.userName}</span>
                          <span className="text-amber-500 font-mono text-[11px] shrink-0">
                            {'★'.repeat(rev.rating)}
                          </span>
                          <span className="text-stone-600 truncate text-[11px]">{rev.comment}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewFromAdmin(rev.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                          title="حذف هذا التقييم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION: Product Language & Market Targeting (لغة وسوق ظهور المنتج، وتخصيص لغة هذه الصفحة) */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-3">
            <div className="border-b border-stone-200 pb-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>سوق ولغة ظهور المنتج (Market & Language Settings)</span>
              </h4>
              <p className="text-[11px] text-stone-500">
                حدد في أي سوق ولغة متجر يظهر هذا المنتج، مع إمكانية تحويل لغة صفحة هذا المنتج فقط
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* 1. Market Filter */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  سوق ظهور المنتج في المتجر:
                </label>
                <select
                  value={productLanguage}
                  onChange={(e) => setProductLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                >
                  <option value="all">كل الأسواق واللغات (يظهر دائماً)</option>
                  <option value="ar">السوق العربي فقط (العربية - RTL)</option>
                  <option value="fr">السوق الفرنسي فقط (Français - LTR)</option>
                  <option value="en">السوق الإنجليزي فقط (English - LTR)</option>
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  إذا اخترت السوق الفرنسي أو الإنجليزي، فلن يظهر هذا المنتج للزوار عندما يكون المتجر باللغة العربية
                </p>
              </div>

              {/* 2. Single Page Language Override */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  لغة صفحة هذا المنتج حصراً:
                </label>
                <select
                  value={pageLanguageOverride}
                  onChange={(e) => setPageLanguageOverride(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                >
                  <option value="store">حسب لغة المتجر العامة (تلقائي)</option>
                  <option value="ar">فرض اللغة العربية دائماً (العربية - RTL)</option>
                  <option value="fr">فرض اللغة الفرنسية لصفحة هذا المنتج (Français - LTR)</option>
                  <option value="en">فرض اللغة الإنجليزية لصفحة هذا المنتج (English - LTR)</option>
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  يتيح لك إطلاق حملة إعلانية لمنتج واحد باللغة الفرنسية أو الإنجليزية بشكل مستقل تماماً
                </p>
              </div>
            </div>
          </div>

          {/* SECTION: Product-Specific Form Placeholders */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-3">
            <div className="border-b border-stone-200 pb-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-700" />
                <span>تخصيص نصوص خانات الاستمارة (Placeholders) لهذا المنتج فقط</span>
              </h4>
              <p className="text-[11px] text-stone-500">
                يمكنك كتابة نصوص توضيحية مخصصة داخل حقول استمارة الطلب لهذا المنتج. إذا تركت أي خانة فارغة، ستعتمد تلقائياً النص المحدد للمتجر بالكامل أو النص الافتراضي للغة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">خانة الاسم واللقب</label>
                <input
                  type="text"
                  placeholder="افتراضي: حسب إعدادات المتجر..."
                  value={formPlaceholders.customerName || ''}
                  onChange={(e) =>
                    setFormPlaceholders((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">خانة رقم الهاتف</label>
                <input
                  type="text"
                  placeholder="افتراضي: حسب إعدادات المتجر..."
                  value={formPlaceholders.phone || ''}
                  onChange={(e) =>
                    setFormPlaceholders((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">خانة المدينة / الإقليم</label>
                <input
                  type="text"
                  placeholder="افتراضي: حسب إعدادات المتجر..."
                  value={formPlaceholders.city || ''}
                  onChange={(e) =>
                    setFormPlaceholders((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">خانة العنوان بالتفصيل</label>
                <input
                  type="text"
                  placeholder="افتراضي: حسب إعدادات المتجر..."
                  value={formPlaceholders.address || ''}
                  onChange={(e) =>
                    setFormPlaceholders((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-right"
                />
              </div>
            </div>
          </div>

          {/* SECTION: Product-Specific City Options (خيارات وقائمة المدن لهذا المنتج تحديداً) */}
          <div className="border border-stone-200 bg-stone-50/70 rounded-xl p-4 space-y-3.5">
            <div className="border-b border-stone-200 pb-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>خيارات وقائمة المدن في استمارة هذا المنتج (City Selection for this Product)</span>
              </h4>
              <p className="text-[11px] text-stone-500">
                يمكنك تخصيص قائمة مدن معينة لهذا المنتج (مثلاً عند استهداف سوق كالسعودية أو فرنسا)، أو إلغاء قائمة الخيارات وجعله حقل كتابة حر، أو تركه ليعتمد تلقائياً إعدادات المتجر العامة.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Option 1: Store Default */}
              <button
                type="button"
                onClick={() => setCitySelectionMode('store')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  citySelectionMode === 'store'
                    ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>حسب إعدادات المتجر العامة</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 font-normal leading-relaxed">
                  سيعتمد هذا المنتج على نفس قائمة المدن المحددة للمتجر
                </p>
              </button>

              {/* Option 2: Custom for this product */}
              <button
                type="button"
                onClick={() => {
                  setCitySelectionMode('custom');
                  if (!customCitiesText.trim()) {
                    setCustomCitiesText(CITY_PRESETS.morocco.cities.join('\n'));
                  }
                }}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  citySelectionMode === 'custom'
                    ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <span>✏️</span>
                  <span>تخصيص مدن خاصة بهذا المنتج</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 font-normal leading-relaxed">
                  تحديد مدن خاصة بسوق هذا المنتج (كالسعودية أو فرنسا...)
                </p>
              </button>

              {/* Option 3: Disabled / Free text */}
              <button
                type="button"
                onClick={() => setCitySelectionMode('disabled')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  citySelectionMode === 'disabled'
                    ? 'border-rose-600 bg-rose-50/80 text-rose-950 font-bold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <span>🚫</span>
                  <span>إلغاء قائمة المدن (حقل حر)</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 font-normal leading-relaxed">
                  حقل كتابة فارغ يكتب فيه الزبون أي مدينة بحرية دون خيارات
                </p>
              </button>
            </div>

            {/* Custom Cities Editor (when 'custom' is active) */}
            {citySelectionMode === 'custom' && (
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-3 mt-2 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-stone-800">
                    اختيار قائمة مدن جاهزة (Preset):
                  </label>
                  <select
                    value={cityPreset}
                    onChange={(e) => {
                      const selectedKey = e.target.value;
                      setCityPreset(selectedKey);
                      if (CITY_PRESETS[selectedKey]) {
                        setCustomCitiesText(CITY_PRESETS[selectedKey].cities.join('\n'));
                      }
                    }}
                    className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-stone-50 font-medium"
                  >
                    <option value="morocco">🇲🇦 المغرب</option>
                    <option value="saudi">🇸🇦 المملكة العربية السعودية</option>
                    <option value="uae">🇦🇪 الإمارات العربية المتحدة</option>
                    <option value="algeria">🇩🇿 الجزائر</option>
                    <option value="tunisia">🇹🇳 تونس</option>
                    <option value="egypt">🇪🇬 مصر</option>
                    <option value="france">🇫🇷 فرنسا (France)</option>
                    <option value="custom">✏️ قائمة مدن مخصصة يدوياً...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    قائمة مدن هذا المنتج (افصل بين المدن بسطر جديد أو فاصلة):
                  </label>
                  <textarea
                    rows={4}
                    dir="auto"
                    value={customCitiesText}
                    onChange={(e) => {
                      setCustomCitiesText(e.target.value);
                      setCityPreset('custom');
                    }}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 leading-relaxed font-sans"
                    placeholder="الرياض&#10;جدة&#10;الدمام..."
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    عدد المدن المسجلة لهذا المنتج:{' '}
                    {customCitiesText.split(/[\n,،]+/).filter((c) => c.trim()).length} مدينة
                  </span>
                </div>
              </div>
            )}

            {citySelectionMode === 'disabled' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                ستظهر خانة المدينة لصفحة هذا المنتج كحقل كتابة حر بدون أي اقتراحات إجبارية.
              </div>
            )}
          </div>

          {/* In stock toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-stone-800">حالة توفر المنتج في المخزون</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* إخفاء المنتج من المتجر (مسودة) */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold text-stone-800 block">إخفاء المنتج من المتجر (مسودة)</span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                {hidden ? 'المنتج مخفي عن الزوار ولا يظهر في البحث أو التصنيفات' : 'المنتج ظاهر للزوار في المتجر'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3 sticky bottom-0 bg-white py-2 flex-wrap">
            <div>
              {isEditing && onDuplicate && (
                <button
                  type="button"
                  onClick={handleDuplicateFromModal}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="إنشاء نسخة مكررة جديدة من هذا المنتج مع كامل تفاصيله وإعداداته"
                >
                  <Files className="w-3.5 h-3.5" />
                  <span>تكرار كمنتج جديد (Duplicate)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {isSaving ? 'جاري الحفظ…' : 'حفظ بيانات وتخصيصات المنتج'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
