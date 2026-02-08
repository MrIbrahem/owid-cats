/**
 * TODO: use it in the workflow
 * Error recovery system for failed operations
 * @class ErrorRecovery
 */
class ErrorRecovery {
    constructor() {
        this.failedOperations = [];
        this.loadFromStorage();
    }

    /**
     * Record a failed operation
     * @param {Object} operation - The failed operation details
     */
    recordFailure(operation) {
        this.failedOperations.push({
            ...operation,
            timestamp: new Date().toISOString(),
            attemptCount: (operation.attemptCount || 0) + 1
        });

        this.saveToStorage();
    }

    /**
     * TODO: use it in the workflow
     * Retry all failed operations that haven't exceeded max attempts
     * @param {Function} executeOperation - Function to retry an operation
     * @returns {Promise<Object>} Results of retry attempts
     */
    async retryFailed(executeOperation) {
        const toRetry = this.failedOperations.filter(
            op => op.attemptCount < 3
        );

        const results = { retried: 0, succeeded: 0, failed: 0 };

        for (const operation of toRetry) {
            try {
                await executeOperation(operation);
                this.removeFailure(operation);
                results.succeeded++;
            } catch (error) {
                this.recordFailure(operation);
                results.failed++;
            }
            results.retried++;
        }

        return results;
    }

    /**
     * Remove a failure from the list
     * @param {Object} operation - The operation to remove
     */
    removeFailure(operation) {
        const index = this.failedOperations.indexOf(operation);
        if (index > -1) {
            this.failedOperations.splice(index, 1);
            this.saveToStorage();
        }
    }

    /**
     * Save failed operations to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(
                'cbm-failed-operations',
                JSON.stringify(this.failedOperations)
            );
        } catch (e) {
            // localStorage may not be available
        }
    }

    /**
     * Load failed operations from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('cbm-failed-operations');
            if (stored) {
                this.failedOperations = JSON.parse(stored);
            }
        } catch (e) {
            this.failedOperations = [];
        }
    }

    /**
     * TODO: use it in the workflow
     * Clear all failed operations
     */
    clearAll() {
        this.failedOperations = [];
        this.saveToStorage();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRecovery;
}
