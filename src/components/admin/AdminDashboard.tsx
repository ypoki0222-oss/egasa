import React, { useState } from 'react';
import { Product, Order, StoreSettings, OrderStatus, PixelSettings } from '../../types';
import { OrdersTab } from './OrdersTab';
import { ProductsTab } from './ProductsTab';
import { StoreSettingsTab } from './StoreSettingsTab';
import { PixelTab } from './PixelTab';
import { GoogleSheetsTab } from './GoogleSheetsTab';
import { ProductEditModal } from './ProductEditModal';
import { StoreLaunchModal } from './StoreLaunchModal';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Package,
  Sliders,
  Zap,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Lock,
  Rocket,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onClose: () => void;
  onLogout?: () => void;
  onViewProduct?: (product: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSaveProduct: (product: Product) => Promise<void>;
  onDuplicateProduct?: (product: Product) => Promise<Product>;
  onDeleteProduct: (productId: string) => void;
  onSaveStoreSettings: (settings: StoreSettings) => Promise<void>;
  onSavePixelSettings: (pixel: PixelSettings) => Promise<void>;
  onSaveGoogleSheets: (url: string, autoSync: boolean) => Promise<void>;
  onRefreshSync: (orderId: string) => void;
  onClearOrders?: () => void;
  onClearProducts?: () => void;
  onClearAllDemoData?: () => void;
  onRestoreDemoData?: () => void;
  onExportSnapshot?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  settings,
  onClose,
  onLogout,
  onViewProduct,
  onUpdateOrderStatus,
  onSaveProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onSaveStoreSettings,
  onSavePixelSettings,
  onSaveGoogleSheets,
  onRefreshSync,
  onClearOrders,
  onClearProducts,
  onClearAllDemoData,
  onRestoreDemoData,
  onExportSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'pixels' | 'sheets'>('orders');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const { user, signInWithGoogle, signOut } = useAuth();

  // Statistics
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.totalPrice : sum), 0);
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const confirmedOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'delivered').length;
  const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-stone-900 pb-16">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>معاينة المتجر</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="تسجيل الخروج وقفل لوحة التحكم"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>قفل وخروج</span>
              </button>
            )}
            <button
              onClick={() => setIsLaunchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="تهيئة المتجر للإطلاق الرسمي وحذف البيانات التجريبية"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-700" />
              <span>🚀 إطلاق المتجر (حذف التجريبي)</span>
            </button>
            <div className="h-4 w-px bg-stone-200 hidden sm:block" />
            <h1 className="text-base font-bold text-stone-900 font-serif">
              لوحة تحكم المتجر · <span className="text-stone-500 font-sans font-normal text-xs">{settings.storeName}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-xl">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-stone-700 font-medium text-[11px] hidden md:inline max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-stone-400 hover:text-stone-700 text-[10px] font-bold underline cursor-pointer"
                  title="تسجيل خروج حساب Google"
                >
                  فصل
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle().catch(() => {})}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                title="تسجيل الدخول بحساب Google"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.4 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <span className="hidden sm:inline">ربط Google</span>
              </button>
            )}

            <div className="text-stone-500 font-mono">
              {newOrdersCount > 0 ? (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">
                  {newOrdersCount} طلب جديد
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold hidden sm:inline">كافة الطلبات محدثة</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-right">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold text-stone-600">إجمالي المبيعات</span>
              <DollarSign className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {totalRevenue.toLocaleString()} {settings.currency}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">طلبات مسجلة</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold text-stone-600">عدد الطلبات</span>
              <ShoppingBag className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {orders.length}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">{newOrdersCount} طلب جديد</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold text-stone-600">متوسط قيمة السلة</span>
              <TrendingUp className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {averageOrderValue} {settings.currency}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">لكل عميل</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold text-stone-600">الطلبات المؤكدة</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 tabular-nums">
              {confirmedOrdersCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">تم تأكيدها أو تسليمها</span>
          </div>
        </div>

        {/* Tab Navigation Controls (Interactive Filter Controls as per SKILL.md) */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 rounded-xl overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>إدارة الطلبات</span>
            <span className="bg-stone-100 text-stone-800 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>إدارة المنتجات</span>
            <span className="bg-stone-100 text-stone-800 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تخصيص المتجر والعروض والواتساب</span>
          </button>

          <button
            onClick={() => setActiveTab('pixels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pixels'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ربط بكسل الإعلانات</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ربط Google Sheets</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              currency={settings.currency}
              googleSheetsWebhookUrl={settings.googleSheetsWebhookUrl}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onRefreshSync={onRefreshSync}
              onClearOrders={onClearOrders}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              currency={settings.currency}
              onAddProduct={handleOpenAddProduct}
              onEditProduct={handleOpenEditProduct}
              onDuplicateProduct={onDuplicateProduct}
              onDeleteProduct={onDeleteProduct}
              onViewProduct={onViewProduct}
              onClearProducts={onClearProducts}
              onExportSnapshot={onExportSnapshot}
            />
          )}

          {activeTab === 'settings' && (
            <StoreSettingsTab
              settings={settings}
              products={products}
              onSave={onSaveStoreSettings}
            />
          )}

          {activeTab === 'pixels' && (
            <PixelTab
              settings={settings.pixel}
              currency={settings.currency}
              onSave={onSavePixelSettings}
            />
          )}

          {activeTab === 'sheets' && (
            <GoogleSheetsTab
              webhookUrl={settings.googleSheetsWebhookUrl}
              autoSync={settings.googleSheetsAutoSync}
              onSave={onSaveGoogleSheets}
            />
          )}
        </div>
      </main>

      {/* Product Edit / Add Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={onSaveProduct}
        onDuplicate={async (prod) => {
          if (onDuplicateProduct) {
            const duplicated = await onDuplicateProduct(prod);
            setEditingProduct(duplicated);
          }
        }}
        availableCategories={settings.searchCategories || []}
      />

      {/* Store Launch Cleaner Modal */}
      <StoreLaunchModal
        isOpen={isLaunchModalOpen}
        ordersCount={orders.length}
        productsCount={products.length}
        onClearOrders={() => onClearOrders && onClearOrders()}
        onClearProducts={() => onClearProducts && onClearProducts()}
        onClearAll={() => onClearAllDemoData && onClearAllDemoData()}
        onRestoreDemoData={() => onRestoreDemoData && onRestoreDemoData()}
        onClose={() => setIsLaunchModalOpen(false)}
      />
    </div>
  );
};
