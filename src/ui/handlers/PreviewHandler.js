/**
 * Preview Handler
 *
 * @description
 * Handles all preview-related functionality for CategoryBatchManagerUI.
 * Manages preview generation, modal display, and validation.
 *
 * @requires ValidationHelper - For common validation logic
 */

/* global ValidationHelper */

class PreviewHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
        this.validator = new ValidationHelper(ui);
    }

    /**
     * Handle preview button click
     * Generates and displays a preview of category changes
     */
    async handlePreview() {
        console.log('[CBM-P] Preview button clicked');

        // Use ValidationHelper for common validation
        const validation = this.validator.validateBatchOperation();
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

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
        if (!modal) {
            console.error('[CBM] Preview modal container not found');
            return;
        }
        if (!content) {
            console.error('[CBM] Preview content container not found');
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
            console.log('[CBM] No changes detected');
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
