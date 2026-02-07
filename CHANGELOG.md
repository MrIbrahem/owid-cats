# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### ✨ Enhancements

#### Skipped Files Tracking
- **Added separate tracking for files with no changes**
  - Files that don't need modification are now counted as **"skipped"** instead of "successful"
  - `BatchProcessor` now returns `skipped` count in results
  - Progress display shows: `(X successful, Y skipped, Z failed)`
  - Final results display includes skipped count
  - **Use Cases:**
    - Adding a category that already exists → Skipped
    - Removing a category that doesn't exist → Skipped
    - Actual changes made → Successful
  - Provides better transparency and accuracy in batch operation reports

### 🧪 Testing
- Added test: `should count skipped files when no changes made`
- All 129 tests passing ✅

### 🔧 Technical Changes
- Updated `BatchProcessor.processBatch()` to track `skipped` files separately
- Updated `updateProgress()` to display skipped count
- Updated `showResults()` to include skipped files in final report
- Modified `onFileComplete` callback to distinguish between modified and skipped files

---

## [1.1.1] - 2026-02-07

### 🐛 Bug Fixes

#### Search Results Persistence
- **Fixed file list disappearing after clicking "GO"**
  - Added separate `cbm-results-message` div for displaying messages
  - `showMessage()` and `showResults()` now target message area instead of file list
  - File list remains visible after batch operations complete
  - Users can now perform multiple operations on the same search results
  - Added `clearMessage()` method to clear messages when starting new search

#### Preview Modal Issues
- **Fixed preview modal close behavior**
  - Moved event listeners to `attachEventListeners()` to prevent duplication
  - Added `hidePreviewModal()` method for proper modal closing
  - Added backdrop click handler to close modal when clicking outside
  - Fixed memory leaks from repeated event listener attachment

#### MediaWiki API Improvements
- **Upgraded to native MediaWiki API methods**
  - `APIService.editPage()` now uses `mw.Api.edit()` with transform function
  - Added `APIService.getCategories()` using `mw.Api.getCategories()`
  - Added `CategoryService.getCurrentCategories()` for easier category retrieval
  - Added `CategoryService.updateCategoriesOptimized()` with automatic conflict handling
  - Automatic edit conflict detection and retry
  - ~33% reduction in API calls for edit operations

#### Search Query Format
- **Fixed MediaWiki search API query syntax**
  - Changed order: `incategory` now comes before `intitle`
  - Pattern now uses regex format: `intitle:/pattern/` instead of `intitle:"pattern"`
  - Removed quotes from category name in search query
  - **Added space handling**: Spaces in category names are now automatically replaced with underscores
  - **Set srlimit to 'max'**: Uses 'max' instead of fixed 500 to respect user-specific API limits
  - This fixes the issue where search wasn't working with certain patterns
  - Example: `incategory:Life_expectancy_maps_of_South_America_(no_data) intitle:/177/`

### ✨ Enhancements
- Messages now stack vertically above file list (newest on top)
- Better user feedback with persistent context
- Improved workflow for progressive categorization
- Preview modal more responsive and user-friendly

#### Category Normalization (Spaces/Underscores)
- **Fixed space vs underscore normalization bug**
  - MediaWiki treats spaces and underscores equivalently
  - Users can now remove/add categories using either format
  - Example: `Our_World_in_Data` matches `Our World in Data`
  - Added `WikitextParser.normalize()` method
  - Updated `hasCategory()`, `removeCategory()`, and `addCategory()` to handle both formats
  - Prevents duplicate categories with different formats
  - **18 comprehensive tests** covering all edge cases

#### Circular Category Detection
- **Prevents adding a category to itself**
  - Added `Validator.normalizeCategoryName()` for consistent comparison
  - Added `Validator.isCircularCategory()` to detect self-references
  - Handles all format variations:
    - `Our_World_in_Data_graphs_of_Afghanistan` vs `Our World in Data graphs of Afghanistan`
    - With/without `Category:` prefix
    - Case-insensitive comparison
  - Shows clear error message when attempting circular reference
  - **12 comprehensive tests** covering validation scenarios

### 📊 Testing
- **Total Tests:** 128 (up from 98)
- **Test Coverage:** 93% overall
- **New Test Files:**
  - `tests/unit/CategoryNormalization.test.js` - 18 tests
  - Validator tests expanded by 12 tests
- **All tests passing** ✅

### 📝 Documentation
- Updated `CHANGELOG.md` - This file
- Added `docs/API_USAGE_GUIDE.md` - Comprehensive API usage guide
- Added `docs/VISUAL_GUIDE.md` - Visual before/after guide for fixes
- Added `docs/DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification checklist
- Updated `docs/EXAMPLES.md` with new API method examples
- Updated `docs/QUICK_REFERENCE.md` with new features

### 🧪 Testing
- Added tests for `getCurrentCategories()` method
- Added tests for `updateCategoriesOptimized()` method
- Updated FileService tests to match new search query format
- Added test case for category names with spaces
- All 74 tests passing ✅

### 🔧 Technical Changes
- Added `cbm-results-message` container to UI template
- Refactored message display logic for better separation of concerns
- Improved modal lifecycle management
- Better memory management with proper event listener cleanup

---

## [1.1.0] - 2026-02-07

### 🚀 Performance Improvements
- **Major Performance Boost**: Replaced `categorymembers` API with `search` API for finding files
  - 60x faster search operations
  - 99% reduction in API calls
  - 99% reduction in memory usage
  - Can now efficiently search in categories with 100,000+ files
- See [PERFORMANCE.md](PERFORMANCE.md) for detailed performance comparison

### ✨ New Features
- **Flexible Source Category**: Users can now specify and change the source category in the UI
  - Auto-populates with current page name
  - Can be edited to search in any category
  - No longer restricted to current category page

### 🔧 Technical Changes
- `FileService.searchFiles()` now uses MediaWiki Search API
- Added new method `FileService.searchInCategory()` for optimized searching
- Updated constructor in `CategoryBatchManagerUI` to use current page as default source
- Added source category input field in the UI

### 📝 Documentation
- Added PERFORMANCE.md with detailed performance analysis
- Updated README.md with new features
- Updated tests to reflect new search implementation

### 🧪 Testing
- Updated FileService tests to use search API mocking
- Added tests for pagination in search results
- All tests passing ✅

---

## [1.0.0] - Initial Release

### Features
- Pattern-based file search in categories
- Bulk category add/remove operations
- Preview changes before applying
- Progress tracking
- Error recovery
- Rate limiting
