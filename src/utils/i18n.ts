export type AppLanguage = 'ar' | 'fr' | 'en';
export type ProductLanguageTarget = 'all' | 'ar' | 'fr' | 'en';

export interface Translations {
  searchPlaceholder: string;
  allCategories: string;
  orderNow: string;
  submittingOrder: string;
  confirmOrder: string;
  cashOnDeliveryBadge: string;
  freeShippingBadge: string;
  fastShippingBadge: string;
  directWhatsApp: string;
  phoneOrWhatsApp: string;
  customerNameLabel: string;
  customerNamePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  colorLabel: string;
  sizeLabel: string;
  selectSize: string;
  selectColor: string;
  customizationTitle: string;
  orderFormTitle: string;
  orderFormSubtitle: string;
  productPrice: string;
  totalCod: string;
  codGuarantee: string;
  fastDelivery: string;
  fastDeliveryDesc: string;
  easyReturn: string;
  easyReturnDesc: string;
  quantityLabel: string;
  productDetailsHeading: string;
  additionalFeatures: string;
  reviewsHeading: string;
  addReviewBtn: string;
  closeBtn: string;
  writeReviewHeading: string;
  submitReviewBtn: string;
  userNameLabel: string;
  userNamePlaceholder: string;
  starRatingLabel: string;
  reviewCommentLabel: string;
  reviewCommentPlaceholder: string;
  visitorPhotoBtn: string;
  uploadPhotoBtn: string;
  choosePhoto: string;
  changePhoto: string;
  verifiedPurchaseBadge: string;
  helpfulBtn: string;
  noReviewsYet: string;
  reviewSuccessMessage: string;
  cartTitle: string;
  emptyCart: string;
  continueShopping: string;
  cartTotal: string;
  currency: string;
  orderSuccessTitle: string;
  orderSuccessSubtitle: string;
  orderNumber: string;
  backToShopping: string;
  backToStore: string;
  enlargeImage: string;
  popularCities: string[];
  // Product Page & Cart Constants:
  availableColors: string;
  choosePackage: string;
  singlePiece: string;
  standardOrder: string;
  saveMoreFreeShipping: string;
  withCustomization: string;
  withoutCustomization: string;
  suggestedCities: string;
  imageCountOf: (current: number, total: number) => string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  prevImage: string;
  nextImage: string;
  increaseQty: string;
  decreaseQty: string;
  directWhatsAppContact: string;
  directWhatsAppTitle: string;
  cartItemsCount: string;
  freeShippingBanner: string;
  browseProducts: string;
  itemsDetails: string;
  totalAmountDue: string;
  registeredPhone: string;
  deliveryAddress: string;
  paymentMethodCod: string;
  deliveryNotice: string;
  thankYouOrder: string;
  orderReceivedSuccess: string;
  yourOrderNumber: string;
  imageTooLarge: string;
  enterNameError: string;
  enterReviewError: string;
  justNow: string;
  avatarOrVisitor: string;
  fillAllFieldsError: string;
  nameRequiredError: string;
  phoneRequiredError: string;
  cityRequiredError: string;
  addressRequiredError: string;
  pleaseSpecifyCust: string;
  deliveryInfoCod: string;
  editItems: string;
  emptyCartSubtitle: string;
  productsPriceLabel: string;
  proceedToConfirmCod: string;
  orderConfirmationInProgress: string;
  confirmOrderWithTotal: (total: number, currency: string) => string;
  orderSyncedSheets: string;
  followOrderOnWhatsApp: string;
  continueShoppingStore: string;
  orderWhatsAppMsg: (orderNum: string, name: string, total: number, curr: string) => string;
  productInquiryWhatsAppMsg: (productName: string, packageDesc: string, price: number, curr: string) => string;
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  ar: {
    searchPlaceholder: 'ابحث من هنا',
    allCategories: 'الكل',
    orderNow: 'أطلب الان !',
    submittingOrder: 'جاري إرسال طلبك...',
    confirmOrder: 'تأكيد الطلب الآن (الدفع نقداً عند الاستلام)',
    cashOnDeliveryBadge: 'الدفع عند الاستلام بعد المعاينة',
    freeShippingBadge: 'توصيل مجاني وسريع',
    fastShippingBadge: 'توصيل في 24-48 ساعة',
    directWhatsApp: 'تواصل واطلب عبر الواتساب',
    phoneOrWhatsApp: 'الهاتف / الواتساب',
    customerNameLabel: 'الاسم الكامل *',
    customerNamePlaceholder: 'الإسم الكامل',
    phoneLabel: 'رقم الهاتف *',
    phonePlaceholder: 'رقم الهاتف (مثال: 0612345678)',
    cityLabel: 'المدينة أو الإقليم *',
    cityPlaceholder: 'المدينة (مثال: الدار البيضاء، الرباط، طنجة...)',
    addressLabel: 'العنوان التفصيلي للتوصيل *',
    addressPlaceholder: 'العنوان بالتفصيل (الحي، الشارع، رقم الدار/الإقامة)',
    notesLabel: 'ملاحظات إضافية للمندوب (اختياري)',
    notesPlaceholder: 'مثال: يرجى الاتصال قبل الوصول...',
    colorLabel: 'اختر اللون المطلوب:',
    sizeLabel: 'اختر المقاس المناسب:',
    selectSize: 'المقاس',
    selectColor: 'اللون',
    customizationTitle: 'تخصيص إضافي',
    orderFormTitle: 'معلومات الزبون للطلب',
    orderFormSubtitle: 'قم بملء الاستمارة لإتمام طلبك، سنتصل بك لتأكيد الإرسال والشحن',
    productPrice: 'سعر المنتج',
    totalCod: 'المجموع الكلي للدفع عند الاستلام',
    codGuarantee: 'الدفع نقداً بعد استلام ومعاينة الطلب (COD)',
    fastDelivery: 'شحن سريع لكافة المدن',
    fastDeliveryDesc: 'توصيل من 24 إلى 48 ساعة إلى باب منزلك',
    easyReturn: 'استبدال سهل وسريع',
    easyReturnDesc: 'خدمة عملاء عبر الواتساب على مدار الساعة',
    quantityLabel: 'الكمية المطلوبة:',
    productDetailsHeading: 'تفاصيل ومواصفات المنتج',
    additionalFeatures: 'مميزات إضافية',
    reviewsHeading: 'التقييمات',
    addReviewBtn: 'أضف تقييم',
    closeBtn: 'إغلاق',
    writeReviewHeading: 'كتابة تقييم جديد للمنتج:',
    submitReviewBtn: 'نشر التقييم الآن',
    userNameLabel: 'الاسم *',
    userNamePlaceholder: 'اكتب اسمك هنا...',
    starRatingLabel: 'عدد النجوم:',
    reviewCommentLabel: 'التقييم كتابة *',
    reviewCommentPlaceholder: 'اكتب رأيك وتجربتك في المنتج...',
    visitorPhotoBtn: 'صورة زائر',
    uploadPhotoBtn: 'رفع صورة',
    choosePhoto: 'اختيار صورة',
    changePhoto: 'تغيير الصورة',
    verifiedPurchaseBadge: 'شراء مؤكد',
    helpfulBtn: 'مفيد',
    noReviewsYet: 'لا توجد تقييمات حالياً، كن أول من يقيّم!',
    reviewSuccessMessage: 'تمت إضافة تقييمك بنجاح!',
    cartTitle: 'سلة المشتريات',
    emptyCart: 'سلة المشتريات فارغة حالياً',
    continueShopping: 'متابعة التسوق',
    cartTotal: 'المجموع الإجمالي:',
    currency: 'د.م',
    orderSuccessTitle: 'تم تأكيد طلبك بنجاح!',
    orderSuccessSubtitle: 'شكراً لثقتك بنا. سنقوم بتجهيز وشحن طلبك فوراً والتواصل معك لتأكيد موعد التوصيل.',
    orderNumber: 'رقم الطلب:',
    backToShopping: 'العودة للتسوق',
    backToStore: 'العودة للمتجر',
    enlargeImage: 'تكبير الصورة',
    popularCities: [
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
    ],
    // New constants:
    availableColors: 'الألوان المتوفرة',
    choosePackage: 'اختر العرض المناسب لك:',
    singlePiece: 'قطعة واحدة',
    standardOrder: 'الطلب القياسي',
    saveMoreFreeShipping: 'وفر أكثر + شحن مجاني',
    withCustomization: 'نعم، مع',
    withoutCustomization: 'بدون',
    suggestedCities: 'مدن مقترحة:',
    imageCountOf: (cur, tot) => `صورة ${cur} من ${tot}`,
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    resetZoom: 'إعادة الحجم الافتراضي',
    prevImage: 'الصورة السابقة',
    nextImage: 'الصورة التالية',
    increaseQty: 'زيادة الكمية',
    decreaseQty: 'إنقاص الكمية',
    directWhatsAppContact: 'تواصل واطلب عبر الواتساب',
    directWhatsAppTitle: 'تواصل مباشر عبر الواتساب',
    cartItemsCount: 'منتجات',
    freeShippingBanner: 'التوصيل مجاني 100% لجميع الطلبات والدفع عند الاستلام',
    browseProducts: 'تصفح المنتجات',
    itemsDetails: 'تفاصيل المنتجات:',
    totalAmountDue: 'المجموع الكلي المطلوب:',
    registeredPhone: 'رقم الهاتف المسجل:',
    deliveryAddress: 'عنوان التوصيل:',
    paymentMethodCod: 'طريقة الدفع: الدفع نقداً عند الاستلام (COD)',
    deliveryNotice: 'سيقوم فريق الشحن والتوصيل بالتواصل معك عبر الهاتف للتسليم خلال 24-48 ساعة.',
    thankYouOrder: 'شكراً لثقتكم بنا',
    orderReceivedSuccess: 'تم استلام وتأكيد طلبك بنجاح!',
    yourOrderNumber: 'رقم الطلب الخاص بك:',
    imageTooLarge: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5MB',
    enterNameError: 'يرجى كتابة الاسم',
    enterReviewError: 'يرجى كتابة التقييم',
    justNow: 'الآن',
    avatarOrVisitor: 'صورة المستخدم أو صورة زائر:',
    fillAllFieldsError: 'يرجى ملء جميع الحقول المطلوبة لتأكيد التوصيل.',
    nameRequiredError: 'يرجى إدخال الإسم الكامل لتأكيد الطلب.',
    phoneRequiredError: 'يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد الشحنة (مثال: 0612345678).',
    cityRequiredError: 'يرجى كتابة أو اختيار المدينة.',
    addressRequiredError: 'يرجى كتابة العنوان بالتفصيل (الحي، الشارع، رقم المنزل).',
    pleaseSpecifyCust: 'يرجى تحديد أو إدخال:',
    deliveryInfoCod: 'بيانات التوصيل (الدفع عند الاستلام)',
    editItems: 'تعديل المنتجات',
    emptyCartSubtitle: 'تصفح تشكيلة منتجاتنا المتنوعة واختر ما يناسبك وسنصله لك.',
    productsPriceLabel: 'سعر المنتجات:',
    proceedToConfirmCod: 'متابعة لتأكيد الطلب (الدفع عند الاستلام)',
    orderConfirmationInProgress: 'جاري تأكيد طلبك...',
    confirmOrderWithTotal: (tot, curr) => `تأكيد الطلب الآن (${tot} ${curr})`,
    orderSyncedSheets: 'تمت مزامنة الطلب تلقائياً مع قاعدة البيانات و Google Sheets',
    followOrderOnWhatsApp: 'متابعة الطلب عبر واتساب مع خدمة العملاء',
    continueShoppingStore: 'متابعة التسوق في المتجر',
    orderWhatsAppMsg: (orderNum, name, total, curr) =>
      `مرحباً، قمت بتأكيد الطلب رقم ${orderNum} باسم ${name}.\nالمبلغ الإجمالي: ${total} ${curr}.\nأود متابعة حالة الشحن.`,
    productInquiryWhatsAppMsg: (productName, packageDesc, price, curr) =>
      `مرحباً EGASA، أود الاستفسار وطلب منتج: ${productName} (${packageDesc}) بسعر ${price} ${curr}.`,
  },
  fr: {
    searchPlaceholder: 'Rechercher ici...',
    allCategories: 'Tous',
    orderNow: 'Commander maintenant !',
    submittingOrder: 'Envoi de votre commande...',
    confirmOrder: 'Confirmer la commande (Paiement à la livraison)',
    cashOnDeliveryBadge: 'Paiement à la livraison après vérification',
    freeShippingBadge: 'Livraison gratuite et rapide',
    fastShippingBadge: 'Livraison en 24-48h',
    directWhatsApp: 'Commander via WhatsApp',
    phoneOrWhatsApp: 'Téléphone / WhatsApp',
    customerNameLabel: 'Nom complet *',
    customerNamePlaceholder: 'Nom et prénom',
    phoneLabel: 'Numéro de téléphone *',
    phonePlaceholder: 'Numéro de téléphone (ex: 0612345678)',
    cityLabel: 'Ville ou Région *',
    cityPlaceholder: 'Ville (ex: Casablanca, Rabat, Paris...)',
    addressLabel: 'Adresse de livraison détaillée *',
    addressPlaceholder: 'Adresse détaillée (quartier, rue, n°)',
    notesLabel: 'Instructions de livraison (Optionnel)',
    notesPlaceholder: 'Ex: Appeler avant la livraison...',
    colorLabel: 'Choisissez la couleur :',
    sizeLabel: 'Choisissez la taille :',
    selectSize: 'Taille',
    selectColor: 'Couleur',
    customizationTitle: 'Option personnalisée',
    orderFormTitle: 'Informations de commande',
    orderFormSubtitle: 'Remplissez le formulaire ci-dessous pour confirmer votre commande',
    productPrice: 'Prix du produit',
    totalCod: 'Total à payer à la livraison (COD)',
    codGuarantee: 'Paiement en espèces à la livraison après inspection (COD)',
    fastDelivery: 'Livraison rapide partout',
    fastDeliveryDesc: 'Livraison en 24 à 48 heures directement à votre porte',
    easyReturn: 'Échange & retour faciles',
    easyReturnDesc: 'Assistance client via WhatsApp 24/7',
    quantityLabel: 'Quantité :',
    productDetailsHeading: 'Détails et spécifications du produit',
    additionalFeatures: 'Caractéristiques supplémentaires',
    reviewsHeading: 'Avis clients',
    addReviewBtn: 'Donner un avis',
    closeBtn: 'Fermer',
    writeReviewHeading: 'Rédiger un nouvel avis :',
    submitReviewBtn: 'Publier mon avis',
    userNameLabel: 'Votre nom *',
    userNamePlaceholder: 'Écrivez votre nom ici...',
    starRatingLabel: 'Note en étoiles :',
    reviewCommentLabel: 'Votre avis écrit *',
    reviewCommentPlaceholder: 'Partagez votre expérience avec le produit...',
    visitorPhotoBtn: 'Avatar visiteur',
    uploadPhotoBtn: 'Photo perso',
    choosePhoto: 'Choisir une photo',
    changePhoto: 'Changer la photo',
    verifiedPurchaseBadge: 'Achat vérifié',
    helpfulBtn: 'Utile',
    noReviewsYet: 'Aucun avis pour le moment. Soyez le premier à donner votre avis !',
    reviewSuccessMessage: 'Votre avis a été publié avec succès !',
    cartTitle: 'Mon Panier',
    emptyCart: 'Votre panier est vide',
    continueShopping: 'Continuer mes achats',
    cartTotal: 'Total de la commande :',
    currency: 'DH',
    orderSuccessTitle: 'Commande confirmée avec succès !',
    orderSuccessSubtitle: 'Merci pour votre confiance. Votre colis est en cours de préparation et nous vous contacterons sous peu pour la livraison.',
    orderNumber: 'Numéro de commande :',
    backToShopping: 'Retour à la boutique',
    backToStore: 'Retour au magasin',
    enlargeImage: 'Agrandir l\'image',
    popularCities: [
      'Casablanca',
      'Rabat',
      'Marrakech',
      'Tanger',
      'Fès',
      'Agadir',
      'Meknès',
      'Oujda',
      'Kénitra',
      'Tétouan',
      'Paris',
      'Lyon',
      'Marseille',
      'Bruxelles',
    ],
    // New constants:
    availableColors: 'Couleurs disponibles',
    choosePackage: 'Choisissez votre offre :',
    singlePiece: '1 pièce',
    standardOrder: 'Commande standard',
    saveMoreFreeShipping: 'Économisez plus + Livraison gratuite',
    withCustomization: 'Oui, avec',
    withoutCustomization: 'Sans',
    suggestedCities: 'Villes suggérées :',
    imageCountOf: (cur, tot) => `Image ${cur} sur ${tot}`,
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    resetZoom: 'Taille normale',
    prevImage: 'Image précédente',
    nextImage: 'Image suivante',
    increaseQty: 'Augmenter la quantité',
    decreaseQty: 'Diminuer la quantité',
    directWhatsAppContact: 'Commander via WhatsApp',
    directWhatsAppTitle: 'Contact direct WhatsApp',
    cartItemsCount: 'articles',
    freeShippingBanner: 'Livraison 100% gratuite et paiement à la livraison',
    browseProducts: 'Découvrir nos produits',
    itemsDetails: 'Détails des articles :',
    totalAmountDue: 'Montant total dû :',
    registeredPhone: 'Numéro de téléphone enregistré :',
    deliveryAddress: 'Adresse de livraison :',
    paymentMethodCod: 'Mode de paiement : Paiement à la livraison (COD)',
    deliveryNotice: 'Notre équipe logistique vous contactera par téléphone pour convenir de la livraison sous 24-48h.',
    thankYouOrder: 'Merci pour votre confiance',
    orderReceivedSuccess: 'Votre commande a été reçue et confirmée avec succès !',
    yourOrderNumber: 'Votre numéro de commande :',
    imageTooLarge: 'L\'image est trop volumineuse (maximum 5 Mo)',
    enterNameError: 'Veuillez saisir votre nom',
    enterReviewError: 'Veuillez rédiger votre avis',
    justNow: 'À l\'instant',
    avatarOrVisitor: 'Photo ou avatar visiteur :',
    fillAllFieldsError: 'Veuillez remplir tous les champs obligatoires pour la livraison.',
    nameRequiredError: 'Veuillez saisir votre nom complet pour confirmer la commande.',
    phoneRequiredError: 'Veuillez saisir un numéro de téléphone valide pour la livraison.',
    cityRequiredError: 'Veuillez indiquer votre ville de livraison.',
    addressRequiredError: 'Veuillez indiquer votre adresse détaillée (quartier, rue, n°).',
    pleaseSpecifyCust: 'Veuillez spécifier :',
    deliveryInfoCod: 'Coordonnées de livraison (Paiement à la livraison)',
    editItems: 'Modifier les articles',
    emptyCartSubtitle: 'Parcourez nos collections et choisissez vos articles préférés.',
    productsPriceLabel: 'Sous-total articles :',
    proceedToConfirmCod: 'Continuer vers la confirmation (COD)',
    orderConfirmationInProgress: 'Confirmation de votre commande en cours...',
    confirmOrderWithTotal: (tot, curr) => `Confirmer la commande maintenant (${tot} ${curr})`,
    orderSyncedSheets: 'Commande synchronisée avec la base de données et Google Sheets',
    followOrderOnWhatsApp: 'Suivre la commande sur WhatsApp avec le service client',
    continueShoppingStore: 'Continuer mes achats dans la boutique',
    orderWhatsAppMsg: (orderNum, name, total, curr) =>
      `Bonjour, j'ai confirmé la commande n° ${orderNum} au nom de ${name}.\nMontant total : ${total} ${curr}.\nJe souhaite suivre l'état de la livraison.`,
    productInquiryWhatsAppMsg: (productName, packageDesc, price, curr) =>
      `Bonjour EGASA, je souhaite commander : ${productName} (${packageDesc}) au prix de ${price} ${curr}.`,
  },
  en: {
    searchPlaceholder: 'Search here...',
    allCategories: 'All',
    orderNow: 'Order Now !',
    submittingOrder: 'Submitting your order...',
    confirmOrder: 'Confirm Order (Cash on Delivery)',
    cashOnDeliveryBadge: 'Cash on delivery after inspection',
    freeShippingBadge: 'Free & fast shipping',
    fastShippingBadge: 'Delivered in 24-48 hours',
    directWhatsApp: 'Order via WhatsApp',
    phoneOrWhatsApp: 'Phone / WhatsApp',
    customerNameLabel: 'Full Name *',
    customerNamePlaceholder: 'Full name',
    phoneLabel: 'Phone Number *',
    phonePlaceholder: 'Phone number (e.g. +1 555-0199)',
    cityLabel: 'City or Region *',
    cityPlaceholder: 'City (e.g. New York, London, Dubai...)',
    addressLabel: 'Full Delivery Address *',
    addressPlaceholder: 'Detailed address (street, apt, building)',
    notesLabel: 'Delivery Instructions (Optional)',
    notesPlaceholder: 'Ex: Please call before arrival...',
    colorLabel: 'Select Color:',
    sizeLabel: 'Select Size:',
    selectSize: 'Size',
    selectColor: 'Color',
    customizationTitle: 'Custom Option',
    orderFormTitle: 'Customer Order Information',
    orderFormSubtitle: 'Fill in your details below to place your cash-on-delivery order',
    productPrice: 'Product price',
    totalCod: 'Total cash on delivery (COD)',
    codGuarantee: 'Pay cash upon delivery after inspecting the product (COD)',
    fastDelivery: 'Fast & Secure Delivery',
    fastDeliveryDesc: 'Delivered directly to your door within 24 to 48 hours',
    easyReturn: 'Hassle-Free Returns',
    easyReturnDesc: 'Friendly WhatsApp customer service available 24/7',
    quantityLabel: 'Quantity:',
    productDetailsHeading: 'Product Details & Specifications',
    additionalFeatures: 'Key Features',
    reviewsHeading: 'Customer Reviews',
    addReviewBtn: 'Write a Review',
    closeBtn: 'Close',
    writeReviewHeading: 'Write a new review:',
    submitReviewBtn: 'Post Review Now',
    userNameLabel: 'Your Name *',
    userNamePlaceholder: 'Enter your name...',
    starRatingLabel: 'Star Rating:',
    reviewCommentLabel: 'Written Feedback *',
    reviewCommentPlaceholder: 'Write your thoughts and experience with the product...',
    visitorPhotoBtn: 'Visitor Avatar',
    uploadPhotoBtn: 'Upload Photo',
    choosePhoto: 'Choose Photo',
    changePhoto: 'Change Photo',
    verifiedPurchaseBadge: 'Verified Buyer',
    helpfulBtn: 'Helpful',
    noReviewsYet: 'No reviews yet. Be the first to leave a review!',
    reviewSuccessMessage: 'Your review has been published successfully!',
    cartTitle: 'Shopping Cart',
    emptyCart: 'Your cart is currently empty',
    continueShopping: 'Continue Shopping',
    cartTotal: 'Order Total:',
    currency: '$',
    orderSuccessTitle: 'Order Placed Successfully!',
    orderSuccessSubtitle: 'Thank you for shopping with us! Your order is being prepared and we will reach out shortly for delivery confirmation.',
    orderNumber: 'Order ID:',
    backToShopping: 'Back to Store',
    backToStore: 'Back to Store',
    enlargeImage: 'Enlarge image',
    popularCities: [
      'New York',
      'London',
      'Dubai',
      'Riyadh',
      'Casablanca',
      'Toronto',
      'Sydney',
      'Los Angeles',
      'Chicago',
      'Manchester',
    ],
    // New constants:
    availableColors: 'Available colors',
    choosePackage: 'Choose your package:',
    singlePiece: '1 Piece',
    standardOrder: 'Standard Order',
    saveMoreFreeShipping: 'Save more + Free shipping',
    withCustomization: 'Yes, with',
    withoutCustomization: 'Without',
    suggestedCities: 'Suggested cities:',
    imageCountOf: (cur, tot) => `Image ${cur} of ${tot}`,
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom',
    prevImage: 'Previous image',
    nextImage: 'Next image',
    increaseQty: 'Increase quantity',
    decreaseQty: 'Decrease quantity',
    directWhatsAppContact: 'Order via WhatsApp',
    directWhatsAppTitle: 'Direct WhatsApp Contact',
    cartItemsCount: 'items',
    freeShippingBanner: '100% Free delivery on all orders & Cash on delivery',
    browseProducts: 'Browse Products',
    itemsDetails: 'Items details:',
    totalAmountDue: 'Total amount due:',
    registeredPhone: 'Registered phone number:',
    deliveryAddress: 'Delivery address:',
    paymentMethodCod: 'Payment method: Cash on delivery (COD)',
    deliveryNotice: 'Our delivery team will contact you by phone for delivery within 24 to 48 hours.',
    thankYouOrder: 'Thank you for your trust',
    orderReceivedSuccess: 'Your order has been received & confirmed successfully!',
    yourOrderNumber: 'Your Order Number:',
    imageTooLarge: 'Image is too large (maximum 5MB)',
    enterNameError: 'Please enter your name',
    enterReviewError: 'Please write your review',
    justNow: 'Just now',
    avatarOrVisitor: 'User photo or visitor avatar:',
    fillAllFieldsError: 'Please fill in all required fields to confirm delivery.',
    nameRequiredError: 'Please enter your full name to confirm the order.',
    phoneRequiredError: 'Please enter a valid phone number for delivery confirmation.',
    cityRequiredError: 'Please specify your delivery city.',
    addressRequiredError: 'Please enter your detailed address (neighborhood, street, house number).',
    pleaseSpecifyCust: 'Please specify:',
    deliveryInfoCod: 'Delivery Information (Cash on Delivery)',
    editItems: 'Edit Items',
    emptyCartSubtitle: 'Browse our collections and select your favorite pieces.',
    productsPriceLabel: 'Items Subtotal:',
    proceedToConfirmCod: 'Proceed to Checkout (Cash on Delivery)',
    orderConfirmationInProgress: 'Confirming your order...',
    confirmOrderWithTotal: (tot, curr) => `Confirm Order Now (${tot} ${curr})`,
    orderSyncedSheets: 'Order automatically synced to database and Google Sheets',
    followOrderOnWhatsApp: 'Track order on WhatsApp with Customer Service',
    continueShoppingStore: 'Continue Shopping in Store',
    orderWhatsAppMsg: (orderNum, name, total, curr) =>
      `Hello, I placed order ${orderNum} under the name ${name}.\nTotal amount: ${total} ${curr}.\nI would like to track my order shipment.`,
    productInquiryWhatsAppMsg: (productName, packageDesc, price, curr) =>
      `Hello EGASA, I would like to order: ${productName} (${packageDesc}) for ${price} ${curr}.`,
  },
};

export const getDirection = (lang: AppLanguage): 'rtl' | 'ltr' => {
  return lang === 'ar' ? 'rtl' : 'ltr';
};

export const getFontFamily = (lang: AppLanguage): string => {
  return lang === 'ar'
    ? "'Cairo', sans-serif"
    : "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
};
