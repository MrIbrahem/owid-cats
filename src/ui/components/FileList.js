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
    renderFileList(files) {
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

        listContainer.innerHTML = ''; files.forEach((file, index) => {
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
        <button class="cdx-button cdx-button--action-destructive cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only cbm-remove-btn"
                data-index="${index}" aria-label="Remove file">&#215;</button>
      `;

            listContainer.appendChild(fileRow);
        });

        // Attach remove button listeners
        document.querySelectorAll('.cbm-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFile(index);
            });
        });

        // Attach checkbox listeners
        document.querySelectorAll('.cbm-file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedCount();
            });
        });

        this.updateSelectedCount();
    }

    updateSelectedCount() {
        document.getElementById('cbm-selected').textContent = this.getSelectedCount();
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
