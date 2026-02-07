/**
 * Preview Handler
 *
 * @description
 * Handles all preview-related functionality for CategoryBatchManagerUI.
 * Manages preview generation, modal display, and validation.
 *
 * @requires Validator - For checking circular category references
 */

/* global Validator */

class PreviewHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
    }

    /**
     * Handle preview button click
     * Generates and displays a preview of category changes
     */
    async handlePreview() {
        console.log('[CBM-P] Preview button clicked');
        const selectedFiles = this.ui.getSelectedFiles();
        console.log('[CBM-P] Selected files:', selectedFiles);
        if (selectedFiles.length === 0) {
            console.log('[CBM-P] No files selected');
            this.ui.showMessage('No files selected.', 'warning');
            return;
        }

        const toAdd = this.ui.parseCategories(
            document.getElementById('cbm-add-cats').value
        );
        const toRemove = this.ui.parseCategories(
            document.getElementById('cbm-remove-cats').value
        );
        console.log('[CBM-P] Categories to add:', toAdd);
        console.log('[CBM-P] Categories to remove:', toRemove);

        if (toAdd.length === 0 && toRemove.length === 0) {
            console.log('[CBM-P] No categories specified');
            this.ui.showMessage('Please specify categories to add or remove.', 'warning');
            return;
        }

        // Check for circular category reference
        const sourceCategory = this.ui.state.sourceCategory;
        for (const category of toAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                console.log('[CBM-P] Circular category detected:', category);
                this.ui.showMessage(
                    `⚠️ Cannot add category "${category}" to itself. You are trying to add a category to the same category page you're working in.`,
                    'error'
                );
                return;
            }
        }

        // Generate preview without affecting file list - no loading indicator
        try {
            console.log('[CBM-P] Calling batchProcessor.previewChanges');
            const preview = await this.ui.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );
            console.log('[CBM-P] Preview result:', preview);
            this.showPreviewModal(preview);

        } catch (error) {
            console.log('[CBM-P] Error in previewChanges:', error);
            // Check if error is about duplicate categories
            if (error.message.includes('already exist')) {
                this.ui.showMessage(`⚠️ ${error.message}`, 'warning');
            } else {
                this.ui.showMessage(`Error generating preview: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Show the preview modal with changes
     * @param {Array} preview - Array of preview items
     */
    showPreviewModal(preview) {
        const modal = document.getElementById('cbm-preview-modal');
        const content = document.getElementById('cbm-preview-content');

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
            this.ui.showMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice');
            return;
        }

        html = `<p>${changesCount} files will be modified</p>` + html;

        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    /**
     * Hide the preview modal
     */
    hidePreviewModal() {
        const modal = document.getElementById('cbm-preview-modal');
        modal.classList.add('hidden');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreviewHandler;
}
