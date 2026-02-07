/**
 * Category inputs UI component with multiselect support.
 * Uses OOUI MenuTagMultidget and MediaWiki API for category suggestions.
 *
 * @requires mw.Api - MediaWiki API for category search
 * @requires OO.ui - OOUI library for multiselect widgets
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

    // Store available categories for both widgets
    this.availableCategories = [];

    // Initialize mw.Api if not provided
    if (!this.apiService && typeof mw !== 'undefined' && mw.Api) {
      this.mwApi = new mw.Api();
    }
  }

  /**
   * Create the category inputs HTML element with OOUI multiselect widgets.
   * @returns {HTMLElement} The container element with all inputs
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-actions';

    // Create "Add Categories" multiselect widget container
    const addCatsField = this._createField(
      'cbm-add-cats',
      'Add Categories',
      'Search and select multiple categories to add',
      'Search categories...'
    );
    div.appendChild(addCatsField);

    // Create "Remove Categories" multiselect widget container
    const removeCatsField = this._createField(
      'cbm-remove-cats',
      'Remove Categories',
      'Search and select multiple categories to remove',
      'Search categories...'
    );
    div.appendChild(removeCatsField);

    // Create "Edit Summary" field (simple text input, no multiselect)
    const summaryField = this._createField(
      'cbm-summary',
      'Edit Summary',
      '',
      'Batch category update via Category Batch Manager',
      false
    );
    div.appendChild(summaryField);

    // Initialize OOUI widgets after DOM insertion
    setTimeout(() => this._initWidgets(), 0);

    return div;
  }

  /**
   * Initialize OOUI widgets for multiselect functionality.
   * @private
   */
  _initWidgets() {
    // Check if OOUI is available
    if (typeof OO === 'undefined' || !OO.ui) {
      console.warn('[CategoryInputs] OOUI not available, falling back to plain inputs');
      return;
    }

    // Check if MenuTagMultidget is available
    if (!OO.ui.MenuTagMultidget) {
      console.warn('[CategoryInputs] OO.ui.MenuTagMultidget not available, falling back to ComboBoxInputWidget');
      this._initComboBoxWidgets();
      return;
    }

    // Initialize Add Categories multiselect
    const addCatsContainer = document.getElementById('cbm-add-cats-container');
    if (addCatsContainer) {
      this.addCategoriesWidget = this._createMultiselectWidget(
        'cbm-add-cats',
        'Search categories...'
      );
      if (this.addCategoriesWidget) {
        addCatsContainer.appendChild(this.addCategoriesWidget.$element[0]);
      }
    }

    // Initialize Remove Categories multiselect
    const removeCatsContainer = document.getElementById('cbm-remove-cats-container');
    if (removeCatsContainer) {
      this.removeCategoriesWidget = this._createMultiselectWidget(
        'cbm-remove-cats',
        'Search categories...'
      );
      if (this.removeCategoriesWidget) {
        removeCatsContainer.appendChild(this.removeCategoriesWidget.$element[0]);
      }
    }

    // Initialize Summary widget (simple text input)
    const summaryInput = document.getElementById('cbm-summary');
    if (summaryInput && OO.ui.TextInputWidget) {
      this.summaryWidget = new OO.ui.TextInputWidget({
        $input: $(summaryInput),
        value: summaryInput.value
      });
    }
  }

  /**
   * Fallback: Initialize ComboBoxInputWidget if MenuTagMultidget is not available.
   * @private
   */
  _initComboBoxWidgets() {
    if (!OO.ui.ComboBoxInputWidget) return;

    const addCatsInput = document.getElementById('cbm-add-cats');
    if (addCatsInput) {
      this.addCategoriesWidget = this._createComboBoxWidget(
        'cbm-add-cats',
        'Category:Example'
      );
    }

    const removeCatsInput = document.getElementById('cbm-remove-cats');
    if (removeCatsInput) {
      this.removeCategoriesWidget = this._createComboBoxWidget(
        'cbm-remove-cats',
        'Category:Old'
      );
    }

    const summaryInput = document.getElementById('cbm-summary');
    if (summaryInput) {
      this.summaryWidget = new OO.ui.TextInputWidget({
        $input: $(summaryInput),
        value: summaryInput.value
      });
    }
  }

  /**
   * Create a multiselect widget using OOUI MenuTagMultidget.
   * @param {string} inputId - ID of the input element
   * @param {string} placeholder - Placeholder text
   * @returns {OO.ui.MenuTagMultidget|null} The widget or null if not available
   * @private
   */
  _createMultiselectWidget(inputId, placeholder) {
    if (typeof OO === 'undefined' || !OO.ui || !OO.ui.MenuTagMultidget) {
      return null;
    }

    const widget = new OO.ui.MenuTagMultidget({
      placeholder: placeholder,
      allowArbitrary: false, // Only allow selections from menu
      allowEditTags: false,  // Don't allow editing tags after selection
      tagLimit: 10,          // Maximum number of tags
        menu: {
          filterFromInput: true,
          highlightFooter: false,
          highlightFirst: true
        }
    });

    // Setup autocomplete search
    this._setupMultiselectSearch(widget);

    return widget;
  }

  /**
   * Create a fallback combobox widget.
   * @param {string} inputId - ID of the input element
   * @param {string} placeholder - Placeholder text
   * @returns {OO.ui.ComboBoxInputWidget|null} The widget or null if not available
   * @private
   */
  _createComboBoxWidget(inputId, placeholder) {
    if (typeof OO === 'undefined' || !OO.ui || !OO.ui.ComboBoxInputWidget) {
      return null;
    }

    const inputElement = document.getElementById(inputId);
    if (!inputElement) return null;

    const widget = new OO.ui.ComboBoxInputWidget({
      $input: $(inputElement),
      placeholder: placeholder,
      options: []
    });

    this._setupAutocompleteSearch(widget);
    return widget;
  }

  /**
   * Setup autocomplete search functionality for MenuTagMultidget.
   * @param {OO.ui.MenuTagMultidget} widget - The multiselect widget
   * @private
   */
  _setupMultiselectSearch(widget) {
    if (!widget) return;

    let searchTimeout = null;
    const SEARCH_DELAY = 300; // ms

    // Handle input changes for searching categories
    widget.on('inputChange', (value) => {
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
        this._searchCategoriesForMultiselect(trimmedValue, widget);
      }, SEARCH_DELAY);
    });
  }

  /**
   * Setup autocomplete search for ComboBoxInputWidget (fallback).
   * @param {OO.ui.ComboBoxInputWidget} widget - The combobox widget
   * @private
   */
  _setupAutocompleteSearch(widget) {
    if (!widget) return;

    let searchTimeout = null;
    const SEARCH_DELAY = 300;

    widget.on('change', (value) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const trimmedValue = value.trim();
      if (trimmedValue.length < 2) {
        return;
      }

      searchTimeout = setTimeout(() => {
        this._searchCategoriesForCombobox(trimmedValue, widget);
      }, SEARCH_DELAY);
    });
  }

  /**
   * Search for categories matching the given query for MenuTagMultidget.
   * @param {string} query - Search query
   * @param {OO.ui.MenuTagMultidget} widget - The widget to update with results
   * @private
   */
  async _searchCategoriesForMultiselect(query, widget) {
    if (!widget) return;

    try {
      let categories = [];

      if (typeof mw !== 'undefined' && mw.Api) {
        const api = this.mwApi || new mw.Api();

        const data = await api.get({
          action: 'opensearch',
          namespace: 14,
          search: query,
          limit: 10,
          redirects: 'resolve'
        });

        if (data && data[1]) {
          categories = data[1].map(title => {
            return title.startsWith('Category:') ? title : `Category:${title}`;
          });
        }
      }

      // Update widget menu options
      if (categories.length > 0) {
        const menuOptions = categories.map(cat => ({
          data: cat,
          label: cat
        }));
        widget.clearOptions();
        menuOptions.forEach(option => widget.addOption(option));
      }

    } catch (error) {
      console.error('[CategoryInputs] Failed to search categories:', error);
    }
  }

  /**
   * Search for categories matching the given query for ComboBoxInputWidget.
   * @param {string} query - Search query
   * @param {OO.ui.ComboBoxInputWidget} widget - The widget to update with results
   * @private
   */
  async _searchCategoriesForCombobox(query, widget) {
    if (!widget) return;

    try {
      let categories = [];

      if (typeof mw !== 'undefined' && mw.Api) {
        const api = this.mwApi || new mw.Api();

        const data = await api.get({
          action: 'opensearch',
          namespace: 14,
          search: query,
          limit: 10,
          redirects: 'resolve'
        });

        if (data && data[1]) {
          categories = data[1].map(title => {
            return title.startsWith('Category:') ? title : `Category:${title}`;
          });
        }
      }

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
   * @param {boolean} isMultiselect - Whether this field should use multiselect
   * @returns {HTMLElement} The field element
   * @private
   */
  _createField(inputId, labelText, description = '', placeholder = '', isMultiselect = true) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cdx-field';

    let descriptionHtml = '';
    if (description) {
      descriptionHtml = `
        <span class="cdx-label__description">${description}</span>
      `;
    }

    if (isMultiselect) {
      // Create container for MenuTagMultidget
      wrapper.innerHTML = `
        <div class="cdx-label">
          <label class="cdx-label__label" for="${inputId}">
            <span class="cdx-label__label__text">${labelText}</span>
          </label>
          ${descriptionHtml}
        </div>
        <div class="cdx-field__control" id="${inputId}-container">
        </div>
      `;
    } else {
      // Create regular text input
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
    }

    return wrapper;
  }

  /**
   * Get categories to add from the multiselect widget.
   * @returns {Array<string>} Array of selected category names
   */
  getCategoriesToAdd() {
    if (this.addCategoriesWidget) {
      if (this.addCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
        // MenuTagMultidget: get selected tags data
        return this.addCategoriesWidget.getItems().map(item => item.data);
      } else if (this.addCategoriesWidget instanceof OO.ui.ComboBoxInputWidget) {
        // ComboBoxInputWidget: parse comma-separated value
        return this.parseCategories(this.addCategoriesWidget.getValue());
      } else if (this.addCategoriesWidget.getValue) {
        return this.parseCategories(this.addCategoriesWidget.getValue());
      }
    }

    // Fallback to plain input
    const input = document.getElementById('cbm-add-cats');
    if (input) {
      return this.parseCategories(input.value);
    }

    return [];
  }

  /**
   * Get categories to remove from the multiselect widget.
   * @returns {Array<string>} Array of selected category names
   */
  getCategoriesToRemove() {
    if (this.removeCategoriesWidget) {
      if (this.removeCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
        return this.removeCategoriesWidget.getItems().map(item => item.data);
      } else if (this.removeCategoriesWidget instanceof OO.ui.ComboBoxInputWidget) {
        return this.parseCategories(this.removeCategoriesWidget.getValue());
      } else if (this.removeCategoriesWidget.getValue) {
        return this.parseCategories(this.removeCategoriesWidget.getValue());
      }
    }

    const input = document.getElementById('cbm-remove-cats');
    if (input) {
      return this.parseCategories(input.value);
    }

    return [];
  }

  /**
   * Get edit summary
   * @returns {string} Edit summary text
   */
  getEditSummary() {
    if (this.summaryWidget && this.summaryWidget.getValue) {
      return this.summaryWidget.getValue();
    }

    const input = document.getElementById('cbm-summary');
    if (input) {
      return input.value;
    }

    return '';
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
   * Clear all input fields and widgets.
   */
  clear() {
    // Clear multiselect widgets
    if (this.addCategoriesWidget) {
      if (this.addCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
        this.addCategoriesWidget.clearItems();
      } else if (this.addCategoriesWidget.setValue) {
        this.addCategoriesWidget.setValue('');
      }
    }

    if (this.removeCategoriesWidget) {
      if (this.removeCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
        this.removeCategoriesWidget.clearItems();
      } else if (this.removeCategoriesWidget.setValue) {
        this.removeCategoriesWidget.setValue('');
      }
    }

    // Clear summary widget
    if (this.summaryWidget && this.summaryWidget.setValue) {
      this.summaryWidget.setValue('Batch category update via Category Batch Manager');
    }

    // Clear plain inputs
    const addInput = document.getElementById('cbm-add-cats');
    const removeInput = document.getElementById('cbm-remove-cats');
    const summaryInput = document.getElementById('cbm-summary');

    if (addInput) addInput.value = '';
    if (removeInput) removeInput.value = '';
    if (summaryInput) summaryInput.value = 'Batch category update via Category Batch Manager';
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
