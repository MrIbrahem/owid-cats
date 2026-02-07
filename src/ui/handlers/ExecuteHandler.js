/**
 * Execute Handler
 *
 * @description
 * Handles all execute-related functionality for CategoryBatchManagerUI.
 * Manages batch execution, progress display, and result reporting.
 *
 * @requires Validator - For checking circular category references
 * @requires UsageLogger - For logging batch operations
 */

/* global Validator, UsageLogger */

class ExecuteHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
    }

    /**
     * Handle execute (GO) button click
     * Validates input, shows confirmation, and executes the batch operation
     */
    async handleExecute() {
        console.log('[CBM-E] GO button clicked');
        const selectedFiles = this.ui.getSelectedFiles();
        console.log('[CBM-E] Selected files:', selectedFiles);
        if (selectedFiles.length === 0) {
            console.log('[CBM-E] No files selected');
            this.ui.showMessage('No files selected.', 'warning');
            return;
        }

        const toAdd = this.ui.parseCategories(
            document.getElementById('cbm-add-cats').value
        );
        const toRemove = this.ui.parseCategories(
            document.getElementById('cbm-remove-cats').value
        );
        console.log('[CBM-E] Categories to add:', toAdd);
        console.log('[CBM-E] Categories to remove:', toRemove);

        if (toAdd.length === 0 && toRemove.length === 0) {
            console.log('[CBM-E] No categories specified');
            this.ui.showMessage('Please specify categories to add or remove.', 'warning');
            return;
        }

        // Check for circular category reference
        const sourceCategory = this.ui.state.sourceCategory;
        for (const category of toAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                console.log('[CBM-E] Circular category detected:', category);
                this.ui.showMessage(
                    `⚠️ Cannot add category "${category}" to itself. You are trying to add a category to the same category page you're working in.`,
                    'error'
                );
                return;
            }
        }

        // Check for duplicate categories before execution
        try {
            console.log('[CBM-E] Calling batchProcessor.previewChanges (pre-execute validation)');
            await this.ui.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );
        } catch (error) {
            console.log('[CBM-E] Error in previewChanges (pre-execute):', error);
            if (error.message.includes('already exist')) {
                this.ui.showMessage(`❌ Cannot proceed: ${error.message}`, 'error');
            } else {
                this.ui.showMessage(`Error: ${error.message}`, 'error');
            }
            return;
        }

        // Show confirmation dialog
        const confirmMsg =
            `You are about to update ${selectedFiles.length} file(s).\n\n` +
            `Categories to add: ${toAdd.length > 0 ? toAdd.join(', ') : 'none'}\n` +
            `Categories to remove: ${toRemove.length > 0 ? toRemove.join(', ') : 'none'}\n\n` +
            'Do you want to proceed?';

        console.log('[CBM-E] Showing confirmation dialog');
        const confirmed = await this.ui.showConfirmDialog(confirmMsg, {
            title: 'Confirm Batch Update',
            confirmLabel: 'Proceed',
            cancelLabel: 'Cancel'
        });
        console.log('[CBM-E] Confirmation dialog result:', confirmed);

        if (!confirmed) {
            console.log('[CBM-E] User cancelled batch operation');
            return;
        }

        this.ui.state.isProcessing = true;
        this.ui.state.processAbortController = new AbortController();

        // إخفاء أزرار Preview و GO وإظهار زر الإيقاف
        this.toggleProcessButtons(true);
        this.showProgress();

        try {
            console.log('[CBM-E] Calling batchProcessor.processBatch');
            const results = await this.ui.batchProcessor.processBatch(
                selectedFiles,
                toAdd,
                toRemove,
                {
                    signal: this.ui.state.processAbortController.signal,
                    onProgress: (progress, results) => {
                        console.log('[CBM-E] Progress:', progress, results);
                        this.updateProgress(progress, results);
                    },
                    onFileComplete: (file, success) => {
                        console.log(`[CBM-E] File complete: ${file.title}: ${success ? 'success' : 'failed'}`);
                    },
                    onError: (file, error) => {
                        console.error(`[CBM-E] Error processing ${file.title}:`, error);
                    }
                }
            );

            console.log('[CBM-E] Batch operation results:', results);
            UsageLogger.logBatchOperation(selectedFiles.length, toAdd, toRemove);
            this.showResults(results);

        } catch (error) {
            console.log('[CBM-E] Error in processBatch:', error);
            if (error.name === 'AbortError') {
                this.ui.showMessage('Batch process cancelled by user.', 'warning');
            } else {
                this.ui.showMessage(`Batch process failed: ${error.message}`, 'error');
            }
        } finally {
            this.ui.state.isProcessing = false;
            this.hideProgress();
            this.toggleProcessButtons(false);
        }
    }

    /**
     * Stop the current batch process
     */
    stopProcess() {
        if (this.ui.state.processAbortController) {
            this.ui.state.processAbortController.abort();
            this.ui.state.processAbortController = null;
        }
    }

    /**
     * Toggle button visibility based on processing state
     * @param {boolean} isProcessing - Whether processing is in progress
     */
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
    }

    /**
     * Show the progress bar
     */
    showProgress() {
        document.getElementById('cbm-progress').classList.remove('hidden');
    }

    /**
     * Hide the progress bar
     */
    hideProgress() {
        document.getElementById('cbm-progress').classList.add('hidden');
    }

    /**
     * Update the progress bar and status text
     * @param {number} percentage - Progress percentage (0-100)
     * @param {Object} results - Current results object
     */
    updateProgress(percentage, results) {
        document.getElementById('cbm-progress-fill').style.width = `${percentage}%`;
        document.getElementById('cbm-progress-text').textContent =
            `Processing: ${results.processed}/${results.total} (${results.successful} successful, ${results.skipped || 0} skipped, ${results.failed} failed)`;
    }

    /**
     * Show the final results of the batch operation
     * @param {Object} results - Results object with total, successful, skipped, failed, errors
     */
    showResults(results) {
        const messageContainer = document.getElementById('cbm-results-message');
        if (!messageContainer) {
            console.error('[CBM-E] Message container not found');
            return;
        }

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
        messageContainer.classList.remove('hidden');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExecuteHandler;
}
