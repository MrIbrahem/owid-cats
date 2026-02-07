/**
 * Category inputs UI component with autocomplete support.
 * Uses OOUI widgets and MediaWiki API for category suggestions.
 *
 * @requires mw.Api - MediaWiki API for category search
 * @requires OO.ui - OOUI library for combobox widgets
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputs
 */
/* global mw, OO */

class CategoryInputs {
  /**
   * Create a new CategoryInputs component.
   * @param {APIService} apiService - API service instance for fetching categories
   */
  constructor(apiService = null) {
    this.apiService = apiService;
    this.addCategoriesWidget = null;
    this.removeCategoriesWidget = null;
    this.summaryWidget = null;

    // Initialize mw.Api if not provided
    if (!this.apiService && typeof mw !== 'undefined' && mw.Api) {
      this.mwApi = new mw.Api();
    }
  }

  /**
   * Create the category inputs HTML element with OOUI autocomplete widgets.
   * @returns {HTMLElement} The container element with all inputs
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-actions';

    // Create "Add Categories" autocomplete widget
    const addCatsField = this._createField(
      'cbm-add-cats',
      'Add Categories (comma-separated)',
      'e.g., Category:Belarus, Category:Europe',
      'Category:Example'
    );
    div.appendChild(addCatsField);

    // Create "Remove Categories" autocomplete widget
    const removeCatsField = this._createField(
      'cbm-remove-cats',
      'Remove Categories (comma-separated)',
      '',
      'Category:Old'
    );
    div.appendChild(removeCatsField);

    // Create "Edit Summary" field (simple text input, no autocomplete)
    const summaryField = this._createField(
      'cbm-summary',
      'Edit Summary',
      '',
      'Batch category update via Category Batch Manager',
      false // No autocomplete for summary
    );
    div.appendChild(summaryField);

    // Initialize OOUI widgets after DOM insertion
    setTimeout(() => this._initWidgets(), 0);

    return div;
  }

  /**
   * Initialize OOUI widgets for autocomplete functionality.
   * @private
   */
  _initWidgets() {
    // Check if OOUI is available
    if (typeof OO === 'undefined' || !OO.ui) {
      console.warn('[CategoryInputs] OOUI not available, falling back to plain inputs');
      return;
    }

    // Initialize Add Categories combobox
    const addCatsInput = document.getElementById('cbm-add-cats');
    if (addCatsInput) {
      this.addCategoriesWidget = this._createAutocompleteWidget(
        'cbm-add-cats',
        'Category:Example'
      );
    }

    // Initialize Remove Categories combobox
    const removeCatsInput = document.getElementById('cbm-remove-cats');
    if (removeCatsInput) {
      this.removeCategoriesWidget = this._createAutocompleteWidget(
        'cbm-remove-cats',
        'Category:Old'
      );
    }

    // Initialize Summary widget (simple text input)
    const summaryInput = document.getElementById('cbm-summary');
    if (summaryInput) {
      this.summaryWidget = new OO.ui.TextInputWidget({
        $input: $(summaryInput),
        value: summaryInput.value
      });
    }
  }

  /**
   * Create an autocomplete widget using OOUI ComboBoxInputWidget.
   * @param {string} inputId - ID of the input element
   * @param {string} placeholder - Placeholder text
   * @returns {OO.ui.ComboBoxInputWidget|null} The widget or null if OOUI unavailable
   * @private
   */
  _createAutocompleteWidget(inputId, placeholder) {
    if (typeof OO === 'undefined' || !OO.ui || !OO.ui.ComboBoxInputWidget) {
      return null;
    }

    const inputElement = document.getElementById(inputId);
    if (!inputElement) return null;

    // Store reference for cleanup
    const originalInput = inputElement;

    const widget = new OO.ui.ComboBoxInputWidget({
      $input: $(inputElement),
      placeholder: placeholder,
      options: [], // Will be populated dynamically
      menu: {
        filterFromInput: true,
        highlightFooter: false,
        highlightFirst: true,
        items: []
      }
    });

    // Add autocomplete search handler
    this._setupAutocompleteSearch(widget);

    return widget;
  }

  /**
   * Setup autocomplete search functionality for the widget.
   * @param {OO.ui.ComboBoxInputWidget} widget - The combobox widget
   * @private
   */
  _setupAutocompleteSearch(widget) {
    if (!widget) return;

    let searchTimeout = null;
    const SEARCH_DELAY = 300; // ms

    widget.on('change', (value) => {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Don't search if value is empty or too short
      const trimmedValue = value.trim();
      if (trimmedValue.length < 2) {
        return;
      }

      // Debounce the search
      searchTimeout = setTimeout(() => {
        this._searchCategories(trimmedValue, widget);
      }, SEARCH_DELAY);
    });
  }

  /**
   * Search for categories matching the given query using MediaWiki API.
   * @param {string} query - Search query
   * @param {OO.ui.ComboBoxInputWidget} widget - The widget to update with results
   * @private
   */
  async _searchCategories(query, widget) {
    if (!widget) return;

    try {
      let categories = [];

      // Use mw.Api directly for category search
      if (typeof mw !== 'undefined' && mw.Api) {
        const api = this.mwApi || new mw.Api();

        const data = await api.get({
          action: 'opensearch',
          namespace: 14, // Category namespace
          search: query,
          limit: 10,
          redirects: 'resolve'
        });

        // Format results
        if (data && data[1]) {
          categories = data[1].map(title => {
            // Ensure "Category:" prefix
            return title.startsWith('Category:') ? title : `Category:${title}`;
          });
        }
      }

      // Update widget options
      if (categories.length > 0) {
        const options = categories.map(cat => ({ data: cat, label: cat }));
        widget.setOptions(options);
      }

    } catch (error) {
      console.error('[CategoryInputs] Failed to search categories:', error);
    }
  }

  /**
   * Create a labeled field container.
   * @param {string} inputId - ID for the input element
   * @param {string} labelText - Label text
   * @param {string} description - Optional description text
   * @param {string} placeholder - Placeholder text
   * @param {boolean} withAutocomplete - Whether this field should have autocomplete
   * @returns {HTMLElement} The field element
   * @private
   */
  _createField(inputId, labelText, description = '', placeholder = '', withAutocomplete = true) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cdx-field';

    let descriptionHtml = '';
    if (description) {
      descriptionHtml = `
        <span class="cdx-label__description">${description}</span>
      `;
    }

    wrapper.innerHTML = `
      <div class="cdx-label">
        <label class="cdx-label__label" for="${inputId}">
          <span class="cdx-label__label__text">${labelText}</span>
        </label>
        ${descriptionHtml}
      </div>
      <div class="cdx-field__control">
        <div class="cdx-text-input">
          <input id="${inputId}" class="cdx-text-input__input" type="text" placeholder="${placeholder}">
        </div>
      </div>
    `;

    return wrapper;
  }

  /**
   * Get categories to add
   * @returns {Array<string>} Parsed category names
   */
  getCategoriesToAdd() {
    const input = document.getElementById('cbm-add-cats');
    if (!input) return [];
    return this.parseCategories(input.value);
  }

  /**
   * Get categories to remove
   * @returns {Array<string>} Parsed category names
   */
  getCategoriesToRemove() {
    const input = document.getElementById('cbm-remove-cats');
    if (!input) return [];
    return this.parseCategories(input.value);
  }

  /**
   * Get edit summary
   * @returns {string} Edit summary text
   */
  getEditSummary() {
    const input = document.getElementById('cbm-summary');
    if (!input) return '';
    return input.value;
  }

  /**
   * Parse comma-separated category input.
   * Handles various formats:
   * - "Category:Test" -> "Category:Test"
   * - "Test" -> "Category:Test"
   * - "Category:Test 1, Test 2" -> ["Category:Test 1", "Category:Test 2"]
   *
   * @param {string} input - Raw input string
   * @returns {Array<string>} Array of category names with "Category:" prefix
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
   * Clear all input fields.
   */
  clear() {
    const addInput = document.getElementById('cbm-add-cats');
    const removeInput = document.getElementById('cbm-remove-cats');
    const summaryInput = document.getElementById('cbm-summary');

    if (addInput) addInput.value = '';
    if (removeInput) removeInput.value = '';
    if (summaryInput) summaryInput.value = 'Batch category update via Category Batch Manager';

    // Update OOUI widgets if they exist
    if (this.addCategoriesWidget) {
      this.addCategoriesWidget.setValue('');
    }
    if (this.removeCategoriesWidget) {
      this.removeCategoriesWidget.setValue('');
    }
    if (this.summaryWidget) {
      this.summaryWidget.setValue('Batch category update via Category Batch Manager');
    }
  }

  /**
   * Cleanup widgets and remove references.
   */
  destroy() {
    if (this.addCategoriesWidget) {
      this.addCategoriesWidget.destroy();
      this.addCategoriesWidget = null;
    }
    if (this.removeCategoriesWidget) {
      this.removeCategoriesWidget.destroy();
      this.removeCategoriesWidget = null;
    }
    if (this.summaryWidget) {
      this.summaryWidget.destroy();
      this.summaryWidget = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryInputs;
}
