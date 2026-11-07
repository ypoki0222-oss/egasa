import React, { useState } from 'react';
import { Product } from '../../types';
import { FashionIllustration } from '../FashionIllustration';
import { Plus, Edit3, Trash2, CheckCircle2, XCircle, Search, Copy, Check, ExternalLink, Link2, Sparkles, Download, Info, Files } from 'lucide-react';

interface ProductsTabProps {
  products: Product[];
  currency: string;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct?: (product: Product) => Promise<Product>;
  onDeleteProduct: (productId: string) => void;
  onViewProduct?: (product: Product) => void;
  onClearProducts?: () => void;
  onExportSnapshot?: () => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  currency,
  onAddProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onViewProduct,
  onClearProducts,
  onExportSnapshot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUrlText, setCopiedUrlText] = useState<string>('');
  const [duplicatedToast, setDuplicatedToast] = useState<{ name: string; product?: Product } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyAdUrl = (product: Product) => {
    try {
      // المسار النظيف /product/<slug> — يخدمه Pages Function من الحافة (Edge SSR).
      const url = `${window.location.origin}/product/${encodeURIComponent(
        product.slug || product.id
      )}`;
      navigator.clipboard.writeText(url);
      setCopiedId(product.id);
      setCopiedUrlText(url);
      setTimeout(() => {
        setCopiedId(null);
      }, 4000);
    } catch {
      // Fallback
      setCopiedId(product.id);
      setTimeout(() => setCopiedId(null), 4000);
    }
  };

  const handleCopyProductsJson = () => {
    try {
      const jsonStr = JSON.stringify(products, null, 2);
      navigator.clipboard.writeText(jsonStr);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Informative Ad Linking Banner */}
      <div className="bg-teal-900 text-white p-4 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-teal-300" />
            <h4 className="text-sm font-bold">روابط المنتجات للحملات الإعلانية (Meta / TikTok / Snap Ads)</h4>
          </div>
          <span className="text-[10px] bg-teal-800 text-teal-200 px-2 py-0.5 rounded-full font-mono">
            جاهز للاستخدام في EdgeOne
          </span>
        </div>
        <p className="text-xs text-teal-100 leading-relaxed">
          لكل منتج رابط مباشر فريد خاص به على المسار النظيف <code className="bg-teal-800/80 px-1 py-0.5 rounded font-mono text-[11px]">/product/رابط-المنتج</code> (يُعرض من حافة Cloudflare مباشرة عند كل زيارة). اضغط على زر <strong>"نسخ رابط الإعلان"</strong> بجانب أي منتج، والصقه مباشرة كرابط الصفحة المقصودة (Website URL) في إعلانات فيسبوك، تيك توك، أو سناب شات. عند نقر العميل على الإعلان سيفتح المنتج مباشرة ويشتغل نموذج الطلب والبكسل تلقائياً. لا تحتاج إعادة بناء أو نشر عند إضافة منتج جديد — يظهر تلقائياً خلال دقيقة.
        </p>
      </div>

      {copiedId && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>تم نسخ رابط الإعلان بنجاح!</strong> الصقه الآن في المنصة الإعلانية.
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 dir-ltr select-all truncate max-w-xs">
            {copiedUrlText}
          </span>
        </div>
      )}

      {duplicatedToast && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center justify-between animate-in fade-in shadow-2xs gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Files className="w-3.5 h-3.5" />
            </div>
            <span>
              تم عمل نسخة مكررة من <strong>"{duplicatedToast.name}"</strong> بنجاح بكامل المواصفات والصور والأسعار وخيارات المقاسات والتخصيصات!
            </span>
          </div>
          {duplicatedToast.product && (
            <button
              onClick={() => {
                onEditProduct(duplicatedToast.product!);
                setDuplicatedToast(null);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              فتح وتعديل النسخة الجديدة الآن
            </button>
          )}
        </div>
      )}

      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="البحث في المنتجات بالاسم أو التصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right font-['Cairo']"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {products.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="تصدير كود المنتجات لحفظها في الموقع قبل الرفع إلى EdgeOne"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>تصدير كود المنتجات</span>
            </button>
          )}

          {onExportSnapshot && products.length > 0 && (
            <button
              onClick={onExportSnapshot}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-700 hover:bg-teal-800 text-white border border-teal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="تنزيل ملف store_state.json (products + settings) كنسخة احتياطية — لم يعد مطلوباً للنشر على Cloudflare Pages (الEdge Function يستعلم Firestore مباشرة عند كل طلب)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تصدير لقطة النشر</span>
            </button>
          )}

          {onClearProducts && products.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onClearProducts();
                    setConfirmClear(false);
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer animate-pulse"
                  title="تأكيد الحذف النهائي"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد الحذف الشامل</span>
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="حذف جميع المنتجات التجريبية"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>تفريغ المنتجات التجريبية</span>
              </button>
            )
          )}

          <button
            onClick={onAddProduct}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">المنتج</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">السعر</th>
                <th className="py-3 px-4">عروض الباقة</th>
                <th className="py-3 px-4">المخزون</th>
                <th className="py-3 px-4 text-center">رابط الإعلان</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-stone-50/80 transition-colors ${product.hidden ? 'bg-amber-50/50' : ''}`}>
                  {/* Product with thumbnail */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                        {product.customImage ? (
                          <img
                            src={product.customImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FashionIllustration
                            type={product.imageSvgType || 'dress'}
                            accentColor={product.colors?.[0]?.hex || '#2D3748'}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 line-clamp-1">{product.name}</div>
                        <div className="text-[11px] text-stone-400 mt-0.5 font-mono">{product.slug}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              product.sizesEnabled !== false
                                ? 'bg-stone-100 text-stone-700'
                                : 'bg-stone-100 text-stone-400 line-through'
                            }`}
                          >
                            {product.sizesEnabled !== false ? `مقاسات (${product.sizes?.length || 0})` : 'مقاسات معطلة'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              product.colorsEnabled !== false
                                ? 'bg-stone-100 text-stone-700'
                                : 'bg-stone-100 text-stone-400 line-through'
                            }`}
                          >
                            {product.colorsEnabled !== false ? `ألوان (${product.colors?.length || 0})` : 'ألوان معطلة'}
                          </span>
                          {product.customizations && product.customizations.filter((c) => c.enabled).length > 0 && (
                            <span className="px-1.5 py-0.5 rounded font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                              تخصيصات ({product.customizations.filter((c) => c.enabled).length})
                            </span>
                          )}
                          {product.priceCustomizations && product.priceCustomizations.filter((c) => c.enabled).length > 0 && (
                            <span className="px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                              إضافات مسعرة ({product.priceCustomizations.filter((c) => c.enabled).length})
                            </span>
                          )}
                          {product.hidden && (
                            <span className="px-1.5 py-0.5 rounded font-bold bg-stone-700 text-white border border-stone-800">
                              مخفي (مسودة)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Badge */}
                  <td className="py-3 px-4">
                    <div className="text-stone-700 font-medium">{product.category}</div>
                    {product.badge && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                        {product.badge}
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-stone-900 tabular-nums">
                      {product.price} {currency}
                    </div>
                    {product.originalPrice && (
                      <div className="text-stone-400 line-through text-[11px] tabular-nums">
                        {product.originalPrice} {currency}
                      </div>
                    )}
                  </td>

                  {/* Bundle offer indicator */}
                  <td className="py-3 px-4">
                    {product.bundleOffer?.enabled ? (
                      <span className="inline-block text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        مفعل ({product.bundleOffer.price} {currency})
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">غير مفعل</span>
                    )}
                  </td>

                  {/* Stock Status */}
                  <td className="py-3 px-4">
                    {product.inStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>متوفر</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>نفد</span>
                      </span>
                    )}
                  </td>

                  {/* Copy Ad Link Button */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleCopyAdUrl(product)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        copiedId === product.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                      }`}
                      title="نسخ رابط الإعلان المباشر لفيسبوك وتيك توك"
                    >
                      {copiedId === product.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-teal-700" />
                          <span>نسخ رابط الإعلان</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onViewProduct && (
                        <button
                          onClick={() => onViewProduct(product)}
                          className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="معاينة صفحة المنتج"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditProduct(product)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="تعديل المنتج والخيارات"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {onDuplicateProduct && (
                        <button
                          onClick={async () => {
                            try {
                              const newProd = await onDuplicateProduct(product);
                              setDuplicatedToast({ name: product.name, product: newProd });
                            } catch {
                              window.alert('تعذر حفظ نسخة المنتج على الخادم. حاول مجددًا.');
                            }
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="عمل نسخة مكررة من هذا المنتج (Duplicate)"
                        >
                          <Files className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف "${product.name}"؟`)) {
                            onDeleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Export Products Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-stone-700" />
                <h3 className="font-bold text-base text-stone-900 font-serif">
                  تصدير كود المنتجات لدمجها في المتجر
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>كيف تضمن ظهور منتجاتك وصورك لجميع الزوار 100% عند الرفع على EdgeOne؟</span>
              </p>
              <p className="text-[11px] text-amber-800">
                استضافة EdgeOne هي استضافة للملفات الثابتة. لتظهر المنتجات والصور لجميع الزبائن في هواتفهم دون الحاجة لقاعدة بيانات، اضغط على <strong>"نسخ كود المنتجات"</strong> بالأسفل، ويمكن استبدال محتوى ملف <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">INITIAL_PRODUCTS</code> به، أو تفعيل الربط السحابي مع Firebase لمزامنة المنتجات والطلبات سحابياً وتلقائياً فور إضافتها.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-mono">
                  {products.length} منتج مسجل جاهز للتصدير
                </span>
                <button
                  onClick={handleCopyProductsJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {copiedExport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم نسخ الكود بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ كود المنتجات (JSON)</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                value={JSON.stringify(products, null, 2)}
                className="w-full h-56 p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px] text-stone-700 dir-ltr select-all focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
