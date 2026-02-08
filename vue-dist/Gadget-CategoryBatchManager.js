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
     * @param {mw.Api} apiService - API service for category search
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
     * Attach event listeners for category inputs including autocomplete
     */
    attachListeners() {
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
    selectAll() {
        this.selectedFiles.forEach(file => {
            file.selected = true;
        });
    }

    // Deselect all files
    deselectAll() {
        this.selectedFiles.forEach(file => {
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
    const search_panel = new SearchPanel();
    const category_inputs = new CategoryInputs(api);
    const files_list = new FilesList();
    const progress_section = new ProgressSection();

    const Search_SectionHtml = search_panel.createElement();
    const CategoryInputPanelHtml = category_inputs.createElement();
    const FilesListHtml = files_list.createElement();
    const ProgressSectionHtml = progress_section.createElement();

    const app = {
        data: function () {
            return {
                sourceCategory: 'Category:Economic Data',
                searchPattern: '',
                addCategories: [],
                removeCategories: [],
                editSummary: 'Batch category update via Category Batch Manager',
                searchResults: [],
                // selectedFiles: [],
                selectedFiles: this.files_list.selectedFiles, // Bind to FilesList component's selectedFiles
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

            // Select all files
            selectAll: function () {
                return this.files_list.selectAll();
            },

            // Deselect all files
            deselectAll: function () {
                return this.files_list.deselectAll();
            },

            // Remove individual file from list
            removeFile: function (index) {
                this.selectedFiles.splice(index, 1);
                if (this.selectedFiles.length === 0) {
                    this.showResultsMessage = false;
                }
            },

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

            // Fetch categories from API with autocomplete
            fetchCategories: function (searchTerm) {
                if (!searchTerm || searchTerm.length < 2) {
                    return Promise.resolve([]);
                }

                return api.get({
                    action: 'opensearch',
                    search: searchTerm,
                    namespace: 14, // Category namespace
                    limit: 10
                }).then(function (data) {
                    // data[1] contains the category titles
                    if (data && data[1]) {
                        return data[1].map(function (title) {
                            return {
                                value: title,
                                label: title
                            };
                        });
                    }
                    return [];
                }).catch(function (error) {
                    console.error('Error fetching categories:', error);
                    return [];
                });
            },

            // Handle add category input with debounce
            onAddCategoryInput: function (value) {
                // Clear previous timeout
                if (this.addCategoryDebounce) {
                    clearTimeout(this.addCategoryDebounce);
                }

                // If empty, clear menu items
                if (!value || value.trim().length < 2) {
                    this.addCategoryMenuItems = [];
                    return;
                }

                // Debounce API call
                this.addCategoryDebounce = setTimeout(() => {
                    this.fetchCategories(value).then((items) => {
                        this.addCategoryMenuItems = items;
                    });
                }, 300); // 300ms debounce
            },

            // Handle remove category input with debounce
            onRemoveCategoryInput: function (value) {
                // Clear previous timeout
                if (this.removeCategoryDebounce) {
                    clearTimeout(this.removeCategoryDebounce);
                }

                // If empty, clear menu items
                if (!value || value.trim().length < 2) {
                    this.removeCategoryMenuItems = [];
                    return;
                }

                // Debounce API call
                this.removeCategoryDebounce = setTimeout(() => {
                    this.fetchCategories(value).then((items) => {
                        this.removeCategoryMenuItems = items;
                    });
                }, 300); // 300ms debounce
            },

            // Handle chip changes for add categories
            handleAddCategoryChipChange: function (newChips) {
                this.addCategoryChips = newChips;
                this.addCategories = newChips.map(chip => chip.value);
            },

            // Handle chip changes for remove categories
            handleRemoveCategoryChipChange: function (newChips) {
                this.removeCategoryChips = newChips;
                this.removeCategories = newChips.map(chip => chip.value);
            },

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
        template: `
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
        `
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
