/**
 * Category inputs UI component using Codex CSS-only classes.
 * Manages the add categories, remove categories inputs with autocomplete.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputs
 */
class CategoryInputs {
    /**
     * @param {APIService} apiService - API service for category search
     */
    constructor(apiService) {
        this.apiService = apiService;
    }

    /**
     * Create the category inputs HTML element with Codex components.
     */
    createElement() {
        return `
            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-add-cats" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Add Categories
                </cdx-label>
                <span style="display: block; color: #54595d; font-size: 0.875em; margin-bottom: 5px;">
                    e.g., Category:Belarus, Category:Europe
                </span>
                <cdx-multiselect-lookup v-model:input-chips="addCategoryChips" v-model:selected="addCategories"
                    :menu-items="addCategoryMenuItems" :menu-config="addCategoryMenuConfig"
                    aria-label="Add categories" placeholder="Type to search categories" @input="onAddCategoryInput"
                    @update:input-chips="handleAddCategoryChipChange">
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>

            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-remove-cats" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Remove Categories
                </cdx-label>
                <cdx-multiselect-lookup v-model:input-chips="removeCategoryChips"
                    v-model:selected="removeCategories" :menu-items="removeCategoryMenuItems"
                    :menu-config="removeCategoryMenuConfig" aria-label="Remove categories"
                    placeholder="Type to search categories" @input="onRemoveCategoryInput"
                    @update:input-chips="handleRemoveCategoryChipChange">
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>
    `;
    }
    // handleAddCategoryChipChange, onAddCategoryInput, onRemoveCategoryInput, handleRemoveCategoryChipChange
    /**
     * Handle add category input with debounce.
     * @param {string} value - The input value to search for
     */
    onAddCategoryInput(self, value) {
        // Clear previous timeout
        if (self.addCategoryDebounce) {
            clearTimeout(self.addCategoryDebounce);
        }

        // If empty, clear menu items
        if (!value || value.trim().length < 2) {
            self.addCategoryMenuItems = [];
            return;
        }

        // Debounce API call
        self.addCategoryDebounce = setTimeout(() => {
            this.apiService.fetchCategories(value).then((items) => {
                self.addCategoryMenuItems = items;
            });
        }, 300); // 300ms debounce
    }

    /**
     * Handle remove category input with debounce.
     * @param {string} value - The input value to search for
     */
    onRemoveCategoryInput(self, value) {
        // Clear previous timeout
        if (self.removeCategoryDebounce) {
            clearTimeout(self.removeCategoryDebounce);
        }

        // If empty, clear menu items
        if (!value || value.trim().length < 2) {
            self.removeCategoryMenuItems = [];
            return;
        }

        // Debounce API call
        self.removeCategoryDebounce = setTimeout(() => {
            this.apiService.fetchCategories(value).then((items) => {
                self.removeCategoryMenuItems = items;
            });
        }, 300); // 300ms debounce
    }

    /**
     * Handle chip changes for add categories.
     * @param {Array} newChips - The new chips array
     */
    handleAddCategoryChipChange(self, newChips) {
        self.addCategoryChips = newChips;
        self.addCategories = newChips.map(chip => chip.value);
    }

    /**
     * Handle chip changes for remove categories.
     * @param {Array} newChips - The new chips array
     */
    handleRemoveCategoryChipChange(self, newChips) {
        self.removeCategoryChips = newChips;
        self.removeCategories = newChips.map(chip => chip.value);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryInputs;
}
