/**
 * File list UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
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
   * Render the file list using Codex CdxCheckbox CSS-only pattern.
   * @param {Array} files - Files to display
   */
  render(files) {
    const listContainer = document.getElementById('cbm-file-list');
    const countElement = document.getElementById('cbm-count');
    const headerElement = document.getElementById('cbm-results-header');

    if (files.length === 0) {
      listContainer.innerHTML = `
        <div class="cdx-message cdx-message--block cdx-message--notice" aria-live="polite">
          <span class="cdx-message__icon"></span>
          <div class="cdx-message__content">No files found matching the pattern.</div>
        </div>`;
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
        <div class="cdx-checkbox cbm-file-checkbox-wrapper">
          <div class="cdx-checkbox__wrapper">
            <input id="file-${index}" class="cdx-checkbox__input cbm-file-checkbox"
                   type="checkbox" checked>
            <span class="cdx-checkbox__icon"></span>
            <div class="cdx-checkbox__label cdx-label">
              <label for="file-${index}" class="cdx-label__label">
                <span class="cdx-label__label__text">${file.title}</span>
              </label>
            </div>
          </div>
        </div>
        <button class="cdx-button cdx-button--action-destructive cdx-button--weight-quiet cdx-button--size-medium cbm-remove-btn"
                data-index="${index}" aria-label="Remove file">
          &#215;
        </button>
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
