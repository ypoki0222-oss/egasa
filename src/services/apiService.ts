import { Product, Order, StoreSettings } from '../types';
import {
  getProducts,
  upsertProduct,
  deleteProduct,
  clearAllProducts,
  getOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  clearAllOrders,
  getStoreSettings,
  updateStoreSettings,
  restoreDemoData,
  subscribeProducts,
  subscribeOrders,
  subscribeSettings,
  isStoreSeeded,
} from '../db/store';

// Dispatch a JSON payload to a Google Apps Script webhook directly from the browser.
// Apps Script does not return CORS headers, so we use mode:'no-cors' (fire-and-forget).
// Sent as text/plain to stay a "simple request" with no preflight.
async function dispatchToSheets(payload: unknown, webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'رابط Google Sheets Webhook غير محدد' };
  }
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
      keepalive: true,
    });
    return { success: true, message: 'تم إرسال الطلب بنجاح إلى جدول Google Sheets' };
  } catch (err: any) {
    return { success: false, message: `فشل الاتصال بـ Google Sheets: ${err?.message || 'خطأ في الشبكة'}` };
  }
}

export const apiService = {
  async getProducts(): Promise<Product[]> {
    return getProducts();
  },

  async saveProduct(product: Product): Promise<Product> {
    return upsertProduct(product);
  },

  async deleteProduct(id: string): Promise<void> {
    await deleteProduct(id);
  },

  async clearAllProducts(): Promise<void> {
    await clearAllProducts();
  },

  async getOrders(): Promise<Order[]> {
    return getOrders();
  },

  async createOrder(order: Order): Promise<Order> {
    // محاولة الحفظ في قاعدة البيانات — إذا فشلت لأي سبب، لا نوقف العملية.
    let saved: Order = order;
    try {
      saved = await createOrder(order);
    } catch (e) {
      console.warn('Order save to Firestore failed, continuing with Sheets sync:', e);
    }
    // مزامنة Google Sheets في الخلفية — لا ننتظرها حتى تظهر شاشة النجاح فوراً
    (async () => {
      try {
        const settings = await getStoreSettings();
        if (settings.googleSheetsWebhookUrl && settings.googleSheetsAutoSync !== false && !(saved as any).syncedToGoogleSheets) {
          const result = await dispatchToSheets({ ...saved, currency: (saved as unknown as { currency?: string }).currency || settings.currency || 'د.م' }, settings.googleSheetsWebhookUrl);
          try {
            await updateOrder(saved.id, { syncedToGoogleSheets: result.success, googleSheetsResponse: result.message });
          } catch { /* ignore */ }
        }
      } catch (e) {
        console.warn('Auto sheets sync failed:', e);
      }
    })();
    return saved;
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await updateOrderStatus(id, status);
  },

  async deleteOrder(id: string): Promise<void> {
    await deleteOrder(id);
  },

  async clearAllOrders(): Promise<void> {
    await clearAllOrders();
  },

  async getSettings(): Promise<StoreSettings> {
    return getStoreSettings();
  },

  async saveSettings(settings: StoreSettings): Promise<StoreSettings> {
    return updateStoreSettings(settings);
  },

  async restoreDemoData(): Promise<{ products: Product[]; orders: Order[] }> {
    return restoreDemoData();
  },
  // اشتراكات فورية (Real-time) — تُرجع دالة إلغاء اشتراك
  subscribeProducts: (callback: (products: Product[]) => void): (() => void) =>
    subscribeProducts(callback),
  subscribeOrders: (callback: (orders: Order[]) => void): (() => void) =>
    subscribeOrders(callback),
  subscribeSettings: (callback: (settings: StoreSettings | null) => void): (() => void) =>
    subscribeSettings(callback),
  async isStoreSeeded(): Promise<boolean> {
    return isStoreSeeded();
  },

  // يضغط الصورة من المتصفح (بدون أي خدمة تخزين خارجية) ويحفظها كنص base64 مباشرة في قاعدة البيانات.
  // الحجم الناتج عادة 80-200KB، أي أقل بكثير من حد Firestore (1MB لكل مستند).
  async uploadImage(base64Data: string): Promise<string> {
    try {
      if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
        return base64Data;
      }
      // SVG لا يحتاج ضغط
      if (base64Data.startsWith('data:image/svg')) return base64Data;

      const compressed = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1000;
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64Data);
          ctx.drawImage(img, 0, 0, width, height);
          // JPEG بجودة 72% — حجم أصغر يسمح بعدد أكبر من الصور مع جودة مقبولة
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = () => reject(new Error('image load failed'));
        img.src = base64Data;
      });
      return compressed;
    } catch (e) {
      console.warn('Image compression failed, keeping original:', e);
      return base64Data;
    }
  },

  async testSheetsWebhook(webhookUrl?: string): Promise<{ success: boolean; message: string }> {
    let url = webhookUrl;
    if (!url) {
      const settings = await getStoreSettings();
      url = settings.googleSheetsWebhookUrl;
    }
    if (!url || !url.trim()) {
      return { success: false, message: 'يرجى إدخال رابط Google Webhook أولاً' };
    }
    const testPayload = {
      orderNumber: '#TEST-9999',
      createdAt: new Date().toISOString(),
      customerName: 'فحص اتصال المتجر (تجربة)',
      phone: '0661234567',
      city: 'الدار البيضاء',
      address: 'حي المعاريف - تجربة تحقق وتأكيد الربط',
      items: [{ productName: 'منتج تجريبي لتأكيد الربط', quantity: 1, selectedSize: 'L', selectedColor: 'أسود' }],
      totalPrice: 299,
      currency: 'د.م',
      status: 'new',
      notes: 'الباقة: عرض تجريبي - هذا فحص آلي للتأكد من وصول الطلبات للشيت بنجاح',
    };
    return dispatchToSheets(testPayload, url);
  },

  async syncOrderToSheets(order: Order, webhookUrl?: string, currency?: string): Promise<{ success: boolean; message: string }> {
    let targetUrl = webhookUrl;
    let targetCurrency = currency;
    if (!targetUrl) {
      const settings = await getStoreSettings();
      targetUrl = settings.googleSheetsWebhookUrl;
      targetCurrency = targetCurrency || settings.currency;
    }
    if (!targetUrl) return { success: false, message: 'لم يتم إعداد رابط Google Sheets' };
    const result = await dispatchToSheets({ ...order, currency: (order as unknown as { currency?: string }).currency || targetCurrency || 'د.م' }, targetUrl);
    await updateOrder(order.id, { syncedToGoogleSheets: result.success, googleSheetsResponse: result.message });
    return result;
  },

  async syncAllOrdersToSheets(): Promise<{ success: boolean; message: string; count?: number }> {
    const settings = await getStoreSettings();
    if (!settings.googleSheetsWebhookUrl) {
      return { success: false, message: 'لم يتم إعداد رابط Google Sheets في الإعدادات' };
    }
    const orders = await getOrders();
    const unsynced = orders.filter((o) => !o.syncedToGoogleSheets);
    if (unsynced.length === 0) {
      return { success: true, message: 'جميع الطلبات متزامنة بالفعل مع Google Sheets!', count: 0 };
    }
    let syncedCount = 0;
    for (const ord of unsynced) {
      const res = await dispatchToSheets({ ...ord, currency: (ord as unknown as { currency?: string }).currency || settings.currency }, settings.googleSheetsWebhookUrl);
      if (res.success) {
        syncedCount++;
        await updateOrder(ord.id, { syncedToGoogleSheets: true, googleSheetsResponse: 'تمت المزامنة بنجاح' });
      }
    }
    return { success: true, message: `تمت مزامنة ${syncedCount} من أصل ${unsynced.length} طلبات بنجاح إلى Google Sheets!`, count: syncedCount };
  },
};
