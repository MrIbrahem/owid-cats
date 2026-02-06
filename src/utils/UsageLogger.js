/**
 * Usage logger for monitoring and analytics
 * @class UsageLogger
 */
class UsageLogger {
  /**
   * Log a search operation
   * @param {string} pattern - Search pattern used
   * @param {number} resultsCount - Number of results found
   */
  static logSearch(pattern, resultsCount) {
    console.log(`[CBM] Search: "${pattern}" - ${resultsCount} results`);
  }

  /**
   * Log a batch operation
   * @param {number} filesCount - Number of files processed
   * @param {Array<string>} categoriesAdded - Categories that were added
   * @param {Array<string>} categoriesRemoved - Categories that were removed
   */
  static logBatchOperation(filesCount, categoriesAdded, categoriesRemoved) {
    console.log(
      `[CBM] Batch: ${filesCount} files, ` +
      `+${categoriesAdded.length} -${categoriesRemoved.length} categories`
    );
  }

  /**
   * Log an error
   * @param {string} context - Where the error occurred
   * @param {Error} error - The error object
   */
  static logError(context, error) {
    console.error(`[CBM] Error in ${context}:`, error);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   */
  static logPerformance(operation, duration) {
    console.log(`[CBM] Performance: ${operation} took ${duration}ms`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UsageLogger;
}
