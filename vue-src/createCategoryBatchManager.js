/**
 * Creates the Vue app definition for the Category Batch Manager tool.
 * @param {mw.Api} api - An instance of the MediaWiki API for making requests.
 * @returns {Object} Vue app definition object.
 */
/* global SearchPanel */

function createCategoryBatchManager(api) {
    const search_panel = new SearchPanel();
    const category_inputs = new CategoryInputs(api);
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

    const fileSelectionComputed = {
        selectedCount: function () {
            return this.selectedFiles.filter(f => f.selected).length;
        },
        isSearchValid: function () {
            return this.sourceCategory.trim() !== '';
        },
        totalFilesCount: function () {
            return this.selectedFiles.length;
        }
    };
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
                selectedFiles: this.selectedFiles, // Bind to FilesList component's selectedFiles
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
        computed: fileSelectionComputed,
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
                return this.files_list.selectAll(this.selectedFiles);
            },

            // Deselect all files
            deselectAll: function () {
                return this.files_list.deselectAll(this.selectedFiles);
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
        template: template
    };
    return app;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = createCategoryBatchManager;
}
