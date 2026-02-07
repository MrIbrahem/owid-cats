# دليل استخدام Codex في Category Batch Manager

## نظرة عامة

[Codex](https://doc.wikimedia.org/codex/latest/) هو نظام التصميم الرسمي لمشاريع Wikimedia. يوفر مكونات UI متسقة وقابلة للوصول ومتوافقة مع معايير Wikimedia.

هذا الدليل يوضح كيفية ترقية مكونات UI الحالية في المشروع لاستخدام Codex.

## المكونات المتاحة للاستخدام

### 1. **SearchPanel.js** - مكونات البحث

#### المكونات الحالية:
- `<input type="text">` - حقل إدخال البحث
- `<button>` - زر البحث
- `<label>` - تسمية الحقل

#### مكونات Codex المقترحة:

##### **CdxTextInput** - حقل النص
```javascript
// بدلاً من:
<input type="text" id="cbm-pattern" placeholder="e.g., ,BLR.svg">

// استخدم:
new CdxTextInput({
  placeholder: 'e.g., ,BLR.svg',
  value: '',
  inputId: 'cbm-pattern',
  clearable: true  // زر لمسح المحتوى
});
```

**المزايا:**
- دعم RTL تلقائي
- تصميم متسق مع واجهة ويكيميديا
- إمكانية مسح المحتوى بسهولة
- حالات التحقق المدمجة (error, warning, success)

##### **CdxButton** - الأزرار
```javascript
// بدلاً من:
<button id="cbm-search-btn">Search</button>

// استخدم:
new CdxButton({
  label: 'Search',
  action: 'progressive',  // أزرق للإجراءات الأساسية
  weight: 'primary'       // زر بارز
});
```

**أنواع الأزرار المتاحة:**
- `action: 'progressive'` - للإجراءات الإيجابية (أزرق)
- `action: 'destructive'` - للإجراءات الخطرة (أحمر)
- `action: 'default'` - للإجراءات العادية (رمادي)

##### **CdxSearchInput** - حقل بحث متخصص
```javascript
// للبحث المباشر مع اقتراحات:
new CdxSearchInput({
  placeholder: 'Search pattern...',
  buttonLabel: 'Search'
});
```

**المزايا:**
- تصميم مخصص للبحث
- دعم الاقتراحات التلقائية
- زر بحث مدمج

---

### 2. **CategoryInputs.js** - حقول الإدخال

#### المكونات الحالية:
- `<input type="text">` × 3 (إضافة، إزالة، ملخص)
- `<label>` × 3

#### مكونات Codex المقترحة:

##### **CdxField** - حقل نموذج كامل
```javascript
// بدلاً من:
<div class="cbm-input-group">
  <label>Add Categories:</label>
  <input type="text" id="cbm-add-cats">
</div>

// استخدم:
new CdxField({
  label: 'Add Categories (comma-separated)',
  helpText: 'e.g., Category:Belarus, Category:Europe',
  optionalFlag: false
}, {
  default: () => new CdxTextInput({
    placeholder: 'Category:Example',
    inputId: 'cbm-add-cats'
  })
});
```

**المزايا:**
- تسمية موحدة
- نص مساعد (helpText)
- علامة اختيارية (optional)
- رسائل خطأ مدمجة

##### **CdxChipInput** - إدخال متعدد بشرائح
```javascript
// لإدخال الفئات بشكل أفضل:
new CdxChipInput({
  inputChips: [],
  placeholder: 'Add category and press Enter',
  separateInput: true
});
```

**المزايا:**
- عرض كل فئة كشريحة منفصلة
- سهولة الحذف والإضافة
- واجهة أكثر وضوحاً

##### **CdxTextArea** - لملخص التعديل
```javascript
// للملخصات الطويلة:
new CdxTextArea({
  placeholder: 'Describe your changes...',
  rows: 3,
  autosize: true
});
```

---

### 3. **FileList.js** - قائمة الملفات

#### المكونات الحالية:
- `<input type="checkbox">` - اختيار الملفات
- `<label>` - اسم الملف
- `<button>` - زر الحذف

#### مكونات Codex المقترحة:

##### **CdxCheckbox** - صناديق الاختيار
```javascript
// بدلاً من:
<input type="checkbox" class="cbm-file-checkbox" id="file-0" checked>
<label for="file-0">File name</label>

// استخدم:
new CdxCheckbox({
  modelValue: true,
  inputId: 'file-0'
}, {
  default: () => 'File name'
});
```

##### **CdxTable** - جدول منظم
```javascript
// لعرض أفضل للملفات:
new CdxTable({
  columns: [
    { id: 'select', label: '', width: '50px' },
    { id: 'title', label: 'File Name', width: 'auto' },
    { id: 'actions', label: 'Actions', width: '100px' }
  ],
  data: files,
  useRowSelection: true
});
```

##### **CdxAccordion** - للمعاينة القابلة للطي
```javascript
// لعرض تفاصيل الملف:
new CdxAccordion({
  items: [{
    id: 'file-details',
    title: 'File Details',
    content: 'Categories: ...'
  }]
});
```

---

### 4. **ProgressBar.js** - شريط التقدم

#### المكونات الحالية:
- `<div>` مخصص لشريط التقدم
- تحديث يدوي للعرض

#### مكونات Codex المقترحة:

##### **CdxProgressBar** - شريط تقدم احترافي
```javascript
// بدلاً من التنفيذ المخصص:
new CdxProgressBar({
  value: 0,  // 0-100
  inline: false,
  label: 'Processing files...'
});

// للتحديث:
progressBar.value = percentage;
```

**المزايا:**
- رسوم متحركة سلسة
- دعم التسميات
- متوافق مع قارئات الشاشة

---

### 5. **مكونات إضافية مفيدة**

#### **CdxDialog** - نافذة منبثقة
```javascript
// لاستبدال الـ container المخصص:
new CdxDialog({
  title: 'Category Batch Manager',
  hideTitle: false,
  closeButtonLabel: 'Close',
  primaryAction: {
    label: 'GO',
    actionType: 'progressive'
  },
  defaultAction: {
    label: 'Preview Changes'
  }
});
```

**المزايا:**
- إدارة Focus تلقائية
- إغلاق بـ ESC
- خلفية شفافة
- أزرار إجراء مدمجة

#### **CdxMessage** - رسائل الحالة
```javascript
// لعرض الأخطاء والنجاحات:
new CdxMessage({
  type: 'error',  // error, warning, success, notice
  inline: true,
  dismissButtonLabel: 'Dismiss'
}, {
  default: () => 'Operation failed. Please try again.'
});
```

#### **CdxToggleButton** - زر التبديل
```javascript
// لخيارات مثل "Select All":
new CdxToggleButton({
  modelValue: false,
  label: 'Select All Files',
  quiet: false
});
```

#### **CdxTabs** - تبويبات
```javascript
// لتنظيم الواجهة:
new CdxTabs({
  tabs: [
    { name: 'search', label: 'Search Files' },
    { name: 'operations', label: 'Category Operations' },
    { name: 'results', label: 'Results' }
  ]
});
```

#### **CdxInfoChip** - شريحة معلومات
```javascript
// لعرض عدد الملفات:
new CdxInfoChip({
  status: 'notice',
  icon: 'cdxIconInfo'
}, {
  default: () => `${count} files selected`
});
```

#### **CdxCombobox** - قائمة منسدلة مع بحث
```javascript
// لاختيار الفئة المصدر:
new CdxCombobox({
  menuItems: [
    { value: 'cat1', label: 'Category:OWID' },
    { value: 'cat2', label: 'Category:Charts' }
  ],
  placeholder: 'Select source category'
});
```

---

## خطة الترقية المقترحة

### المرحلة 1: إعداد Codex
```javascript
// في gadget-entry.js أو main.js
// تحميل مكتبة Codex
mw.loader.using(['@wikimedia/codex', '@wikimedia/codex-styles'], function() {
  // تهيئة التطبيق هنا
});
```

### المرحلة 2: ترقية المكونات (الأولوية)

1. **SearchPanel.js** → استخدام `CdxTextInput` و `CdxButton`
2. **CategoryInputs.js** → استخدام `CdxField` و `CdxTextInput`
3. **ProgressBar.js** → استخدام `CdxProgressBar`
4. **FileList.js** → استخدام `CdxCheckbox` و `CdxTable`

### المرحلة 3: تحسينات إضافية

- استبدال الـ container المخصص بـ `CdxDialog`
- إضافة `CdxMessage` لرسائل الخطأ والنجاح
- إضافة `CdxTabs` لتنظيم الواجهة
- استخدام `CdxChipInput` للفئات

---

## مثال: ترقية SearchPanel.js

### قبل (الكود الحالي):
```javascript
createElement() {
  const div = document.createElement('div');
  div.className = 'cbm-search';
  div.innerHTML = `
    <label>Search Pattern:</label>
    <input type="text" id="cbm-pattern" placeholder="e.g., ,BLR.svg">
    <button id="cbm-search-btn">Search</button>
  `;
  return div;
}
```

### بعد (باستخدام Codex):
```javascript
createElement() {
  const div = document.createElement('div');
  div.className = 'cbm-search';

  // Field مع TextInput
  const searchField = new CdxField({
    label: 'Search Pattern',
    helpText: 'Enter a pattern to search files (e.g., ,BLR.svg)',
    optionalFlag: false
  }, {
    default: () => new CdxTextInput({
      placeholder: 'e.g., ,BLR.svg',
      inputId: 'cbm-pattern',
      clearable: true
    })
  });

  // زر البحث
  const searchButton = new CdxButton({
    label: 'Search',
    action: 'progressive',
    weight: 'primary'
  });

  div.appendChild(searchField.$el);
  div.appendChild(searchButton.$el);

  return div;
}
```

---

## الموارد والمراجع

### الوثائق الرسمية:
- **الصفحة الرئيسية**: https://doc.wikimedia.org/codex/latest/
- **Components**: https://doc.wikimedia.org/codex/latest/components/
- **Design Tokens**: https://doc.wikimedia.org/codex/latest/design-tokens/
- **Icons**: https://doc.wikimedia.org/codex/latest/icons/

### مكونات محددة:
- **CdxTextInput**: https://doc.wikimedia.org/codex/latest/components/text-input.html
- **CdxButton**: https://doc.wikimedia.org/codex/latest/components/button.html
- **CdxField**: https://doc.wikimedia.org/codex/latest/components/field.html
- **CdxCheckbox**: https://doc.wikimedia.org/codex/latest/components/checkbox.html
- **CdxProgressBar**: https://doc.wikimedia.org/codex/latest/components/progress-bar.html
- **CdxDialog**: https://doc.wikimedia.org/codex/latest/components/dialog.html
- **CdxMessage**: https://doc.wikimedia.org/codex/latest/components/message.html
- **CdxTable**: https://doc.wikimedia.org/codex/latest/components/table.html
- **CdxTabs**: https://doc.wikimedia.org/codex/latest/components/tabs.html
- **CdxChipInput**: https://doc.wikimedia.org/codex/latest/components/chip-input.html
- **CdxCombobox**: https://doc.wikimedia.org/codex/latest/components/combobox.html

### أمثلة عملية:
- **Demos**: https://doc.wikimedia.org/codex/latest/demos/
- **Playground**: https://doc.wikimedia.org/codex/latest/playground/

---

## المزايا العامة لاستخدام Codex

### 1. **إمكانية الوصول (Accessibility)**
- دعم ARIA كامل
- متوافق مع قارئات الشاشة
- دعم لوحة المفاتيح الكامل
- نسب تباين ألوان محسّنة

### 2. **التدويل (i18n)**
- دعم RTL/LTR تلقائي
- ترجمة النصوص الافتراضية
- تنسيق الأرقام والتواريخ

### 3. **الاتساق**
- تصميم موحد مع Wikimedia
- ألوان ونصوص قياسية
- تجربة مستخدم متسقة

### 4. **الصيانة**
- تحديثات تلقائية
- إصلاح الأخطاء من Wikimedia
- توافق مستقبلي مضمون

### 5. **الأداء**
- محسّن للأداء
- تحميل كسول (lazy loading)
- حجم صغير

---

## ملاحظات مهمة

### التحميل:
```javascript
// استخدم دائماً mw.loader.using
mw.loader.using(['@wikimedia/codex']).then(() => {
  const { CdxButton, CdxTextInput } = require('@wikimedia/codex');
  // استخدم المكونات هنا
});
```

### الأنماط:
```javascript
// لتحميل CSS
mw.loader.using(['@wikimedia/codex-styles']);
```

### التوافق:
- Codex يتطلب Vue.js 3
- متوافق مع MediaWiki 1.39+
- يعمل على جميع المتصفحات الحديثة

---

## الخلاصة

استخدام Codex سيحسن من:
- ✅ إمكانية الوصول
- ✅ الاتساق مع منصة Wikimedia
- ✅ تجربة المستخدم
- ✅ سهولة الصيانة
- ✅ التوافق المستقبلي

**توصية**: ابدأ بترقية المكونات الأساسية (SearchPanel, CategoryInputs) ثم انتقل تدريجياً للمكونات الأخرى.
