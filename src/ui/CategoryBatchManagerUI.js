/**
 * Category Batch Manager UI
 *
 * @description
 * Main UI class for the Category Batch Manager tool.
 * Manages the user interface, file selection, and batch operations.
 *
 * @requires OO.ui - MediaWiki's OOUI library for dialogs
 */

/* global APIService, FileService, CategoryService, BatchProcessor, UsageLogger, Validator, OO */

class CategoryBatchManagerUI {
    constructor() {
        this.apiService = new APIService();
        this.fileService = new FileService(this.apiService);
        this.categoryService = new CategoryService(this.apiService);
        this.batchProcessor = new BatchProcessor(this.categoryService); this.state = {
            sourceCategory: mw.config.get('wgPageName'),
            searchPattern: '',
            files: [],
            selectedFiles: [],
            categoriesToAdd: [],
            categoriesToRemove: [],
            isProcessing: false,
            isSearching: false,
            searchAbortController: null,
            processAbortController: null
        };

        this.init();
    }

    init() {
        this.createUI();
        this.attachEventListeners();
    }
    createUI() {
        // Create reopen button
        const reopenBtn = document.createElement('button');
        reopenBtn.id = 'cbm-reopen-btn';
        reopenBtn.className = 'cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-large cdx-button--icon-only'; reopenBtn.setAttribute('aria-label', 'Open Category Batch Manager');
        reopenBtn.setAttribute('title', 'Open Category Batch Manager');
        reopenBtn.textContent = '☰';
        reopenBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 99; display: none;';
        document.body.appendChild(reopenBtn);

        // Create main container
        const container = this.buildContainer();
        document.body.appendChild(container);

        // Add reopen button listener
        reopenBtn.addEventListener('click', () => {
            this.reopenModal();
        });
    }
    buildContainer() {
        const div = document.createElement('div');
        div.id = 'category-batch-manager';
        div.className = 'cbm-container'; div.innerHTML = `
            <div class="cbm-header">
                <h2>Category Batch Manager</h2>
                <div>
                    <button
                        class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only"
                        id="cbm-minimize" aria-label="Minimize" title="Minimize">−</button>
                    <button
                        class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only cbm-close"
                        id="cbm-close" aria-label="Close" title="Close">&#215;</button>
                </div>
            </div>

            <div class="cbm-body">
                <div class="cbm-main-layout">
                    <!-- Left Panel: Search and Actions -->
                    <div class="cbm-left-panel">
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

                        <div id="cbm-results-message" class="hidden"></div>

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
                            </div>                            <div class="cbm-buttons">
                                <button id="cbm-preview"
                                    class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium">
                                    Preview Changes
                                </button>
                                <button id="cbm-execute"
                                    class="cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium">
                                    GO
                                </button>
                                <button id="cbm-stop" style="display: none;"
                                    class="cdx-button cdx-button--action-destructive cdx-button--weight-primary cdx-button--size-medium">
                                    Stop Process
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

                    <!-- Right Panel: File List -->
                    <div class="cbm-right-panel">
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
                            <div id="cbm-file-list"></div>
                        </div>
                    </div>
                </div>
            </div>            <div id="cbm-preview-modal" class="cbm-modal hidden">
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
        }); document.getElementById('cbm-execute').addEventListener('click', () => {
            this.handleExecute();
        });

        document.getElementById('cbm-stop').addEventListener('click', () => {
            this.stopProcess();
        });

        document.getElementById('cbm-minimize').addEventListener('click', () => {
            this.minimizeModal();
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
        // إذا كان البحث جارياً، أوقفه
        if (this.state.isSearching) {
            this.stopSearch();
            return;
        }

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
        this.state.isSearching = true;
        this.state.searchAbortController = new AbortController();

        // تغيير زر البحث إلى زر إيقاف
        this.updateSearchButton(true);
        this.showSearchProgress();

        try {
            const files = await this.fileService.searchFiles(
                sourceCategory,
                pattern,
                { signal: this.state.searchAbortController.signal }
            );

            this.state.files = files;
            this.state.searchPattern = pattern;
            this.state.sourceCategory = sourceCategory;
            this.renderFileList();
            this.hideSearchProgress();
            this.updateSearchButton(false);
            this.state.isSearching = false;

            UsageLogger.logSearch(pattern, files.length);
        } catch (error) {
            this.hideSearchProgress();
            this.updateSearchButton(false);
            this.state.isSearching = false;

            if (error.name === 'AbortError') {
                this.showMessage('Search cancelled by user.', 'notice');
            } else {
                this.showMessage(`Error searching files: ${error.message}`, 'error');
            }
        }
    }

    stopSearch() {
        if (this.state.searchAbortController) {
            this.state.searchAbortController.abort();
            this.state.searchAbortController = null;
        }
    }

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

    hideSearchProgress() {
        // Content will be replaced by renderFileList
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
    }    async handlePreview() {
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

        // Generate preview without affecting file list - no loading indicator
        try {
            const preview = await this.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );

            this.showPreviewModal(preview);

        } catch (error) {
            // Check if error is about duplicate categories
            if (error.message.includes('already exist')) {
                this.showMessage(`⚠️ ${error.message}`, 'warning');
            } else {
                this.showMessage(`Error generating preview: ${error.message}`, 'error');
            }
        }
    }showPreviewModal(preview) {
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

        if (changesCount === 0) {
            this.showMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice');
            return;
        }

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
        }        // Check for duplicate categories before execution
        try {
            await this.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );
        } catch (error) {
            if (error.message.includes('already exist')) {
                this.showMessage(`❌ Cannot proceed: ${error.message}`, 'error');
            } else {
                this.showMessage(`Error: ${error.message}`, 'error');
            }
            return;
        }        // Show confirmation dialog
        const confirmMsg =
            `You are about to update ${selectedFiles.length} file(s).\n\n` +
            `Categories to add: ${toAdd.length > 0 ? toAdd.join(', ') : 'none'}\n` +
            `Categories to remove: ${toRemove.length > 0 ? toRemove.join(', ') : 'none'}\n\n` +
            'Do you want to proceed?';

        const confirmed = await this.showConfirmDialog(confirmMsg, {
            title: 'Confirm Batch Update',
            confirmLabel: 'Proceed',
            cancelLabel: 'Cancel'
        });

        if (!confirmed) {
            return;
        }

        this.state.isProcessing = true;
        this.state.processAbortController = new AbortController();

        // إخفاء أزرار Preview و GO وإظهار زر الإيقاف
        this.toggleProcessButtons(true);
        this.showProgress();

        try {
            const results = await this.batchProcessor.processBatch(
                selectedFiles,
                toAdd,
                toRemove,
                {
                    signal: this.state.processAbortController.signal,
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
            if (error.name === 'AbortError') {
                this.showMessage('Batch process cancelled by user.', 'warning');
            } else {
                this.showMessage(`Batch process failed: ${error.message}`, 'error');
            }
        } finally {
            this.state.isProcessing = false;
            this.hideProgress();
            this.toggleProcessButtons(false);
        }
    }

    stopProcess() {
        if (this.state.processAbortController) {
            this.state.processAbortController.abort();
            this.state.processAbortController = null;
        }
    }

    toggleProcessButtons(isProcessing) {
        const previewBtn = document.getElementById('cbm-preview');
        const executeBtn = document.getElementById('cbm-execute');
        const stopBtn = document.getElementById('cbm-stop');

        if (isProcessing) {
            // إخفاء Preview و GO
            if (previewBtn) previewBtn.style.display = 'none';
            if (executeBtn) executeBtn.style.display = 'none';
            // إظهار زر الإيقاف
            if (stopBtn) stopBtn.style.display = 'block';
        } else {
            // إظهار Preview و GO
            if (previewBtn) previewBtn.style.display = 'block';
            if (executeBtn) executeBtn.style.display = 'block';
            // إخفاء زر الإيقاف
            if (stopBtn) stopBtn.style.display = 'none';
        }
    } showProgress() {
        document.getElementById('cbm-progress').classList.remove('hidden');
    }

    hideProgress() {
        document.getElementById('cbm-progress').classList.add('hidden');
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
    } hideLoading() {
        // Content will be replaced by renderFileList or showMessage
    }

    /**
     * Show a confirmation dialog using MediaWiki's OO.ui.confirm
     * @param {string} message - Dialog message
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    async showConfirmDialog(message, options = {}) {
        const title = options.title || 'Confirm';

        return new Promise((resolve) => {
            if (typeof OO === 'undefined' || !OO.ui || !OO.ui.confirm) {
                // Fallback to native confirm if OO.ui is not available
                resolve(confirm(message));
                return;
            }

            OO.ui.confirm(message, {
                title: title,
                actions: [
                    {
                        action: 'accept',
                        label: options.confirmLabel || 'Confirm',
                        flags: ['primary', 'progressive']
                    },
                    {
                        action: 'reject',
                        label: options.cancelLabel || 'Cancel',
                        flags: 'safe'
                    }
                ]
            }).done((confirmed) => {
                resolve(confirmed);
            });
        });
    }

    minimizeModal() {
        const modal = document.getElementById('category-batch-manager');
        const reopenBtn = document.getElementById('cbm-reopen-btn');
        if (modal) modal.style.display = 'none';
        if (reopenBtn) reopenBtn.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('category-batch-manager');
        const reopenBtn = document.getElementById('cbm-reopen-btn');
        if (modal) modal.style.display = 'none';
        if (reopenBtn) reopenBtn.style.display = 'block';
    }

    reopenModal() {
        const modal = document.getElementById('category-batch-manager');
        const reopenBtn = document.getElementById('cbm-reopen-btn');
        if (modal) modal.style.display = 'flex';
        if (reopenBtn) reopenBtn.style.display = 'none';
    } async close() {
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to close? Any unsaved changes will be lost.',
            {
                title: 'Close Category Batch Manager',
                confirmLabel: 'Close',
                cancelLabel: 'Cancel'
            }
        );

        if (confirmed) {
            const el = document.getElementById('category-batch-manager');
            const reopenBtn = document.getElementById('cbm-reopen-btn');
            if (el) el.remove();
            if (reopenBtn) reopenBtn.remove();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryBatchManagerUI;
}
