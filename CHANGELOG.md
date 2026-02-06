# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] - 2026-02-07

### 🐛 Bug Fixes
- **Search Query Format**: Fixed MediaWiki search API query syntax
  - Changed order: `incategory` now comes before `intitle`
  - Pattern now uses regex format: `intitle:/pattern/` instead of `intitle:"pattern"`
  - Removed quotes from category name in search query
  - **Added space handling**: Spaces in category names are now automatically replaced with underscores
  - **Set srlimit to 'max'**: Uses 'max' instead of fixed 500 to respect user-specific API limits
  - This fixes the issue where search wasn't working with certain patterns
  - Example: `incategory:Life_expectancy_maps_of_South_America_(no_data) intitle:/177/`

### 🧪 Testing
- Updated FileService tests to match new search query format
- Added test case for category names with spaces
- All 70 tests passing ✅ (added 1 new test)

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
