# MediaWiki API Usage Guide

## Quick Start

This guide shows how to use the improved MediaWiki API methods in the Category Batch Manager.

## Basic Usage

### 1. Get Current Categories of a File

```javascript
// Initialize services
const apiService = new APIService();
const categoryService = new CategoryService(apiService);

// Get categories for a specific file
const categories = await categoryService.getCurrentCategories('File:GDP-per-capita,BLR.svg');
console.log(categories); 
// Output: ['Belarus', 'GDP_Indicators', 'Economic_Data']
```

### 2. Update Categories (Optimized Method)

```javascript
// Add and remove categories in one atomic operation
const result = await categoryService.updateCategoriesOptimized(
  'File:GDP-per-capita,BLR.svg',
  ['Category:Belarus', 'Category:Europe'],  // Categories to add
  ['Category:Old_Data']                      // Categories to remove
);

console.log(result);
// Output: { success: true, modified: true }
```

### 3. Batch Update Multiple Files

```javascript
const files = [
  'File:GDP-per-capita,BLR.svg',
  'File:Population,BLR.svg',
  'File:Life-expectancy,BLR.svg'
];

const toAdd = ['Category:Belarus', 'Category:Europe'];
const toRemove = ['Category:Uncategorized'];

for (const file of files) {
  try {
    const result = await categoryService.updateCategoriesOptimized(
      file,
      toAdd,
      toRemove
    );
    console.log(`${file}: ${result.modified ? 'Updated' : 'No changes'}`);
  } catch (error) {
    console.error(`Failed to update ${file}:`, error);
  }
}
```

## Advanced Usage

### Using mw.Api Directly

#### Example 1: Edit with Transform Function

```javascript
const api = new mw.Api();

await api.edit('File:Example.svg', function(revision) {
  // revision.content contains the current wikitext
  let content = revision.content;
  
  // Make modifications
  content = content.replace('old_text', 'new_text');
  
  // Return the edit parameters
  return {
    text: content,
    summary: 'Updated content',
    minor: true,
    bot: false
  };
});
```

#### Example 2: Async Transform with External API

```javascript
await api.edit('File:Example.svg', async function(revision) {
  // You can use async operations in the transform
  const analysisResult = await externalAPI.analyze(revision.content);
  
  return {
    text: analysisResult.improvedContent,
    summary: analysisResult.changelog,
    minor: false
  };
});
```

#### Example 3: Conditional Edit

```javascript
await api.edit('File:Example.svg', function(revision) {
  const content = revision.content;
  
  // Only edit if certain conditions are met
  if (!content.includes('[[Category:Belarus]]')) {
    return {
      text: content + '\n[[Category:Belarus]]',
      summary: 'Added Belarus category'
    };
  }
  
  // Return false to skip the edit
  return false;
});
```

### Query Multiple Metadata

```javascript
const api = new mw.Api();

// Get both user info and site info in one request
const data = await api.get({
  action: 'query',
  meta: ['userinfo', 'siteinfo']
});

console.log('Current user:', data.query.userinfo.name);
console.log('Site name:', data.query.general.sitename);
```

### Get Categories with Full Metadata

```javascript
const api = new mw.Api();

// Get categories with additional info
const data = await api.get({
  action: 'query',
  titles: 'File:Example.svg',
  prop: 'categories',
  clprop: 'timestamp|hidden',
  cllimit: 500
});

const pages = data.query.pages;
const pageId = Object.keys(pages)[0];
const categories = pages[pageId].categories || [];

categories.forEach(cat => {
  console.log(`Category: ${cat.title}`);
  console.log(`Added: ${cat.timestamp}`);
  console.log(`Hidden: ${cat.hidden ? 'Yes' : 'No'}`);
});
```

## Error Handling

### Handle Edit Conflicts

```javascript
try {
  await categoryService.updateCategoriesOptimized(file, toAdd, toRemove);
} catch (error) {
  if (error.code === 'editconflict') {
    console.log('Edit conflict detected, retrying...');
    // The mw.Api.edit() method automatically retries once
    // If this error is thrown, it means the retry also failed
  } else if (error.code === 'protectedpage') {
    console.log('Page is protected, cannot edit');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Handle Missing Pages

```javascript
const categories = await categoryService.getCurrentCategories('File:DoesNotExist.svg');

if (categories === false || categories.length === 0) {
  console.log('File not found or has no categories');
}
```

## Performance Comparison

### Old Method (3 API calls)

```javascript
// Call 1: Get CSRF token
const token = await api.getToken('csrf');

// Call 2: Get page content
const content = await api.getPageContent(title);

// Call 3: Edit page
await api.postWithToken('csrf', {
  action: 'edit',
  title: title,
  text: modifiedContent,
  summary: 'Updated'
});
```

### New Method (2 API calls)

```javascript
// Call 1+2: Get revision and edit in one operation
await api.edit(title, function(revision) {
  return {
    text: modifyContent(revision.content),
    summary: 'Updated'
  };
});
// Token management is automatic!
```

**Result:** ~33% reduction in API calls

## Best Practices

### 1. Use Optimized Methods for Batch Operations

```javascript
// ✅ Good: Uses mw.Api.edit() with conflict handling
await categoryService.updateCategoriesOptimized(file, toAdd, toRemove);

// ❌ Less optimal: Manual content fetch + edit
const content = await api.getPageContent(file);
const modified = modifyContent(content);
await api.editPage(file, modified, 'Updated');
```

### 2. Rate Limiting

```javascript
const rateLimiter = new RateLimiter(5000); // 5 second delay

for (const file of files) {
  await rateLimiter.throttle();
  await categoryService.updateCategoriesOptimized(file, toAdd, toRemove);
}
```

### 3. Batch Similar Operations

```javascript
// ✅ Good: Group files with same category changes
const filesForBelarusTag = [/* ... */];
await batchUpdateCategories(filesForBelarusTag, ['Belarus'], []);

// ❌ Bad: Different operations for each file
for (const file of files) {
  const specificCategories = determineCategories(file);
  await updateCategories(file, specificCategories, []);
}
```

### 4. Error Recovery

```javascript
const failedFiles = [];

for (const file of files) {
  try {
    await categoryService.updateCategoriesOptimized(file, toAdd, toRemove);
  } catch (error) {
    failedFiles.push({ file, error: error.message });
  }
}

// Retry failed files
if (failedFiles.length > 0) {
  console.log(`Retrying ${failedFiles.length} failed files...`);
  for (const { file } of failedFiles) {
    await retryWithBackoff(() => 
      categoryService.updateCategoriesOptimized(file, toAdd, toRemove)
    );
  }
}
```

## Common Patterns

### Pattern 1: Search and Tag

```javascript
// Search for files matching a pattern
const files = await fileService.searchInCategory(
  'Category:Uploaded_by_OWID_importer_tool',
  ',BLR.svg'
);

// Tag all matching files
for (const file of files) {
  await categoryService.updateCategoriesOptimized(
    file.title,
    ['Category:Belarus', 'Category:Europe'],
    []
  );
}
```

### Pattern 2: Replace Deprecated Category

```javascript
// Find all files in old category
const files = await apiService.getCategoryMembers('Category:Old_Economic_Data');

// Replace with new category
for (const file of files) {
  await categoryService.updateCategoriesOptimized(
    file.title,
    ['Category:Economic_Data_2024'],
    ['Category:Old_Economic_Data']
  );
}
```

### Pattern 3: Conditional Categorization

```javascript
const files = await fileService.searchInCategory(category, pattern);

for (const file of files) {
  const currentCats = await categoryService.getCurrentCategories(file.title);
  
  // Only add if not already present
  if (!currentCats.includes('Belarus')) {
    await categoryService.updateCategoriesOptimized(
      file.title,
      ['Category:Belarus'],
      []
    );
  }
}
```

## Debugging

### Enable Verbose Logging

```javascript
// In browser console
mw.log.deprecate(window, 'debugAPI', true, 'Enable API debugging');

// Now all API calls will be logged
```

### Inspect API Calls

```javascript
const api = new mw.Api();

// Add a custom interceptor
const originalGet = api.get.bind(api);
api.get = async function(params) {
  console.log('API GET:', params);
  const result = await originalGet(params);
  console.log('API Response:', result);
  return result;
};
```

## Resources

- [mw.Api Documentation](https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Api)
- [MediaWiki API:Edit](https://www.mediawiki.org/wiki/API:Edit)
- [MediaWiki API:Categories](https://www.mediawiki.org/wiki/API:Categories)
- [Rate Limiting Best Practices](https://www.mediawiki.org/wiki/API:Etiquette)
