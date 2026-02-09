/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class ExecuteHandler
 */
class ExecuteHandler {
    /**
     */
    constructor(mwApi) {
        this.validator = new ValidationHelper();
        this.categoryService = new CategoryService(mwApi)
        this.batchProcessor = new BatchProcessor(this.categoryService)
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
            <cdx-dialog
                v-model:open="openConfirmDialog"
                title="Confirm Batch Update"
                :use-close-button="true"
                :primary-action="ConfirmPrimaryAction"
                :default-action="ConfirmDefaultAction"
                @primary="ConfirmOnPrimaryAction"
                @default="openConfirmDialog = false"
            >
                    <p>{{ confirmMessage }}</p>

                <template #footer-text>
                </template>
            </cdx-dialog>
            <div v-if="showExecutionProgress" class="cbm-progress-section">
                <div class="cbm-progress-bar-bg">
                    <div class="cbm-progress-bar-fill"
                        :style="{ width: ExecutionProgressPercent + '%' }">
                    </div>
                </div>
                <div class="cbm-progress-text">
                    {{ ExecutionProgressText }}
                </div>
            </div>
        `;
    }

    // Execute batch operation
    executeOperationOld(self) {
        const selectedCount = self.selectedCount;

        if (selectedCount === 0 || !self.selectedFiles || self.selectedFiles.length === 0) {
            self.showWarningMessage('Please select at least one file.');
            return;
        }

        if (self.addCategories.length === 0 && self.removeCategories.length === 0) {
            self.showWarningMessage('Please specify categories to add or remove.');
            return;
        }

        // Filter out circular categories (returns null if ALL are circular)
        const filteredToAdd = this.validator.filterCircularCategories(self);

        if (filteredToAdd === null) return null; // All categories were circular

        // Check if there are any valid operations remaining
        if (filteredToAdd.length === 0 && self.removeCategories.length === 0) {
            console.log('[CBM-V] No valid categories after filtering');
            self.displayCategoryMessage('No valid categories to add or remove.', 'warning', 'add');
            return;
        }

        if (!confirm(`Are you sure you want to process ${selectedCount} file(s)?`)) {
            return;
        }

        self.isProcessing = true;
        self.shouldStopProgress = false;
        self.showExecutionProgress = true;

        // Placeholder - implement actual batch processing
        const selectedFilesToProcess = self.workFiles.filter(f => f.selected);
        self.processBatch(selectedFilesToProcess, 0);
    }

    // Execute batch operation
    executeOperation(self) {
        const selectedCount = self.selectedCount;

        if (selectedCount === 0 || !self.selectedFiles || self.selectedFiles.length === 0) {
            self.showWarningMessage('Please select at least one file.');
            return;
        }

        if (self.addCategories.length === 0 && self.removeCategories.length === 0) {
            self.showWarningMessage('Please specify categories to add or remove.');
            return;
        }

        // Filter out circular categories (returns null if ALL are circular)
        const filteredToAdd = this.validator.filterCircularCategories(self);

        // Check if there are any valid operations remaining
        if (filteredToAdd.length === 0 && self.removeCategories.length === 0) {
            console.log('[CBM-V] No valid categories after filtering');
            self.displayCategoryMessage('No valid categories to add or remove.', 'warning', 'add');
            return;
        }

        // Show confirmation dialog
        self.confirmMessage =
            `You are about to update ${self.selectedFiles.length} file(s).\n\n` +
            `Categories to add: ${filteredToAdd.length > 0 ? filteredToAdd.join(', ') : 'none'}\n` +
            `Categories to remove: ${self.removeCategories.length > 0 ? self.removeCategories.join(', ') : 'none'}\n\n` +
            'Do you want to proceed?';

        // trigger confirm dialog
        self.openConfirmDialog = true;
    }

    ConfirmOnPrimaryAction(self) {
        self.openConfirmDialog = false;
        // eslint-disable-next-line no-console
        console.log('[CBM-E] User confirmed operation');

        self.isProcessing = true;
        self.shouldStopProgress = false;
        self.showExecutionProgress = true;

        // Placeholder - implement actual batch processing
        // const selectedFilesToProcess = self.selectedFiles.filter(f => f.selected);
        self.processBatch(self.selectedFiles, 0);
    }

    // Process files sequentially
    processBatch(self, files, index) {
        if (self.shouldStopProgress || index >= files.length) {
            self.isProcessing = false;
            self.showExecutionProgress = false;
            if (!self.shouldStopProgress) {
                self.showSuccessMessage('Batch operation completed successfully!');
            } else {
                self.showWarningMessage('Operation stopped by user.');
            }
            return;
        }

        self.ExecutionProgressPercent = ((index + 1) / files.length) * 100;
        self.ExecutionProgressText = `Processing ${index + 1} of ${files.length}...`;

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExecuteHandler;
}
