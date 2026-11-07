import { Order } from '../types';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * سكربت ربط متجر الأزياء بجدول بيانات غوغل شيت (Google Sheets Webhook)
 * ====================================================================
 * 
 * مميزات هذا السكربت:
 * 1. يستقبل الطلبات تلقائياً وبشكل فوري بمجرد تأكيد العميل للطلب.
 * 2. ينشئ الجدول وعناوين الأعمدة وينسقها تلقائياً إذا كان الشيت جديداً.
 * 3. يحافظ على أصفار أرقام الهواتف (06 / 07 / 05) دون أن يمسحها غوغل شيت.
 * 4. يفرز تفاصيل المقاسات، الألوان، التخصيصات، والباقات في أعمدة مرتبة.
 * 5. يدعم فحص الاتصال التلقائي (doGet و doPost) لضمان الربط بدون أخطاء.
 *
 * --------------------------------------------------------------------
 * خطوات التفعيل في 60 ثانية فقط:
 * --------------------------------------------------------------------
 * 1. افتح جدول Google Sheet جديد في حسابك (أو استخدم جدولك الحالي).
 * 2. من القائمة العلوية اضغط: "الإضافات" (Extensions) -> "Apps Script".
 * 3. امسح أي كود موجود بالكامل والصق هذا الكود كاملاً مكانه.
 * 4. اضغط على أيقونة الحفظ (💾 Save).
 * 5. اضغط على زر "نشر" الأزرق في الأعلى (Deploy) ثم اختر "نشر جديد" (New deployment).
 * 6. اضغط على أيقونة الترس بجانب "Select type" واختر: "تطبيق ويب" (Web app).
 * 7. قم بضبط الإعدادات كالتالي:
 *    - الوصف (Description): "ربط متجر الأزياء"
 *    - تنفيذ كـ (Execute as): "أنا" (Me - بريدك الإلكتروني)
 *    - من يملك حق الوصول (Who has access): اختر "أي شخص" (Anyone) **مهم جداً**
 * 8. اضغط زر "نشر" (Deploy)، وامنح الأذونات بالضغط على (Authorize access -> خيارات متقدمة Advanced -> الانتقال Go to...).
 * 9. انسخ رابط "عنوان URL لتطبيق الويب" (Web app URL) والصقه في لوحة تحكم المتجر.
 */

// معالجة فحص الاتصال واختبار الرابط عبر المتصفح (GET)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "تهانينا! سكربت ربط المتجر مع غوغل شيت متصل ويعمل بنجاح 100%.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// معالجة استقبال الطلبات الجديدة من المتجر (POST)
function doPost(e) {
  var lock = LockService.getScriptLock();
  // حماية من تعارض الطلبات المتزامنة والانتظار حتى 30 ثانية
  try {
    lock.waitLock(30000);
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "الخادم مشغول حالياً، يرجى إعادة المحاولة."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // استخدام الورقة المسماة "طلبات المتجر" أو الورقة الأولى الافتراضية
    var sheet = ss.getSheetByName("طلبات المتجر");
    if (!sheet) {
      // إذا كانت الورقة الأولى فارغة نغير اسمها، وإلا ننشئ ورقة جديدة
      var activeSheet = ss.getActiveSheet();
      if (activeSheet && activeSheet.getLastRow() === 0) {
        activeSheet.setName("طلبات المتجر");
        sheet = activeSheet;
      } else {
        sheet = ss.insertSheet("طلبات المتجر");
      }
    }

    // إذا كان الجدول فارغاً، ننشئ عناوين الأعمدة مع تنسيق احترافي
    if (sheet.getLastRow() === 0) {
      var headers = [
        "تاريخ ووقت الطلب",
        "رقم الطلب",
        "اسم العميل",
        "رقم الهاتف",
        "المدينة",
        "العنوان بالتفصيل",
        "المنتجات والكمية",
        "المقاس",
        "اللون",
        "الخيارات والتخصيص",
        "الباقة / العرض",
        "المبلغ الإجمالي",
        "العملة",
        "حالة الطلب",
        "ملاحظات إضافية"
      ];
      sheet.appendRow(headers);

      // تنسيق شريط العناوين
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0F172A"); // لون كحلي داكن فخم
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontSize(11);
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1); // تجميد الصف الأول
    }

    // قراءة البيانات بأمان سواء كانت JSON أو نص عادي أو معلمات نموذج
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        try {
          data = JSON.parse(decodeURIComponent(e.postData.contents));
        } catch (e2) {
          data = e.parameter || {};
        }
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // تجهيز وتنسيق تفاصيل المنتجات والمقاسات والألوان
    var itemsList = [];
    var sizesList = [];
    var colorsList = [];
    var customizationsList = [];
    var totalQty = 0;

    if (data.items && Array.isArray(data.items)) {
      for (var i = 0; i < data.items.length; i++) {
        var it = data.items[i];
        var qty = it.quantity || 1;
        totalQty += qty;
        itemsList.push((it.productName || "منتج") + " (x" + qty + ")");
        if (it.selectedSize) sizesList.push(it.selectedSize);
        if (it.selectedColor) colorsList.push(it.selectedColor);
        if (it.customizations && Array.isArray(it.customizations)) {
          for (var c = 0; c < it.customizations.length; c++) {
            var cust = it.customizations[c];
            customizationsList.push((cust.title || "") + ": " + (cust.value || ""));
          }
        }
      }
    }

    var itemsSummary = itemsList.join(" | ") || (data.productName ? data.productName + " (x" + (data.quantity || 1) + ")" : "-");
    var sizesSummary = sizesList.join(", ") || (data.selectedSize || "-");
    var colorsSummary = colorsList.join(", ") || (data.selectedColor || "-");
    var customizationsSummary = customizationsList.join(" | ") || "-";

    // استخراج اسم الباقة أو العرض من الملاحظات إن وجد
    var packageTier = "-";
    if (data.notes && data.notes.indexOf("الباقة:") > -1) {
      var parts = data.notes.split(" - ");
      for (var p = 0; p < parts.length; p++) {
        if (parts[p].indexOf("الباقة:") > -1) {
          packageTier = parts[p].replace("الباقة:", "").trim();
        }
      }
    }

    // تنظيف رقم الهاتف وإضافة ' لحفظ الأصفار الأولى
    var rawPhone = String(data.phone || "").trim();
    var cleanPhone = rawPhone ? ("'" + rawPhone) : "-";

    // تنسيق التاريخ والوقت
    var dateStr = "";
    if (data.createdAt) {
      try {
        var d = new Date(data.createdAt);
        dateStr = Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+1", "yyyy/MM/dd HH:mm:ss");
      } catch (errDate) {
        dateStr = data.createdAt;
      }
    }
    if (!dateStr) {
      dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+1", "yyyy/MM/dd HH:mm:ss");
    }

    // صف البيانات الجديد
    var newRow = [
      dateStr,
      data.orderNumber || ("#ORD-" + Math.floor(1000 + Math.random() * 9000)),
      data.customerName || "-",
      cleanPhone,
      data.city || "-",
      data.address || "-",
      itemsSummary,
      sizesSummary,
      colorsSummary,
      customizationsSummary,
      packageTier,
      data.totalPrice !== undefined ? data.totalPrice : 0,
      data.currency || "د.م",
      data.status === "new" ? "جديد" : (data.status || "جديد"),
      data.notes || ""
    ];

    sheet.appendRow(newRow);

    // تنسيق الصف الجديد ليكون مرتباً ومريحاً للعين
    var lastRow = sheet.getLastRow();
    var newRowRange = sheet.getRange(lastRow, 1, 1, newRow.length);
    newRowRange.setVerticalAlignment("middle");
    newRowRange.setFontSize(10);
    sheet.setRowHeight(lastRow, 30);

    // محاذاة الأعمدة: التاريخ ورقم الهاتف في الوسط، النصوص لليمين
    sheet.getRange(lastRow, 1, 1, 4).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 5, 1, 6).setHorizontalAlignment("right");
    sheet.getRange(lastRow, 11, 1, 4).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      result: "success",
      message: "تم تسجيل الطلب بنجاح في غوغل شيت",
      orderNumber: data.orderNumber,
      rowNumber: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      result: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;

// In-memory cache of synced order IDs to prevent duplicate dispatches in the same browser session
const clientSyncedOrders = new Set<string>();

/**
 * Sends order to Google Sheets using intelligent single-delivery dispatch:
 * 1. Primary: Server proxy sync (avoids CORS, ad-block immune, verified HTTP response).
 * 2. Fallback: Direct browser dispatch (only if server proxy is unavailable or store is offline).
 * Guards against duplicate/triplicate entries.
 */
export async function sendOrderToGoogleSheet(
  order: Order,
  webhookUrl: string,
  currency: string = 'د.م'
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'لم يتم إدخال رابط Google Sheets Webhook في الإعدادات.' };
  }

  // Deduplication guard: if this specific order was already synced in this session, return success immediately
  if (order.id && clientSyncedOrders.has(order.id)) {
    return {
      success: true,
      message: 'تم إرسال الطلب وتأكيده بنجاح',
    };
  }

  const payload = {
    ...order,
    currency,
  };

  // 1. Primary: Server proxy sync (verified delivery, no CORS)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/sheets/sync-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: payload,
        webhookUrl: webhookUrl.trim(),
        currency,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (order.id) clientSyncedOrders.add(order.id);
        return {
          success: true,
          message: data.message || 'تم إرسال الطلب بنجاح إلى جدول Google Sheets!',
        };
      }
    }
  } catch (proxyError) {
    // Backend proxy inactive or timed out - fall through to direct browser dispatch fallback
    console.warn('Backend proxy inactive or offline, executing direct Google Sheets fallback');
  }

  // 2. Fallback: Direct browser dispatch (only runs if server proxy failed or server is offline)
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
      keepalive: true,
    });

    if (order.id) clientSyncedOrders.add(order.id);

    return {
      success: true,
      message: 'تم إرسال الطلب مباشرة إلى جدول Google Sheets!',
    };
  } catch (directErr: any) {
    console.warn('Direct Google Sheet dispatch error:', directErr);
    return {
      success: false,
      message: directErr?.message || 'فشل إرسال الطلب إلى Google Sheets',
    };
  }
}

/**
 * Tests the webhook connection.
 * Attempts server-side test first to get genuine HTTP status code,
 * then falls back to direct client test.
 */
export async function testWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'يرجى إدخال الرابط أولاً للاختبار.' };
  }

  // 1. Try server-side test endpoint
  try {
    const res = await fetch('/api/sheets/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        message: data.message,
      };
    }
  } catch (serverErr) {
    console.warn('Server test failed, trying direct browser test:', serverErr);
  }

  // 2. Fallback to direct client test
  const testData = {
    orderNumber: '#TEST-9999',
    createdAt: new Date().toISOString(),
    customerName: 'فحص اتصال المتجر (تجربة)',
    phone: '0661234567',
    city: 'الدار البيضاء',
    address: 'حي المعاريف - تجربة تحقق وتأكيد الربط',
    items: [
      {
        productName: 'منتج تجريبي لتأكيد الربط',
        quantity: 1,
        selectedSize: 'L',
        selectedColor: 'أسود',
      },
    ],
    totalPrice: 299,
    currency: 'د.م',
    status: 'new',
    notes: 'الباقة: عرض تجريبي - هذا فحص آلي للتأكد من وصول الطلبات للشيت بنجاح',
  };

  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testData),
      mode: 'no-cors',
    });
    return {
      success: true,
      message: 'تم إرسال إشارة الفحص بنجاح! تفقد جدول Google Sheet الآن وستجد سطراً تجريبياً أُضيف للتو.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `تعذر الوصول إلى الرابط: ${err?.message || 'خطأ غير معروف'}`,
    };
  }
}

export function exportOrdersToCSV(orders: Order[], currency: string = 'د.م') {
  if (orders.length === 0) return;

  const headers = [
    'رقم الطلب',
    'التاريخ',
    'اسم العميل',
    'الهاتف',
    'المدينة',
    'العنوان بالتفصيل',
    'المنتجات',
    'المقاسات',
    'الألوان',
    'الكمية',
    'المبلغ الإجمالي',
    'الحالة',
    'ملاحظات',
  ];

  const rows = orders.map((o) => {
    const productsStr = o.items.map((i) => {
      let title = `${i.productName} (x${i.quantity})`;
      if (i.customizations && i.customizations.length > 0) {
        title += ` [${i.customizations.map((c) => `${c.title}: ${c.value}`).join(', ')}]`;
      }
      return title;
    }).join(' | ');
    const sizesStr = o.items.map((i) => i.selectedSize || '-').join(', ');
    const colorsStr = o.items.map((i) => i.selectedColor || '-').join(', ');
    const totalQty = o.items.reduce((sum, i) => sum + i.quantity, 0);

    return [
      `"${o.orderNumber}"`,
      `"${o.createdAt}"`,
      `"${o.customerName}"`,
      `"'\t${o.phone}"`,
      `"${o.city}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${productsStr.replace(/"/g, '""')}"`,
      `"${sizesStr}"`,
      `"${colorsStr}"`,
      totalQty,
      `"${o.totalPrice} ${currency}"`,
      `"${o.status}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `طلبات_المتجر_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
