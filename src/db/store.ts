import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { firestore, auth } from '../lib/firebase';
import type { Product, Order, StoreSettings } from '../types/index.js';
import legacySnapshot from '../../data/store_state.json';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_STORE_SETTINGS } from '../data/initialData.js';

const productsCol = collection(firestore, 'products');
const ordersCol = collection(firestore, 'orders');
const settingsDoc = doc(firestore, 'settings', 'global');
const initMarkerDoc = doc(firestore, 'settings', '_init');

let seededCache: boolean | null = null;

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

function mergeSettings(current: Partial<StoreSettings>, updates: Partial<StoreSettings> = {}): StoreSettings {
  const merged = { ...INITIAL_STORE_SETTINGS, ...current, ...updates };
  return {
    ...merged,
    announcement: { ...INITIAL_STORE_SETTINGS.announcement, ...current.announcement, ...updates.announcement },
    homeBanner: { ...INITIAL_STORE_SETTINGS.homeBanner, ...current.homeBanner, ...updates.homeBanner },
    whatsapp: { ...INITIAL_STORE_SETTINGS.whatsapp, ...current.whatsapp, ...updates.whatsapp },
    pixel: { ...INITIAL_STORE_SETTINGS.pixel, ...current.pixel, ...updates.pixel },
    formPlaceholders: { ...(current.formPlaceholders ?? {}), ...(updates.formPlaceholders ?? {}) },
  };
}

// هل تمت تهيئة القاعدة من قبل؟ (يُقرأ العلامة — مسموح للجميع)
async function isSeeded(): Promise<boolean> {
  if (seededCache !== null) return seededCache;
  try {
    const snap = await getDoc(initMarkerDoc);
    seededCache = snap.exists();
    return seededCache;
  } catch {
    return false;
  }
}

// تهيئة القاعدة بالبيانات الافتراضية — تتم فقط إذا كان المشرف مسجّلاً دخوله (لأن الكتابة تتطلب مصادقة).
// الزائر غير المسجّل لا يفشل؛ نعيد السيطرة ببساطة وتُكمل العمليات (مثل حفظ الطلب).
async function initializeStore(): Promise<void> {
  if (await isSeeded()) return;
  if (!auth.currentUser) return; // لا يمكن التهيئة بدون مصادقة — لن نفشل، فقط نؤجل
  try {
    const products: Product[] = Array.isArray(legacySnapshot.products)
      ? (legacySnapshot.products as Product[])
      : INITIAL_PRODUCTS;
    const orders: Order[] = Array.isArray(legacySnapshot.orders)
      ? (legacySnapshot.orders as Order[])
      : INITIAL_ORDERS;
    const batch = writeBatch(firestore);
    for (const p of products) {
      const data = stripUndefined(p as unknown as Record<string, unknown>);
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      batch.set(doc(productsCol, p.id), data);
    }
    for (const o of orders) {
      const data = stripUndefined(o as unknown as Record<string, unknown>);
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      batch.set(doc(ordersCol, o.id), data);
    }
    batch.set(settingsDoc, mergeSettings((legacySnapshot.settings ?? {}) as Partial<StoreSettings>));
    batch.set(initMarkerDoc, { initialized: true, at: new Date().toISOString() });
    await batch.commit();
    seededCache = true;
  } catch (e) {
    console.warn('Seed failed (will retry on next admin action):', e);
  }
}

export async function getProducts(): Promise<Product[]> {
  await initializeStore();
  if (!(await isSeeded())) {
    // القاعدة لم تُهيأ بعد (لم يدخل المشرف) — نعيد البيانات الافتراضية المحلية
    return Array.isArray(legacySnapshot.products) ? (legacySnapshot.products as Product[]) : INITIAL_PRODUCTS;
  }
  const snap = await getDocs(query(productsCol, orderBy('createdAt', 'desc')));
  const out: Product[] = [];
  snap.forEach((d) => out.push(d.data() as Product));
  return out;
}

export async function upsertProduct(product: Product): Promise<Product> {
  await initializeStore();
  // تنظيف عميق: إزالة أي قيم undefined من كل المستويات (Firestore يرفضها)
  const data = JSON.parse(JSON.stringify(product)) as Record<string, unknown>;
  if (!data.createdAt) data.createdAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();
  await setDoc(doc(productsCol, product.id), data, { merge: true });
  const fresh = await getDoc(doc(productsCol, product.id));
  return fresh.data() as Product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await initializeStore();
  await deleteDoc(doc(productsCol, id));
  return true;
}

export async function clearAllProducts(): Promise<boolean> {
  await initializeStore();
  const snap = await getDocs(productsCol);
  const batch = writeBatch(firestore);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return true;
}

export async function getOrders(): Promise<Order[]> {
  await initializeStore();
  if (!(await isSeeded())) return [];
  const snap = await getDocs(query(ordersCol, orderBy('createdAt', 'desc')));
  const out: Order[] = [];
  snap.forEach((d) => out.push(d.data() as Order));
  return out;
}

export async function createOrder(order: Order): Promise<Order> {
  // لا ننتظر التهيئة حتى لو فشلت — حفظ الطلب مسموح للجميع (allow create)
  initializeStore().catch(() => {});
  const ref = doc(ordersCol, order.id);
  // محاولة قراءة الطلب الموجود — إذا فشلت (الزائر غير مخوّل بالقراءة)، نكمل الحفظ مباشرة
  let existingSnap: any = null;
  try {
    existingSnap = await getDoc(ref);
  } catch {
    existingSnap = null;
  }
  if (existingSnap && existingSnap.exists()) return existingSnap.data() as Order;
  // تنظيف عميق: إزالة أي قيم undefined من كل المستويات (Firestore يرفضها)
  const data = JSON.parse(JSON.stringify(order)) as Record<string, unknown>;
  if (!data.createdAt) data.createdAt = new Date().toISOString();
  await setDoc(ref, data);
  return data as unknown as Order;
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
  await initializeStore();
  const ref = doc(ordersCol, orderId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return null;
  const patch: Record<string, unknown> = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.syncedToGoogleSheets !== undefined) patch.syncedToGoogleSheets = updates.syncedToGoogleSheets;
  if (updates.googleSheetsResponse !== undefined) patch.googleSheetsResponse = updates.googleSheetsResponse;
  if (Object.keys(patch).length) {
    await setDoc(ref, patch, { merge: true });
  }
  const fresh = await getDoc(ref);
  return fresh.data() as Order;
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  await initializeStore();
  await setDoc(doc(ordersCol, id), { status }, { merge: true });
  return true;
}

export async function deleteOrder(id: string): Promise<boolean> {
  await initializeStore();
  await deleteDoc(doc(ordersCol, id));
  return true;
}

export async function clearAllOrders(): Promise<boolean> {
  await initializeStore();
  const snap = await getDocs(ordersCol);
  const batch = writeBatch(firestore);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return true;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  await initializeStore();
  if (!(await isSeeded())) {
    return mergeSettings((legacySnapshot.settings ?? {}) as Partial<StoreSettings>);
  }
  const snap = await getDoc(settingsDoc);
  return mergeSettings((snap.data() ?? {}) as Partial<StoreSettings>);
}

export async function updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
  await initializeStore();
  const current = await getStoreSettings();
  const merged = mergeSettings(current, settings);
  await setDoc(settingsDoc, merged, { merge: true });
  return merged;
}

export async function restoreDemoData(): Promise<{ products: Product[]; orders: Order[] }> {
  await initializeStore();
  const batch = writeBatch(firestore);
  const pSnap = await getDocs(productsCol);
  pSnap.forEach((d) => batch.delete(d.ref));
  const oSnap = await getDocs(ordersCol);
  oSnap.forEach((d) => batch.delete(d.ref));
  for (const p of INITIAL_PRODUCTS) {
    const data = stripUndefined(p as unknown as Record<string, unknown>);
    if (!data.createdAt) data.createdAt = new Date().toISOString();
    batch.set(doc(productsCol, p.id), data);
  }
  for (const o of INITIAL_ORDERS) {
    const data = stripUndefined(o as unknown as Record<string, unknown>);
    if (!data.createdAt) data.createdAt = new Date().toISOString();
    batch.set(doc(ordersCol, o.id), data);
  }
  await batch.commit();
  return { products: await getProducts(), orders: await getOrders() };
}

// ====== الاستماع الفوري (Real-time) — يحل محل الاستطلاع الدوري ======
// تُرجع كل دالة دالة إلغاء اشتراك (unsubscribe) لاستدعائها عند تفكيك المكوّن.

export async function isStoreSeeded(): Promise<boolean> {
  return isSeeded();
}

export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  const q = query(productsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const out: Product[] = [];
      snap.forEach((d) => out.push(d.data() as Product));
      callback(out);
    },
    (err) => {
      console.warn('subscribeProducts listener error:', err);
    }
  );
}

export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  const q = query(ordersCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const out: Order[] = [];
      snap.forEach((d) => out.push(d.data() as Order));
      callback(out);
    },
    (err) => {
      // عادةً بسبب عدم المصادقة (الزائر غير المشرف) — نتجاهل بصمت
      console.warn('subscribeOrders listener skipped (auth required):', err?.code || err);
    }
  );
}

// null تعني أن وثيقة الإعدادات غير موجودة بعد (المتجر لم يُهيأ) — نبقي الإعدادات المحلية الافتراضية
export function subscribeSettings(callback: (settings: StoreSettings | null) => void): () => void {
  return onSnapshot(
    settingsDoc,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(mergeSettings((snap.data() ?? {}) as Partial<StoreSettings>));
    },
    (err) => {
      console.warn('subscribeSettings listener error:', err);
    }
  );
}
