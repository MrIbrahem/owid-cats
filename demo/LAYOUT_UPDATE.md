# تحديث التخطيط - Two-Column Layout Update

## التاريخ: 7 فبراير 2026

## التغييرات المطبقة

### 1. **تخطيط ثنائي الأعمدة (Two-Column Layout)**

تم تقسيم الواجهة إلى جزأين:
- **الجزء الأيسر (66%)**: يحتوي على البحث والإجراءات
- **الجزء الأيمن (33%)**: يحتوي على قائمة الملفات

### 2. **تحديثات CSS في `main.css`**

```css
/* توسيع النافذة */
.cbm-container {
  width: 80vw;
  max-width: 1400px;
  max-height: 95vh;
}

/* التخطيط الرئيسي */
.cbm-main-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.cbm-left-panel {
  flex: 2;  /* ثلثين */
}

.cbm-right-panel {
  flex: 1;  /* ثلث */
}
```

### 3. **تحديثات HTML في `CategoryBatchManagerUI.js`**

تم إعادة هيكلة HTML لتشمل:
- `.cbm-main-layout` كحاوية رئيسية
- `.cbm-left-panel` للبحث والإجراءات
- `.cbm-right-panel` لقائمة الملفات

### 4. **إصلاح مشكلة Preview**

تم إزالة `showLoading()` من دالة `handlePreview()` حتى لا تختفي قائمة الملفات عند عرض المعاينة.

**قبل:**
```javascript
async handlePreview() {
    // ...
    this.showLoading();  // يؤثر على قائمة الملفات
    const preview = await this.batchProcessor.previewChanges(...);
    this.showPreviewModal(preview);
}
```

**بعد:**
```javascript
async handlePreview() {
    // ...
    const preview = await this.batchProcessor.previewChanges(...);
    this.showPreviewModal(preview);  // بدون تأثير على القائمة
}
```

## الملفات المعدّلة

1. ✅ `src/ui/styles/main.css`
2. ✅ `src/ui/CategoryBatchManagerUI.js`
3. ✅ `demo/demo.html`
4. ✅ `demo/demo.js`

## النتائج

- ✅ واجهة أوسع وأكثر راحة
- ✅ قائمة الملفات في جانب مستقل
- ✅ لا تتأثر قائمة الملفات عند عرض المعاينة
- ✅ تخطيط أكثر احترافية

## الاختبار

لاختبار التحديثات:
```bash
npm run build
```

ثم افتح `demo/demo.html` في المتصفح.

## ملاحظات

- النسبة 2:1 (ثلثين:ثلث) تعطي توازناً جيداً
- يمكن تعديل النسبة بتغيير قيم `flex` في CSS
- التخطيط متجاوب ويعمل على الشاشات الكبيرة
