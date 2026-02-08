/**
 * Validation Helper
 *
 * @description
 * Shared validation logic for BatchManager handlers.
 * Provides common validation functions used by PreviewHandler and ExecuteHandler.
 *
 * @requires Validator - For checking circular category references
 */

/* global Validator */

class ValidationHelper {
    /**
     * @param {BatchManager} ui - The main UI instance
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
     * Check for circular category references and filter them out silently
     * Only shows error if ALL categories are circular
     * @param {Array<string>} categoriesToAdd - Categories to check for circular references
     * @returns {Array<string>|null} Filtered categories, or null if all are circular
     */
    filterCircularCategories(self) {
        const circularCategories = [];
        const validCategories = [];
        for (const category of self.addCategories) {
            if (Validator.isCircularCategory(self.sourceCategory, category)) {
                console.log('[CBM-V] Circular category detected (silently removed):', category);
                circularCategories.push(category);
            } else {
                validCategories.push(category);
            }
        }

        // If all categories are circular, show error
        if (circularCategories.length > 0 && validCategories.length === 0) {
            self.displayAddCategoryMessage(
                `❌ Cannot add: all categorie(s) are circular references to the current page. Cannot add "${circularCategories.join(', ')}" to itself.`,
                'error'
            );
            return null;
        }

        // Silently filter circular categories if there are valid ones
        return validCategories;
    }

    /**
     * Perform all validation steps before a batch operation
     * @returns {Object|null} Object with selectedFiles, toAdd, toRemove, or null if validation fails
     */
    validateBatchOperation(self) {
        if (!self.selectedFiles) return null;
        if (!self.addCategories && !self.removeCategories) return null;

        // Filter out circular categories (returns null if ALL are circular)
        const filteredToAdd = this.filterCircularCategories(self);
        if (filteredToAdd === null) return null; // All categories were circular

        // Check if there are any valid operations remaining
        if (filteredToAdd.length === 0 && self.removeCategories.length === 0) {
            console.log('[CBM-V] No valid categories after filtering');
            self.displayAddCategoryMessage('No valid categories to add or remove.', 'warning');
            return null;
        }

        return {
            selectedFiles: self.selectedFiles,
            toAdd: filteredToAdd,
            toRemove: self.removeCategories
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationHelper;
}
