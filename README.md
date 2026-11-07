# متجر EGASA — نسخة Firebase (مجانية للأبد، بدون Netlify)

هذه النسخة لا تستخدم Netlify نهائياً. كل البيانات (المنتجات، الطلبات، الإعدادات، الصور) تُحفظ في Firebase وتتزامن فورياً بين كل الأجهزة والمتصفحات.

## لماذا هذا الحل؟
- **مجاني 100%** بدون بطاقة ائتمانية (خطة Spark في Firebase).
- **لا يُوقف أبداً** — لا حدود لاستدعاءات دوال لأننا لا نستخدم أي خادم وسطي (الواجهة تتصل بقاعدة البيانات مباشرة).
- **مزامنة فورية**: أي تعديل تجريه من لوحة التحكم على أي جهاز يظهر فوراً على كل الأجهزة.
- الحدود المجانية كافية لمتجر صغير: 50,000 قراءة + 20,000 كتابة يومياً في قاعدة البيانات، و5GB لتخزين الصور.

---

## خطوات النشر بالضبط (تستغرق 10 دقائق)

### الخطوة 1: تفعيل قاعدة البيانات والتخزين في Firebase
1. افتح https://console.firebase.google.com واختر المشروع **egasa-87fcd** (موجود بالفعل).
2. من القائمة اليسرى: **Build → Firestore Database** → اضغط **Create database**.
   - اختر **Start in production mode**.
   - اختر موقع القاعدة: **eur3 (europe-west)** أو **nam5** — الأقرب للمغرب هو eur3.
   - اضغط Enable.
3. من القائمة اليسرى: **Build → Storage** → اضغط **Get started** → Next → Done.
4. من القائمة اليسرى: **Authentication** → تأكد من تفعيل **Google** كمزود تسجيل دخول (Sign-in method → Google → Enable).
5. في Authentication → Settings → **Authorized domains**: أضف نطاقك `egasa-87fcd.web.app` (localhost موجود افتراضياً).

### الخطوة 2: تثبيت أداة Firebase والنشر
6. ثبّت أداة Firebase على جهازك (مرة واحدة):
   ```
   npm install -g firebase-tools
   ```
7. سجّل الدخول:
   ```
   firebase login
   ```
8. ادخل إلى مجلد المشروع ثم انشر:
   ```
   npm install
   npm run deploy
   ```
   هذا الأمر يبني الموقع ويرفعه مع قواعد الأمان تلقائياً.

9. بعد الانتهاء، سيظهر رابط موقعك:
   ```
   https://egasa-87fcd.web.app
   ```

### الخطوة 3: أول تشغيل
10. افتح الرابط — ستظهر المتجر بالمنتج التجريبي (سورفيت أميليا) والإعدادات المحفوظة مسبقاً.
11. لفتح لوحة التحكم: اضغط على زر **الإدارة** (عادة في أسفل الصفحة أو الرابط `/admin`).
12. سجّل الدخول بكلمة المرور `egasa2025` ثم بحساب Google الخاص بك (إجباري لحفظ التعديلات).
13. عدّل المنتجات والإعدادات — ستظهر التعديلات فوراً على كل الأجهزة.

---

## مهم جداً: تقييد لوحة التحكم بحسابك فقط
حالياً أي شخص يسجّل دخول بأي حساب Google يمكنه تعديل المتجر. لتقييده بحسابك فقط:
1. افتح ملف `firestore.rules`.
2. في كل سطر `allow write: if request.auth != null;` استبدله بـ:
   ```
   allow write: if request.auth != null && request.auth.token.email == 'بريدك@gmail.com';
   ```
   (استبدل بريدك@gmail.com بريدك الحقيقي — نفس الحساب الذي تسجّل به الدخول).
3. أعد النشر: `npm run deploy`.

نفس الشيء في `storage.rules` لرفع الصور.

---

## ربط Google Sheets (اختياري)
- في لوحة التحكم → تبويب Google Sheets → الصق رابط Webhook الخاص بك (نفس السكربت القديم يعمل بدون تغيير).
- الطلبات تُرسل مباشرة من المتصفح إلى Google Sheets بدون خادم.

---

## تشغيل محلي للتطوير
```
npm install
npm run dev
```
فتح http://localhost:5173 — التعديلات المحلية تُحفظ مباشرة في نفس قاعدة Firebase (تظهر على الموقع المباشر فوراً).

---

## الملفات المعدّلة مقارنة بالنسخة الأصلية
- `src/lib/firebase.ts` — إضافة Firestore + Storage.
- `src/db/store.ts` — إعادة كتابة كاملة من PostgreSQL/Drizzle إلى Firestore (نفس الواجهة).
- `src/services/apiService.ts` — اتصال مباشر بقاعدة البيانات من المتصفح + رفع الصور إلى Storage.
- `src/context/AuthContext.tsx` — إزالة استدعاء خادم Netlify.
- `src/components/admin/AdminPasswordModal.tsx` — إجبار تسجيل دخول Google بعد كلمة المرور (لأغراض الأمان في قاعدة البيانات).
- `firebase.json` / `.firebaserc` / `firestore.rules` / `storage.rules` — إعدادات النشر والأمان.
- حُذفت: `netlify/`, `netlify.toml`, `server.ts`, `db/`, `drizzle.config.ts`, وحزم Netlify و Drizzle و Express.
