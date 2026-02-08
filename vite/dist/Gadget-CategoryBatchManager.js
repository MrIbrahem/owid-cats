/**
 * Gadget-CategoryBatchManager.js (Vue-based)
 * Category Batch Manager for Wikimedia Commons
 *
 * @version 1.0.0
 * @license MIT
 * @description A tool for batch categorization of files in Wikimedia Commons.
 *              Built with Vue.js and Wikimedia Codex.
 *
 * Built from: https://github.com/MrIbrahem/owid-cats
 */
// <nowiki>

// === src/utils/Validator.js ===
/**
 * Input validation utility
 * @class Validator
 */
class Validator {
    /**
     * TODO: use it in the workflow or remove if not needed
     * Check if a category name is valid
     * @param {string} name - Category name to validate
     * @returns {boolean} True if valid
     */
    static isValidCategoryName(name) {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        if (trimmed.length === 0) return false;
        // Category names must not contain certain characters
        const invalidChars = /[#<>\[\]{|}]/;
        const cleanName = trimmed.replace(/^Category:/i, '');
        return cleanName.length > 0 && !invalidChars.test(cleanName);
    }

    /**
     * TODO: use it in the workflow or remove if not needed
     * Check if a search pattern is valid
     * @param {string} pattern - Search pattern to validate
     * @returns {boolean} True if valid
     */
    static isValidSearchPattern(pattern) {
        if (!pattern || typeof pattern !== 'string') return false;
        return pattern.trim().length > 0;
    }
    /**
     * TODO: use it in the workflow or remove if not needed
     * Sanitize user input to prevent injection
     * @param {string} input - Raw user input
     * @returns {string} Sanitized input
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        return input.trim();
    }

    /**
     * Normalize category name for comparison (remove prefix, convert underscores to spaces)
     * @param {string} categoryName - Category name to normalize
     * @returns {string} Normalized category name
     */
    static normalizeCategoryName(categoryName) {
        if (!categoryName || typeof categoryName !== 'string') return '';
        return categoryName
            .replace(/^Category:/i, '')
            .replace(/_/g, ' ')
            .trim();
    }

    /**
     * Check if a category is trying to add itself (circular reference)
     * @param {string} currentCategory - The category being edited
     * @param {string} categoryToAdd - The category to be added
     * @returns {boolean} True if circular reference detected
     */
    static isCircularCategory(currentCategory, categoryToAdd) {
        if (!currentCategory || !categoryToAdd) return false;

        const normalizedCurrent = this.normalizeCategoryName(currentCategory);
        const normalizedToAdd = this.normalizeCategoryName(categoryToAdd);

        return normalizedCurrent.toLowerCase() === normalizedToAdd.toLowerCase();
    }
}

// === src/models/FileModel.js ===
/**
 * File model representing a Wikimedia Commons file
 * @class FileModel
 */
class FileModel {
  /**
   * @param {Object} data - File data
   * @param {string} data.title - Full file title (e.g., "File:Example,BLR.svg")
   * @param {number} data.pageid - Unique page ID
   * @param {boolean} [data.selected=true] - Whether file is selected for operation
   * @param {Array<string>} [data.currentCategories=[]] - Current categories
   * @param {string} [data.thumbnail=''] - URL to thumbnail
   * @param {number} [data.size=0] - File size in bytes
   */
  constructor(data) {
    this.title = data.title;
    this.pageid = data.pageid;
    this.selected = data.selected !== undefined ? data.selected : true;
    this.currentCategories = data.currentCategories || [];
    this.thumbnail = data.thumbnail || '';
    this.size = data.size || 0;
  }
}

// === src/models/CategoryOperation.js ===
/**
 * Category operation model
 * @class CategoryOperation
 */
class CategoryOperation {
    /**
     * @param {Object} data - Operation data
     * @param {string} data.sourceCategory - Source category name
     * @param {string} data.searchPattern - Search pattern used
     * @param {Array} [data.files=[]] - Files matched
     * @param {Array<string>} [data.categoriesToAdd=[]] - Categories to add
     * @param {Array<string>} [data.categoriesToRemove=[]] - Categories to remove
     * @param {string} [data.status='idle'] - Operation status
     */
    constructor(data) {
        this.sourceCategory = data.sourceCategory;
        this.searchPattern = data.searchPattern;
        this.files = data.files || [];
        this.categoriesToAdd = data.categoriesToAdd || [];
        this.categoriesToRemove = data.categoriesToRemove || [];
        this.status = data.status || 'idle';
    }
}

// === vite/src/services/APIService.js ===
/**
 * Service for interacting with the MediaWiki API
 *
 * All requests go through mw.Api which handles CSRF-token management,
 * automatic bad-token retry, and correct origin headers.
 *
 * For local development without MediaWiki, set `window.mw` to a shim
 * that wraps fetch() — see README or DEPLOYMENT.md for details.
 *
 * @class APIService
 */



class APIService {
    constructor() {
        /**
         * Native MediaWiki API helper
         * @type {mw.Api}
         */
        this.mwApi = new mw.Api();
    }
    /* ------------------------------------------------------------------ */
    /*  Public helpers used by other services                              */
    /* ------------------------------------------------------------------ */

    /**
     * TODO: remove it and related tests
     * Fetch files from a category with pagination support.
     * @param {string} categoryName - Full category name including "Category:" prefix
     * @param {Object} [options={}] - Query options
     * @param {number} [options.limit=500] - Maximum files to retrieve per request
     * @returns {Promise<Array>} Array of file objects
     */
    async getCategoryMembers(categoryName, options = {}) {
        const allMembers = [];
        let cmcontinue = null;

        do {
            const params = {
                action: 'query',
                list: 'categorymembers',
                cmtitle: categoryName,
                cmtype: 'file',
                cmlimit: options.limit || 500,
                format: 'json'
            };

            if (cmcontinue) {
                params.cmcontinue = cmcontinue;
            }

            const data = await this.makeRequest(params);
            allMembers.push(...data.query.categorymembers);

            cmcontinue = data.continue ? data.continue.cmcontinue : null;
        } while (cmcontinue);

        return allMembers;
    }

    /**
     * Get file details including categories.
     * @param {Array<string>} titles - Array of file titles
     * @returns {Promise<Object>} API response with file info
     */
    async getFileInfo(titles) {
        const params = {
            action: 'query',
            titles: titles.join('|'),
            prop: 'categories|imageinfo',
            cllimit: 500,
            format: 'json'
        };

        return this.makeRequest(params);
    }
    /**
     * Get page content (wikitext).
     * @param {string} title - Page title
     * @returns {Promise<string>} Page wikitext content
     */
    async getPageContent(title) {
        const params = {
            action: 'query',
            titles: title,
            prop: 'revisions',
            rvprop: 'content',
            rvslots: 'main',
            format: 'json'
        };

        const data = await this.makeRequest(params);
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        return pages[pageId].revisions[0].slots.main['*'];
    }

    /**
     * Search for categories by prefix.
     * Uses MediaWiki's opensearch API for category suggestions.
     * @param {string} prefix - Search prefix (can include or exclude "Category:" prefix)
     * @param {Object} [options={}] - Search options
     * @param {number} [options.limit=10] - Maximum results to return
     * @returns {Promise<Array<string>>} Array of category names with "Category:" prefix
     */
    async searchCategories(prefix, options = {}) {
        const limit = options.limit || 10;

        // Remove "Category:" prefix if present for the search
        const searchPrefix = prefix.replace(/^Category:/, '');

        const params = {
            action: 'opensearch',
            search: `Category:${searchPrefix}`,
            namespace: 14, // Category namespace
            limit: limit,
            format: 'json'
        };

        try {
            const data = await this.makeRequest(params);
            // opensearch returns: [query, [titles], [descriptions], [urls]]
            // We only need the titles
            const titles = data[1] || [];

            // Ensure all results have "Category:" prefix and filter to only categories
            return titles
                .filter(title => title.startsWith('Category:'))
                .map(title => {
                    // Preserve the exact format from API (already has Category: prefix)
                    return title;
                });
        } catch (error) {
            console.error('Failed to search categories', error);
            return [];
        }
    }

    async fetchCategories(searchTerm, options = {}) {
        const limit = options.limit || 10;
        if (!searchTerm || searchTerm.length < 2) {
            return Promise.resolve([]);
        }
        const params = {
            action: 'opensearch',
            search: searchTerm,
            namespace: 14, // Category namespace
            limit: limit
        };
        if (options.offset) {
            params.continue = String(options.offset);
        }
        const data = await this.makeRequest(params);
        // data[1] contains the category titles
        if (data && data[1]) {
            return data[1].map(function (title) {
                return {
                    value: title,
                    label: title
                };
            });
        } else {
            return [];
        }
    }

    /**
     * Get categories that a page belongs to.
     * @param {string} title - Page title
     * @returns {Promise<Array<string>|false>} Array of category names (without "Category:" prefix), or false if page not found
     */
    async getCategories(title) {
        try {
            const categories = await this.mwApi.getCategories(title);
            if (categories === false) {
                return false;
            }
            // Convert mw.Title objects to strings and remove "Category:" prefix
            return categories.map(cat => {
                const catStr = cat.toString();
                return catStr.replace(/^Category:/, '');
            });
        } catch (error) {
            console.error('Failed to get categories', error);
            throw error;
        }
    }

    /**
     * Search for files in a category using MediaWiki search API
     * Much more efficient than loading all category members
     * @param {string} categoryName - Category name (without "Category:" prefix)
     * @param {string} pattern - Search pattern
     * @returns {Promise<Array>} Array of file objects
     */
    async searchInCategory(categoryName, pattern) {
        const results = [];
        let continueToken = null;

        do {
            // Replace spaces with underscores in category name for search API
            const searchCategoryName = categoryName.replace(/\s+/g, '_');
            const params = {
                action: 'query',
                list: 'search',
                srsearch: `incategory:${searchCategoryName} intitle:/${pattern}/`,
                srnamespace: 6, // File namespace
                srlimit: 'max',
                srprop: 'size|wordcount|timestamp',
                format: 'json'
            };

            if (continueToken) {
                params.sroffset = continueToken;
            }

            const response = await this.makeRequest(params);

            if (response.query && response.query.search) {
                const searchResults = response.query.search.map(file => ({
                    title: file.title,
                    pageid: file.pageid,
                    size: file.size,
                    timestamp: file.timestamp
                }));

                results.push(...searchResults);
            }

            // Check if there are more results
            continueToken = response.continue ? response.continue.sroffset : null;

            // Safety limit to prevent too many requests
            if (results.length >= 5000) {
                console.warn('Search result limit reached (5000 files)');
                break;
            }

        } while (continueToken);

        return results;
    }


    /**
     * Edit a page using mw.Api.edit() which handles revision fetching and conflicts.
     *
     * @param {string} title   - Page title
     * @param {string} content - New page content (wikitext)
     * @param {string} summary - Edit summary
     * @param {Object} [options={}] - Additional edit options (minor, bot, etc.)
     * @returns {Promise<Object>} API response
     */
    async editPage(title, content, summary, options = {}) {

        // Use mw.Api.edit() with a transform function
        return this.mwApi.edit(title, function () {
            return {
                text: content,
                summary: summary,
                ...options
            };
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Low-level request method                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Make a GET request to the MediaWiki API via mw.Api.get().
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Parsed JSON response
     */
    async makeRequest(params) {
        try {
            return await this.mwApi.get(params);
        } catch (error) {
            console.error('API request failed', error);
            throw error;
        }
    }
}

// === vite/src/services/FileService.js ===
/**
 * Service for file operations
 * @class FileService
 */



class FileService {
    /**
     * @param {APIService} apiService - API service instance
     */
    constructor(apiService) {
        this.api = apiService;
    }

    /**
     * Search files by pattern within a category
     * Uses MediaWiki search API for efficiency instead of loading all category members
     * @param {string} categoryName - Category to search in
     * @param {string} searchPattern - Pattern to match against file titles
     * @returns {Promise<Array<FileModel>>} Array of matching file models
     */
    async searchFiles(categoryName, searchPattern) {
        // Normalize category name
        const cleanCategoryName = categoryName.replace(/^Category:/i, '');

        // Use search API to find files matching the pattern in the category
        const searchResults = await this.api.searchInCategory(cleanCategoryName, searchPattern);

        // Get detailed info for matching files
        const filesWithInfo = await this.getFilesDetails(searchResults);

        return filesWithInfo;
    }

    /**
     * Get detailed information for a batch of files
     * @param {Array} files - Array of file objects with title property
     * @returns {Promise<Array<FileModel>>} Array of file models with details
     */
    async getFilesDetails(files) {
        if (files.length === 0) return [];

        const batchSize = 50; // API limit
        const batches = this.createBatches(files, batchSize);

        const results = [];
        for (const batch of batches) {
            const titles = batch.map(f => f.title);
            const info = await this.api.getFileInfo(titles);
            results.push(...this.parseFileInfo(info));
        }

        return results;
    }

    /**
     * Split an array into batches
     * @param {Array} array - Array to split
     * @param {number} size - Batch size
     * @returns {Array<Array>} Array of batches
     */
    createBatches(array, size) {
        const batches = [];
        for (let i = 0; i < array.length; i += size) {
            batches.push(array.slice(i, i + size));
        }
        return batches;
    }

    /**
     * Parse API response into FileModel objects
     * @param {Object} apiResponse - Raw API response
     * @returns {Array<FileModel>} Array of file models
     */
    parseFileInfo(apiResponse) {
        const pages = apiResponse.query.pages;
        const fileModels = [];

        for (const pageId of Object.keys(pages)) {
            const page = pages[pageId];
            if (parseInt(pageId) < 0) continue; // Skip missing pages

            const categories = (page.categories || []).map(cat => cat.title);
            const FileModelClass = typeof FileModel !== 'undefined' ? FileModel : function (d) {
                return d;
            };

            fileModels.push(new FileModelClass({
                title: page.title,
                pageid: page.pageid,
                selected: true,
                currentCategories: categories,
                thumbnail: page.imageinfo && page.imageinfo[0] ? page.imageinfo[0].url : '',
                size: page.imageinfo && page.imageinfo[0] ? page.imageinfo[0].size : 0
            }));
        }

        return fileModels;
    }
}

// === vite/src/ui/components/CategoryInputs.js ===
/**
 * Category inputs UI component using Codex CSS-only classes.
 * Manages the add categories, remove categories inputs with autocomplete.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputs
 */
class CategoryInputs {
    /**
     * @param {APIService} apiService - API service for category search
     */
    constructor(apiService) {
        this.apiService = apiService;
    }

    /**
     * Create the category inputs HTML element with Codex components.
     */
    createElement() {
        return `
            <div class="cbm-category-input-group">
                <cdx-label input-id="cbm-add-cats" class="cbm-label">
                    Add Categories
                </cdx-label>
                <span class="cbm-help-text">
                    e.g., Category:Belarus, Category:Europe
                </span>
                <cdx-multiselect-lookup
                    id="cdx-category-add"
                    v-model:input-chips="addCategoryChips"
                    v-model:selected="addCategories"
		            v-model:input-value="addInputValue"
                    :menu-items="addCategoryMenuItems"
                    :menu-config="addCategoryMenuConfig"
                    aria-label="Add categories"
                    placeholder="Type to search categories"
                    @update:input-value="onAddCategoryInput"
		            @load-more="addOnLoadMore"
                >
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>

            <!-- Category Add Message -->
            <div v-if="showAddCategoryMessage" class="margin-bottom-20">
                <cdx-message type="{{ addCategoryMessageType }}" :inline="false">
                    {{ addCategoryMessageText }}
                </cdx-message>
            </div>

            <div class="cbm-category-input-group">
                <cdx-label input-id="cbm-remove-cats" class="cbm-label">
                    Remove Categories
                </cdx-label>
                <cdx-multiselect-lookup
                    id="cdx-category-remove"
                    v-model:input-chips="removeCategoryChips"
                    v-model:selected="removeCategories"
		            v-model:input-value="removeInputValue"
                    :menu-items="removeCategoryMenuItems"
                    :menu-config="removeCategoryMenuConfig"
                    aria-label="Remove categories"
                    placeholder="Type to search categories"
                    @update:input-value="onRemoveCategoryInput"
		            @load-more="removeOnLoadMore"
                    >
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>
            <!-- Category Remove Message -->
            <div v-if="showRemoveCategoryMessage" class="margin-bottom-20">
                <cdx-message type="{{ removeCategoryMessageType }}" :inline="false">
                    {{ removeCategoryMessageText }}
                </cdx-message>
            </div>
    `;
    }
    displayCategoryMessage(self, text, type = 'error', msg_type = 'add') {
        if (msg_type === 'add') {
            self.showAddCategoryMessage = true;
            self.addCategoryMessageType = type;
            self.addCategoryMessageText = text;
        } else if (msg_type === 'remove') {
            self.showRemoveCategoryMessage = true;
            self.removeCategoryMessageType = type;
            self.removeCategoryMessageText = text;
        }
    }

    hideCategoryMessage(self, msg_type = 'add') {
        if (msg_type === 'add') {
            self.showAddCategoryMessage = false;
            self.addCategoryMessageText = '';
        } else if (msg_type === 'remove') {
            self.showRemoveCategoryMessage = false;
            self.removeCategoryMessageText = '';
        }
    }
    deduplicateResults(items1, results) {
        const seen = new Set(items1.map((result) => result.value));
        return results.filter((result) => !seen.has(result.value));
    }

    /**
     * Handle add category input with debounce.
     * @param {string} value - The input value to search for
     */
    async onAddCategoryInput(self, value) {
        this.hideCategoryMessage(self, 'add');

        // Clear menu items if the input was cleared.
        if (!value) {
            console.warn('Add category input cleared, clearing menu items.');
            self.addCategoryMenuItems = [];
            return;
        }

        // If empty, clear menu items
        if (!value || value.trim().length < 2) {
            console.warn('Add category input too short, clearing menu items.');
            self.addCategoryMenuItems = [];
            return;
        }

        const data = await this.apiService.fetchCategories(value);

        // Make sure this data is still relevant first.
        if (self.addInputValue !== value) {
            console.warn('Add category input value changed during fetch, discarding results.');
            return;
        }

        // Reset the menu items if there are no results.
        if (!data || data.length === 0) {
            console.warn('No results for add category input, clearing menu items.');
            self.addCategoryMenuItems = [];
            return;
        }

        // Update addCategoryMenuItems.
        self.addCategoryMenuItems = data;
    }

    /**
     * Handle remove category input with debounce.
     * @param {string} value - The input value to search for
     */
    async onRemoveCategoryInput(self, value) {
        this.hideCategoryMessage(self, 'remove');
        // Clear menu items if the input was cleared.
        if (!value) {
            console.warn('Remove category input cleared, clearing menu items.');
            self.removeCategoryMenuItems = [];
            return;
        }

        // If empty, clear menu items
        if (!value || value.trim().length < 2) {
            console.warn('Remove category input too short, clearing menu items.');
            self.removeCategoryMenuItems = [];
            return;
        }

        const data = await this.apiService.fetchCategories(value);

        // Make sure this data is still relevant first.
        if (self.removeInputValue !== value) {
            console.warn('Remove category input value changed during fetch, discarding results.');
            return;
        }

        // Reset the menu items if there are no results.
        if (!data || data.length === 0) {
            console.warn('No results for remove category input, clearing menu items.');
            self.removeCategoryMenuItems = [];
            return;
        }

        // Update removeCategoryMenuItems.
        self.removeCategoryMenuItems = data;
    }

    async addOnLoadMore(self) {
        if (!self.addInputValue) {
            console.warn('No input value for add categories, cannot load more.');
            return;
        }

        const data = await this.apiService.fetchCategories(self.addInputValue, { offset: self.addCategoryMenuItems.length });

        if (!data || data.length === 0) {
            console.warn('No more results to load for add categories.');
            return;
        }

        // Update self.addCategoryMenuItems.
        const deduplicatedResults = this.deduplicateResults(self.addCategoryMenuItems, data);
        self.addCategoryMenuItems.push(...deduplicatedResults);
    }

    async removeOnLoadMore(self) {
        if (!self.removeInputValue) {
            console.warn('No input value for remove categories, cannot load more.');
            return;
        }

        const data = await this.apiService.fetchCategories(self.removeInputValue, { offset: self.removeCategoryMenuItems.length });

        if (!data || data.length === 0) {
            console.warn('No more results to load for remove categories.');
            return;
        }

        // Update self.removeCategoryMenuItems.
        const deduplicatedResults = this.deduplicateResults(self.removeCategoryMenuItems, data);
        self.removeCategoryMenuItems.push(...deduplicatedResults);
    }

}

// === vite/src/ui/components/FilesList.js ===
/**
 * File list UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class FilesList
 */
class FilesList {
    /**
     * @param {mw.Api} apiService - API service for category search
     */
    constructor(apiService) {
        this.apiService = apiService;
    }

    /**
     * Create the files list HTML element with Codex components.
     */
    createElement() {
        return `
        <div v-if="selectedFiles.length > 0" class="cbm-files-list">
            <!-- Results Header -->
            <div class="cbm-files-header">
                <div class="cbm-count-badge">
                    Found <strong>{{ totalFilesCount }}</strong> files
                </div>
                <div class="cbm-header-buttons">
                    <cdx-button @click="selectAll" action="default" weight="quiet" size="medium">
                        Select All
                    </cdx-button>
                    <cdx-button @click="deselectAll" action="default" weight="quiet" size="medium">
                        Deselect All
                    </cdx-button>
                </div>
            </div>

            <!-- File List -->
            <div class="cbm-files-scrollable">
                <div v-for="(file, index) in selectedFiles" :key="index" class="cbm-file-row">
                    <cdx-checkbox v-model="file.selected" :input-id="'file-' + index" />
                    <label :for="'file-' + index">
                        {{ file.title }}
                    </label>
                    <button @click="removeFile(index)" class="cbm-file-remove-btn" title="Remove from list">
                        ×
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="cbm-empty-state">
            <p>No files found. Use the search to find files.</p>
        </div>
    `;
    }

    // Select all files
    selectAll(selectedFiles) {
        selectedFiles.forEach(file => {
            file.selected = true;
        });
    }

    // Deselect all files
    deselectAll(selectedFiles) {
        selectedFiles.forEach(file => {
            file.selected = false;
        });
    }
}

// === vite/src/ui/components/ProgressBar.js ===
/**
 * Progress bar UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class ProgressBar
 */
class ProgressBar {
    /**
     */
    constructor() {
    }

    /**
     * Create the HTML structure for the progress section
     */
    createElement() {
        return `
        <div v-if="showProgress" class="cbm-progress-section">
            <div class="cbm-progress-bar-bg">
                <div class="cbm-progress-bar-fill"
                    :style="{ width: progressPercent + '%' }">
                </div>
            </div>
            <div class="cbm-progress-text">
                {{ progressText }}
            </div>
        </div>
    `;
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
    }
}

// === vite/src/ui/handlers/ExecuteHandler.js ===
/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class ExecuteHandler
 */
class ExecuteHandler {
    /**
     */
    constructor() {
    }

    /**
     * Create the search panel HTML element with Codex components.
     */
    createElement() {
        return `
            <cdx-button v-if="!isProcessing" @click="executeOperation" action="progressive" weight="primary">
                GO
            </cdx-button>
            <cdx-button v-if="isProcessing" @click="stopOperation" action="destructive" weight="primary">
                Stop Process
            </cdx-button>
        `;
    }

    // should be moved to class ExecuteHandler` at `src/ui/handlers/ExecuteHandler.js`
    // Execute batch operation
    executeOperation(self) {
        const selectedCount = self.selectedCount;

        if (selectedCount === 0) {
            self.showWarningMessage('Please select at least one file.');
            return;
        }

        if (self.addCategories.length === 0 && self.removeCategories.length === 0) {
            self.showWarningMessage('Please specify categories to add or remove.');
            return;
        }

        if (!confirm(`Are you sure you want to process ${selectedCount} file(s)?`)) {
            return;
        }

        self.isProcessing = true;
        self.shouldStopProgress = false;
        self.showProgress = true;

        // Placeholder - implement actual batch processing
        const selectedFilesToProcess = self.selectedFiles.filter(f => f.selected);
        self.processBatch(selectedFilesToProcess, 0);
    }

    // Process files sequentially
    processBatch(self, files, index) {
        if (self.shouldStopProgress || index >= files.length) {
            self.isProcessing = false;
            self.showProgress = false;
            if (!self.shouldStopProgress) {
                self.showSuccessMessage('Batch operation completed successfully!');
            } else {
                self.showWarningMessage('Operation stopped by user.');
            }
            return;
        }

        self.progressPercent = ((index + 1) / files.length) * 100;
        self.progressText = `Processing ${index + 1} of ${files.length}...`;

        // Placeholder - implement actual file processing
        setTimeout(() => {
            console.log('Processing:', files[index].title);
            self.processBatch(files, index + 1);
        }, 500);
    }

    // Stop ongoing operation
    stopOperation(self) {
        self.shouldStopProgress = true;
    }

}

// === vite/src/ui/handlers/PreviewHandler.js ===
/**
 * Preview Handler
 *
 * @description
 * Handles all preview-related functionality for BatchManager.
 * Manages preview generation, modal display, and validation.
 *
 * @requires ValidationHelper - For common validation logic
 */



class PreviewHandler {
    /**
     */
    constructor() {
        this.validator = new ValidationHelper();
    }
    createElement() {
        return `
        <cdx-button @click="previewTheChanges" action="default" weight="normal"
            :disabled="isProcessing">
            Preview Changes
        </cdx-button>
    `;
    }
    // Preview changes before executing
    previewTheChanges(self) {
        console.log('[CBM-P] Preview button clicked');

        const selectedCount = self.selectedCount;

        if (selectedCount === 0) {
            self.showWarningMessage('Please select at least one file.');
            return;
        }

        if (self.addCategories.length === 0 && self.removeCategories.length === 0) {
            self.showWarningMessage('Please specify categories to add or remove.');
            return;
        }

        const validation = this.validator.validateBatchOperation(self);
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

        // Placeholder - implement preview logic
        let previewMessage = `Preview for ${selectedFiles.length} file(s):\n`;
        if (toAdd.length > 0) {
            previewMessage += `\nAdding: ${toAdd.join(', ')}`;
        }
        if (toRemove.length > 0) {
            previewMessage += `\nRemoving: ${toRemove.join(', ')}`;
        }

        // should be replaced by showPreviewModal
        alert(previewMessage);
    }
    /**
     * Handle preview button click
     * Generates and displays a preview of category changes
     */
    async handlePreview(self) {
        console.log('[CBM-P] Preview button clicked');

        // Use ValidationHelper for common validation
        const validation = this.validator.validateBatchOperation(self);
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

        // Generate preview without affecting file list - no loading indicator
        try {
            console.log('[CBM-P] Calling batchProcessor.previewChanges');
            const preview = await self.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );
            console.log('[CBM-P] Preview result:', preview);
            this.showPreviewModal(self, preview);

        } catch (error) {
            console.log('[CBM-P] Error in previewChanges:', error);
            // Check if error is about duplicate categories
            if (error.message.includes('already exist')) {
                self.showWarningMessage(`⚠️ ${error.message}`);
            } else {
                self.showErrorMessage(`Error generating preview: ${error.message}`);
            }
        }
    }

    /**
     * Show the preview modal with changes
     * @param {Array} preview - Array of preview items
     */
    showPreviewModal(self, preview) {
        const modal = document.getElementById('cbm-preview-modal');
        const content = document.getElementById('cbm-preview-content');
        if (!modal) {
            console.error('[CBM] Preview modal container not found');
            return;
        }
        if (!content) {
            console.error('[CBM] Preview content container not found');
            return;
        }
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
            console.log('[CBM] No changes detected');
            self.displayCategoryMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice', 'add');
            return;
        }

        html = `<p>${changesCount} files will be modified</p>` + html;

        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    /**
     * Hide the preview modal
     */
    hidePreviewModal() {
        const modal = document.getElementById('cbm-preview-modal');
        modal.classList.add('hidden');
    }
}

// === vite/src/ui/handlers/SearchHandler.js ===
/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class SearchHandler
 */
class SearchHandler {
    /**
     */
    constructor() {
    }

    /**
     * Create the search panel HTML element with Codex components.
     */
    createElement() {
        return `
        <div class="cbm-search-panel">
            <div class="cbm-input-group">
                <cdx-label input-id="cbm-source-category" class="cbm-label">
                    Source Category
                </cdx-label>
                <cdx-text-input id="cbm-source-category" v-model="sourceCategory"
                    placeholder="Category:Our World in Data graphs of Austria" />
            </div>

            <div class="cbm-input-group">
                <cdx-label input-id="cbm-pattern" class="cbm-label">
                    Search Pattern
                </cdx-label>
                <span class="cbm-help-text">
                    Enter a pattern to filter files (e.g., ,BLR.svg)
                </span>
                <div class="cbm-input-button-group">
                    <cdx-text-input id="cbm-pattern" v-model="searchPattern" placeholder="e.g., ,BLR.svg" />
                    <cdx-button v-if="!isSearching" @click="searchFiles" action="progressive" weight="primary">
                        Search
                    </cdx-button>
                    <cdx-button v-if="isSearching" @click="stopSearch" action="destructive" weight="primary">
                        Stop Search
                    </cdx-button>
                </div>
            </div>
        </div>
        <!-- Results Message -->
        <div v-if="showResultsMessage" class="margin-bottom-20">
            <cdx-message type="success" :inline="false">
                {{ resultsMessageText }}
            </cdx-message>
        </div>
        `;
    }

    async searchFiles(self) {
        self.isSearching = true;
        self.resetMessageState();

        if (self.sourceCategory.trim() === '') {
            self.showWarningMessage('Please enter a source category.');
            return;
        }

        const searchResults_demo = [
            { title: 'File:GDP-per-capita,BLR.svg', selected: false },
            { title: 'File:Life-expectancy,BLR.svg', selected: false }
        ];

        self.showProgress = true;
        self.progressText = 'Searching for files...';

        self.searchResults = await self.file_service.searchFiles(self.sourceCategory, self.searchPattern);
        self.selectedFiles = [...self.searchResults];
        self.showProgress = false;
        self.showResultsMessage = true;
        self.isSearching = false;
        self.resultsMessageText = `Found ${self.searchResults.length} files matching the pattern.`;
    }

    stopSearch(self) {
        self.isSearching = false;
        self.shouldStopSearch = true;
        // Implement logic to stop ongoing search like in `class stopOperation`
    }

}

// === vite/src/ui/helpers/ValidationHelper.js ===
/**
 * Validation Helper
 *
 * @description
 * Shared validation logic for BatchManager handlers.
 * Provides common validation functions used by PreviewHandler and ExecuteHandler.
 *
 * @requires Validator - For checking circular category references
 */



class ValidationHelper {
    /**
     */
    constructor() {
    }

    /**
     * Check for circular category references and filter them out silently
     * Only shows error if ALL categories are circular
     * @param {Array<string>} categoriesToAdd - Categories to check for circular references
     * @returns {Array<string>|null} Filtered categories, or null if all are circular
     */
    filterCircularCategories(self) {
        const circularCategories = [];
        const validCategories = [];
        for (const category of self.addCategories) {
            if (Validator.isCircularCategory(self.sourceCategory, category)) {
                console.log('[CBM-V] Circular category detected (silently removed):', category);
                circularCategories.push(category);
            } else {
                validCategories.push(category);
            }
        }

        // If all categories are circular, show error
        if (circularCategories.length > 0 && validCategories.length === 0) {
            self.displayCategoryMessage(
                `❌ Cannot add: all categorie(s) are circular references to the current page. Cannot add "${circularCategories.join(', ')}" to itself.`,
                'error',
                'add'
            );
            return null;
        }

        // Silently filter circular categories if there are valid ones
        return validCategories;
    }

    /**
     * Perform all validation steps before a batch operation
     * @returns {Object|null} Object with selectedFiles, toAdd, toRemove, or null if validation fails
     */
    validateBatchOperation(self) {
        if (!self.selectedFiles) return null;
        if (!self.addCategories && !self.removeCategories) return null;

        // Filter out circular categories (returns null if ALL are circular)
        const filteredToAdd = this.filterCircularCategories(self);
        if (filteredToAdd === null) return null; // All categories were circular

        // Check if there are any valid operations remaining
        if (filteredToAdd.length === 0 && self.removeCategories.length === 0) {
            console.log('[CBM-V] No valid categories after filtering');
            self.displayCategoryMessage('No valid categories to add or remove.', 'warning', 'add');
            return null;
        }

        return {
            selectedFiles: self.selectedFiles,
            toAdd: filteredToAdd,
            toRemove: self.removeCategories
        };
    }
}

// === vite/src/BatchManager.js ===
/**
 * Creates the Vue app definition for the Category Batch Manager tool.
 * @returns {Object} Vue app definition object.
 */


function BatchManager() {
    const mwApi = new APIService();
    const search_handler = new SearchHandler();
    const category_inputs = new CategoryInputs(mwApi);
    const files_list = new FilesList(mwApi);
    const progress_section = new ProgressBar();
    const file_service = new FileService(mwApi);
    const execute_handler = new ExecuteHandler(mwApi);
    const preview_handler = new PreviewHandler();

    const Search_SectionHtml = search_handler.createElement();
    const CategoryInputPanelHtml = category_inputs.createElement();
    const FilesListHtml = files_list.createElement();
    const ProgressSectionHtml = progress_section.createElement();
    const ExecuteSectionHtml = execute_handler.createElement();
    const PreviewChangesHtml = preview_handler.createElement();

    const template = `
        <div class="cbm-container">
        <h2 class="cbm-title">
            Category Batch Manager
        </h2>

        <div class="cbm-grid">
            <!-- Left Panel: Search and Actions -->
            <div>
                <!-- Search Section -->
                ${Search_SectionHtml}

                <!-- Actions Section -->
                <div>
                    ${CategoryInputPanelHtml}

                    <div class="margin-bottom-20">
                        <cdx-label input-id="cbm-summary" class="cbm-label">
                            Edit Summary
                        </cdx-label>
                        <cdx-text-input id="cbm-summary" v-model="editSummary" />
                    </div>

                    <div class="cbm-selected-info">
                        Selected: <strong>{{ selectedCount }}</strong> files
                    </div>

                    <div class="cbm-button-group">
                        ${PreviewChangesHtml}
                        ${ExecuteSectionHtml}
                    </div>
                </div>
                <!-- Progress Section -->
                ${ProgressSectionHtml}
            </div>

            <!-- Right Panel: File List -->
            <div>
                ${FilesListHtml}
            </div>
        </div>
    </div>

    <!-- Message Display -->
    <div v-if="showMessage" class="cbm-fixed-message">
        <cdx-message :type="messageType" :fade-in="true" :auto-dismiss="messageType === 'success'" :display-time="3000"
            dismiss-button-label="Close" @dismissed="handleMessageDismiss">
            {{ messageContent }}
        </cdx-message>
    </div>
    `;

    const app = {
        data: function () {
            return {
                execute_handler: execute_handler,
                preview_handler: preview_handler,
                search_handler: search_handler,
                file_service: file_service,
                category_inputs: category_inputs,
                files_list: files_list,

                mwApi: mwApi, // Reference to API service instance
                sourceCategory: 'Category:Our World in Data graphs of Austria',
                searchPattern: '1990',
                addCategories: [],
                addInputValue: '',
                removeInputValue: '',
                removeCategories: [],
                editSummary: 'Batch category update via Category Batch Manager',
                searchResults: [],
                selectedFiles: [],
                showMessage: false,
                messageType: '',
                messageContent: '',
                showProgress: false,
                progressPercent: 0,
                progressText: 'Processing...',
                isSearching: false,
                isProcessing: false,
                shouldStopProgress: false,
                shouldStopSearch: false,

                showAddCategoryMessage: false,
                addCategoryMessageType: '',
                addCategoryMessageText: '',

                showRemoveCategoryMessage: false,
                removeCategoryMessageType: '',
                removeCategoryMessageText: '',

                showResultsMessage: false,
                resultsMessageText: '',

                // For multiselect lookup - Add Categories
                addCategoryChips: [],
                addCategoryMenuItems: [
                    // { value: 'Category:Economics', label: 'Category:Economics' },
                    // { value: 'Category:Science', label: 'Category:Science' }
                ],
                addCategoryMenuConfig: {
                    boldLabel: true,
                    visibleItemLimit: 10
                },

                // For multiselect lookup - Remove Categories
                removeCategoryChips: [],
                removeCategoryMenuItems: [
                    // { value: 'Category:Politics', label: 'Category:Politics' }
                ],
                removeCategoryMenuConfig: {
                    boldLabel: true,
                    visibleItemLimit: 10
                },

            };
        },
        computed: {
            selectedCount: function () {
                return this.selectedFiles.filter(f => f.selected).length;
            },
            totalFilesCount: function () {
                return this.selectedFiles.length;
            }
        },
        methods: {
            /* *************************
            **      FileService
            ** *************************
            */

            searchFiles: function () {
                return this.search_handler.searchFiles(this);
            },
            stopSearch: function () {
                return this.search_handler.stopSearch(this);
            },

            /* *************************
            **      FilesList
            ** *************************
            */

            // should be moved to `class FilesList` at `ui/components/FilesList.js`
            // Select all files
            selectAll: function () {
                return this.files_list.selectAll(this.selectedFiles);
            },

            // should be moved to `class FilesList` at `ui/components/FilesList.js`
            // Deselect all files
            deselectAll: function () {
                return this.files_list.deselectAll(this.selectedFiles);
            },

            // should be moved to `class FilesList` at `ui/components/FilesList.js`
            // Remove individual file from list
            removeFile: function (index) {
                this.selectedFiles.splice(index, 1);
                if (this.selectedFiles.length === 0) {
                    this.showResultsMessage = false;
                }
            },

            /* *************************
            **      BatchProcessor
            ** *************************
            */

            // should be moved to `class BatchProcessor` at `src/services/BatchProcessor.js`
            // Preview changes before executing
            previewTheChanges: function () {
                return this.preview_handler.previewTheChanges(this);
            },

            /* *************************
            **      ExecuteHandler
            ** *************************
            */

            // Execute batch operation
            executeOperation: function () {
                return this.execute_handler.executeOperation(this);
            },

            // Process files sequentially
            processBatch: function (files, index) {
                return this.execute_handler.processBatch(this, files, index);
            },

            // Stop ongoing operation
            stopOperation: function () {
                return this.execute_handler.stopOperation(this);
            },

            /* *************************
            **      CategoryInputs
            ** *************************
            */
            displayCategoryMessage: function (text, type, msg_type = 'add') {
                return this.category_inputs.displayCategoryMessage(this, text, type, msg_type);
            },
            hideCategoryMessage: function (msg_type = 'add') {
                return this.category_inputs.hideCategoryMessage(this, msg_type);
            },
            onAddCategoryInput: function (value) {
                return this.category_inputs.onAddCategoryInput(this, value);
            },
            onRemoveCategoryInput: function (value) {
                return this.category_inputs.onRemoveCategoryInput(this, value);
            },
            addOnLoadMore: function () {
                return this.category_inputs.addOnLoadMore(this);
            },
            removeOnLoadMore: function () {
                return this.category_inputs.removeOnLoadMore(this);
            },

            /* *************************
            **      Message Handlers
            ** *************************
            */

            // Message handlers
            resetMessageState: function () {
                this.showMessage = false;
                this.messageType = '';
                this.messageContent = '';
            },

            showWarningMessage: function (message) {
                this.messageType = 'warning';
                this.messageContent = message;
                this.showMessage = true;
            },

            showErrorMessage: function (message) {
                this.messageType = 'error';
                this.messageContent = message;
                this.showMessage = true;
            },

            showSuccessMessage: function (message) {
                this.messageType = 'success';
                this.messageContent = message;
                this.showMessage = true;
            },

            handleMessageDismiss: function () {
                this.showMessage = false;
            }
        },
        template: template
    };
    return app;
}

// === vite/src/gadget-entry.js ===
// <nowiki>

if (typeof categoryBatchManager === 'undefined') {
    var categoryBatchManager = {};
}

mw.loader.using(['@wikimedia/codex', 'mediawiki.api', 'vue']).then(function (require) {
    const target = document.getElementById('category-batch-manager2');
    if (!target) {
        return;
    }
    categoryBatchManager.api = new mw.Api();
    const Vue = require('vue');
    const Codex = require('@wikimedia/codex');

    const app = BatchManager();

    Vue.createMwApp(app)
        .component('cdx-text-input', Codex.CdxTextInput)
        .component('cdx-textarea', Codex.CdxTextArea)
        .component('cdx-select', Codex.CdxSelect)
        .component('cdx-checkbox', Codex.CdxCheckbox)
        .component('cdx-button', Codex.CdxButton)
        .component('cdx-progress-bar', Codex.CdxProgressBar)
        .component('cdx-message', Codex.CdxMessage)
        .component('cdx-dialog', Codex.CdxDialog)
        .component('cdx-label', Codex.CdxLabel)
        .component('cdx-multiselect-lookup', Codex.CdxMultiselectLookup)
        .mount('#category-batch-manager2');
});

// </nowiki>
// </nowiki>
