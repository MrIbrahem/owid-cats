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

module.exports = {
    FilesList
};
