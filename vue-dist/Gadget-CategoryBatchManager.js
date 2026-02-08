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

// === vue-src/services/APIService.js ===
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
            if (typeof Logger !== 'undefined') {
                Logger.error('Failed to search categories', error);
            }
            return [];
        }
    }

    async fetchCategories(searchTerm, options = {}) {
        const limit = options.limit || 10;
        if (!searchTerm || searchTerm.length < 2) {
            return Promise.resolve([]);
        }

        const data = await this.makeRequest({
            action: 'opensearch',
            search: searchTerm,
            namespace: 14, // Category namespace
            limit: limit
        });
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
            if (typeof Logger !== 'undefined') {
                Logger.error('Failed to get categories', error);
            }
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
            if (typeof Logger !== 'undefined') {
                Logger.error('API request failed', error);
            }
            throw error;
        }
    }
}

// === vue-src/ui/components/SearchPanel.js ===
/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class SearchPanel
 */
class SearchPanel {
    /**
     */
    constructor() {
    }

    /**
     * Create the search panel HTML element with Codex components.
     */
    createElement() {
        return `
        <div style="margin-bottom: 25px;">
            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-source-category"
                    style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Source Category
                </cdx-label>
                <cdx-text-input id="cbm-source-category" v-model="sourceCategory"
                    placeholder="Category:Economic Data" />
            </div>

            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-pattern" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Search Pattern
                </cdx-label>
                <span style="display: block; color: #54595d; font-size: 0.875em; margin-bottom: 5px;">
                    Enter a pattern to filter files (e.g., ,BLR.svg)
                </span>
                <div style="display: flex; gap: 10px;">
                    <cdx-text-input id="cbm-pattern" v-model="searchPattern" placeholder="e.g., ,BLR.svg"
                        style="flex: 1;" />
                    <cdx-button @click="searchFiles" action="progressive" weight="primary">
                        Search
                    </cdx-button>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * searchFiles() {} to be moved from createCategoryBatchManager.js to here.
     */

}

// === vue-src/ui/components/CategoryInputs.js ===
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
            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-add-cats" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Add Categories
                </cdx-label>
                <span style="display: block; color: #54595d; font-size: 0.875em; margin-bottom: 5px;">
                    e.g., Category:Belarus, Category:Europe
                </span>
                <cdx-multiselect-lookup v-model:input-chips="addCategoryChips" v-model:selected="addCategories"
                    :menu-items="addCategoryMenuItems" :menu-config="addCategoryMenuConfig"
                    aria-label="Add categories" placeholder="Type to search categories" @input="onAddCategoryInput"
                    @update:input-chips="handleAddCategoryChipChange">
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>

            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-remove-cats" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Remove Categories
                </cdx-label>
                <cdx-multiselect-lookup v-model:input-chips="removeCategoryChips"
                    v-model:selected="removeCategories" :menu-items="removeCategoryMenuItems"
                    :menu-config="removeCategoryMenuConfig" aria-label="Remove categories"
                    placeholder="Type to search categories" @input="onRemoveCategoryInput"
                    @update:input-chips="handleRemoveCategoryChipChange">
                    <template #no-results>
                        Type at least 2 characters to search
                    </template>
                </cdx-multiselect-lookup>
            </div>
    `;
    }
    // handleAddCategoryChipChange, onAddCategoryInput, onRemoveCategoryInput, handleRemoveCategoryChipChange
    /**
     * Handle add category input with debounce.
     * @param {string} value - The input value to search for
     */
    onAddCategoryInput(self, value) {
        // Clear previous timeout
        if (self.addCategoryDebounce) {
            clearTimeout(self.addCategoryDebounce);
        }

        // If empty, clear menu items
        if (!value || value.trim().length < 2) {
            self.addCategoryMenuItems = [];
            return;
        }

        // Debounce API call
        self.addCategoryDebounce = setTimeout(() => {
            this.apiService.fetchCategories(value).then((items) => {
                self.addCategoryMenuItems = items;
            });
        }, 300); // 300ms debounce
    }

    /**
     * Handle remove category input with debounce.
     * @param {string} value - The input value to search for
     */
    onRemoveCategoryInput(self, value) {
        // Clear previous timeout
        if (self.removeCategoryDebounce) {
            clearTimeout(self.removeCategoryDebounce);
        }

        // If empty, clear menu items
        if (!value || value.trim().length < 2) {
            self.removeCategoryMenuItems = [];
            return;
        }

        // Debounce API call
        self.removeCategoryDebounce = setTimeout(() => {
            this.apiService.fetchCategories(value).then((items) => {
                self.removeCategoryMenuItems = items;
            });
        }, 300); // 300ms debounce
    }

    /**
     * Handle chip changes for add categories.
     * @param {Array} newChips - The new chips array
     */
    handleAddCategoryChipChange(self, newChips) {
        self.addCategoryChips = newChips;
        self.addCategories = newChips.map(chip => chip.value);
    }

    /**
     * Handle chip changes for remove categories.
     * @param {Array} newChips - The new chips array
     */
    handleRemoveCategoryChipChange(self, newChips) {
        self.removeCategoryChips = newChips;
        self.removeCategories = newChips.map(chip => chip.value);
    }
}

// === vue-src/ui/components/FilesList.js ===
/**
 * @class FilesList
 */
class FilesList {
    /**
     * @param {mw.Api} apiService - API service for category search
     */
    constructor(apiService) {
        this.apiService = apiService;
        this.selectedFiles = [];
    }

    /**
     * Create the files list HTML element with Codex components.
     */
    createElement() {
        return `
        <div v-if="selectedFiles.length > 0"
            style="background-color: #ffffff; padding: 20px; border-radius: 4px; border: 1px solid #c8ccd1; height: fit-content;">
            <!-- Results Header -->
            <div
                style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #c8ccd1;">
                <div
                    style="background-color: #eaf3ff; color: #36c; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 0.9em;">
                    Found <strong>{{ totalFilesCount }}</strong> files
                </div>
                <div style="display: flex; gap: 8px;">
                    <cdx-button @click="selectAll" action="default" weight="quiet" size="medium">
                        Select All
                    </cdx-button>
                    <cdx-button @click="deselectAll" action="default" weight="quiet" size="medium">
                        Deselect All
                    </cdx-button>
                </div>
            </div>

            <!-- File List -->
            <div style="max-height: 500px; overflow-y: auto;">
                <div v-for="(file, index) in selectedFiles" :key="index"
                    style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eaecf0; gap: 10px;">
                    <cdx-checkbox v-model="file.selected" :input-id="'file-' + index" style="flex-shrink: 0;" />
                    <label :for="'file-' + index" style="flex: 1; cursor: pointer; font-size: 0.9em;">
                        {{ file.title }}
                    </label>
                    <button @click="removeFile(index)"
                        style="flex-shrink: 0; background: none; border: none; color: #d33; font-size: 1.5em; cursor: pointer; padding: 0 8px; line-height: 1;"
                        title="Remove from list">
                        ×
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else
            style="background-color: #ffffff; padding: 40px; border-radius: 4px; border: 1px solid #c8ccd1; text-align: center; color: #72777d;">
            <p style="margin: 0; font-size: 1.1em;">No files found. Use the search to find files.</p>
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

// === vue-src/ui/components/ProgressSection.js ===
/**
 * @class ProgressSection
 */
class ProgressSection {
    /**
     */
    constructor() {
    }

    /**
     * Create the HTML structure for the progress section
     */
    createElement() {
        return `
        <div v-if="showProgress"
            style="margin-top: 20px; padding: 15px; background-color: #ffffff; border: 1px solid #c8ccd1; border-radius: 4px;">
            <div
                style="width: 100%; background-color: #eaecf0; border-radius: 2px; height: 20px; overflow: hidden; margin-bottom: 10px;">
                <div
                    :style="{ width: progressPercent + '%', height: '100%', backgroundColor: '#36c', transition: 'width 0.3s ease' }">
                </div>
            </div>
            <div style="text-align: center; color: #202122; font-weight: 500;">
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

// === vue-src/createCategoryBatchManager.js ===
/**
 * Creates the Vue app definition for the Category Batch Manager tool.
 * @param {mw.Api} api - An instance of the MediaWiki API for making requests.
 * @returns {Object} Vue app definition object.
 */


function createCategoryBatchManager(api) {
    const mwApi = new APIService();
    const search_panel = new SearchPanel();
    const category_inputs = new CategoryInputs(mwApi);
    const files_list = new FilesList();
    const progress_section = new ProgressSection();

    const Search_SectionHtml = search_panel.createElement();
    const CategoryInputPanelHtml = category_inputs.createElement();
    const FilesListHtml = files_list.createElement();
    const ProgressSectionHtml = progress_section.createElement();

    const template = `
        <div style="max-width: 1200px; margin: 30px auto; padding: 30px; border: 1px solid #a2a9b1; border-radius: 4px; background-color: #f8f9fa; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2
            style="margin-top: 0; margin-bottom: 25px; font-size: 1.5em; color: #202122; border-bottom: 2px solid #0645ad; padding-bottom: 10px;">
            Category Batch Manager
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Left Panel: Search and Actions -->
            <div>
                <!-- Search Section -->
                ${Search_SectionHtml}
                <!-- Results Message -->
                <div v-if="showResultsMessage" style="margin-bottom: 20px;">
                    <cdx-message type="success" :inline="false">
                        {{ resultsMessageText }}
                    </cdx-message>
                </div>

                <!-- Actions Section -->
                <div>
                    ${CategoryInputPanelHtml}

                    <div style="margin-bottom: 20px;">
                        <cdx-label input-id="cbm-summary" style="font-weight: 600; margin-bottom: 5px; display: block;">
                            Edit Summary
                        </cdx-label>
                        <cdx-text-input id="cbm-summary" v-model="editSummary" />
                    </div>

                    <div style="margin-bottom: 15px; padding: 10px; background-color: #eaecf0; border-radius: 4px;">
                        Selected: <strong>{{ selectedCount }}</strong> files
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <cdx-button @click="previewChanges" action="default" weight="normal" style="flex: 1;"
                            :disabled="isProcessing">
                            Preview Changes
                        </cdx-button>
                        <cdx-button v-if="!isProcessing" @click="executeOperation" action="progressive" weight="primary"
                            style="flex: 1;">
                            GO
                        </cdx-button>
                        <cdx-button v-if="isProcessing" @click="stopOperation" action="destructive" weight="primary"
                            style="flex: 1;">
                            Stop Process
                        </cdx-button>
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
    <div v-if="showMessage"
        style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 60%; max-width: 600px; z-index: 999;">
        <cdx-message :type="messageType" :fade-in="true" :auto-dismiss="messageType === 'success'" :display-time="3000"
            dismiss-button-label="Close" @dismissed="handleMessageDismiss">
            {{ messageContent }}
        </cdx-message>
    </div>
    `;

    const app = {
        data: function () {
            return {
                mwApi: mwApi, // Reference to API service instance
                files_list: files_list, // Reference to FilesList component instance
                category_inputs: category_inputs, // Reference to CategoryInputs component instance
                sourceCategory: 'Category:Economic Data',
                searchPattern: '',
                addCategories: [],
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
                isProcessing: false,
                shouldStop: false,
                showResultsMessage: false,
                resultsMessageText: '',

                // For multiselect lookup - Add Categories
                addCategoryChips: [],
                addCategoryMenuItems: [],
                addCategoryMenuConfig: {
                    boldLabel: true,
                    visibleItemLimit: 10
                },

                // For multiselect lookup - Remove Categories
                removeCategoryChips: [],
                removeCategoryMenuItems: [],
                removeCategoryMenuConfig: {
                    boldLabel: true,
                    visibleItemLimit: 10
                },

                // Debounce timers
                addCategoryDebounce: null,
                removeCategoryDebounce: null
            };
        },
        computed: {
            selectedCount: function () {
                return this.selectedFiles.filter(f => f.selected).length;
            },
            isSearchValid: function () {
                return this.sourceCategory.trim() !== '';
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

            // should be moved to services/FileService.js
            searchFiles: function () {
                this.resetMessageState();

                if (!this.isSearchValid) {
                    this.showWarningMessage('Please enter a source category.');
                    return;
                }

                this.showProgress = true;
                this.progressText = 'Searching for files...';

                // Placeholder - implement actual search logic
                setTimeout(() => {
                    // Mock results for demonstration
                    this.searchResults = [
                        { title: 'File:GDP-per-capita,BLR.svg', selected: false },
                        { title: 'File:Life-expectancy,BLR.svg', selected: false },
                        { title: 'File:Population,BLR.svg', selected: false },
                        { title: 'File:Unemployment-rate,BLR.svg', selected: false },
                        { title: 'File:Literacy-rate,BLR.svg', selected: false },
                        { title: 'File:Infant-mortality,BLR.svg', selected: false },
                        { title: 'File:CO2-emissions,BLR.svg', selected: false },
                        { title: 'File:Energy-consumption,BLR.svg', selected: false }
                    ];
                    this.selectedFiles = [...this.searchResults];
                    this.showProgress = false;
                    this.showResultsMessage = true;
                    this.resultsMessageText = `Found ${this.searchResults.length} files matching the pattern.`;
                }, 1000);
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
            previewChanges: function () {
                const selectedCount = this.selectedCount;

                if (selectedCount === 0) {
                    this.showWarningMessage('Please select at least one file.');
                    return;
                }

                if (this.addCategories.length === 0 && this.removeCategories.length === 0) {
                    this.showWarningMessage('Please specify categories to add or remove.');
                    return;
                }

                // Placeholder - implement preview logic
                let previewMessage = `Preview for ${selectedCount} file(s):\n`;
                if (this.addCategories.length > 0) {
                    previewMessage += `\nAdding: ${this.addCategories.join(', ')}`;
                }
                if (this.removeCategories.length > 0) {
                    previewMessage += `\nRemoving: ${this.removeCategories.join(', ')}`;
                }

                alert(previewMessage);
            },

            /* *************************
            **      ExecuteHandler
            ** *************************
            */

            // should be moved to class ExecuteHandler` at `src/ui/handlers/ExecuteHandler.js`
            // Execute batch operation
            executeOperation: function () {
                const selectedCount = this.selectedCount;

                if (selectedCount === 0) {
                    this.showWarningMessage('Please select at least one file.');
                    return;
                }

                if (this.addCategories.length === 0 && this.removeCategories.length === 0) {
                    this.showWarningMessage('Please specify categories to add or remove.');
                    return;
                }

                if (!confirm(`Are you sure you want to process ${selectedCount} file(s)?`)) {
                    return;
                }

                this.isProcessing = true;
                this.shouldStop = false;
                this.showProgress = true;

                // Placeholder - implement actual batch processing
                const selectedFilesToProcess = this.selectedFiles.filter(f => f.selected);
                this.processBatch(selectedFilesToProcess, 0);
            },

            // Process files sequentially
            processBatch: function (files, index) {
                if (this.shouldStop || index >= files.length) {
                    this.isProcessing = false;
                    this.showProgress = false;
                    if (!this.shouldStop) {
                        this.showSuccessMessage('Batch operation completed successfully!');
                    } else {
                        this.showWarningMessage('Operation stopped by user.');
                    }
                    return;
                }

                this.progressPercent = ((index + 1) / files.length) * 100;
                this.progressText = `Processing ${index + 1} of ${files.length}...`;

                // Placeholder - implement actual file processing
                setTimeout(() => {
                    console.log('Processing:', files[index].title);
                    this.processBatch(files, index + 1);
                }, 500);
            },

            // Stop ongoing operation
            stopOperation: function () {
                this.shouldStop = true;
            },

            /* *************************
            **      CategoryInputs
            ** *************************
            */

            handleAddCategoryChipChange: function (newChips) {
                return this.category_inputs.handleAddCategoryChipChange(this, newChips);
            },

            onAddCategoryInput: function (value) {
                return this.category_inputs.onAddCategoryInput(this, value);
            },

            onRemoveCategoryInput: function (value) {
                return this.category_inputs.onRemoveCategoryInput(this, value);
            },

            handleRemoveCategoryChipChange: function (newChips) {
                return this.category_inputs.handleRemoveCategoryChipChange(this, newChips);
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

// === vue-src/main.js ===
// <nowiki>

if (typeof categoryBatchManager === 'undefined') {
    var categoryBatchManager = {};
}

mw.loader.using(['@wikimedia/codex', 'mediawiki.api', 'vue']).then(function (require) {
    categoryBatchManager.api = new mw.Api();
    const Vue = require('vue');
    const Codex = require('@wikimedia/codex');

    const app = createCategoryBatchManager(categoryBatchManager.api);

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
        .mount('#category-batch-manager');
});

// </nowiki>
// </nowiki>
