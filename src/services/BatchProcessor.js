/**
 * Batch processor for handling multiple file operations
 * @class BatchProcessor
 */

/* global RateLimiter */

class BatchProcessor {
  /**
   * @param {CategoryService} categoryService - Category service instance
   */
  constructor(categoryService) {
    this.categoryService = categoryService;
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Process a batch of files with category updates
   * @param {Array} files - Files to process
   * @param {Array<string>} categoriesToAdd - Categories to add
   * @param {Array<string>} categoriesToRemove - Categories to remove
   * @param {Object} [callbacks={}] - Callback functions
   * @param {Function} [callbacks.onProgress] - Progress callback (percentage, results)
   * @param {Function} [callbacks.onFileComplete] - File complete callback (file, success)
   * @param {Function} [callbacks.onError] - Error callback (file, error)
   * @returns {Promise<Object>} Results with total, processed, successful, failed, errors
   */
  async processBatch(files, categoriesToAdd, categoriesToRemove, callbacks = {}) {
    const {
      onProgress = () => { },
      onFileComplete = () => { },
      onError = () => { }
    } = callbacks; const results = {
      total: files.length,
      processed: 0,
      successful: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    // Process files sequentially with throttling
    for (const file of files) {
      try {
        // Wait to respect rate limits (1 edit per 2 seconds)
        await this.rateLimiter.wait(2000);

        // Update categories
        const result = await this.categoryService.updateCategories(
          file.title,
          categoriesToAdd,
          categoriesToRemove
        );

        results.processed++;
        if (result.success) {
          if (result.modified) {
            results.successful++;
            onFileComplete(file, true);
          } else {
            results.skipped++;
            onFileComplete(file, false);
          }
        }

        // Update progress
        const progress = (results.processed / results.total) * 100;
        onProgress(progress, results);

      } catch (error) {
        results.processed++;
        results.failed++;
        results.errors.push({
          file: file.title,
          error: error.message
        });

        onError(file, error);
        onProgress((results.processed / results.total) * 100, results);
      }
    }

    return results;
  }
  /**
   * Preview changes without actually editing
   * @param {Array} files - Files to preview
   * @param {Array<string>} categoriesToAdd - Categories to add
   * @param {Array<string>} categoriesToRemove - Categories to remove
   * @returns {Promise<Array>} Preview of changes
   */  async previewChanges(files, categoriesToAdd, categoriesToRemove) {
    const previews = [];

    for (const file of files) {
      const current = file.currentCategories || [];

      // Check if trying to add categories that already exist (only if we're adding categories)
      if (categoriesToAdd.length > 0) {
        const duplicateCategories = categoriesToAdd.filter(cat => current.includes(cat));
        if (duplicateCategories.length > 0) {
          throw new Error(`The following categories already exist and cannot be added: ${duplicateCategories.join(', ')}`);
        }
      }

      const after = [...current];

      // Simulate removal
      categoriesToRemove.forEach(cat => {
        const index = after.indexOf(cat);
        if (index > -1) after.splice(index, 1);
      });

      // Simulate addition
      categoriesToAdd.forEach(cat => {
        if (!after.includes(cat)) after.push(cat);
      });

      previews.push({
        file: file.title,
        currentCategories: current,
        newCategories: after,
        willChange: JSON.stringify(current) !== JSON.stringify(after)
      });
    }

    return previews;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatchProcessor;
}
