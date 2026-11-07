import { Product, StoreSettings, CityOptionsConfig, ProductCityConfig } from '../types';

export const CITY_PRESETS: Record<string, { label: string; flag: string; cities: string[] }> = {
  morocco: {
    label: 'المغرب (Morocco)',
    flag: '🇲🇦',
    cities: [
      'الدار البيضاء (Casablanca)',
      'الرباط (Rabat)',
      'مراكش (Marrakech)',
      'طنجة (Tanger)',
      'فاس (Fès)',
      'أكادير (Agadir)',
      'مكناس (Meknès)',
      'وجدة (Oujda)',
      'القنيطرة (Kénitra)',
      'تطوان (Tétouan)',
      'تمارة (Témara)',
      'آسفي (Safi)',
      'المحمدية (Mohammédia)',
      'الجديدة (El Jadida)',
      'بني ملال (Béni Mellal)',
      'الناظور (Nador)',
      'خريبكة (Khouribga)',
      'سطات (Settat)',
      'تازة (Taza)',
      'العيون (Laâyoune)',
      'الداخلة (Dakhla)',
      'بركان (Berkane)',
      'العرائش (Larache)',
      'كلميم (Guelmim)',
    ],
  },
  saudi: {
    label: 'المملكة العربية السعودية (KSA)',
    flag: '🇸🇦',
    cities: [
      'الرياض',
      'جدة',
      'مكة المكرمة',
      'المدينة المنورة',
      'الدمام',
      'الخبر',
      'الظهران',
      'الأحساء / الهفوف',
      'الطائف',
      'تبوك',
      'بريدة',
      'عنيزة',
      'أبها',
      'خميس مشيط',
      'حائل',
      'نجران',
      'جازان',
      'ينبع',
      'الجبيل',
      'حفر الباطن',
      'الخرج',
      'القطيف',
    ],
  },
  uae: {
    label: 'الإمارات العربية المتحدة (UAE)',
    flag: '🇦🇪',
    cities: [
      'دبي (Dubai)',
      'أبوظبي (Abu Dhabi)',
      'الشارقة (Sharjah)',
      'عجمان (Ajman)',
      'رأس الخيمة (Ras Al Khaimah)',
      'الفجيرة (Fujairah)',
      'أم القيوين (Umm Al Quwain)',
      'العين (Al Ain)',
    ],
  },
  algeria: {
    label: 'الجزائر (Algeria)',
    flag: '🇩🇿',
    cities: [
      'الجزائر العاصمة (Alger)',
      'وهران (Oran)',
      'قسنطينة (Constantine)',
      'عنابة (Annaba)',
      'البليدة (Blida)',
      'باتنة (Batna)',
      'سطيف (Sétif)',
      'تلمسان (Tlemcen)',
      'سيدي بلعباس (Sidi Bel Abbès)',
      'بسكرة (Biskra)',
      'بجاية (Béjaïa)',
      'تيزي وزو (Tizi Ouzou)',
      'الشلف (Chlef)',
      'مستغانم (Mostaganem)',
      'سكيكدة (Skikda)',
    ],
  },
  tunisia: {
    label: 'تونس (Tunisia)',
    flag: '🇹🇳',
    cities: [
      'تونس العاصمة (Tunis)',
      'صفاقس (Sfax)',
      'سوسة (Sousse)',
      'التضامن (Ettadhamen)',
      'القيروان (Kairouan)',
      'قابس (Gabès)',
      'بنزرت (Bizerte)',
      'أريانة (Ariana)',
      'قفصة (Gafsa)',
      'المروج (El Mourouj)',
      'المنستير (Monastir)',
      'نابل (Nabeul)',
      'بن عروس (Ben Arous)',
    ],
  },
  egypt: {
    label: 'مصر (Egypt)',
    flag: '🇪🇬',
    cities: [
      'القاهرة',
      'الجيزة',
      'الإسكندرية',
      'المنصورة',
      'طنطا',
      'الزقازيق',
      'بورسعيد',
      'السويس',
      'دمياط',
      'أسيوط',
      'الإسماعيلية',
      'الفيوم',
      'بني سويف',
      'سوهاج',
      'المنيا',
      'قنا',
      'أسوان',
      'الأقصر',
    ],
  },
  france: {
    label: 'فرنسا (France)',
    flag: '🇫🇷',
    cities: [
      'Paris',
      'Marseille',
      'Lyon',
      'Toulouse',
      'Nice',
      'Nantes',
      'Montpellier',
      'Strasbourg',
      'Bordeaux',
      'Lille',
      'Rennes',
      'Reims',
      'Toulon',
      'Saint-Étienne',
      'Le Havre',
      'Grenoble',
    ],
  },
};

export const DEFAULT_MOROCCAN_CITIES = CITY_PRESETS.morocco.cities;

/**
 * Resolves the effective city configuration for a product.
 * Returns { enabled: boolean, cities: string[] }
 * Hierarchical order:
 * 1. If product explicitly disables city choices -> enabled: false
 * 2. If product has custom cities configured -> enabled: true, custom cities
 * 3. Fallback to StoreSettings -> if disabled, enabled: false; else store cities or default Moroccan cities.
 */
export function resolveProductCities(
  product?: Product | null,
  storeSettings?: StoreSettings | null
): { enabled: boolean; cities: string[] } {
  // 1. Product-level override check
  if (product?.citiesConfig) {
    if (product.citiesConfig.mode === 'disabled') {
      return { enabled: false, cities: [] };
    }
    if (product.citiesConfig.mode === 'custom') {
      const cities =
        Array.isArray(product.citiesConfig.customCities) && product.citiesConfig.customCities.length > 0
          ? product.citiesConfig.customCities
          : product.citiesConfig.preset && CITY_PRESETS[product.citiesConfig.preset]
          ? CITY_PRESETS[product.citiesConfig.preset].cities
          : [];
      return {
        enabled: cities.length > 0,
        cities,
      };
    }
  }

  // 2. Store-level settings fallback
  if (storeSettings?.cities) {
    if (storeSettings.cities.enabled === false) {
      return { enabled: false, cities: [] };
    }
    if (Array.isArray(storeSettings.cities.customCities) && storeSettings.cities.customCities.length > 0) {
      return { enabled: true, cities: storeSettings.cities.customCities };
    }
    if (storeSettings.cities.preset && CITY_PRESETS[storeSettings.cities.preset]) {
      return { enabled: true, cities: CITY_PRESETS[storeSettings.cities.preset].cities };
    }
  }

  // 3. Default fallback: Moroccan cities enabled by default unless turned off
  return {
    enabled: true,
    cities: DEFAULT_MOROCCAN_CITIES,
  };
}
