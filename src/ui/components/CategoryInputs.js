/**
 * Category inputs UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputs
 */
class CategoryInputs {
  /**
   * Create the category inputs HTML element with Codex components.
   * Uses CdxField, CdxTextInput CSS-only patterns.
   * @returns {HTMLElement} The inputs element
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-actions';
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
            <input id="cbm-add-cats" class="cdx-text-input__input" type="text"
                   placeholder="Category:Example">
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
            <input id="cbm-remove-cats" class="cdx-text-input__input" type="text"
                   placeholder="Category:Old">
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
   * Get categories to add
   * @returns {Array<string>} Parsed category names
   */
  getCategoriesToAdd() {
    const input = document.getElementById('cbm-add-cats').value;
    return this.parseCategories(input);
  }

  /**
   * Get categories to remove
   * @returns {Array<string>} Parsed category names
   */
  getCategoriesToRemove() {
    const input = document.getElementById('cbm-remove-cats').value;
    return this.parseCategories(input);
  }

  /**
   * Parse comma-separated category input
   * @param {string} input - Raw input string
   * @returns {Array<string>} Array of category names with "Category:" prefix
   */
  parseCategories(input) {
    return input
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
      .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryInputs;
}
