/**
 * Preview Handler
 *
 * @description
 * Handles all preview-related functionality for BatchManager.
 * Manages preview generation, modal display, and validation.
 *
 * @requires ValidationHelper - For common validation logic
 */

/* global ValidationHelper */

class PreviewHandler {
    /**
     */
    constructor() {
        this.validator = new ValidationHelper();
    }
    createElement() {
        return `
        <cdx-button @click="previewTheChanges" action="default" weight="normal"
            :disabled="isProcessing">
            Preview Changes
        </cdx-button>
    `;
    }
    // Preview changes before executing
    previewTheChanges(self) {
        console.log('[CBM-P] Preview button clicked');

        const selectedCount = self.selectedCount;

        if (selectedCount === 0) {
            self.showWarningMessage('Please select at least one file.');
            return;
        }

        if (self.addCategories.length === 0 && self.removeCategories.length === 0) {
            self.showWarningMessage('Please specify categories to add or remove.');
            return;
        }

        const validation = this.validator.validateBatchOperation(self);
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

        // Placeholder - implement preview logic
        let previewMessage = `Preview for ${selectedFiles.length} file(s):\n`;
        if (toAdd.length > 0) {
            previewMessage += `\nAdding: ${toAdd.join(', ')}`;
        }
        if (toRemove.length > 0) {
            previewMessage += `\nRemoving: ${toRemove.join(', ')}`;
        }

        // should be replaced by showPreviewModal
        alert(previewMessage);
    }
    /**
     * Handle preview button click
     * Generates and displays a preview of category changes
     */
    async handlePreview(self) {
        console.log('[CBM-P] Preview button clicked');

        // Use ValidationHelper for common validation
        const validation = this.validator.validateBatchOperation(self);
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

        // Generate preview without affecting file list - no loading indicator
        try {
            console.log('[CBM-P] Calling batchProcessor.previewChanges');
            const preview = await self.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );
            console.log('[CBM-P] Preview result:', preview);
            this.showPreviewModal(self, preview);

        } catch (error) {
            console.log('[CBM-P] Error in previewChanges:', error);
            // Check if error is about duplicate categories
            if (error.message.includes('already exist')) {
                self.showWarningMessage(`⚠️ ${error.message}`);
            } else {
                self.showErrorMessage(`Error generating preview: ${error.message}`);
            }
        }
    }

    /**
     * Show the preview modal with changes
     * @param {Array} preview - Array of preview items
     */
    showPreviewModal(self, preview) {
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
            self.displayCategoryMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice', 'add');
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
