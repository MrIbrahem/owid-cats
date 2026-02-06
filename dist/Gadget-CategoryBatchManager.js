/**
 * Gadget-CategoryBatchManager.js
 * Category Batch Manager for Wikimedia Commons
 *
 * @version 1.0.0
 * @license MIT
 * @description A tool for batch categorization of files in Wikimedia Commons.
 *
 * Built from: https://github.com/MrIbrahem/owid-cats
 */

(function () {
'use strict';

// === src/utils/Logger.js ===
/**
 * Logger utility for debugging and monitoring
 * @class Logger
 */
class Logger {
  /**
   * Log a message at the specified level
   * @param {string} message - The message to log
   * @param {string} level - Log level: 'info', 'warn', 'error', 'debug'
   */
  static log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[CategoryBatchManager][${level.toUpperCase()}][${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Log an error with optional error object
   * @param {string} message - The error message
   * @param {Error} error - The error object
   */
  static error(message, error) {
    Logger.log(`${message}: ${error && error.message ? error.message : error}`, 'error');
  }

  /**
   * Log a warning
   * @param {string} message - The warning message
   */
  static warn(message) {
    Logger.log(message, 'warn');
  }
}

// === src/utils/RateLimiter.js ===
/**
 * Rate limiter to prevent API abuse
 * @class RateLimiter
 */
class RateLimiter {
  /**
   * Wait for a specified duration
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Throttle a function call with a delay
   * @param {Function} fn - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise<*>} Result of the function
   */
  static async throttle(fn, delay) {
    await new Promise(resolve => setTimeout(resolve, delay));
    return fn();
  }

  /**
   * Process items in batches with delay between each
   * @param {Array} items - Items to process
   * @param {number} batchSize - Number of items per batch
   * @param {Function} processor - Async function to process each item
   * @returns {Promise<Array>} Results of processing
   */
  static async batch(items, batchSize, processor) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }
    return results;
  }
}

// === src/utils/Validator.js ===
/**
 * Input validation utility
 * @class Validator
 */
class Validator {
  /**
   * Check if a category name is valid
   * @param {string} name - Category name to validate
   * @returns {boolean} True if valid
   */
  static isValidCategoryName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length === 0) return false;
    // Category names must not contain certain characters
    const invalidChars = /[#<>\[\]{|}]/;
    const cleanName = trimmed.replace(/^Category:/i, '');
    return cleanName.length > 0 && !invalidChars.test(cleanName);
  }

  /**
   * Check if a search pattern is valid
   * @param {string} pattern - Search pattern to validate
   * @returns {boolean} True if valid
   */
  static isValidSearchPattern(pattern) {
    if (!pattern || typeof pattern !== 'string') return false;
    return pattern.trim().length > 0;
  }

  /**
   * Sanitize user input to prevent injection
   * @param {string} input - Raw user input
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    return input.trim();
  }
}

// === src/utils/WikitextParser.js ===
/**
 * Parse and modify wikitext for category operations
 * @class WikitextParser
 */
class WikitextParser {
  /**
   * Extract all categories from wikitext
   * @param {string} wikitext - The wikitext content
   * @returns {Array<string>} Array of category names with "Category:" prefix
   */
  extractCategories(wikitext) {
    const categoryRegex = /\[\[Category:([^\]|]+)(?:\|[^\]]*)?\]\]/gi;
    const matches = [];
    let match;

    while ((match = categoryRegex.exec(wikitext)) !== null) {
      matches.push(`Category:${match[1].trim()}`);
    }

    return matches;
  }

  /**
   * Check if category exists in wikitext
   * @param {string} wikitext - The wikitext content
   * @param {string} categoryName - Category name to check (with or without "Category:" prefix)
   * @returns {boolean} True if category exists
   */
  hasCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const regex = new RegExp(
      `\\[\\[Category:${this.escapeRegex(cleanName)}(?:\\|[^\\]]*)?\\]\\]`,
      'i'
    );
    return regex.test(wikitext);
  }

  /**
   * Add a category to wikitext
   * @param {string} wikitext - The wikitext content
   * @param {string} categoryName - Category name to add (with or without "Category:" prefix)
   * @returns {string} Modified wikitext
   */
  addCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const categorySyntax = `[[Category:${cleanName}]]`;

    // Find last category or end of file
    const lastCategoryMatch = wikitext.match(/\[\[Category:[^\]]+\]\]\s*$/);

    if (lastCategoryMatch) {
      // Add after last category
      return wikitext.replace(
        /(\[\[Category:[^\]]+\]\])\s*$/,
        `$1\n${categorySyntax}\n`
      );
    } else {
      // Add at end
      return wikitext.trim() + `\n${categorySyntax}\n`;
    }
  }

  /**
   * Remove a category from wikitext
   * @param {string} wikitext - The wikitext content
   * @param {string} categoryName - Category name to remove (with or without "Category:" prefix)
   * @returns {string} Modified wikitext
   */
  removeCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const regex = new RegExp(
      `\\[\\[Category:${this.escapeRegex(cleanName)}(?:\\|[^\\]]*)?\\]\\]\\s*\\n?`,
      'gi'
    );
    return wikitext.replace(regex, '');
  }

  /**
   * Escape special regex characters in a string
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get the proper wikitext syntax for a category
   * @param {string} categoryName - Category name (with or without "Category:" prefix)
   * @returns {string} Wikitext category syntax
   */
  getCategorySyntax(categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    return `[[Category:${cleanName}]]`;
  }
}

// === src/utils/UsageLogger.js ===
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

// === src/models/FileModel.js ===
/**
 * File model representing a Wikimedia Commons file
 * @class FileModel
 */
class FileModel {
  /**
   * @param {Object} data - File data
   * @param {string} data.title - Full file title (e.g., "File:Example,BLR.svg")
   * @param {number} data.pageid - Unique page ID
   * @param {boolean} [data.selected=true] - Whether file is selected for operation
   * @param {Array<string>} [data.currentCategories=[]] - Current categories
   * @param {string} [data.thumbnail=''] - URL to thumbnail
   * @param {number} [data.size=0] - File size in bytes
   */
  constructor(data) {
    this.title = data.title;
    this.pageid = data.pageid;
    this.selected = data.selected !== undefined ? data.selected : true;
    this.currentCategories = data.currentCategories || [];
    this.thumbnail = data.thumbnail || '';
    this.size = data.size || 0;
  }
}

// === src/models/CategoryOperation.js ===
/**
 * Category operation model
 * @class CategoryOperation
 */
class CategoryOperation {
  /**
   * @param {Object} data - Operation data
   * @param {string} data.sourceCategory - Source category name
   * @param {string} data.searchPattern - Search pattern used
   * @param {Array} [data.files=[]] - Files matched
   * @param {Array<string>} [data.categoriesToAdd=[]] - Categories to add
   * @param {Array<string>} [data.categoriesToRemove=[]] - Categories to remove
   * @param {string} [data.status='idle'] - Operation status
   */
  constructor(data) {
    this.sourceCategory = data.sourceCategory;
    this.searchPattern = data.searchPattern;
    this.files = data.files || [];
    this.categoriesToAdd = data.categoriesToAdd || [];
    this.categoriesToRemove = data.categoriesToRemove || [];
    this.status = data.status || 'idle';
  }
}

// === src/services/APIService.js ===
/**
 * Service for interacting with MediaWiki API
 * @class APIService
 */


class APIService {
  constructor() {
    this.baseURL = 'https://commons.wikimedia.org/w/api.php';
    this.csrfToken = null;
  }

  /**
   * Get CSRF token for editing
   * @returns {Promise<string>} CSRF token
   */
  async getCSRFToken() {
    const params = {
      action: 'query',
      meta: 'tokens',
      type: 'csrf',
      format: 'json'
    };

    const data = await this.makeRequest(params);
    this.csrfToken = data.query.tokens.csrftoken;
    return this.csrfToken;
  }

  /**
   * Fetch files from a category with pagination support
   * @param {string} categoryName - Full category name including "Category:" prefix
   * @param {Object} [options={}] - Query options
   * @param {number} [options.limit=500] - Maximum files to retrieve per request
   * @returns {Promise<Array>} Array of file objects
   */
  async getCategoryMembers(categoryName, options = {}) {
    const allMembers = [];
    let cmcontinue = null;

    do {
      const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: categoryName,
        cmtype: 'file',
        cmlimit: options.limit || 500,
        format: 'json'
      };

      if (cmcontinue) {
        params.cmcontinue = cmcontinue;
      }

      const data = await this.makeRequest(params);
      allMembers.push(...data.query.categorymembers);

      cmcontinue = data.continue ? data.continue.cmcontinue : null;
    } while (cmcontinue);

    return allMembers;
  }

  /**
   * Get file details including categories
   * @param {Array<string>} titles - Array of file titles
   * @returns {Promise<Object>} API response with file info
   */
  async getFileInfo(titles) {
    const params = {
      action: 'query',
      titles: titles.join('|'),
      prop: 'categories|imageinfo',
      cllimit: 500,
      format: 'json'
    };

    return this.makeRequest(params);
  }

  /**
   * Get page content (wikitext)
   * @param {string} title - Page title
   * @returns {Promise<string>} Page wikitext content
   */
  async getPageContent(title) {
    const params = {
      action: 'query',
      titles: title,
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      format: 'json'
    };

    const data = await this.makeRequest(params);
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId].revisions[0].slots.main['*'];
  }

  /**
   * Edit a page
   * @param {string} title - Page title
   * @param {string} content - New page content
   * @param {string} summary - Edit summary
   * @returns {Promise<Object>} API response
   */
  async editPage(title, content, summary) {
    if (!this.csrfToken) {
      await this.getCSRFToken();
    }

    const params = {
      action: 'edit',
      title: title,
      text: content,
      summary: summary,
      token: this.csrfToken,
      format: 'json'
    };

    return this.makePostRequest(params);
  }

  /**
   * Make a GET request to the MediaWiki API
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Parsed JSON response
   */
  async makeRequest(params) {
    params.origin = '*';

    const url = new URL(this.baseURL);
    Object.keys(params).forEach(key =>
      url.searchParams.append(key, params[key])
    );

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.info);
      }

      return data;
    } catch (error) {
      if (typeof Logger !== 'undefined') {
        Logger.error('API request failed', error);
      }
      throw error;
    }
  }

  /**
   * Make a POST request to the MediaWiki API
   * @param {Object} params - POST parameters
   * @returns {Promise<Object>} Parsed JSON response
   */
  async makePostRequest(params) {
    const formData = new FormData();
    Object.keys(params).forEach(key => formData.append(key, params[key]));

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.info);
      }

      return data;
    } catch (error) {
      if (typeof Logger !== 'undefined') {
        Logger.error('API POST request failed', error);
      }
      throw error;
    }
  }
}

// === src/services/FileService.js ===
/**
 * Service for file operations
 * @class FileService
 */


class FileService {
  /**
   * @param {APIService} apiService - API service instance
   */
  constructor(apiService) {
    this.api = apiService;
  }

  /**
   * Search files by pattern within a category
   * @param {string} categoryName - Category to search in
   * @param {string} searchPattern - Pattern to match against file titles
   * @returns {Promise<Array<FileModel>>} Array of matching file models
   */
  async searchFiles(categoryName, searchPattern) {
    // 1. Get all files from category
    const allFiles = await this.api.getCategoryMembers(categoryName);

    // 2. Filter by pattern
    const matchingFiles = allFiles.filter(file =>
      file.title.includes(searchPattern)
    );

    // 3. Get detailed info for matching files
    const filesWithInfo = await this.getFilesDetails(matchingFiles);

    return filesWithInfo;
  }

  /**
   * Get detailed information for a batch of files
   * @param {Array} files - Array of file objects with title property
   * @returns {Promise<Array<FileModel>>} Array of file models with details
   */
  async getFilesDetails(files) {
    if (files.length === 0) return [];

    const batchSize = 50; // API limit
    const batches = this.createBatches(files, batchSize);

    const results = [];
    for (const batch of batches) {
      const titles = batch.map(f => f.title);
      const info = await this.api.getFileInfo(titles);
      results.push(...this.parseFileInfo(info));
    }

    return results;
  }

  /**
   * Split an array into batches
   * @param {Array} array - Array to split
   * @param {number} size - Batch size
   * @returns {Array<Array>} Array of batches
   */
  createBatches(array, size) {
    const batches = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Parse API response into FileModel objects
   * @param {Object} apiResponse - Raw API response
   * @returns {Array<FileModel>} Array of file models
   */
  parseFileInfo(apiResponse) {
    const pages = apiResponse.query.pages;
    const fileModels = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      if (parseInt(pageId) < 0) continue; // Skip missing pages

      const categories = (page.categories || []).map(cat => cat.title);
      const FileModelClass = typeof FileModel !== 'undefined' ? FileModel : function(d) {
        return d;
      };

      fileModels.push(new FileModelClass({
        title: page.title,
        pageid: page.pageid,
        selected: true,
        currentCategories: categories,
        thumbnail: page.imageinfo && page.imageinfo[0] ? page.imageinfo[0].url : '',
        size: page.imageinfo && page.imageinfo[0] ? page.imageinfo[0].size : 0
      }));
    }

    return fileModels;
  }
}

// === src/services/CategoryService.js ===
/**
 * Service for category operations on files
 * @class CategoryService
 */


class CategoryService {
  /**
   * @param {APIService} apiService - API service instance
   */
  constructor(apiService) {
    this.api = apiService;
    this.parser = typeof WikitextParser !== 'undefined' ? new WikitextParser() : null;
  }

  /**
   * Add categories to a file
   * @param {string} fileTitle - File page title
   * @param {Array<string>} categoriesToAdd - Categories to add
   * @returns {Promise<{success: boolean, modified: boolean}>}
   */
  async addCategories(fileTitle, categoriesToAdd) {
    const wikitext = await this.api.getPageContent(fileTitle);

    let newWikitext = wikitext;
    for (const category of categoriesToAdd) {
      if (!this.parser.hasCategory(newWikitext, category)) {
        newWikitext = this.parser.addCategory(newWikitext, category);
      }
    }

    if (newWikitext !== wikitext) {
      await this.api.editPage(
        fileTitle,
        newWikitext,
        `Adding categories: ${categoriesToAdd.join(', ')}`
      );
    }

    return { success: true, modified: newWikitext !== wikitext };
  }

  /**
   * Remove categories from a file
   * @param {string} fileTitle - File page title
   * @param {Array<string>} categoriesToRemove - Categories to remove
   * @returns {Promise<{success: boolean, modified: boolean}>}
   */
  async removeCategories(fileTitle, categoriesToRemove) {
    const wikitext = await this.api.getPageContent(fileTitle);

    let newWikitext = wikitext;
    for (const category of categoriesToRemove) {
      newWikitext = this.parser.removeCategory(newWikitext, category);
    }

    if (newWikitext !== wikitext) {
      await this.api.editPage(
        fileTitle,
        newWikitext,
        `Removing categories: ${categoriesToRemove.join(', ')}`
      );
    }

    return { success: true, modified: newWikitext !== wikitext };
  }

  /**
   * Combined add and remove operation
   * @param {string} fileTitle - File page title
   * @param {Array<string>} toAdd - Categories to add
   * @param {Array<string>} toRemove - Categories to remove
   * @returns {Promise<{success: boolean, modified: boolean}>}
   */
  async updateCategories(fileTitle, toAdd, toRemove) {
    const wikitext = await this.api.getPageContent(fileTitle);
    let newWikitext = wikitext;

    // Remove first
    for (const category of toRemove) {
      newWikitext = this.parser.removeCategory(newWikitext, category);
    }

    // Then add
    for (const category of toAdd) {
      if (!this.parser.hasCategory(newWikitext, category)) {
        newWikitext = this.parser.addCategory(newWikitext, category);
      }
    }

    if (newWikitext !== wikitext) {
      const summary = this.buildEditSummary(toAdd, toRemove);
      await this.api.editPage(fileTitle, newWikitext, summary);
    }

    return { success: true, modified: newWikitext !== wikitext };
  }

  /**
   * Build an edit summary from add/remove lists
   * @param {Array<string>} toAdd - Categories added
   * @param {Array<string>} toRemove - Categories removed
   * @returns {string} Edit summary
   */
  buildEditSummary(toAdd, toRemove) {
    const parts = [];
    if (toAdd.length) parts.push(`+${toAdd.join(', ')}`);
    if (toRemove.length) parts.push(`-${toRemove.join(', ')}`);
    return `Batch category update: ${parts.join('; ')} (via Category Batch Manager)`;
  }
}

// === src/services/ErrorRecovery.js ===
/**
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
   * Clear all failed operations
   */
  clearAll() {
    this.failedOperations = [];
    this.saveToStorage();
  }
}

// === src/services/BatchProcessor.js ===
/**
 * Batch processor for handling multiple file operations
 * @class BatchProcessor
 */


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
      onProgress = () => {},
      onFileComplete = () => {},
      onError = () => {}
    } = callbacks;

    const results = {
      total: files.length,
      processed: 0,
      successful: 0,
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
          results.successful++;
          onFileComplete(file, true);
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
   */
  async previewChanges(files, categoriesToAdd, categoriesToRemove) {
    const previews = [];

    for (const file of files) {
      const current = file.currentCategories || [];
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

// === src/ui/components/SearchPanel.js ===
/**
 * Search panel UI component
 * @class SearchPanel
 */
class SearchPanel {
  /**
   * @param {Function} onSearch - Callback when search is triggered
   */
  constructor(onSearch) {
    this.onSearch = onSearch;
  }

  /**
   * Create the search panel HTML element
   * @returns {HTMLElement} The search panel element
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-search';
    div.innerHTML = `
      <label>Search Pattern:</label>
      <input type="text" id="cbm-pattern" placeholder="e.g., ,BLR.svg">
      <button id="cbm-search-btn">Search</button>
    `;
    return div;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    document.getElementById('cbm-search-btn').addEventListener('click', () => {
      const pattern = document.getElementById('cbm-pattern').value.trim();
      this.onSearch(pattern);
    });

    document.getElementById('cbm-pattern').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const pattern = document.getElementById('cbm-pattern').value.trim();
        this.onSearch(pattern);
      }
    });
  }
}

// === src/ui/components/FileList.js ===
/**
 * File list UI component
 * @class FileList
 */
class FileList {
  /**
   * @param {Function} onSelectionChange - Callback when selection changes
   */
  constructor(onSelectionChange) {
    this.onSelectionChange = onSelectionChange;
  }

  /**
   * Render the file list
   * @param {Array} files - Files to display
   */
  render(files) {
    const listContainer = document.getElementById('cbm-file-list');
    const countElement = document.getElementById('cbm-count');
    const headerElement = document.getElementById('cbm-results-header');

    if (files.length === 0) {
      listContainer.innerHTML = '<p>No files found matching the pattern.</p>';
      headerElement.classList.add('hidden');
      return;
    }

    countElement.textContent = files.length;
    headerElement.classList.remove('hidden');

    listContainer.innerHTML = '';

    files.forEach((file, index) => {
      const fileRow = document.createElement('div');
      fileRow.className = 'cbm-file-row';
      fileRow.dataset.index = index;

      fileRow.innerHTML = `
        <input type="checkbox" class="cbm-file-checkbox" 
               id="file-${index}" checked>
        <label for="file-${index}">${file.title}</label>
        <button class="cbm-remove-btn" data-index="${index}">&#215;</button>
      `;

      listContainer.appendChild(fileRow);
    });
  }

  /**
   * Get count of selected files
   * @returns {number} Number of selected files
   */
  getSelectedCount() {
    return document.querySelectorAll('.cbm-file-checkbox:checked').length;
  }
}

// === src/ui/components/CategoryInputs.js ===
/**
 * Category inputs UI component
 * @class CategoryInputs
 */
class CategoryInputs {
  /**
   * Create the category inputs HTML element
   * @returns {HTMLElement} The inputs element
   */
  createElement() {
    const div = document.createElement('div');
    div.className = 'cbm-actions';
    div.innerHTML = `
      <div class="cbm-input-group">
        <label>Add Categories (comma-separated):</label>
        <input type="text" id="cbm-add-cats" placeholder="Category:Example">
      </div>
      
      <div class="cbm-input-group">
        <label>Remove Categories (comma-separated):</label>
        <input type="text" id="cbm-remove-cats" placeholder="Category:Old">
      </div>
      
      <div class="cbm-input-group">
        <label>Edit Summary:</label>
        <input type="text" id="cbm-summary" 
               value="Batch category update via Category Batch Manager">
      </div>
    `;
    return div;
  }

  /**
   * Get categories to add
   * @returns {Array<string>} Parsed category names
   */
  getCategoriesToAdd() {
    const input = document.getElementById('cbm-add-cats').value;
    return this.parseCategories(input);
  }

  /**
   * Get categories to remove
   * @returns {Array<string>} Parsed category names
   */
  getCategoriesToRemove() {
    const input = document.getElementById('cbm-remove-cats').value;
    return this.parseCategories(input);
  }

  /**
   * Parse comma-separated category input
   * @param {string} input - Raw input string
   * @returns {Array<string>} Array of category names with "Category:" prefix
   */
  parseCategories(input) {
    return input
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
      .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
  }
}

// === src/ui/components/ProgressBar.js ===
/**
 * Progress bar UI component
 * @class ProgressBar
 */
class ProgressBar {
  /**
   * Show the progress bar
   */
  show() {
    const el = document.getElementById('cbm-progress');
    if (el) el.classList.remove('hidden');
  }

  /**
   * Hide the progress bar
   */
  hide() {
    const el = document.getElementById('cbm-progress');
    if (el) el.classList.add('hidden');
  }

  /**
   * Update the progress bar
   * @param {number} percentage - Progress percentage (0-100)
   * @param {Object} results - Current results
   */
  update(percentage, results) {
    const fill = document.getElementById('cbm-progress-fill');
    const text = document.getElementById('cbm-progress-text');

    if (fill) fill.style.width = `${percentage}%`;
    if (text) {
      text.textContent =
        `Processing: ${results.processed}/${results.total} ` +
        `(${results.successful} successful, ${results.failed} failed)`;
    }
  }
}

// === src/main.js ===
/**
 * Category Batch Manager for Wikimedia Commons
 *
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * A tool for batch categorization of files in Wikimedia Commons.
 * Allows filtering files by pattern and applying category changes
 * to multiple files at once.
 */


class CategoryBatchManagerUI {
  constructor() {
    this.apiService = new APIService();
    this.fileService = new FileService(this.apiService);
    this.categoryService = new CategoryService(this.apiService);
    this.batchProcessor = new BatchProcessor(this.categoryService);

    this.state = {
      sourceCategory: 'Category:Uploaded_by_OWID_importer_tool',
      searchPattern: '',
      files: [],
      selectedFiles: [],
      categoriesToAdd: [],
      categoriesToRemove: [],
      isProcessing: false
    };

    this.init();
  }

  init() {
    this.createUI();
    this.attachEventListeners();
  }

  createUI() {
    const container = this.buildContainer();
    document.body.appendChild(container);
  }

  buildContainer() {
    const div = document.createElement('div');
    div.id = 'category-batch-manager';
    div.className = 'cbm-container';

    div.innerHTML = `
      <div class="cbm-header">
        <h2>Category Batch Manager</h2>
        <button class="cbm-close" id="cbm-close">&times;</button>
      </div>
      
      <div class="cbm-search">
        <label>Search Pattern:</label>
        <input type="text" id="cbm-pattern" placeholder="e.g., ,BLR.svg">
        <button id="cbm-search-btn">Search</button>
      </div>
      
      <div class="cbm-results">
        <div id="cbm-results-header" class="hidden">
          Found <span id="cbm-count">0</span> files
          <button id="cbm-select-all">Select All</button>
          <button id="cbm-deselect-all">Deselect All</button>
        </div>
        <div id="cbm-file-list"></div>
      </div>
      
      <div class="cbm-actions">
        <div class="cbm-input-group">
          <label>Add Categories (comma-separated):</label>
          <input type="text" id="cbm-add-cats" placeholder="Category:Example">
        </div>
        
        <div class="cbm-input-group">
          <label>Remove Categories (comma-separated):</label>
          <input type="text" id="cbm-remove-cats" placeholder="Category:Old">
        </div>
        
        <div class="cbm-input-group">
          <label>Edit Summary:</label>
          <input type="text" id="cbm-summary" 
                 value="Batch category update via Category Batch Manager">
        </div>
        
        <div class="cbm-selected-count">
          Selected: <span id="cbm-selected">0</span> files
        </div>
        
        <div class="cbm-buttons">
          <button id="cbm-preview" class="cbm-btn-secondary">Preview Changes</button>
          <button id="cbm-execute" class="cbm-btn-primary">GO</button>
        </div>
      </div>
      
      <div id="cbm-progress" class="cbm-progress hidden">
        <div class="cbm-progress-bar">
          <div id="cbm-progress-fill" style="width: 0%"></div>
        </div>
        <div id="cbm-progress-text">Processing...</div>
      </div>
      
      <div id="cbm-preview-modal" class="cbm-modal hidden">
        <div class="cbm-modal-content">
          <h3>Preview Changes</h3>
          <div id="cbm-preview-content"></div>
          <button id="cbm-preview-close">Close</button>
        </div>
      </div>
    `;

    return div;
  }

  attachEventListeners() {
    document.getElementById('cbm-search-btn').addEventListener('click', () => {
      this.handleSearch();
    });

    document.getElementById('cbm-select-all').addEventListener('click', () => {
      this.selectAll();
    });

    document.getElementById('cbm-deselect-all').addEventListener('click', () => {
      this.deselectAll();
    });

    document.getElementById('cbm-preview').addEventListener('click', () => {
      this.handlePreview();
    });

    document.getElementById('cbm-execute').addEventListener('click', () => {
      this.handleExecute();
    });

    document.getElementById('cbm-close').addEventListener('click', () => {
      this.close();
    });
  }

  async handleSearch() {
    const pattern = document.getElementById('cbm-pattern').value.trim();

    if (!pattern) {
      alert('Please enter a search pattern');
      return;
    }

    this.showLoading();

    try {
      const files = await this.fileService.searchFiles(
        this.state.sourceCategory,
        pattern
      );

      this.state.files = files;
      this.state.searchPattern = pattern;
      this.renderFileList();
      this.hideLoading();

      UsageLogger.logSearch(pattern, files.length);

    } catch (error) {
      this.hideLoading();
      alert(`Error searching files: ${error.message}`);
    }
  }

  renderFileList() {
    const listContainer = document.getElementById('cbm-file-list');
    const countElement = document.getElementById('cbm-count');
    const headerElement = document.getElementById('cbm-results-header');

    if (this.state.files.length === 0) {
      listContainer.innerHTML = '<p>No files found matching the pattern.</p>';
      headerElement.classList.add('hidden');
      return;
    }

    countElement.textContent = this.state.files.length;
    headerElement.classList.remove('hidden');

    listContainer.innerHTML = '';

    this.state.files.forEach((file, index) => {
      const fileRow = document.createElement('div');
      fileRow.className = 'cbm-file-row';
      fileRow.dataset.index = index;

      fileRow.innerHTML = `
        <input type="checkbox" class="cbm-file-checkbox" 
               id="file-${index}" checked>
        <label for="file-${index}">${file.title}</label>
        <button class="cbm-remove-btn" data-index="${index}">&times;</button>
      `;

      listContainer.appendChild(fileRow);
    });

    // Attach remove button listeners
    document.querySelectorAll('.cbm-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeFile(index);
      });
    });

    // Attach checkbox listeners
    document.querySelectorAll('.cbm-file-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedCount();
      });
    });

    this.updateSelectedCount();
  }

  removeFile(index) {
    this.state.files.splice(index, 1);
    this.renderFileList();
  }

  selectAll() {
    document.querySelectorAll('.cbm-file-checkbox').forEach(cb => {
      cb.checked = true;
    });
    this.updateSelectedCount();
  }

  deselectAll() {
    document.querySelectorAll('.cbm-file-checkbox').forEach(cb => {
      cb.checked = false;
    });
    this.updateSelectedCount();
  }

  updateSelectedCount() {
    const selected = document.querySelectorAll('.cbm-file-checkbox:checked').length;
    document.getElementById('cbm-selected').textContent = selected;
  }

  getSelectedFiles() {
    const selected = [];
    document.querySelectorAll('.cbm-file-checkbox:checked').forEach(cb => {
      const index = parseInt(cb.id.replace('file-', ''));
      if (this.state.files[index]) {
        selected.push(this.state.files[index]);
      }
    });
    return selected;
  }

  parseCategories(input) {
    return input
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
      .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
  }

  async handlePreview() {
    const selectedFiles = this.getSelectedFiles();

    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }

    const toAdd = this.parseCategories(
      document.getElementById('cbm-add-cats').value
    );
    const toRemove = this.parseCategories(
      document.getElementById('cbm-remove-cats').value
    );

    this.showLoading();

    try {
      const preview = await this.batchProcessor.previewChanges(
        selectedFiles,
        toAdd,
        toRemove
      );

      this.showPreviewModal(preview);
      this.hideLoading();

    } catch (error) {
      this.hideLoading();
      alert(`Error generating preview: ${error.message}`);
    }
  }

  showPreviewModal(preview) {
    const modal = document.getElementById('cbm-preview-modal');
    const content = document.getElementById('cbm-preview-content');

    let html = '<table class="cbm-preview-table">';
    html += '<tr><th>File</th><th>Current Categories</th><th>New Categories</th></tr>';

    preview.forEach(item => {
      if (item.willChange) {
        html += `
          <tr>
            <td>${item.file}</td>
            <td>${item.currentCategories.join('<br>')}</td>
            <td>${item.newCategories.join('<br>')}</td>
          </tr>
        `;
      }
    });

    html += '</table>';

    const changesCount = preview.filter(p => p.willChange).length;
    html = `<p>${changesCount} files will be modified</p>` + html;

    content.innerHTML = html;
    modal.classList.remove('hidden');

    document.getElementById('cbm-preview-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  async handleExecute() {
    const selectedFiles = this.getSelectedFiles();

    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }

    const toAdd = this.parseCategories(
      document.getElementById('cbm-add-cats').value
    );
    const toRemove = this.parseCategories(
      document.getElementById('cbm-remove-cats').value
    );

    if (toAdd.length === 0 && toRemove.length === 0) {
      alert('Please specify categories to add or remove');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to update ${selectedFiles.length} files?\n` +
      `Add: ${toAdd.join(', ') || 'none'}\n` +
      `Remove: ${toRemove.join(', ') || 'none'}`
    );

    if (!confirmed) return;

    this.state.isProcessing = true;
    this.showProgress();

    try {
      const results = await this.batchProcessor.processBatch(
        selectedFiles,
        toAdd,
        toRemove,
        {
          onProgress: (progress, results) => {
            this.updateProgress(progress, results);
          },
          onFileComplete: (file, success) => {
            console.log(`${file.title}: ${success ? 'success' : 'failed'}`);
          },
          onError: (file, error) => {
            console.error(`Error processing ${file.title}:`, error);
          }
        }
      );

      UsageLogger.logBatchOperation(selectedFiles.length, toAdd, toRemove);
      this.showResults(results);

    } catch (error) {
      alert(`Batch process failed: ${error.message}`);
    } finally {
      this.state.isProcessing = false;
      this.hideProgress();
    }
  }

  showProgress() {
    document.getElementById('cbm-progress').classList.remove('hidden');
    document.getElementById('cbm-execute').disabled = true;
  }

  hideProgress() {
    document.getElementById('cbm-progress').classList.add('hidden');
    document.getElementById('cbm-execute').disabled = false;
  }

  updateProgress(percentage, results) {
    document.getElementById('cbm-progress-fill').style.width = `${percentage}%`;
    document.getElementById('cbm-progress-text').textContent =
      `Processing: ${results.processed}/${results.total} (${results.successful} successful, ${results.failed} failed)`;
  }

  showResults(results) {
    let message = `Batch process complete!\n\n`;
    message += `Total: ${results.total}\n`;
    message += `Successful: ${results.successful}\n`;
    message += `Failed: ${results.failed}\n`;

    if (results.errors.length > 0) {
      message += `\nErrors:\n`;
      results.errors.forEach(err => {
        message += `- ${err.file}: ${err.error}\n`;
      });
    }

    alert(message);
  }

  showLoading() {
    // Could add a loading spinner overlay
  }

  hideLoading() {
    // Remove loading spinner
  }

  close() {
    const el = document.getElementById('category-batch-manager');
    if (el) el.remove();
  }
}

// === src/gadget-entry.js ===
/**
 * Gadget entry point for Category Batch Manager
 *
 * Adds a "Batch Manager" button to category pages in Wikimedia Commons.
 * When clicked, opens the Category Batch Manager UI.
 */


(function () {
  'use strict';

  /**
   * Add the Batch Manager tool button to the page actions menu
   */
  function addToolButton() {
    // Check if we're on a category page
    var isCategoryPage = mw.config.get('wgCanonicalNamespace') === 'Category';

    if (!isCategoryPage) return;

    // Add button to page
    var portletLink = mw.util.addPortletLink(
      'p-cactions',
      '#',
      'Batch Manager',
      'ca-batch-manager',
      'Open Category Batch Manager'
    );

    portletLink.addEventListener('click', function (e) {
      e.preventDefault();

      // Initialize and show UI
      if (!window.categoryBatchManager) {
        window.categoryBatchManager = new CategoryBatchManagerUI();
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addToolButton);
  } else {
    addToolButton();
  }

})();
