export interface CurrencyItem {
  code: string;
  symbol: string;
  label: string;
  country: string;
}

export const ALL_CURRENCIES: CurrencyItem[] = [
  // المغرب ودول شمال إفريقيا
  { code: 'MAD', symbol: 'د.م', label: 'درهم مغربي (MAD - د.م)', country: 'المغرب' },
  { code: 'DZD', symbol: 'د.ج', label: 'دينار جزائري (DZD - د.ج)', country: 'الجزائر' },
  { code: 'TND', symbol: 'د.ت', label: 'دينار تونسي (TND - د.ت)', country: 'تونس' },
  { code: 'EGP', symbol: 'ج.م', label: 'جنيه مصري (EGP - ج.م)', country: 'مصر' },
  { code: 'LYD', symbol: 'د.ل', label: 'دينار ليبي (LYD - د.ل)', country: 'ليبيا' },
  { code: 'MRU', symbol: 'أ.م', label: 'أوقية موريتانية (MRU)', country: 'موريتانيا' },
  { code: 'SDG', symbol: 'ج.س', label: 'جنيه سوداني (SDG)', country: 'السودان' },

  // دول الخليج العربي والشرق الأوسط
  { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي (SAR - ر.س)', country: 'السعودية' },
  { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي (AED - د.إ)', country: 'الإمارات' },
  { code: 'KWD', symbol: 'د.ك', label: 'دينار كويتي (KWD - د.ك)', country: 'الكويت' },
  { code: 'QAR', symbol: 'ر.ق', label: 'ريال قطري (QAR - ر.ق)', country: 'قطر' },
  { code: 'BHD', symbol: 'د.ب', label: 'دينار بحريني (BHD - د.ب)', country: 'البحرين' },
  { code: 'OMR', symbol: 'ر.ع', label: 'ريال عماني (OMR - ر.ع)', country: 'سلطنة عمان' },
  { code: 'JOD', symbol: 'د.أ', label: 'دينار أردني (JOD - د.أ)', country: 'الأردن' },
  { code: 'IQD', symbol: 'د.ع', label: 'دينار عراقي (IQD - د.ع)', country: 'العراق' },
  { code: 'LBP', symbol: 'ل.ل', label: 'ليرة لبنانية (LBP - ل.ل)', country: 'لبنان' },
  { code: 'TRY', symbol: '₺', label: 'ليرة تركية (TRY - ₺)', country: 'تركيا' },

  // العملات العالمية الكبرى
  { code: 'USD', symbol: '$', label: 'دولار أمريكي (USD - $)', country: 'الولايات المتحدة / عالمي' },
  { code: 'EUR', symbol: '€', label: 'يورو أوروبي (EUR - €)', country: 'منطقة اليورو' },
  { code: 'GBP', symbol: '£', label: 'جنيه إسترليني (GBP - £)', country: 'المملكة المتحدة' },
  { code: 'CAD', symbol: 'CA$', label: 'دولار كندي (CAD - CA$)', country: 'كندا' },
  { code: 'AUD', symbol: 'A$', label: 'دولار أسترالي (AUD - A$)', country: 'أستراليا' },
  { code: 'CHF', symbol: 'CHF', label: 'فرنك سويسري (CHF)', country: 'سويسرا' },
  { code: 'JPY', symbol: '¥', label: 'ين ياباني (JPY - ¥)', country: 'اليابان' },
  { code: 'CNY', symbol: '¥', label: 'يوان صيني (CNY - ¥)', country: 'الصين' },
  { code: 'INR', symbol: '₹', label: 'روبية هندية (INR - ₹)', country: 'الهند' },
  { code: 'BRL', symbol: 'R$', label: 'ريال برازيلي (BRL - R$)', country: 'البرازيل' },
  { code: 'RUB', symbol: '₽', label: 'روبل روسي (RUB - ₽)', country: 'روسيا' },
  { code: 'SEK', symbol: 'kr', label: 'كرونة سويدية (SEK - kr)', country: 'السويد' },
  { code: 'NOK', symbol: 'kr', label: 'كرونة نرويجية (NOK - kr)', country: 'النرويج' },
  { code: 'DKK', symbol: 'kr', label: 'كرونة دنماركية (DKK - kr)', country: 'الدنمارك' },
  { code: 'PLN', symbol: 'zł', label: 'زلوتي بولندي (PLN - zł)', country: 'بولندا' },
  { code: 'XOF', symbol: 'CFA', label: 'فرنك غرب إفريقي (XOF - CFA)', country: 'غرب إفريقيا (السنغال، ساحل العاج...)' },
  { code: 'XAF', symbol: 'FCFA', label: 'فرنك وسط إفريقي (XAF - FCFA)', country: 'وسط إفريقيا (الكاميرون، الغابون...)' },
  { code: 'ZAR', symbol: 'R', label: 'راند جنوب إفريقي (ZAR - R)', country: 'جنوب إفريقيا' },
  { code: 'NGN', symbol: '₦', label: 'نايرا نيجيرية (NGN - ₦)', country: 'نيجيريا' },
  { code: 'GHS', symbol: 'GH₵', label: 'سيدي غاني (GHS - GH₵)', country: 'غانا' },
  { code: 'KES', symbol: 'KSh', label: 'شلن كيني (KES - KSh)', country: 'كينيا' },
];
