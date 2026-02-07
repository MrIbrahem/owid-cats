# Instructions for Developers and AI Assistants

## 📋 Overview

This project is **Category Batch Manager** - a tool for batch category management in Wikimedia Commons.

---

## 🚨 Important Rules

### 1. Documentation
**❌ Don't create new documentation files randomly!**

Use existing files:
- `CHANGELOG.md` - for documenting all changes and new features
- `README.md` - for general description and basic usage
- `docs/PROJECT_STATUS.md` - for project status and tasks
- `docs/API_USAGE_GUIDE.md` - for API documentation
- `docs/DEPLOYMENT.md` - for deployment instructions

**✅ If you need a new file:**
- Ask first
- Place it in the `docs/` folder
- Document it in `PROJECT_STATUS.md`

### 2. Tests
**✅ Always:**
- Write tests for any new code
- Run tests before commit: `npm test`
- Check coverage: `npm test -- --coverage`
- Goal: 90%+ coverage

**📍 Test locations:**
```
tests/unit/
  ├── APIService.test.js
  ├── CategoryService.test.js
  ├── WikitextParser.test.js
  ├── Validator.test.js
  ├── BatchProcessor.test.js
  ├── FileService.test.js
  └── CategoryNormalization.test.js
```

### 3. Build and Deployment
**⚠️ Before deployment:**
```bash
# 1. Run tests
npm test

# 2. Build the project
npm run build

# 3. Verify dist/Gadget-CategoryBatchManager.js file
```

**📦 Built files:**
- `dist/Gadget-CategoryBatchManager.js` - JavaScript bundle
- `dist/Gadget-CategoryBatchManager.css` - CSS bundle

### 4. Code Structure

```
src/
├── utils/           # Helper utilities (Validator, WikitextParser, Logger)
├── services/        # API services (APIService, CategoryService, FileService)
├── models/          # Data models
├── ui/
│   ├── components/  # UI components
│   └── styles/      # CSS
├── main.js          # Main interface
└── gadget-entry.js  # Entry point
```

**⚠️ Load order is important!** Check `build.js`

---

## 🎯 Current Features

### 1. Category Normalization
- MediaWiki treats spaces and underscores the same way
- `Our_World_in_Data` = `Our World in Data`
- Code must handle both formats

### 2. Circular Category Detection
- Prevent adding a category to itself
- `Validator.isCircularCategory(current, toAdd)`
- Checks with normalization and prefix

### 3. Search and Filtering
- Search within a specific category
- Filter by pattern
- Regex support in search

### 4. Batch Operations
- Add/remove categories for multiple files
- Preview before execution
- Progress bar
- Error handling

---

## 🐛 Known Issues - Resolved

### ✅ Resolved:
1. ~~File list disappearing after GO~~ - Fixed v1.1.1
2. ~~Preview modal close issues~~ - Fixed v1.1.1
3. ~~Spaces in category names not supported~~ - Fixed v1.1.1
4. ~~Circular category~~ - Fixed v1.1.1

---

## 📝 How to Add a New Feature

### Steps:
1. **Plan:**
   - Write feature description
   - Identify affected files
   - Plan for tests

2. **Write code:**
   - Start with utils/services if needed
   - Then UI
   - Follow existing code patterns

3. **Write tests:**
   - Add new test file or extend existing
   - Ensure all cases are covered
   - Run `npm test`

4. **Document:**
   - Add entry in `CHANGELOG.md`
   - Update `docs/PROJECT_STATUS.md` if needed
   - Add comments in code

5. **Build:**
   - `npm run build`
   - Test the built file

### Example - Adding new validation:

```javascript
// 1. Add in src/utils/Validator.js
static isValidFileName(name) {
  // logic here
}

// 2. Add in tests/unit/Validator.test.js
describe('isValidFileName', () => {
  test('should accept valid file name', () => {
    expect(Validator.isValidFileName('File:Test.svg')).toBe(true);
  });
});

// 3. Document in CHANGELOG.md
#### File Name Validation
- Added `Validator.isValidFileName()` method
- Validates MediaWiki file name format
- Tests: 5 new tests covering edge cases

// 4. Build
npm test && npm run build
```

---

## 🔧 Development Tools

### Available commands:
```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage
npm test -- path/to/test    # Specific test
npm run build               # Build project
```

### Quality checks:
- ✅ All tests pass
- ✅ Coverage 90%+
- ✅ No console errors
- ✅ Code is readable and commented
- ✅ MediaWiki compatible

---

## 🌐 MediaWiki API

### Use optimized functions:
```javascript
// ✅ Correct
const categories = await apiService.getCategories(fileName);

// ❌ Wrong
const categories = await apiService.get({...complex params...});
```

### Available functions:
- `apiService.getCategories(title)` - Fetch categories
- `apiService.editPage(title, transform, options)` - Edit page
- `categoryService.getCurrentCategories(fileName)` - Current categories
- `categoryService.updateCategoriesOptimized(fileName, toAdd, toRemove)` - Optimized update

---

## 🎨 UI

### Use Codex CSS:
```html
<!-- ✅ Correct -->
<button class="cdx-button cdx-button--action-progressive">OK</button>

<!-- ❌ Wrong -->
<button class="my-custom-button">OK</button>
```

### Available classes:
- `cdx-button` - Buttons
- `cdx-field` - Input fields
- `cdx-text-input` - Text inputs
- `cdx-info-chip` - Info messages
- `cdx-progress-bar` - Progress bar

**📖 Reference:** https://doc.wikimedia.org/codex/latest/

---

## 🧪 Testing Standards

### Good test:
```javascript
test('should normalize category name with underscores', () => {
  const result = Validator.normalizeCategoryName('Test_Category');
  expect(result).toBe('Test Category');
});
```

### Covers:
- ✅ Normal case
- ✅ Error cases
- ✅ Edge cases
- ✅ Empty/null values

---

## 📊 Current Statistics

- **Version:** 1.1.1
- **Tests:** 128 passing
- **Coverage:** 93%
- **Files:** ~20 source files
- **Size:** ~50KB minified

---

## 🤝 For Contributors

### Before Pull Request:
1. ✅ Run `npm test`
2. ✅ Check coverage
3. ✅ Update `CHANGELOG.md`
4. ✅ Write clear description of change

### Code style:
- Use JSDoc for documentation
- Name variables clearly
- Follow existing patterns
- Comment complex code

---

## 🆘 Troubleshooting

### Problem: Tests failing
```bash
# 1. Check dependencies
npm install

# 2. Clear cache
npm test -- --clearCache

# 3. Run specific test
npm test -- tests/unit/Validator.test.js
```

### Problem: Build failed
```bash
# 1. Check for syntax errors
node build.js

# 2. Check file order in build.js
```

### Problem: Not working in Wikimedia
- Check console errors
- Ensure mw.Api is loaded
- Try in sandbox first

---

## 📞 Contact

- **GitHub Issues:** For bug reports and features
- **Documentation:** Check `docs/` folder

---

**Last updated:** February 7, 2026
**Version:** 1.1.1
