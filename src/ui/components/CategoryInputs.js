/**
 * Category inputs UI component using Codex CSS-only classes.
 * Manages the add categories, remove categories, and edit summary inputs.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputs
 */
class CategoryInputs {
    /**
     * Create the category inputs HTML element with Codex components.
     * Uses CdxField, CdxTextInput CSS-only patterns.
     * @returns {HTMLElement} The category inputs element
     */
    createElement() {
        const div = document.createElement('div');
        div.className = 'cbm-category-inputs';
        div.innerHTML = `
            <div class="cdx-field">
                <div class="cdx-label">
                    <label class="cdx-label__label" for="cbm-add-cats">
                        <span class="cdx-label__label__text">Add Categories (comma-separated)</span>
                    </label>
                    <span class="cdx-label__description">
                        e.g., Category:Belarus, Category:Europe
                    </span>
                </div>
                <div class="cdx-field__control">
                    <div class="cdx-text-input">
                        <input id="cbm-add-cats" class="cdx-text-input__input" type="text" placeholder="Category:Example">
                    </div>
                </div>
            </div>

            <div class="cdx-field">
                <div class="cdx-label">
                    <label class="cdx-label__label" for="cbm-remove-cats">
                        <span class="cdx-label__label__text">Remove Categories (comma-separated)</span>
                    </label>
                </div>
                <div class="cdx-field__control">
                    <div class="cdx-text-input">
                        <input id="cbm-remove-cats" class="cdx-text-input__input" type="text" placeholder="Category:Old">
                    </div>
                </div>
            </div>

            <div class="cdx-field">
                <div class="cdx-label">
                    <label class="cdx-label__label" for="cbm-summary">
                        <span class="cdx-label__label__text">Edit Summary</span>
                    </label>
                </div>
                <div class="cdx-field__control">
                    <div class="cdx-text-input">
                        <input id="cbm-summary" class="cdx-text-input__input" type="text"
                            value="Batch category update via Category Batch Manager">
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    /**
     * Attach event listeners for category inputs
     */
    attachListeners() {
        // Add Enter key support for category inputs
        ['cbm-add-cats', 'cbm-remove-cats'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.target.blur();
                    }
                });
            }
        });
    }

    /**
     * Parse comma-separated category input into an array of normalized category names.
     * Auto-adds 'Category:' prefix if not present.
     * @param {string} input - Comma-separated category input
     * @returns {string[]} Array of normalized category names
     */
    parseCategories(input) {
        if (!input || typeof input !== 'string') {
            return [];
        }
        return input
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0)
            .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
    }

    /**
     * Get the categories to add from the input field
     * @returns {string[]} Array of category names to add
     */
    getCategoriesToAdd() {
        const input = document.getElementById('cbm-add-cats');
        return input ? this.parseCategories(input.value) : [];
    }

    /**
     * Get the categories to remove from the input field
     * @returns {string[]} Array of category names to remove
     */
    getCategoriesToRemove() {
        const input = document.getElementById('cbm-remove-cats');
        return input ? this.parseCategories(input.value) : [];
    }

    /**
     * Get the edit summary text
     * @returns {string} Edit summary
     */
    getEditSummary() {
        const input = document.getElementById('cbm-summary');
        return input ? input.value : 'Batch category update via Category Batch Manager';
    }

    /**
     * Clear all category input fields
     */
    clearInputs() {
        const addInput = document.getElementById('cbm-add-cats');
        const removeInput = document.getElementById('cbm-remove-cats');
        if (addInput) addInput.value = '';
        if (removeInput) removeInput.value = '';
    }

    /**
     * Set the edit summary text
     * @param {string} summary - New edit summary
     */
    setEditSummary(summary) {
        const input = document.getElementById('cbm-summary');
        if (input) input.value = summary;
    }

    /**
     * Focus on the add categories input field
     */
    focusAddInput() {
        const input = document.getElementById('cbm-add-cats');
        if (input) input.focus();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryInputs;
}
