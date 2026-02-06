# Search Query Fix

## Issue
The search query was not working correctly with the pattern:
```
intitle:"177" incategory:"Life_expectancy_maps_of_South_America_(no_data)"
```

But it works with:
```
incategory:Life_expectancy_maps_of_South_America_(no_data) intitle:/177/
```

## Root Cause
The MediaWiki Search API requires:
1. **Order**: `incategory` should come before `intitle`
2. **Regex format**: Pattern should be in regex format `/pattern/` instead of quoted `"pattern"`
3. **No quotes**: Category name should not be in quotes
4. **Underscores**: Spaces in category names must be replaced with underscores `_`

## Solution
Changed the search query format in `src/services/FileService.js`:

### Before:
```javascript
srsearch: `intitle:${pattern} incategory:"${categoryName}"`
```

### After:
```javascript
// Replace spaces with underscores in category name for search API
const searchCategoryName = categoryName.replace(/\s+/g, '_');

srsearch: `incategory:${searchCategoryName} intitle:/${pattern}/`
```

## Changes Made
1. **src/services/FileService.js** - Line 47-49: Added space to underscore replacement and updated search query format
2. **tests/unit/FileService.test.js** - Line 68: Updated test to match new format
3. **tests/unit/FileService.test.js** - Added new test case for category names with spaces

## Testing
- ✅ All 70 tests passing (added 1 new test)
- ✅ Build successful
- ✅ Ready for deployment

## Example Queries
The new format supports:

| Pattern | Category | Query |
|---------|----------|-------|
| `177` | `Life_expectancy_maps_of_South_America_(no_data)` | `incategory:Life_expectancy_maps_of_South_America_(no_data) intitle:/177/` |
| `,BLR.svg` | `Uploaded_by_OWID_importer_tool` | `incategory:Uploaded_by_OWID_importer_tool intitle:/,BLR.svg/` |
| `Chart_GDP` | `Economic_indicators` | `incategory:Economic_indicators intitle:/Chart_GDP/` |

## MediaWiki Search API Documentation
The correct syntax according to MediaWiki Search API:
- `incategory:CategoryName` - Search within a category (no quotes, no "Category:" prefix)
- Spaces in category names must be replaced with underscores: `Life expectancy maps` → `Life_expectancy_maps`
- `intitle:/pattern/` - Search for pattern in title using regex format
- Order matters: category filter first, then title filter

## Examples of Space Handling

| Original Category Name | Search Format |
|------------------------|---------------|
| `Life expectancy maps` | `incategory:Life_expectancy_maps` |
| `Life expectancy maps of South America (no data)` | `incategory:Life_expectancy_maps_of_South_America_(no_data)` |
| `Uploaded by OWID importer tool` | `incategory:Uploaded_by_OWID_importer_tool` |

## Version
This fix will be included in v1.1.1
