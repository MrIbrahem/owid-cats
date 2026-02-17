/**
 * Search Handler
 *
 * @description
 * Handles all search-related functionality for BatchManager.
 * Manages search execution, stopping, progress display, and button state.
 *
 */

class SearchHandler {
    /**
     * @param {BatchManager} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
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
     * Handle search button click
     * If search is in progress, stops the search.
     * Otherwise, initiates a new search.
     */
    async handleSearch() {
        // إذا كان البحث جارياً، أوقفه
        if (this.ui.state.isSearching) {
            this.stopSearch();
            return;
        }

        const pattern = document.getElementById('cbm-pattern').value.trim();
        const sourceCategory = document.getElementById('cbm-source-category').value.trim();

        if (!pattern) {
            this.ui.showMessage('Please enter a search pattern.', 'warning');
            return;
        }

        if (!sourceCategory) {
            this.ui.showMessage('Please enter a source category.', 'warning');
            return;
        }

        this.ui.clearMessage();
        this.ui.state.isSearching = true;
        this.ui.state.searchAbortController = new AbortController();

        // تغيير زر البحث إلى زر إيقاف
        this.updateSearchButton(true);
        this.showSearchProgress();

        try {
            const files = await this.ui.fileService.searchFiles(
                sourceCategory,
                pattern,
                { signal: this.ui.state.searchAbortController.signal }
            );

            this.ui.state.files = files;
            this.ui.state.searchPattern = pattern;
            this.ui.state.sourceCategory = sourceCategory;
            this.ui.fileList.renderFileList(this.ui.state.files);
            this.hideSearchProgress();
            this.updateSearchButton(false);
            this.ui.state.isSearching = false;

            console.log(`[CBM] Search: "${pattern}" - ${files.length} results`);
        } catch (error) {
            this.hideSearchProgress();
            this.updateSearchButton(false);
            this.ui.state.isSearching = false;

            if (error.name === 'AbortError') {
                this.ui.showMessage('Search cancelled by user.', 'notice');
            } else {
                this.ui.showMessage(`Error searching files: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Stop the current search operation
     */
    stopSearch() {
        if (this.ui.state.searchAbortController) {
            this.ui.state.searchAbortController.abort();
            this.ui.state.searchAbortController = null;
        }
    }

    /**
     * Update the search button appearance based on search state
     * @param {boolean} isSearching - Whether search is in progress
     */
    updateSearchButton(isSearching) {
        const searchBtn = document.getElementById('cbm-search-btn');
        if (searchBtn) {
            if (isSearching) {
                searchBtn.textContent = 'Stop';
                searchBtn.className = 'cdx-button cdx-button--action-destructive cdx-button--weight-primary cdx-button--size-medium';
            } else {
                searchBtn.textContent = 'Search';
                searchBtn.className = 'cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium';
            }
        }
    }

    /**
     * Show search progress indicator
     */
    showSearchProgress() {
        const listContainer = document.getElementById('cbm-file-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; padding: 20px; justify-content: center;">
                    <div class="cdx-progress-bar cdx-progress-bar--inline" role="progressbar" aria-label="Searching">
                        <div class="cdx-progress-bar__bar"></div>
                    </div>
                    <span>Searching for files...</span>
                </div>
            `;
        }
    }

    /**
     * Hide search progress indicator
     * Content will be replaced by FilesList.renderFileList
     */
    hideSearchProgress() {
        // Content will be replaced by FilesList.renderFileList
    }
    /**
     * Attach event listeners
     */
    attachListeners() {
        document.getElementById('cbm-search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('cbm-pattern').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchHandler;
}
