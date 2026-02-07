# Release Notes - Version 1.1.1

**Release Date:** February 7, 2026

## 🎉 What's New

This release focuses on **bug fixes** and **performance improvements** to make the Category Batch Manager more reliable and efficient.

## 🐛 Major Bug Fixes

### 1. Search Results Now Persist ✅

**Problem:** After clicking "GO" to process files, the search results would disappear, preventing multiple operations.

**Solution:** Messages now appear **above** the file list instead of replacing it.

**Impact:**
- ✅ Perform multiple batch operations on the same search results
- ✅ See operation history stacked above the file list
- ✅ Better context and feedback during workflow

**Example Workflow Now Possible:**
```
1. Search for ",BLR.svg" → 50 files found
2. Add "Category:Belarus" → GO → All files tagged
3. Select only GDP files from same list
4. Add "Category:GDP_2024" → GO → Selected files tagged
5. Review and make more changes without re-searching!
```

---

### 2. Preview Modal Fixed ✅

**Problem:**
- Preview modal couldn't be closed properly
- Event listeners were duplicated every time preview was shown
- Memory leaks and performance degradation

**Solution:**
- Added proper `hidePreviewModal()` method
- Moved event listeners to initialization (attached once)
- Added backdrop click to close modal

**Impact:**
- ✅ Modal closes properly when clicking "Close" or outside
- ✅ No more memory leaks
- ✅ Smoother user experience

---

### 3. MediaWiki API Upgrade ⚡

**Problem:** Manual API token handling and no edit conflict detection.

**Solution:** Upgraded to native MediaWiki API methods:
- `mw.Api.edit()` for editing (automatic conflict handling)
- `mw.Api.getCategories()` for retrieving categories

**Impact:**
- ✅ Automatic edit conflict detection and retry
- ✅ ~33% reduction in API calls for edits
- ✅ More reliable batch operations
- ✅ Better concurrent edit handling

**New Methods:**
```javascript
// Get categories easily
const cats = await categoryService.getCurrentCategories('File:Example.svg');

// Update with automatic conflict handling
await categoryService.updateCategoriesOptimized(
  'File:Example.svg',
  ['Category:New'],
  ['Category:Old']
);
```

---

### 4. Search Query Format Fixed 🔍

**Problem:** Search wasn't working with certain category names (especially those with spaces).

**Solution:**
- Fixed query order: `incategory` before `intitle`
- Use regex format: `intitle:/pattern/`
- Auto-convert spaces to underscores in category names
- Use `srlimit: 'max'` for user-specific limits

**Impact:**
- ✅ Search now works with all category names
- ✅ Handles spaces in category names correctly
- ✅ More reliable pattern matching

---

## 📊 Performance Improvements

### API Efficiency
- **Edit Operations:** 33% fewer API calls (2 instead of 3)
- **Conflict Handling:** Automatic retry on edit conflicts
- **Token Management:** Automatic CSRF token caching

### Memory Management
- **Event Listeners:** No more duplicate listeners
- **Modal Lifecycle:** Proper cleanup and reuse
- **Message Display:** Efficient DOM updates

---

## 📝 Documentation Updates

### New Documentation
- `API_IMPROVEMENTS.md` - Technical details of MediaWiki API upgrade
- `docs/API_USAGE_GUIDE.md` - Complete guide with examples
- `docs/FILE_LIST_PERSISTENCE_FIX.md` - Detailed explanation of fix
- `docs/MODAL_FIX.md` - Modal behavior improvements
- `docs/QUICK_FIX_SUMMARY.md` - Quick reference

### Updated Documentation
- `EXAMPLES.md` - Added API method examples
- `README.md` - Updated with new features
- `CHANGELOG.md` - Comprehensive change log

---

## 🧪 Testing

All 74 tests passing ✅

**New Tests:**
- `getCurrentCategories()` - Category retrieval
- `updateCategoriesOptimized()` - Optimized updates with conflict handling
- Category names with spaces handling

**Test Coverage:**
- WikitextParser: 100%
- Validator: 100%
- CategoryService: 100%
- BatchProcessor: 100%
- FileService: 100%

---

## 🎯 Use Cases Enabled

### 1. Progressive Categorization
```
Search once → Multiple targeted operations
1. Tag all files with base category
2. Select subset → Add specific category
3. Select another subset → Add another category
```

### 2. Error Recovery
```
Made a mistake? No problem!
1. Files already processed
2. List still visible
3. Remove wrong category, add correct one
4. Process again
```

### 3. Iterative Refinement
```
Build categories incrementally:
1. Search for files
2. Add broad category
3. Review which need extra tags
4. Select and add specific tags
5. Repeat as needed
```

---

## 🔄 Migration Notes

### For Users
**No action needed!** All improvements are transparent and automatic.

### For Developers
If you have custom integrations:

**Old way (still works):**
```javascript
const content = await api.getPageContent(title);
// ... modify content ...
await api.editPage(title, newContent, 'Updated');
```

**New optimized way:**
```javascript
await categoryService.updateCategoriesOptimized(
  title,
  ['Category:ToAdd'],
  ['Category:ToRemove']
);
```

---

## 📦 Installation

### Wikimedia Commons Gadget
1. Go to [Commons preferences](https://commons.wikimedia.org/wiki/Special:Preferences#mw-prefsection-gadgets)
2. Enable "Category Batch Manager"
3. Save preferences

### Manual Installation
Add to your `common.js`:
```javascript
mw.loader.load('//commons.wikimedia.org/w/index.php?title=MediaWiki:Gadget-CategoryBatchManager.js&action=raw&ctype=text/javascript');
```

---

## 🐛 Known Issues

None currently! 🎉

If you find any issues, please report them on the project page.

---

## 🙏 Acknowledgments

Thanks to the Wikimedia Commons community for feedback and testing!

---

## 📅 Next Release

Planning for v1.2.0:
- Batch operations progress indicator improvements
- Export operation logs
- Category suggestion based on file patterns
- Undo last operation
- Template support for common workflows

---

## 📖 Full Documentation

- [README.md](../README.md) - Getting started
- [API_USAGE_GUIDE.md](API_USAGE_GUIDE.md) - API reference
- [EXAMPLES.md](EXAMPLES.md) - Usage examples
- [PERFORMANCE.md](../PERFORMANCE.md) - Performance details
- [CHANGELOG.md](../CHANGELOG.md) - Complete change history

---

## 🔗 Resources

- [GitHub Repository](https://github.com/your-org/category-batch-manager)
- [Wikimedia Commons](https://commons.wikimedia.org)
- [MediaWiki API Documentation](https://www.mediawiki.org/wiki/API:Main_page)

---

**Version:** 1.1.1
**Build Date:** February 7, 2026
**License:** MIT
**Status:** Stable ✅
