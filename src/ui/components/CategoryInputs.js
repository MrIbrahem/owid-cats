/**
 * Category inputs UI component
 * @class CategoryInputs
 */
class CategoryInputs {
  /**
   * Create the category inputs HTML element
   * @returns {HTMLElement} The inputs element
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-actions';
    div.innerHTML = `
      <div class="cbm-input-group">
        <label>Add Categories (comma-separated):</label>
        <input type="text" id="cbm-add-cats" placeholder="Category:Example">
      </div>
      
      <div class="cbm-input-group">
        <label>Remove Categories (comma-separated):</label>
        <input type="text" id="cbm-remove-cats" placeholder="Category:Old">
      </div>
      
      <div class="cbm-input-group">
        <label>Edit Summary:</label>
        <input type="text" id="cbm-summary" 
               value="Batch category update via Category Batch Manager">
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
