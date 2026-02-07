/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class SearchPanel
 */
class SearchPanel {
  /**
   * @param {Function} onSearch - Callback when search is triggered
   */
  constructor(onSearch) {
    this.onSearch = onSearch;
  }

  /**
   * Create the search panel HTML element with Codex components.
   * Uses CdxField, CdxTextInput, and CdxButton CSS-only patterns.
   * @returns {HTMLElement} The search panel element
   */
  createElement(sourceCategory) {
    const div = document.createElement('div');
    div.className = 'cbm-search';
    div.innerHTML = `
      <div class="cdx-field">
        <div class="cdx-label">
          <label class="cdx-label__label" for="cbm-source-category">
            <span class="cdx-label__label__text">Source Category</span>
          </label>
        </div>
        <div class="cdx-field__control">
          <div class="cdx-text-input">
            <input id="cbm-source-category" class="cdx-text-input__input" type="text"
            value="${sourceCategory}"
                   placeholder="Category:Example">
          </div>
        </div>
      </div>

      <div class="cdx-field" style="margin-top: 12px;">
        <div class="cdx-label">
          <label class="cdx-label__label" for="cbm-pattern">
            <span class="cdx-label__label__text">Search Pattern</span>
          </label>
          <span class="cdx-label__description">
            Enter a pattern to filter files (e.g., ,BLR.svg)
          </span>
        </div>
        <div class="cdx-field__control cbm-search-row">
          <div class="cdx-text-input" style="flex: 1;">
            <input id="cbm-pattern" class="cdx-text-input__input" type="text"
                   placeholder="e.g., ,BLR.svg">
          </div>
          <button id="cbm-search-btn"
                  class="cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium">
            Search
          </button>
        </div>
      </div>
    `;
    return div;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    document.getElementById('cbm-search-btn').addEventListener('click', () => {
      this.onSearch();
    });

    document.getElementById('cbm-pattern').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.onSearch();
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchPanel;
}
