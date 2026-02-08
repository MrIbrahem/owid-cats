/**
 * Creates the Vue app definition for the Category Batch Manager tool.
 * @param {mw.Api} api - An instance of the MediaWiki API for making requests.
 * @returns {Object} Vue app definition object.
 */
/* global APIService, SearchPanel, CategoryInputs, FilesList, ProgressSection */

function BatchManager(api) {
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
        <div class="cbm-container">
        <h2 class="cbm-title">
            Category Batch Manager
        </h2>

        <div class="cbm-grid">
            <!-- Left Panel: Search and Actions -->
            <div>
                <!-- Search Section -->
                ${Search_SectionHtml}
                <!-- Results Message -->
                <div v-if="showResultsMessage" class="margin-bottom-20">
                    <cdx-message type="success" :inline="false">
                        {{ resultsMessageText }}
                    </cdx-message>
                </div>

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
                        <cdx-button @click="previewChanges" action="default" weight="normal"
                            :disabled="isProcessing">
                            Preview Changes
                        </cdx-button>
                        <cdx-button v-if="!isProcessing" @click="executeOperation" action="progressive" weight="primary">
                            GO
                        </cdx-button>
                        <cdx-button v-if="isProcessing" @click="stopOperation" action="destructive" weight="primary">
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
                mwApi: mwApi, // Reference to API service instance
                files_list: files_list, // Reference to FilesList component instance
                category_inputs: category_inputs, // Reference to CategoryInputs component instance
                sourceCategory: 'Category:Our World in Data graphs of Austria',
                searchPattern: '1990',
                addCategories: [],
                addInputValue: '',
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
                addCategoryMenuItems: [
                    { value: 'Category:Economics', label: 'Category:Economics' },
                    { value: 'Category:Science', label: 'Category:Science' }
                ],
                addCategoryMenuConfig: {
                    boldLabel: true,
                    visibleItemLimit: 10
                },

                // For multiselect lookup - Remove Categories
                removeCategoryChips: [],
                removeCategoryMenuItems: [
                    { value: 'Category:Politics', label: 'Category:Politics' }
                ],
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

            onUpdateInputValue: function (newChips) {
                return this.category_inputs.onUpdateInputValue(this, newChips);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BatchManager;
}
