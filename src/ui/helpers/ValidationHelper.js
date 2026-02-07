/**
 * Validation Helper
 *
 * @description
 * Shared validation logic for CategoryBatchManagerUI handlers.
 * Provides common validation functions used by PreviewHandler and ExecuteHandler.
 *
 * @requires Validator - For checking circular category references
 */

/* global Validator */

class ValidationHelper {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
    }

    /**
     * Get and validate selected files
     * @returns {Array|null} Array of selected files, or null if validation fails
     */
    getSelectedFiles() {
        const selectedFiles = this.ui.getSelectedFiles();
        console.log('[CBM-V] Selected files:', selectedFiles);
        if (selectedFiles.length === 0) {
            console.log('[CBM-V] No files selected');
            this.ui.showMessage('No files selected.', 'warning');
            return null;
        }
        return selectedFiles;
    }

    /**
     * Parse and validate category inputs
     * @returns {Object|null} Object with toAdd and toRemove arrays, or null if validation fails
     */
    parseCategoryInputs() {
        const toAdd = this.ui.parseCategories(
            document.getElementById('cbm-add-cats').value
        );
        const toRemove = this.ui.parseCategories(
            document.getElementById('cbm-remove-cats').value
        );
        console.log('[CBM-V] Categories to add:', toAdd);
        console.log('[CBM-V] Categories to remove:', toRemove);

        if (toAdd.length === 0 && toRemove.length === 0) {
            console.log('[CBM-V] No categories specified');
            this.ui.showMessage('Please specify categories to add or remove.', 'warning');
            return null;
        }

        return { toAdd, toRemove };
    }

    /**
     * Check for circular category references
     * @param {Array<string>} categoriesToAdd - Categories to check for circular references
     * @returns {boolean} True if validation passes, false if circular reference detected
     */
    checkCircularCategories(categoriesToAdd) {
        const sourceCategory = this.ui.state.sourceCategory;
        for (const category of categoriesToAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                console.log('[CBM-V] Circular category detected:', category);
                this.ui.showMessage(
                    `⚠️ Cannot add category "${category}" to itself. You are trying to add a category to the same category page you're working in.`,
                    'error'
                );
                return false;
            }
        }
        return true;
    }

    /**
     * Perform all validation steps before a batch operation
     * @returns {Object|null} Object with selectedFiles, toAdd, toRemove, or null if validation fails
     */
    validateBatchOperation() {
        const selectedFiles = this.getSelectedFiles();
        if (!selectedFiles) return null;

        const categoryInputs = this.parseCategoryInputs();
        if (!categoryInputs) return null;

        if (!this.checkCircularCategories(categoryInputs.toAdd)) return null;

        return {
            selectedFiles,
            toAdd: categoryInputs.toAdd,
            toRemove: categoryInputs.toRemove
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationHelper;
}
