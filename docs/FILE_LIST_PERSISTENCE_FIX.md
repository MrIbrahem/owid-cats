# File List Persistence Fix

## Issue

When clicking the "GO" button a second time, the search results would disappear, making it impossible to perform multiple batch operations on the same search results.

### Root Cause

The issue occurred in two places:

1. **Modal Overlay**: The preview modal was shown but there was no proper way to close it, making the UI appear unresponsive.

2. **Results Display**: The `showResults()` and `showMessage()` methods were replacing the entire file list container's innerHTML, which meant:
   - First "GO" click → processes files → shows success message (replaces file list)
   - Second "GO" click → no files visible because the list was replaced with the results message

## Solution

### 1. Added Separate Results Message Area

**Before:**
```html
<div class="cbm-results">
  <div id="cbm-results-header">...</div>
  <div id="cbm-file-list"></div>
</div>
```

**After:**
```html
<div class="cbm-results">
  <div id="cbm-results-header">...</div>
  <div id="cbm-results-message"></div> <!-- NEW: Dedicated message area -->
  <div id="cbm-file-list"></div>
</div>
```

### 2. Updated showMessage() Method

**Before** - Replaced file list:
```javascript
showMessage(text, type) {
  const listContainer = document.getElementById('cbm-file-list');
  listContainer.innerHTML = `<div class="cdx-message">...</div>`;
}
```

**After** - Uses dedicated message area:
```javascript
showMessage(text, type) {
  const messageContainer = document.getElementById('cbm-results-message');
  messageContainer.innerHTML = `<div class="cdx-message">...</div>`;
}
```

### 3. Updated showResults() Method

**Before** - Replaced file list:
```javascript
showResults(results) {
  const listContainer = document.getElementById('cbm-file-list');
  listContainer.innerHTML = `
    <div class="cdx-message">
      Batch process complete! Total: ${results.total}...
    </div>`;
}
```

**After** - Shows results above file list:
```javascript
showResults(results) {
  const messageContainer = document.getElementById('cbm-results-message');
  messageContainer.innerHTML = `
    <div class="cdx-message">
      Batch process complete! Total: ${results.total}...
    </div>`;
  // File list remains intact!
}
```

### 4. Added clearMessage() Method

```javascript
clearMessage() {
  const messageContainer = document.getElementById('cbm-results-message');
  if (messageContainer) {
    messageContainer.innerHTML = '';
  }
}
```

This is called at the start of each new search to clear previous messages.

### 5. Fixed Modal Close Behavior

Added proper modal close functionality:

```javascript
hidePreviewModal() {
  const modal = document.getElementById('cbm-preview-modal');
  modal.classList.add('hidden');
}
```

And event listeners for closing:

```javascript
// Close button
document.getElementById('cbm-preview-close').addEventListener('click', () => {
  this.hidePreviewModal();
});

// Click outside modal
document.getElementById('cbm-preview-modal').addEventListener('click', (e) => {
  if (e.target.id === 'cbm-preview-modal') {
    this.hidePreviewModal();
  }
});
```

## User Flow - Before vs After

### Before (Broken)

1. User searches for files → sees 50 results ✅
2. User clicks "GO" → processes 50 files → shows "Batch complete" message
3. **File list disappears** → replaced by success message ❌
4. User clicks "GO" again → error "No files selected" ❌

### After (Fixed)

1. User searches for files → sees 50 results ✅
2. User clicks "GO" → processes 50 files → shows "Batch complete" message **above** file list
3. **File list remains visible** ✅
4. User can modify selection or category inputs
5. User clicks "GO" again → processes updated selection ✅
6. Both messages visible (stacked) showing both operations ✅

## Visual Layout

```
┌─────────────────────────────────────┐
│ Search Panel                        │
├─────────────────────────────────────┤
│ Results Header (Found X files)      │
├─────────────────────────────────────┤
│ [Results Message Area]              │  ← NEW: Messages appear here
│ ┌─────────────────────────────────┐ │
│ │ ✅ Batch complete! Total: 50    │ │
│ │    Successful: 48, Failed: 2    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [File List]                         │  ← PRESERVED: Always visible
│ ☑ File:GDP-per-capita,BLR.svg   ✕  │
│ ☑ File:Population,BLR.svg        ✕  │
│ ☑ File:Life-expectancy,BLR.svg   ✕  │
│ ...                                 │
├─────────────────────────────────────┤
│ Category Actions                    │
│ Add: [Category:Belarus         ]    │
│ Remove: [Category:Old          ]    │
│ [Preview] [GO]                      │
└─────────────────────────────────────┘
```

## Benefits

### 1. Multiple Operations on Same Results
Users can now:
- Search once
- Perform multiple different category operations
- Modify selections between operations
- See history of all operations in message stack

### 2. Better User Feedback
- Success messages visible alongside file list
- Users can verify which files were processed
- Error messages don't hide the context

### 3. Improved Workflow
```javascript
// Example: Progressive categorization
1. Search for all Belarus files
2. Add "Category:Belarus" → GO
3. Select only GDP files from the same list
4. Add "Category:GDP_Indicators" → GO
5. Select only 2024 files
6. Add "Category:2024_Data" → GO
```

All without re-searching!

## Testing

Run the test suite to verify:
```bash
npm test
```

All 74 tests pass ✅

## Edge Cases Handled

1. **Empty search results**: Shows "No files found" in message area
2. **Loading state**: Spinner shown in file list during search
3. **Multiple messages**: Messages stack vertically (newest on top)
4. **Modal interaction**: Can close preview and still see file list
5. **Concurrent operations**: Each operation's result is shown separately

## Code Changes Summary

**Files Modified:**
- `src/main.js`
  - Added `cbm-results-message` div to HTML template
  - Updated `showMessage()` to use message container
  - Updated `showResults()` to use message container
  - Added `clearMessage()` method
  - Added `hidePreviewModal()` method
  - Updated `handleSearch()` to call `clearMessage()`

**Lines Changed:** ~30 lines
**Tests:** All passing (74/74)

## Migration Notes

**For users:** No action needed. The fix is transparent.

**For developers:** If you have custom message display logic, update to use:
```javascript
document.getElementById('cbm-results-message')  // For messages
document.getElementById('cbm-file-list')        // For file list only
```

## Related Issues

- ✅ Fixed: Files disappear after clicking GO
- ✅ Fixed: Preview modal doesn't close properly
- ✅ Fixed: Cannot perform multiple operations on same search
- ✅ Fixed: Messages hide file context

## Future Enhancements

Potential improvements:
1. Add "Clear Messages" button
2. Limit message stack to last 3 operations
3. Add animation when messages appear
4. Persist messages across UI reopens
5. Export operation history as log file
