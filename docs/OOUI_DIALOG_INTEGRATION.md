# OO.ui Dialog Integration

## Overview
تم تحديث Category Batch Manager لاستخدام مكتبة **OO.ui** المدمجة في MediaWiki لعرض نوافذ التأكيد، بدلاً من بناء dialog مخصص.

## التغييرات المُنفذة

### 1. استخدام OO.ui.confirm()

بدلاً من بناء dialog HTML مخصص، نستخدم الآن `OO.ui.confirm()` المتوفر في MediaWiki:

```javascript
/**
 * Show a confirmation dialog using MediaWiki's OO.ui.confirm
 * @param {string} message - Dialog message
 * @param {Object} options - Dialog options
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
async showConfirmDialog(message, options = {}) {
    const title = options.title || 'Confirm';

    return new Promise((resolve) => {
        if (typeof OO === 'undefined' || !OO.ui || !OO.ui.confirm) {
            // Fallback to native confirm if OO.ui is not available
            resolve(confirm(message));
            return;
        }

        OO.ui.confirm(message, {
            title: title,
            actions: [
                {
                    action: 'accept',
                    label: options.confirmLabel || 'Confirm',
                    flags: ['primary', 'progressive']
                },
                {
                    action: 'reject',
                    label: options.cancelLabel || 'Cancel',
                    flags: 'safe'
                }
            ]
        }).done((confirmed) => {
            resolve(confirmed);
        });
    });
}
```

### 2. الاستدعاءات المُحدّثة

#### عند تنفيذ Batch Update:
```javascript
const confirmed = await this.showConfirmDialog(confirmMsg, {
    title: 'Confirm Batch Update',
    confirmLabel: 'Proceed',
    cancelLabel: 'Cancel'
});

if (!confirmed) {
    return;
}
```

#### عند إغلاق النافذة:
```javascript
const confirmed = await this.showConfirmDialog(
    'Are you sure you want to close? Any unsaved changes will be lost.',
    {
        title: 'Close Category Batch Manager',
        confirmLabel: 'Close',
        cancelLabel: 'Cancel'
    }
);

if (confirmed) {
    // Close the manager
}
```

### 3. الملفات المُعدّلة

1. **`src/ui/CategoryBatchManagerUI.js`**
   - إضافة `/* global OO */` للتصريح عن المتغير العام
   - تحديث `showConfirmDialog()` لاستخدام `OO.ui.confirm()`
   - إزالة HTML الخاص بالـ dialog المخصص
   - تحديث استدعاءات التأكيد

2. **`src/ui/styles/main.css`**
   - إزالة CSS الخاص بالـ dialog المخصص (لم نعد نحتاجه)
   - **تخفيض z-index** من 10000 إلى 100 لضمان ظهور OO.ui dialogs فوق النافذة

3. **`demo/demo.html`**
   - إزالة HTML الخاص بالـ dialog (الديمو سيستخدم `confirm()` العادي)

## ⚠️ مهم: Z-Index Configuration

### المشكلة
نوافذ OO.ui تستخدم z-index في نطاق **1000-2000**، بينما كانت النافذة الرئيسية تستخدم `z-index: 10000`، مما يجعل dialogs تظهر خلف النافذة.

### الحل
تم تخفيض z-index لجميع عناصر Category Batch Manager:

```css
.cbm-container {
  z-index: 100;  /* كانت 10000 */
}

.cbm-modal {
  z-index: 101;  /* كانت 10001 */
}

#cbm-reopen-btn {
  z-index: 99;   /* كان 9999 */
}
```

### ترتيب Z-Index
1. `#cbm-reopen-btn` - 99 (الأدنى)
2. `.cbm-container` - 100 (النافذة الرئيسية)
3. `.cbm-modal` - 101 (نافذة المعاينة)
4. OO.ui dialogs - ~1000-2000 (الأعلى - يظهر فوق كل شيء)

## المزايا

### ✅ استخدام المكتبات المدمجة
- لا حاجة لبناء dialog من الصفر
- تصميم متسق مع واجهة MediaWiki
- صيانة أقل للكود

### ✅ تجربة مستخدم أفضل
- نوافذ حوار احترافية ومألوفة للمستخدمين
- رسوم متحركة سلسة
- دعم لوحة المفاتيح (ESC للإلغاء، Enter للتأكيد)

### ✅ Fallback آمن
- إذا لم تكن `OO.ui` متوفرة، يتم استخدام `confirm()` العادي
- يعمل في بيئة التطوير والديمو

## الاعتماديات

### MediaWiki Required:
- `OO.ui` - متوفر تلقائياً في MediaWiki
- يتم تحميله عبر `mw.loader.using('oojs-ui')`

### في gadget-entry.js:
```javascript
mw.loader.using([
  'mediawiki.api',
  'oojs-ui',
  'oojs-ui-windows'
], function() {
  // Initialize the tool
  new CategoryBatchManagerUI();
});
```

## البدائل المحتملة

### 1. OO.ui.MessageDialog
للرسائل الأكثر تعقيداً مع محتوى HTML:
```javascript
const messageDialog = new OO.ui.MessageDialog();
const windowManager = new OO.ui.WindowManager();
$('body').append(windowManager.$element);
windowManager.addWindows([messageDialog]);
```

### 2. mw.confirmCloseWindow
لتحذيرات بسيطة عند إغلاق النافذة:
```javascript
mw.confirmCloseWindow({
  message: 'You have unsaved changes',
  namespace: 'categoryBatchManager'
});
```

## الاختبار

### في MediaWiki:
```javascript
// Should show OO.ui dialog
const confirmed = await ui.showConfirmDialog('Test message', {
  title: 'Test',
  confirmLabel: 'OK'
});
console.log('Confirmed:', confirmed);
```

### في بيئة التطوير (بدون MediaWiki):
```javascript
// Should fallback to native confirm()
const confirmed = await ui.showConfirmDialog('Test message');
console.log('Confirmed:', confirmed);
```

## التوثيق الرسمي

- [OO.ui Documentation](https://doc.wikimedia.org/oojs-ui/master/js/)
- [OO.ui.confirm()](https://doc.wikimedia.org/oojs-ui/master/js/#!/api/OO.ui-method-confirm)
- [MediaWiki ResourceLoader](https://www.mediawiki.org/wiki/ResourceLoader/Core_modules#oojs-ui)

## الإصدار

تم التنفيذ في: 7 فبراير 2026
الإصدار: 1.1.1+
