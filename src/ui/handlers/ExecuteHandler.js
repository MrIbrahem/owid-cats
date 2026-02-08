/**
 * Execute Handler
 *
 * @description
 * Handles all execute-related functionality for BatchManager.
 * Manages batch execution, progress display, and result reporting.
 *
 * @requires ValidationHelper - For common validation logic
 * @requires UsageLogger - For logging batch operations
 * @requires ProgressBar - For progress display
 */

/* global ValidationHelper, UsageLogger, ProgressBar */

class ExecuteHandler {
    /**
     * @param {BatchManager} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
        this.validator = new ValidationHelper(ui);
        this.progressBar = new ProgressBar();
    }

    /**
     * Handle execute (GO) button click
     * Validates input, shows confirmation, and executes the batch operation
     */
    async handleExecute() {
        console.log('[CBM-E] GO button clicked');

        // Use ValidationHelper for common validation
        const validation = this.validator.validateBatchOperation();
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

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
        this.progressBar.show();

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
                        this.progressBar.update(progress, results);
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
            this.progressBar.hide();
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
     * Show the final results of the batch operation
     * @param {Object} results - Results object with total, successful, skipped, failed, errors
     */
    showResults(results) {
        const messageContainer = document.getElementById('cbm-results-message');
        if (!messageContainer) {
            console.error('[CBM] Message container not found');
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
