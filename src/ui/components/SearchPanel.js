/**
 * Search panel UI component
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
   * Create the search panel HTML element
   * @returns {HTMLElement} The search panel element
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-search';
    div.innerHTML = `
      <label>Search Pattern:</label>
      <input type="text" id="cbm-pattern" placeholder="e.g., ,BLR.svg">
      <button id="cbm-search-btn">Search</button>
    `;
    return div;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    document.getElementById('cbm-search-btn').addEventListener('click', () => {
      const pattern = document.getElementById('cbm-pattern').value.trim();
      this.onSearch(pattern);
    });

    document.getElementById('cbm-pattern').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const pattern = document.getElementById('cbm-pattern').value.trim();
        this.onSearch(pattern);
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchPanel;
}
