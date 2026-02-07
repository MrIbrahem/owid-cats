# CDX-Dialog Implementation Plan for Category Batch Manager

## Overview
This plan guides the AI agent to refactor the Category Batch Manager gadget to use Codex Dialog (`cdx-dialog`) components instead of the current HTML-based modal implementation.

## Current Implementation Analysis (Updated)

### Code Structure
The gadget now uses a modular architecture:
- **CategoryBatchManagerUI** (line 2001): Main UI class
- **PreviewHandler** (line 1635): Handles preview functionality
- **ExecuteHandler** (line 1759): Handles batch execution
- **SearchHandler**: Handles search operations

### Existing Modal System
The gadget currently uses custom HTML modals for:
1. **Preview Modal** (line 2204-2213 in buildContainer, implemented in PreviewHandler)
   - `showPreviewModal()` method in PreviewHandler class (line 1695)
   - `hidePreviewModal()` method in PreviewHandler class (line 1740)
   - Event listeners attached in attachEventListeners() (line 2252-2262)

2. **Main UI Container** - The entire Category Batch Manager interface (still uses regular div, not dialog)

### Current Problems
- Uses custom HTML with `hidden` class for modal visibility
- Not using native Codex components for dialogs
- Missing proper accessibility features
- Inconsistent with Wikimedia design system
- Modal HTML is embedded in buildContainer() method

## Target Architecture

### Vue.js + Codex Dialog Pattern
Following the provided example, implement:
```javascript
mw.loader.using('@wikimedia/codex').then(function (require) {
    const Vue = require('vue');
    const Codex = require('@wikimedia/codex');
    const mountPoint = document.body.appendChild(document.createElement('div'));

    Vue.createMwApp({
        data: function () {
            return {
                showDialog: false,
            };
        },
        template: `
            <cdx-dialog
                v-model:open="showDialog"
                title="Dialog Title"
                :use-close-button="true"
                close-button-label="Close"
                :default-action="defaultAction"
                @default="showDialog = false">
                <!-- Dialog content here -->
            </cdx-dialog>
        `,
        methods: {
            openDialog() {
                this.showDialog = true;
            }
        },
        mounted() {
            triggerElement.addEventListener('click', this.openDialog);
        },
        unmounted() {
            triggerElement.removeEventListener('click', this.openDialog);
        }
    })
        .component('cdx-button', Codex.CdxButton)
        .component('cdx-dialog', Codex.CdxDialog)
        .mount(mountPoint);
});
```

## Implementation Steps

### Step 1: Add Vue to Dependencies
**File:** `src/gadget-entry.js` (lines 2516)

**Current:**
```javascript
mw.loader.using(['@wikimedia/codex', 'mediawiki.api', 'oojs-ui', 'oojs-ui-windows']).then(function () {
    // ...
});
```

**Modified:**
```javascript
mw.loader.using(['@wikimedia/codex', 'mediawiki.api', 'oojs-ui', 'oojs-ui-windows', 'vue']).then(function () {
    // ...
});
```

### Step 2: Create Vue Dialog Component in PreviewHandler
**File:** `src/ui/handlers/PreviewHandler.js` (add new method in PreviewHandler class)

**Location:** Add this method to the PreviewHandler class (after line 1635, before the existing handlePreview method)

```javascript
/**
 * Create and mount Vue-based preview dialog
 * @param {Array} preview - Preview data from batch processor
 */
createPreviewDialog(preview) {
    const Vue = require('vue');
    const Codex = require('@wikimedia/codex');

    // Calculate changes count first
    const changesCount = preview.filter(p => p.willChange).length;

    if (changesCount === 0) {
        console.log('[CBM-P] No changes detected');
        this.ui.showMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice');
        return;
    }

    // Create mount point
    const mountPoint = document.createElement('div');
    mountPoint.id = 'cbm-preview-dialog-mount';
    document.body.appendChild(mountPoint);

    // Generate table HTML
    let tableHtml = '<table class="cbm-preview-table">';
    tableHtml += '<tr><th>File</th><th>Current Categories</th><th>New Categories</th></tr>';

    preview.forEach(item => {
        if (item.willChange) {
            tableHtml += `
                <tr>
                    <td>${item.file}</td>
                    <td>${item.currentCategories.join('<br>')}</td>
                    <td>${item.newCategories.join('<br>')}</td>
                </tr>
            `;
        }
    });

    tableHtml += '</table>';

    const contentHtml = `<p><strong>${changesCount} files will be modified</strong></p>` + tableHtml;

    // Create Vue app with dialog
    const app = Vue.createMwApp({
        data() {
            return {
                showDialog: true,
                defaultAction: {
                    label: 'Close'
                }
            };
        },
        template: `
            <cdx-dialog
                v-model:open="showDialog"
                title="Preview Changes"
                :use-close-button="true"
                close-button-label="Close"
                :default-action="defaultAction"
                @default="handleClose">
                <div v-html="content"></div>
            </cdx-dialog>
        `,
        computed: {
            content() {
                return contentHtml;
            }
        },
        methods: {
            handleClose() {
                this.showDialog = false;
            }
        },
        watch: {
            showDialog(newVal) {
                if (!newVal) {
                    // Cleanup when dialog closes
                    setTimeout(() => {
                        app.unmount();
                        mountPoint.remove();
                    }, 300);
                }
            }
        }
    });

    app.component('cdx-dialog', Codex.CdxDialog);
    app.component('cdx-button', Codex.CdxButton);
    app.mount(mountPoint);

    // Store reference for external control
    this._previewDialogApp = app;
}
```

### Step 3: Refactor showPreviewModal Method
**File:** `src/ui/handlers/PreviewHandler.js` (lines 1695-1735)

**Current:**
```javascript
showPreviewModal(preview) {
    const modal = document.getElementById('cbm-preview-modal');
    const content = document.getElementById('cbm-preview-content');

    if (!modal) {
        console.error('[CBM-P] Preview modal not found');
        return;
    }
    if (!content) {
        console.error('[CBM-P] Preview content container not found');
        return;
    }
    let html = '<table class="cbm-preview-table">';
    html += '<tr><th>File</th><th>Current Categories</th><th>New Categories</th></tr>';

    preview.forEach(item => {
        if (item.willChange) {
            html += `
          <tr>
            <td>${item.file}</td>
            <td>${item.currentCategories.join('<br>')}</td>
            <td>${item.newCategories.join('<br>')}</td>
          </tr>
        `;
        }
    });

    html += '</table>';

    const changesCount = preview.filter(p => p.willChange).length;

    if (changesCount === 0) {
        console.log('[CBM-P] No changes detected');
        this.ui.showMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice');
        return;
    }

    html = `<p>${changesCount} files will be modified</p>` + html;

    content.innerHTML = html;
    modal.classList.remove('hidden');
}
```

**Modified:**
```javascript
showPreviewModal(preview) {
    console.log('[CBM-P] Showing preview modal with Vue-based Codex Dialog');
    // Use Vue-based Codex Dialog
    this.createPreviewDialog(preview);
}
```

### Step 4: Remove hidePreviewModal Method
**File:** `src/ui/handlers/PreviewHandler.js` (lines 1737-1743)

**Action:** Delete this method as it's no longer needed. Dialog closing is handled by Vue reactivity.

**Delete:**
```javascript
/**
 * Hide the preview modal
 */
hidePreviewModal() {
    const modal = document.getElementById('cbm-preview-modal');
    modal.classList.add('hidden');
}
```

### Step 5: Remove HTML Modal from buildContainer
**File:** `src/ui/CategoryBatchManagerUI.js` (lines 2204-2213)

**Find and remove this section from buildContainer() method:**
```html
<div id="cbm-preview-modal" class="cbm-modal hidden">
    <div class="cbm-modal-content">
        <h3>Preview Changes</h3>
        <div id="cbm-preview-content"></div>
        <button id="cbm-preview-close"
            class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium">
            Close
        </button>
    </div>
</div>
```

### Step 6: Remove Modal Event Listeners
**File:** `src/ui/CategoryBatchManagerUI.js` (in `attachEventListeners` method, lines 2252-2262)

**Find and remove:**
```javascript
// Preview modal close button
document.getElementById('cbm-preview-close').addEventListener('click', () => {
    this.previewHandler.hidePreviewModal();
});

// Close modal when clicking outside
document.getElementById('cbm-preview-modal').addEventListener('click', (e) => {
    if (e.target.id === 'cbm-preview-modal') {
        this.previewHandler.hidePreviewModal();
    }
});
```

### Step 7: Update CSS (Optional)
**File:** `src/styles/styles.css`

**Remove modal-related styles:**
```css
.cbm-modal {
    /* Remove all modal styles */
}

.cbm-modal-content {
    /* Remove */
}

.cbm-modal-header {
    /* Remove */
}

.hidden {
    /* Can keep if used elsewhere */
}
```

**Keep only:**
```css
.cbm-preview-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
}

.cbm-preview-table th,
.cbm-preview-table td {
    border: 1px solid var(--border-color-base, #a2a9b1);
    padding: 8px;
    text-align: left;
}

.cbm-preview-table th {
    background-color: var(--background-color-interactive-subtle, #f8f9fa);
    font-weight: bold;
}
```

### Step 8: Create Main UI Dialog (Advanced)
**Optional:** Convert the entire UI container to a cdx-dialog

**File:** `src/ui/CategoryBatchManagerUI.js`

This would replace the entire `renderInterface()` method with a Vue-based app. This is more complex and should be done after the preview modal works.

Example structure:
```javascript
createMainDialog() {
    const Vue = require('vue');
    const Codex = require('@wikimedia/codex');

    const mountPoint = document.createElement('div');
    mountPoint.id = 'category-batch-manager';
    document.body.appendChild(mountPoint);

    const app = Vue.createMwApp({
        data() {
            return {
                showDialog: true,
                files: [],
                selectedFiles: [],
                categoriesToAdd: '',
                categoriesToRemove: '',
                // ... other state
            };
        },
        template: `
            <cdx-dialog
                v-model:open="showDialog"
                title="Category Batch Manager"
                :use-close-button="true"
                close-button-label="Close"
                size="large"
                @default="handleClose">
                <!-- All UI content here -->
                <!-- File list, checkboxes, inputs, buttons -->
            </cdx-dialog>
        `,
        methods: {
            // All UI methods here
        }
    });

    app.component('cdx-dialog', Codex.CdxDialog);
    app.component('cdx-button', Codex.CdxButton);
    app.component('cdx-text-input', Codex.CdxTextInput);
    app.component('cdx-checkbox', Codex.CdxCheckbox);
    app.mount(mountPoint);

    return app;
}
```

## Testing Checklist

### Unit Testing
- [ ] Preview dialog opens when preview button clicked
- [ ] Dialog displays correct file count
- [ ] Table shows all modified files
- [ ] "Proceed" button triggers execution
- [ ] "Close" button closes dialog
- [ ] Close button (X) works
- [ ] Dialog cleanup removes DOM elements
- [ ] Multiple dialogs don't conflict

### Integration Testing
- [ ] Works with existing batch processor
- [ ] Maintains all current functionality
- [ ] CSS styles apply correctly
- [ ] Codex components load properly
- [ ] No console errors

### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Esc)
- [ ] Screen reader announces dialog
- [ ] Focus trap within dialog
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA

### Browser Testing
- [ ] Firefox
- [ ] Chrome
- [ ] Safari
- [ ] Edge

## Rollback Plan

If issues arise:

1. **Immediate rollback:** Restore lines 1865-1896 in `CategoryBatchManagerUI.js`
2. **Restore modal HTML:** Add back modal structure in `renderInterface()`
3. **Restore event listeners:** Add back modal button handlers
4. **Remove Vue code:** Delete new `createPreviewDialog()` method
5. **Test:** Verify old modal works

## Additional Considerations

### Performance
- Vue app creation has minimal overhead (~50ms)
- Cleanup prevents memory leaks
- Consider caching Vue instance if dialog opened repeatedly

### Maintainability
- Follow Codex design patterns
- Use semantic versioning
- Document all Vue component props
- Add JSDoc comments for new methods

### Future Enhancements
- Convert entire UI to Vue components
- Add animations for dialog transitions
- Implement progressive disclosure for large file lists
- Add keyboard shortcuts (Ctrl+P for preview)

## Code Review Points

Before merging, verify:
1. ✅ No breaking changes to existing API
2. ✅ All tests pass
3. ✅ Accessibility audit complete
4. ✅ Performance benchmarks acceptable
5. ✅ Documentation updated
6. ✅ Browser compatibility verified
7. ✅ Codex version compatibility checked

## References

- [Codex Dialog Documentation](https://doc.wikimedia.org/codex/latest/components/demos/dialog.html)
- [Vue.js MediaWiki Integration](https://www.mediawiki.org/wiki/Vue.js)
- [Wikimedia UI Style Guide](https://design.wikimedia.org/style-guide/)
- [Example Implementation](https://github.com/wikimedia/mediawiki-extensions-GrowthExperiments)

## Timeline

- **Phase 1 (Week 1):** Implement preview dialog with cdx-dialog
- **Phase 2 (Week 2):** Testing and bug fixes
- **Phase 3 (Week 3):** Code review and deployment
- **Phase 4 (Optional):** Convert main UI to Vue-based dialog

## Success Metrics

- Zero regression bugs
- Improved accessibility score (Lighthouse audit)
- Positive user feedback
- Code maintainability improved
- Consistent with Wikimedia design system

---

## Quick Start for AI Agent

### IMPORTANT UPDATES (New Code Structure)
The code has been refactored with the following changes:
1. **PreviewHandler class** (line 1635): Now handles all preview-related functionality
2. **ExecuteHandler class** (line 1759): Handles execution operations
3. **SearchHandler class**: Handles search operations
4. **Dependencies updated** (line 2516): Now includes 'oojs-ui' and 'oojs-ui-windows'
5. **Modal HTML location** (line 2204-2213): Embedded in buildContainer() method

### Start here:
1. **Step 1:** Add 'vue' to mw.loader.using() in gadget-entry.js (line 2516)
2. **Step 2:** Create createPreviewDialog() method in PreviewHandler class (after line 1635)
3. **Step 3:** Modify showPreviewModal() in PreviewHandler class (line 1695)
4. **Step 4:** Delete hidePreviewModal() from PreviewHandler class (line 1740)
5. **Step 5:** Remove modal HTML from buildContainer() in CategoryBatchManagerUI (line 2204-2213)
6. **Step 6:** Remove event listeners from attachEventListeners() in CategoryBatchManagerUI (line 2252-2262)
7. **Test:** Run through testing checklist

### File Locations:
- **Preview logic:** PreviewHandler class (starts at line 1635)
- **Main UI:** CategoryBatchManagerUI class (starts at line 2001)
- **Entry point:** gadget-entry.js (starts at line 2499)
- **Modal HTML:** Inside buildContainer() method (line 2204-2213)

## Example Usage

After implementation, the preview modal will work like this:

```javascript
// User clicks "Preview" button (handled by PreviewHandler)
// In PreviewHandler class:
async handlePreview() {
    console.log('[CBM-P] Preview button clicked');
    const selectedFiles = this.ui.getSelectedFiles();

    if (selectedFiles.length === 0) {
        this.ui.showMessage('No files selected.', 'warning');
        return;
    }

    const toAdd = this.ui.parseCategories(
        document.getElementById('cbm-add-cats').value
    );
    const toRemove = this.ui.parseCategories(
        document.getElementById('cbm-remove-cats').value
    );

    this.ui.showLoading();

    try {
        const preview = await this.ui.batchProcessor.previewChanges(
            selectedFiles,
            toAdd,
            toRemove
        );

        // Old: this.showPreviewModal(preview); [used HTML modal]
        // New: Opens Vue-based Codex dialog automatically
        this.showPreviewModal(preview); // Now uses createPreviewDialog internally
        this.ui.hideLoading();

    } catch (error) {
        this.ui.hideLoading();
        this.ui.showMessage(`Error generating preview: ${error.message}`, 'error');
    }
}
```

The dialog will:
- Open with smooth animation
- Display data in accessible table
- Provide clear Close button
- Handle keyboard navigation (Esc to close)
- Clean up on close
- Follow Wikimedia design patterns

## Notes for AI Agent

- **Priority:** Focus on preview modal first (simpler, lower risk)
- **Preserve:** Don't change batch processing logic
- **Accessibility:** Always include ARIA labels
- **Cleanup:** Remove old code after new code works
- **Testing:** Test each step before moving to next
- **Documentation:** Add inline comments explaining Vue reactivity

## Common Pitfalls to Avoid

1. ❌ Don't forget to unmount Vue app on dialog close
2. ❌ Don't create multiple mount points (cleanup properly)
3. ❌ Don't use `innerHTML` for user-generated content (XSS risk)
4. ❌ Don't skip accessibility attributes
5. ❌ Don't ignore browser compatibility
6. ✅ Do use `v-html` carefully with sanitized content
7. ✅ Do test with different amounts of data
8. ✅ Do verify focus management
9. ✅ Do check memory leaks in DevTools

## Conclusion

This plan provides a structured approach to modernizing the Category Batch Manager with Codex Dialog components, improving accessibility, maintainability, and user experience while maintaining all existing functionality.
