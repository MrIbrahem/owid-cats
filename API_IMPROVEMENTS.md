# MediaWiki API Improvements

## Overview

تم تحسين الكود لاستخدام دوال MediaWiki API الأصلية والمحسّنة بدلاً من الطرق اليدوية.

## Changes Made

### 1. APIService - استخدام `mw.Api.edit()` بدلاً من `postWithToken`

**Before:**
```javascript
async editPage(title, content, summary) {
  const api = this._getMwApi();
  return api.postWithToken('csrf', {
    action: 'edit',
    title: title,
    text: content,
    summary: summary,
    format: 'json'
  });
}
```

**After:**
```javascript
async editPage(title, content, summary, options = {}) {
  const api = this._getMwApi();

  return api.edit(title, function() {
    return {
      text: content,
      summary: summary,
      ...options
    };
  });
}
```

**Benefits:**
- ✅ Automatic revision fetching
- ✅ Edit conflict detection and handling
- ✅ Cleaner API
- ✅ Support for additional options (minor, bot, etc.)

---

### 2. APIService - إضافة `getCategories()`

**New Method:**
```javascript
async getCategories(title) {
  const api = this._getMwApi();
  try {
    const categories = await api.getCategories(title);
    if (categories === false) {
      return false;
    }
    // Convert mw.Title objects to strings
    return categories.map(cat => {
      const catStr = cat.toString();
      return catStr.replace(/^Category:/, '');
    });
  } catch (error) {
    Logger.error('Failed to get categories', error);
    throw error;
  }
}
```

**Benefits:**
- ✅ Direct category retrieval without parsing
- ✅ Returns `false` if page not found
- ✅ Cleaner than querying and parsing wikitext

---

### 3. CategoryService - إضافة `getCurrentCategories()`

```javascript
async getCurrentCategories(fileTitle) {
  const categories = await this.api.getCategories(fileTitle);
  if (categories === false) {
    return [];
  }
  return categories;
}
```

**Usage:**
```javascript
const cats = await categoryService.getCurrentCategories('File:Example.svg');
console.log(cats); // ['Belarus', 'Europe', 'Maps']
```

---

### 4. CategoryService - إضافة `updateCategoriesOptimized()`

**New Method:**
```javascript
async updateCategoriesOptimized(fileTitle, toAdd, toRemove) {
  const api = this.api._getMwApi();
  const parser = this.parser;

  try {
    await api.edit(fileTitle, function(revision) {
      let newWikitext = revision.content;

      // Remove categories first
      for (const category of toRemove) {
        newWikitext = parser.removeCategory(newWikitext, category);
      }

      // Then add new categories
      for (const category of toAdd) {
        if (!parser.hasCategory(newWikitext, category)) {
          newWikitext = parser.addCategory(newWikitext, category);
        }
      }

      // Only save if changed
      if (newWikitext === revision.content) {
        return false;
      }

      const parts = [];
      if (toAdd.length) parts.push(`+${toAdd.join(', ')}`);
      if (toRemove.length) parts.push(`-${toRemove.join(', ')}`);

      return {
        text: newWikitext,
        summary: `Batch category update: ${parts.join('; ')}`,
        minor: false
      };
    });

    return { success: true, modified: true };
  } catch (error) {
    if (error.message && error.message.includes('no changes')) {
      return { success: true, modified: false };
    }
    throw error;
  }
}
```

**Benefits:**
- ✅ Automatic edit conflict handling
- ✅ Transform function gets latest revision automatically
- ✅ Only saves if content actually changed
- ✅ Better concurrency handling for batch operations

---

## Usage Comparison

### Old Way (Manual)
```javascript
// Get content manually
const content = await api.getPageContent(title);

// Parse and modify
let newContent = parser.removeCategory(content, 'Old');
newContent = parser.addCategory(newContent, 'New');

// Save with manual token handling
await api.editPage(title, newContent, 'Updated categories');
```

### New Way (Optimized)
```javascript
// All in one - with automatic conflict handling
await categoryService.updateCategoriesOptimized(
  title,
  ['Category:New'],
  ['Category:Old']
);
```

---

## Performance Impact

### For Single Edits
- **Before:** 3 API calls (get token, get content, edit)
- **After:** 2 API calls (get revision in edit, edit)
- **Improvement:** ~33% fewer calls

### For Concurrent Edits
- **Before:** Edit conflicts possible, no retry logic
- **After:** Automatic conflict detection and resolution
- **Improvement:** Better reliability in batch operations

---

## Migration Guide

### Existing Code
```javascript
const wikitext = await this.api.getPageContent(fileTitle);
let newWikitext = wikitext;
// ... modify newWikitext ...
await this.api.editPage(fileTitle, newWikitext, summary);
```

### New Optimized Code
```javascript
await categoryService.updateCategoriesOptimized(
  fileTitle,
  categoriesToAdd,
  categoriesToRemove
);
```

**Note:** The old methods (`addCategories`, `removeCategories`, `updateCategories`) still work for backward compatibility. The new optimized methods are optional but recommended for better performance.

---

## References

- [mw.Api Documentation](https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Api)
- [mw.Api.edit() Method](https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Api-method-edit)
- [mw.Api.getCategories() Method](https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Api-method-getCategories)

---

## Testing

اختبارات جديدة تم إضافتها في `tests/unit/CategoryService.test.js`:
- `getCurrentCategories()` - test retrieval
- `updateCategoriesOptimized()` - test optimized edit with conflict handling

Run tests:
```bash
npm test
```
