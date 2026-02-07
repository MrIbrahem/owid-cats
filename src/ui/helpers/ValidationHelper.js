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
     * Check for circular category references and filter them out
     * @param {Array<string>} categoriesToAdd - Categories to check for circular references
     * @returns {Array<string>} Filtered categories without circular ones
     */
    filterCircularCategories(categoriesToAdd) {
        const sourceCategory = this.ui.state.sourceCategory;
        const circularCategories = [];
        const validCategories = [];

        for (const category of categoriesToAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                console.log('[CBM-V] Circular category detected:', category);
                circularCategories.push(category);
            } else {
                validCategories.push(category);
            }
        }

        // Show warning if circular categories were found
        if (circularCategories.length > 0) {
            this.ui.showMessage(
                `⚠️ Removed circular categorie(s) that cannot be added: ${circularCategories.join(', ')}. Continuing with ${validCategories.length} valid categorie(s).`,
                'warning'
            );
        }

        return validCategories;
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

        // Filter out circular categories instead of failing
        const filteredToAdd = this.filterCircularCategories(categoryInputs.toAdd);

        // Check if there are any valid operations remaining
        if (filteredToAdd.length === 0 && categoryInputs.toRemove.length === 0) {
            console.log('[CBM-V] No valid categories after filtering');
            this.ui.showMessage('No valid categories to add or remove after filtering circular references.', 'warning');
            return null;
        }

        return {
            selectedFiles,
            toAdd: filteredToAdd,
            toRemove: categoryInputs.toRemove
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationHelper;
}
