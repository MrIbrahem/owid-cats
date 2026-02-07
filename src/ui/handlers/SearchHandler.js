/**
 * Search Handler
 *
 * @description
 * Handles all search-related functionality for CategoryBatchManagerUI.
 * Manages search execution, stopping, progress display, and button state.
 *
 * @requires UsageLogger - For logging search operations
 */

/* global UsageLogger */

class SearchHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
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

            UsageLogger.logSearch(pattern, files.length);
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
                    <span style="color: #54595d;">Searching for files...</span>
                </div>
            `;
        }
    }

    /**
     * Hide search progress indicator
     * Content will be replaced by FileList.renderFileList
     */
    hideSearchProgress() {
        // Content will be replaced by FileList.renderFileList
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchHandler;
}
