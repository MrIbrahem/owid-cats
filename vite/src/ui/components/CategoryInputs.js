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
            <div class="cbm-category-input-group">
                <cdx-label input-id="cbm-add-cats" class="cbm-label">
                    Add Categories
                </cdx-label>
                <span class="cbm-help-text">
                    e.g., Category:Belarus, Category:Europe
                </span>
                <cdx-multiselect-lookup
                    id="cdx-category-add"
                    v-model:input-chips="addCategoryChips"
                    v-model:selected="addCategories"
		            v-model:input-value="addInputValue"
                    :menu-items="addCategoryMenuItems"
                    :menu-config="addCategoryMenuConfig"
                    aria-label="Add categories"
                    placeholder="Type to search categories"
                    @input="onAddCategoryInput"
                    @update:input-value="onUpdateInputValue"
		            @load-more="addOnLoadMore"
                >
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>

            <div class="cbm-category-input-group">
                <cdx-label input-id="cbm-remove-cats" class="cbm-label">
                    Remove Categories
                </cdx-label>
                <cdx-multiselect-lookup
                    id="cdx-category-remove"
                    v-model:input-chips="removeCategoryChips"
                    v-model:selected="removeCategories"
                    :menu-items="removeCategoryMenuItems"
                    :menu-config="removeCategoryMenuConfig"
                    aria-label="Remove categories"
                    placeholder="Type to search categories"
                    @input="onRemoveCategoryInput"
                    @update:input-value="handleRemoveCategoryChipChange"
                    >
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>
    `;
    }
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
    onUpdateInputValue(self, newChips) {
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
