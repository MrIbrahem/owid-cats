/**
 * File list UI component
 * @class FileList
 */
class FileList {
  /**
   * @param {Function} onSelectionChange - Callback when selection changes
   */
  constructor(onSelectionChange) {
    this.onSelectionChange = onSelectionChange;
  }

  /**
   * Render the file list
   * @param {Array} files - Files to display
   */
  render(files) {
    const listContainer = document.getElementById('cbm-file-list');
    const countElement = document.getElementById('cbm-count');
    const headerElement = document.getElementById('cbm-results-header');

    if (files.length === 0) {
      listContainer.innerHTML = '<p>No files found matching the pattern.</p>';
      headerElement.classList.add('hidden');
      return;
    }

    countElement.textContent = files.length;
    headerElement.classList.remove('hidden');

    listContainer.innerHTML = '';

    files.forEach((file, index) => {
      const fileRow = document.createElement('div');
      fileRow.className = 'cbm-file-row';
      fileRow.dataset.index = index;

      fileRow.innerHTML = `
        <input type="checkbox" class="cbm-file-checkbox" 
               id="file-${index}" checked>
        <label for="file-${index}">${file.title}</label>
        <button class="cbm-remove-btn" data-index="${index}">&#215;</button>
      `;

      listContainer.appendChild(fileRow);
    });
  }

  /**
   * Get count of selected files
   * @returns {number} Number of selected files
   */
  getSelectedCount() {
    return document.querySelectorAll('.cbm-file-checkbox:checked').length;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileList;
}
