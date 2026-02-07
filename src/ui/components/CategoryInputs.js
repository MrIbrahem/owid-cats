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
        this.searchTimeout = null;
        this.activeDropdown = null;
        this.selectedIndex = -1;
    }

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
                <div class="cdx-field__control cbm-input-with-dropdown">
                    <div class="cdx-text-input">
                        <input id="cbm-add-cats" class="cdx-text-input__input cbm-category-input" type="text" placeholder="Category:Example" autocomplete="off">
                    </div>
                </div>
            </div>

            <div class="cdx-field">
                <div class="cdx-label">
                    <label class="cdx-label__label" for="cbm-remove-cats">
                        <span class="cdx-label__label__text">Remove Categories (comma-separated)</span>
                    </label>
                </div>
                <div class="cdx-field__control cbm-input-with-dropdown">
                    <div class="cdx-text-input">
                        <input id="cbm-remove-cats" class="cdx-text-input__input cbm-category-input" type="text" placeholder="Category:Old" autocomplete="off">
                    </div>
                </div>
            </div>

        `;
        return div;
    }

    /**
     * Attach event listeners for category inputs including autocomplete
     */
    attachListeners() {
        const inputs = document.querySelectorAll('.cbm-category-input');

        inputs.forEach(input => {
            // Input event for autocomplete
            input.addEventListener('input', (e) => {
                this.handleInput(e.target);
            });

            // Keyboard navigation
            input.addEventListener('keydown', (e) => {
                this.handleKeydown(e);
            });

            // Close dropdown on blur
            input.addEventListener('blur', (e) => {
                // Delay to allow clicking on dropdown items
                setTimeout(() => {
                    this.hideDropdown();
                }, 200);
            });

            // Show dropdown on focus
            input.addEventListener('focus', (e) => {
                const value = e.target.value.trim();
                if (value) {
                    this.handleInput(e.target);
                }
            });
        });
    }

    /**
     * Handle input event for autocomplete
     * @param {HTMLInputElement} input - The input element
     */
    async handleInput(input) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        const value = input.value.trim();

        // Get the last category being typed (after last comma)
        const lastCommaIndex = value.lastIndexOf(',');
        const currentInput = lastCommaIndex >= 0
            ? value.substring(lastCommaIndex + 1).trim()
            : value;

        // Don't search if empty or already has Category: prefix (user might be pasting)
        if (!currentInput || currentInput === 'Category:') {
            this.hideDropdown();
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(async () => {
            try {
                const results = await this.apiService.searchCategories(currentInput, { limit: 10 });
                this.showDropdown(input, results, lastCommaIndex);
            } catch (error) {
                // Silently fail on search errors
                this.hideDropdown();
            }
        }, 300);
    }

    /**
     * Handle keyboard navigation in dropdown
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeydown(e) {
        const dropdown = this.activeDropdown;
        if (!dropdown) return;

        const items = dropdown.querySelectorAll('.cbm-dropdown-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    this.selectItem(items[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }

    /**
     * Update visual selection in dropdown
     * @param {NodeListOf<Element>} items - Dropdown items
     */
    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('cbm-dropdown-item--selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('cbm-dropdown-item--selected');
            }
        });
    }

    /**
     * Show dropdown with suggestions
     * @param {HTMLInputElement} input - The input element
     * @param {string[]} results - Search results
     * @param {number} lastCommaIndex - Index of last comma in input value
     */
    showDropdown(input, results, lastCommaIndex = -1) {
        // Remove existing dropdown
        this.hideDropdown();

        if (results.length === 0) {
            return;
        }

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'cbm-dropdown';
        dropdown.innerHTML = results.map(cat => `
            <div class="cbm-dropdown-item" data-value="${this.escapeHtml(cat)}">
                ${this.escapeHtml(cat)}
            </div>
        `).join('');

        // Position dropdown below input
        const rect = input.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 4}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.maxHeight = '200px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.zIndex = '1000';

        // Add click handlers
        dropdown.querySelectorAll('.cbm-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item, input, lastCommaIndex);
            });
            item.addEventListener('mouseenter', () => {
                const items = dropdown.querySelectorAll('.cbm-dropdown-item');
                items.forEach(i => i.classList.remove('cbm-dropdown-item--selected'));
                item.classList.add('cbm-dropdown-item--selected');
                this.selectedIndex = Array.from(items).indexOf(item);
            });
        });

        document.body.appendChild(dropdown);
        this.activeDropdown = dropdown;
        this.selectedIndex = -1;
    }

    /**
     * Hide and remove dropdown
     */
    hideDropdown() {
        if (this.activeDropdown) {
            this.activeDropdown.remove();
            this.activeDropdown = null;
        }
        this.selectedIndex = -1;
    }

    /**
     * Select a dropdown item
     * @param {Element} item - The selected item
     * @param {HTMLInputElement} input - The input element
     * @param {number} lastCommaIndex - Index of last comma in input value
     */
    selectItem(item, input = null, lastCommaIndex = -1) {
        if (!input) {
            input = document.querySelector('.cbm-category-input:focus');
        }
        if (!input) return;

        const value = item.dataset.value;
        const currentValue = input.value;

        let newValue;
        if (lastCommaIndex >= 0) {
            // Replace the part after last comma
            newValue = currentValue.substring(0, lastCommaIndex + 1) + ' ' + value + ', ';
        } else {
            // Replace entire value
            newValue = value + ', ';
        }

        input.value = newValue;
        input.focus();
        this.hideDropdown();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
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
     * Clear all category input fields
     */
    clearInputs() {
        const addInput = document.getElementById('cbm-add-cats');
        const removeInput = document.getElementById('cbm-remove-cats');
        if (addInput) addInput.value = '';
        if (removeInput) removeInput.value = '';
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
