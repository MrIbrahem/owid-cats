/**
 * Category Batch Manager UI
 *
 * @description
 * Main UI class for the Category Batch Manager tool.
 * Manages the user interface, file selection, and batch operations.
 */

/* global APIService, FileService, CategoryService, BatchProcessor, UsageLogger, Validator */

class CategoryBatchManagerUI {
    constructor() {
        this.apiService = new APIService();
        this.fileService = new FileService(this.apiService);
        this.categoryService = new CategoryService(this.apiService);
        this.batchProcessor = new BatchProcessor(this.categoryService);

        this.state = {
            sourceCategory: mw.config.get('wgPageName'),
            searchPattern: '',
            files: [],
            selectedFiles: [],
            categoriesToAdd: [],
            categoriesToRemove: [],
            isProcessing: false
        };

        this.init();
    }

    init() {
        this.createUI();
        this.attachEventListeners();
    }

    createUI() {
        const container = this.buildContainer();
        document.body.appendChild(container);
    }
    buildContainer() {
        const div = document.createElement('div');
        div.id = 'category-batch-manager';
        div.className = 'cbm-container';
        div.innerHTML = `
            <div class="cbm-header">
                <h2>Category Batch Manager</h2>
                <button
                    class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only cbm-close"
                    id="cbm-close" aria-label="Close">&#215;</button>
            </div>

            <div class="cbm-body">
                <div class="cbm-search">
                    <div class="cdx-field">
                        <div class="cdx-label">
                            <label class="cdx-label__label" for="cbm-source-category">
                                <span class="cdx-label__label__text">Source Category</span>
                            </label>
                        </div>
                        <div class="cdx-field__control">
                            <div class="cdx-text-input">
                                <input id="cbm-source-category" class="cdx-text-input__input" type="text"
                                    value="${this.state.sourceCategory}" placeholder="Category:Example">
                            </div>
                        </div>
                    </div>

                    <div class="cdx-field">
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
                                <input id="cbm-pattern" class="cdx-text-input__input" type="text" placeholder="e.g., ,BLR.svg">
                            </div>
                            <button id="cbm-search-btn"
                                class="cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
                <div class="cbm-results">
                    <div id="cbm-results-header" class="cbm-results-header hidden">
                        <div class="cdx-info-chip cdx-info-chip--notice">
                            <span class="cdx-info-chip__text">
                                Found <strong id="cbm-count">0</strong> files
                            </span>
                        </div>
                        <button id="cbm-select-all"
                            class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium">
                            Select All
                        </button>
                        <button id="cbm-deselect-all"
                            class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium">
                            Deselect All
                        </button>
                    </div>
                    <div id="cbm-results-message"></div>
                    <div id="cbm-file-list"></div>
                </div>

                <div class="cbm-actions">
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
                                <input id="cbm-add-cats" class="cdx-text-input__input" type="text" placeholder="Category:Example">
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
                                <input id="cbm-remove-cats" class="cdx-text-input__input" type="text" placeholder="Category:Old">
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

                    <div class="cbm-selected-count">
                        Selected: <strong id="cbm-selected">0</strong> files
                    </div>

                    <div class="cbm-buttons">
                        <button id="cbm-preview"
                            class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium">
                            Preview Changes
                        </button>
                        <button id="cbm-execute"
                            class="cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium">
                            GO
                        </button>
                    </div>
                </div>

                <div id="cbm-progress" class="cbm-progress hidden">
                    <div class="cdx-progress-bar cdx-progress-bar--block" role="progressbar" aria-label="Batch processing progress">
                        <div id="cbm-progress-fill" class="cdx-progress-bar__bar cbm-progress-fill"></div>
                    </div>
                    <div id="cbm-progress-text" class="cbm-progress-text">Processing...</div>
                </div>
            </div>

            <div id="cbm-preview-modal" class="cbm-modal hidden">
                <div class="cbm-modal-content">
                    <h3>Preview Changes</h3>
                    <div id="cbm-preview-content"></div>
                    <button id="cbm-preview-close"
                        class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium">
                        Close
                    </button>
                </div>
            </div>

        `;

        return div;
    }
    attachEventListeners() {
        document.getElementById('cbm-search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('cbm-select-all').addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('cbm-deselect-all').addEventListener('click', () => {
            this.deselectAll();
        });

        document.getElementById('cbm-preview').addEventListener('click', () => {
            this.handlePreview();
        });

        document.getElementById('cbm-execute').addEventListener('click', () => {
            this.handleExecute();
        });

        document.getElementById('cbm-close').addEventListener('click', () => {
            this.close();
        });

        // Preview modal close button
        document.getElementById('cbm-preview-close').addEventListener('click', () => {
            this.hidePreviewModal();
        });

        // Close modal when clicking outside
        document.getElementById('cbm-preview-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cbm-preview-modal') {
                this.hidePreviewModal();
            }
        });
    } async handleSearch() {
        const pattern = document.getElementById('cbm-pattern').value.trim();
        const sourceCategory = document.getElementById('cbm-source-category').value.trim();

        if (!pattern) {
            this.showMessage('Please enter a search pattern.', 'warning');
            return;
        }

        if (!sourceCategory) {
            this.showMessage('Please enter a source category.', 'warning');
            return;
        }

        this.clearMessage();
        this.showLoading();

        try {
            const files = await this.fileService.searchFiles(
                sourceCategory,
                pattern
            );

            this.state.files = files;
            this.state.searchPattern = pattern;
            this.state.sourceCategory = sourceCategory;
            this.renderFileList();
            this.hideLoading();

            UsageLogger.logSearch(pattern, files.length);
        } catch (error) {
            this.hideLoading();
            this.showMessage(`Error searching files: ${error.message}`, 'error');
        }
    }
    /**
     * Display a Codex CSS-only message banner above the file list.
     * @param {string} text - Message text
     * @param {string} type - One of 'notice', 'warning', 'error', 'success'
     */
    showMessage(text, type) {
        const messageContainer = document.getElementById('cbm-results-message');
        if (!messageContainer) return;
        const ariaAttr = type === 'error' ? 'role="alert"' : 'aria-live="polite"';
        messageContainer.innerHTML = `
      <div class="cdx-message cdx-message--block cdx-message--${type}" ${ariaAttr}>
        <span class="cdx-message__icon"></span>
        <div class="cdx-message__content">${text}</div>
      </div>`;
    }

    /**
     * Clear any displayed messages
     */
    clearMessage() {
        const messageContainer = document.getElementById('cbm-results-message');
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }

    renderFileList() {
        const listContainer = document.getElementById('cbm-file-list');
        const countElement = document.getElementById('cbm-count');
        const headerElement = document.getElementById('cbm-results-header');

        if (this.state.files.length === 0) {
            listContainer.innerHTML = '<p>No files found matching the pattern.</p>';
            headerElement.classList.add('hidden');
            return;
        }

        countElement.textContent = this.state.files.length;
        headerElement.classList.remove('hidden');

        listContainer.innerHTML = ''; this.state.files.forEach((file, index) => {
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

    removeFile(index) {
        this.state.files.splice(index, 1);
        this.renderFileList();
    }

    selectAll() {
        document.querySelectorAll('.cbm-file-checkbox').forEach(cb => {
            cb.checked = true;
        });
        this.updateSelectedCount();
    }

    deselectAll() {
        document.querySelectorAll('.cbm-file-checkbox').forEach(cb => {
            cb.checked = false;
        });
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const selected = document.querySelectorAll('.cbm-file-checkbox:checked').length;
        document.getElementById('cbm-selected').textContent = selected;
    }

    getSelectedFiles() {
        const selected = [];
        document.querySelectorAll('.cbm-file-checkbox:checked').forEach(cb => {
            const index = parseInt(cb.id.replace('file-', ''));
            if (this.state.files[index]) {
                selected.push(this.state.files[index]);
            }
        });
        return selected;
    }

    parseCategories(input) {
        return input
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0)
            .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
    }
    async handlePreview() {
        const selectedFiles = this.getSelectedFiles(); if (selectedFiles.length === 0) {
            this.showMessage('No files selected.', 'warning');
            return;
        }

        const toAdd = this.parseCategories(
            document.getElementById('cbm-add-cats').value
        );
        const toRemove = this.parseCategories(
            document.getElementById('cbm-remove-cats').value
        );

        // Check for circular category reference
        const sourceCategory = this.state.sourceCategory;
        for (const category of toAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                this.showMessage(
                    `⚠️ Cannot add category "${category}" to itself. You are trying to add a category to the same category page you're working in.`,
                    'error'
                );
                return;
            }
        }

        this.showLoading();

        try {
            const preview = await this.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );

            this.showPreviewModal(preview);
            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            this.showMessage(`Error generating preview: ${error.message}`, 'error');
        }
    }
    showPreviewModal(preview) {
        const modal = document.getElementById('cbm-preview-modal');
        const content = document.getElementById('cbm-preview-content');

        let html = '<table class="cbm-preview-table">';
        html += '<tr><th>File</th><th>Current Categories</th><th>New Categories</th></tr>';

        preview.forEach(item => {
            if (item.willChange) {
                html += `
          <tr>
            <td>${item.file}</td>
            <td>${item.currentCategories.join('<br>')}</td>
            <td>${item.newCategories.join('<br>')}</td>
          </tr>
        `;
            }
        });

        html += '</table>';

        const changesCount = preview.filter(p => p.willChange).length;
        html = `<p>${changesCount} files will be modified</p>` + html;

        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    hidePreviewModal() {
        const modal = document.getElementById('cbm-preview-modal');
        modal.classList.add('hidden');
    } async handleExecute() {
        const selectedFiles = this.getSelectedFiles();

        if (selectedFiles.length === 0) {
            this.showMessage('No files selected.', 'warning');
            return;
        }

        const toAdd = this.parseCategories(
            document.getElementById('cbm-add-cats').value
        );
        const toRemove = this.parseCategories(
            document.getElementById('cbm-remove-cats').value
        );

        if (toAdd.length === 0 && toRemove.length === 0) {
            this.showMessage('Please specify categories to add or remove.', 'warning');
            return;
        }

        // Check for circular category reference
        const sourceCategory = this.state.sourceCategory;
        for (const category of toAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                this.showMessage(
                    `⚠️ Cannot add category "${category}" to itself. You are trying to add a category to the same category page you're working in.`,
                    'error'
                );
                return;
            }
        }

        // Show a confirmation message and require a second click on GO
        const confirmMsg =
            `About to update ${selectedFiles.length} file(s). ` +
            `Add: ${toAdd.join(', ') || 'none'}. ` +
            `Remove: ${toRemove.join(', ') || 'none'}. ` +
            'Click GO again to confirm.';

        if (!this._executeConfirmed) {
            this.showMessage(confirmMsg, 'notice');
            this._executeConfirmed = true;
            return;
        }
        this._executeConfirmed = false;

        this.state.isProcessing = true;
        this.showProgress();

        try {
            const results = await this.batchProcessor.processBatch(
                selectedFiles,
                toAdd,
                toRemove,
                {
                    onProgress: (progress, results) => {
                        this.updateProgress(progress, results);
                    },
                    onFileComplete: (file, success) => {
                        console.log(`${file.title}: ${success ? 'success' : 'failed'}`);
                    },
                    onError: (file, error) => {
                        console.error(`Error processing ${file.title}:`, error);
                    }
                }
            );

            UsageLogger.logBatchOperation(selectedFiles.length, toAdd, toRemove);
            this.showResults(results);

        } catch (error) {
            this.showMessage(`Batch process failed: ${error.message}`, 'error');
        } finally {
            this.state.isProcessing = false;
            this.hideProgress();
        }
    }

    showProgress() {
        document.getElementById('cbm-progress').classList.remove('hidden');
        document.getElementById('cbm-execute').disabled = true;
    }

    hideProgress() {
        document.getElementById('cbm-progress').classList.add('hidden');
        document.getElementById('cbm-execute').disabled = false;
    }
    updateProgress(percentage, results) {
        document.getElementById('cbm-progress-fill').style.width = `${percentage}%`;
        document.getElementById('cbm-progress-text').textContent =
            `Processing: ${results.processed}/${results.total} (${results.successful} successful, ${results.skipped || 0} skipped, ${results.failed} failed)`;
    } showResults(results) {
        const messageContainer = document.getElementById('cbm-results-message');
        if (!messageContainer) return;

        const type = results.failed > 0 ? 'warning' : 'success';
        let errorsHtml = '';
        if (results.errors && results.errors.length > 0) {
            errorsHtml = '<ul style="margin: 8px 0 0; padding-left: 20px;">' +
                results.errors.map(err => `<li>${err.file}: ${err.error}</li>`).join('') +
                '</ul>';
        }

        const ariaAttr = type === 'warning' ? 'aria-live="polite"' : 'aria-live="polite"';
        messageContainer.innerHTML = `
      <div class="cdx-message cdx-message--block cdx-message--${type}" ${ariaAttr}>
        <span class="cdx-message__icon"></span>
        <div class="cdx-message__content">
          <p><strong>Batch process complete!</strong></p>
          <p>Total: ${results.total} &mdash;
             Successful: ${results.successful} &mdash;
             Skipped: ${results.skipped || 0} &mdash;
             Failed: ${results.failed}</p>
          ${errorsHtml}
        </div>
      </div>`;
    }
    showLoading() {
        const listContainer = document.getElementById('cbm-file-list');
        if (listContainer) {
            listContainer.innerHTML = `
        <div class="cdx-progress-bar cdx-progress-bar--inline" role="progressbar"
             aria-label="Loading">
          <div class="cdx-progress-bar__bar"></div>
        </div>`;
        }
    }

    hideLoading() {
        // Content will be replaced by renderFileList or showMessage
    }

    close() {
        const el = document.getElementById('category-batch-manager');
        if (el) el.remove();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryBatchManagerUI;
}
