/**
 * Category Batch Manager UI
 *
 * @description
 * Main UI class for the Category Batch Manager tool.
 * Manages the user interface, file selection, and batch operations.
 *
 * @requires OO.ui - MediaWiki's OOUI library for dialogs
 */

/* global APIService, FileService, CategoryService, BatchProcessor, UsageLogger, Validator, OO, SearchHandler, PreviewHandler, ExecuteHandler, ValidationHelper, SearchPanel */

class CategoryBatchManagerUI {
    constructor() {
        this.apiService = new APIService();
        this.fileService = new FileService(this.apiService);
        this.categoryService = new CategoryService(this.apiService);
        this.batchProcessor = new BatchProcessor(this.categoryService);

        // Initialize UI components
        this.searchPanel = new SearchPanel(() => this.searchHandler.handleSearch());

        // Initialize helpers and handlers
        this.validationHelper = new ValidationHelper(this);
        this.searchHandler = new SearchHandler(this);
        this.previewHandler = new PreviewHandler(this);
        this.executeHandler = new ExecuteHandler(this);
        this.progressBarHandler = new ProgressBar();

        this.state = {
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

        // SearchPanel element
        const searchPanelElement = this.searchPanel.createElement(this.state.sourceCategory);
        // Create main container
        const container = this.buildContainer(searchPanelElement);
        document.body.appendChild(container);

        // Add reopen button listener
        reopenBtn.addEventListener('click', () => {
            this.reopenModal();
        });
    }

    buildContainer(searchPanelElement) {
        const ProgressBarElement = this.progressBarHandler.createElement();

        const div = document.createElement('div');
        div.id = 'category-batch-manager';
        div.className = 'cbm-container';
        div.innerHTML = `
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
                        ${searchPanelElement.outerHTML}
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
                        ${ProgressBarElement}
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
        // Search panel listeners
        this.searchPanel.attachListeners();

        document.getElementById('cbm-select-all').addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('cbm-deselect-all').addEventListener('click', () => {
            this.deselectAll();
        });

        document.getElementById('cbm-preview').addEventListener('click', () => {
            this.previewHandler.handlePreview();
        });
        document.getElementById('cbm-execute').addEventListener('click', () => {
            this.executeHandler.handleExecute();
        });

        document.getElementById('cbm-stop').addEventListener('click', () => {
            this.executeHandler.stopProcess();
        });

        document.getElementById('cbm-minimize').addEventListener('click', () => {
            this.minimizeModal();
        });

        document.getElementById('cbm-close').addEventListener('click', () => {
            this.close();
        });

        // Preview modal close button
        document.getElementById('cbm-preview-close').addEventListener('click', () => {
            this.previewHandler.hidePreviewModal();
        });

        // Close modal when clicking outside
        document.getElementById('cbm-preview-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cbm-preview-modal') {
                this.previewHandler.hidePreviewModal();
            }
        });
    }

    /**
     * Display a Codex CSS-only message banner above the file list.
     * @param {string} text - Message text
     * @param {string} type - One of 'notice', 'warning', 'error', 'success'
     */
    showMessage(text, type) {
        const messageContainer = document.getElementById('cbm-results-message');
        if (!messageContainer) {
            console.error('[CBM] Message container not found');
            return;
        }
        const ariaAttr = type === 'error' ? 'role="alert"' : 'aria-live="polite"';
        messageContainer.innerHTML = `
            <div class="cdx-message cdx-message--block cdx-message--${type}" ${ariaAttr}>
                <span class="cdx-message__icon"></span>
                <div class="cdx-message__content">${text}</div>
            </div>`;
        messageContainer.classList.remove('hidden');
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
    }

    async close() {
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
