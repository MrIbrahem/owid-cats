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

  /**
   * Normalize category name for comparison (remove prefix, convert underscores to spaces)
   * @param {string} categoryName - Category name to normalize
   * @returns {string} Normalized category name
   */
  static normalizeCategoryName(categoryName) {
    if (!categoryName || typeof categoryName !== 'string') return '';
    return categoryName
      .replace(/^Category:/i, '')
      .replace(/_/g, ' ')
      .trim();
  }

  /**
   * Check if a category is trying to add itself (circular reference)
   * @param {string} currentCategory - The category being edited
   * @param {string} categoryToAdd - The category to be added
   * @returns {boolean} True if circular reference detected
   */
  static isCircularCategory(currentCategory, categoryToAdd) {
    if (!currentCategory || !categoryToAdd) return false;

    const normalizedCurrent = this.normalizeCategoryName(currentCategory);
    const normalizedToAdd = this.normalizeCategoryName(categoryToAdd);

    return normalizedCurrent.toLowerCase() === normalizedToAdd.toLowerCase();
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
      matches.push(`Category:${this.normalize(match[1].trim())}`);
    }

    return matches;
  }
  /**
   * Normalize category name by replacing underscores with spaces and trimming
   * @param {string} categoryName - Category name to normalize
   * @returns {string} Normalized category name
   */
  normalize(categoryName) {
    return categoryName.replace(/_/g, ' ').trim();
  }

  /**
   * Check if category exists in wikitext
   * @param {string} wikitext - The wikitext content
   * @param {string} categoryName - Category name to check (with or without "Category:" prefix)
   * @returns {boolean} True if category exists
   */
  hasCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const normalizedName = this.normalize(cleanName);

    // Create a pattern that matches both spaces and underscores
    const pattern = normalizedName.split(' ').map(part => this.escapeRegex(part)).join('[ _]+');
    const regex = new RegExp(
      `\\[\\[Category:${pattern}(?:\\|[^\\]]*)?\\]\\]`,
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
    const normalizedName = this.normalize(cleanName);

    // Check if category already exists (with normalization)
    if (this.hasCategory(wikitext, normalizedName)) {
      return wikitext;
    }

    const categorySyntax = `[[Category:${normalizedName}]]`;

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
    const normalizedName = this.normalize(cleanName);

    // Create a pattern that matches both spaces and underscores
    const pattern = normalizedName.split(' ').map(part => this.escapeRegex(part)).join('[ _]+');
    const regex = new RegExp(
      `\\[\\[Category:${pattern}(?:\\|[^\\]]*)?\\]\\]\\s*\\n?`,
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
 * Service for interacting with the MediaWiki API
 *
 * All requests go through mw.Api which handles CSRF-token management,
 * automatic bad-token retry, and correct origin headers.
 *
 * For local development without MediaWiki, set `window.mw` to a shim
 * that wraps fetch() — see README or DEPLOYMENT.md for details.
 *
 * @class APIService
 */



class APIService {
  constructor() {
    /**
     * Native MediaWiki API helper — instantiated lazily on first use.
     * @type {mw.Api|null}
     */
    this.mwApi = null;
  }

  /* ------------------------------------------------------------------ */
  /*  mw.Api helper                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Return (and lazily create) an mw.Api instance.
   * @returns {mw.Api}
   * @throws {Error} If mw.Api is not available
   */
  _getMwApi() {
    if (this.mwApi) return this.mwApi;
    if (typeof mw !== 'undefined' && mw.Api) {
      this.mwApi = new mw.Api();
      return this.mwApi;
    }
    throw new Error('mw.Api is not available — are you running inside MediaWiki?');
  }

  /* ------------------------------------------------------------------ */
  /*  Public helpers used by other services                              */
  /* ------------------------------------------------------------------ */

  /**
   * Fetch files from a category with pagination support.
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
   * Get file details including categories.
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
   * Get page content (wikitext).
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
   * Get categories that a page belongs to.
   * @param {string} title - Page title
   * @returns {Promise<Array<string>|false>} Array of category names (without "Category:" prefix), or false if page not found
   */
  async getCategories(title) {
    const api = this._getMwApi();
    try {
      const categories = await api.getCategories(title);
      if (categories === false) {
        return false;
      }
      // Convert mw.Title objects to strings and remove "Category:" prefix
      return categories.map(cat => {
        const catStr = cat.toString();
        return catStr.replace(/^Category:/, '');
      });
    } catch (error) {
      if (typeof Logger !== 'undefined') {
        Logger.error('Failed to get categories', error);
      }
      throw error;
    }
  }

  /**
   * Edit a page using mw.Api.edit() which handles revision fetching and conflicts.
   *
   * @param {string} title   - Page title
   * @param {string} content - New page content (wikitext)
   * @param {string} summary - Edit summary
   * @param {Object} [options={}] - Additional edit options (minor, bot, etc.)
   * @returns {Promise<Object>} API response
   */
  async editPage(title, content, summary, options = {}) {
    const api = this._getMwApi();

    // Use mw.Api.edit() with a transform function
    return api.edit(title, function () {
      return {
        text: content,
        summary: summary,
        ...options
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Low-level request method                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Make a GET request to the MediaWiki API via mw.Api.get().
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Parsed JSON response
   */
  async makeRequest(params) {
    const api = this._getMwApi();
    try {
      return await api.get(params);
    } catch (error) {
      if (typeof Logger !== 'undefined') {
        Logger.error('API request failed', error);
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
   * Uses MediaWiki search API for efficiency instead of loading all category members
   * @param {string} categoryName - Category to search in
   * @param {string} searchPattern - Pattern to match against file titles
   * @returns {Promise<Array<FileModel>>} Array of matching file models
   */
  async searchFiles(categoryName, searchPattern) {
    // Normalize category name
    const cleanCategoryName = categoryName.replace(/^Category:/i, '');

    // Use search API to find files matching the pattern in the category
    const searchResults = await this.searchInCategory(cleanCategoryName, searchPattern);

    // Get detailed info for matching files
    const filesWithInfo = await this.getFilesDetails(searchResults);

    return filesWithInfo;
  }

  /**
   * Search for files in a category using MediaWiki search API
   * Much more efficient than loading all category members
   * @param {string} categoryName - Category name (without "Category:" prefix)
   * @param {string} pattern - Search pattern
   * @returns {Promise<Array>} Array of file objects
   */
  async searchInCategory(categoryName, pattern) {
    const results = [];
    let continueToken = null;

    do {
      // Replace spaces with underscores in category name for search API
      const searchCategoryName = categoryName.replace(/\s+/g, '_');
      const params = {
        action: 'query',
        list: 'search',
        srsearch: `incategory:${searchCategoryName} intitle:/${pattern}/`,
        srnamespace: 6, // File namespace
        srlimit: 'max',
        srprop: 'size|wordcount|timestamp',
        format: 'json'
      };

      if (continueToken) {
        params.sroffset = continueToken;
      }

      const response = await this.api.makeRequest(params);

      if (response.query && response.query.search) {
        const searchResults = response.query.search.map(file => ({
          title: file.title,
          pageid: file.pageid,
          size: file.size,
          timestamp: file.timestamp
        }));

        results.push(...searchResults);
      }

      // Check if there are more results
      continueToken = response.continue ? response.continue.sroffset : null;

      // Safety limit to prevent too many requests
      if (results.length >= 5000) {
        console.warn('Search result limit reached (5000 files)');
        break;
      }

    } while (continueToken);

    return results;
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
      const FileModelClass = typeof FileModel !== 'undefined' ? FileModel : function (d) {
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
   * Combined add and remove operation using mw.Api.edit() for better conflict handling
   * @param {string} fileTitle - File page title
   * @param {Array<string>} toAdd - Categories to add
   * @param {Array<string>} toRemove - Categories to remove
   * @returns {Promise<{success: boolean, modified: boolean}>}
   */
  async updateCategoriesOptimized(fileTitle, toAdd, toRemove) {
    const api = this.api._getMwApi();
    const parser = this.parser;

    try {
      await api.edit(fileTitle, function (revision) {
        let newWikitext = revision.content;

        // Remove categories first
        for (const category of toRemove) {
          newWikitext = parser.removeCategory(newWikitext, category);
        }

        // Then add new categories
        for (const category of toAdd) {
          if (!parser.hasCategory(newWikitext, category)) {
            newWikitext = parser.addCategory(newWikitext, category);
          }
        }

        // Only save if changed
        if (newWikitext === revision.content) {
          return false; // No changes needed
        }

        const parts = [];
        if (toAdd.length) parts.push(`+${toAdd.join(', ')}`);
        if (toRemove.length) parts.push(`-${toRemove.join(', ')}`);

        return {
          text: newWikitext,
          summary: `Batch category update: ${parts.join('; ')} (via Category Batch Manager)`,
          minor: false
        };
      });

      return { success: true, modified: true };
    } catch (error) {
      if (error.message && error.message.includes('no changes')) {
        return { success: true, modified: false };
      }
      throw error;
    }
  }

  /**
   * Get current categories for a file using the optimized API method
   * @param {string} fileTitle - File page title
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCurrentCategories(fileTitle) {
    const categories = await this.api.getCategories(fileTitle);
    if (categories === false) {
      return [];
    }
    return categories;
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
   * Normalize category name for comparison
   * @param {string} categoryName - Category name to normalize
   * @returns {string} Normalized category name
   */
  normalizeCategoryName(categoryName) {
    return Validator.normalizeCategoryName(categoryName);
  }

  /**
   * Check if a category exists in a list (with normalization)
   * @param {string} category - Category to find
   * @param {Array<string>} categoryList - List to search in
   * @returns {number} Index of the category in the list, or -1 if not found
   */
  findCategoryIndex(category, categoryList) {
    const normalized = this.normalizeCategoryName(category);
    return categoryList.findIndex(cat => {
      return this.normalizeCategoryName(cat).toLowerCase() === normalized.toLowerCase();
    });
  }

  /**
   * Check if category exists in a list (with normalization)
   * @param {string} category - Category to check
   * @param {Array<string>} categoryList - List to search in
   * @returns {boolean} True if category exists in the list
   */
  categoryExists(category, categoryList) {
    return this.findCategoryIndex(category, categoryList) !== -1;
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

      // Check if trying to add categories that already exist (with normalization)
      if (categoriesToAdd.length > 0) {
        const duplicateCategories = categoriesToAdd.filter(cat => this.categoryExists(cat, current));
        if (duplicateCategories.length > 0) {
          throw new Error(`The following categories already exist and cannot be added: ${duplicateCategories.join(', ')}`);
        }
      }

      const after = [...current];

      // Simulate removal (with normalization for matching)
      categoriesToRemove.forEach(cat => {
        const index = this.findCategoryIndex(cat, after);
        if (index > -1) after.splice(index, 1);
      });

      // Simulate addition (with normalization for checking duplicates)
      categoriesToAdd.forEach(cat => {
        if (!this.categoryExists(cat, after)) after.push(cat);
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
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
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
   * Create the search panel HTML element with Codex components.
   * Uses CdxField, CdxTextInput, and CdxButton CSS-only patterns.
   * @returns {HTMLElement} The search panel element
   */
  createElement(sourceCategory) {
    const div = document.createElement('div');
    div.className = 'cbm-search';
    div.innerHTML = `
      <div class="cdx-field">
        <div class="cdx-label">
          <label class="cdx-label__label" for="cbm-source-category">
            <span class="cdx-label__label__text">Source Category</span>
          </label>
        </div>
        <div class="cdx-field__control">
          <div class="cdx-text-input">
            <input id="cbm-source-category" class="cdx-text-input__input" type="text"
            value="${sourceCategory}"
                   placeholder="Category:Example">
          </div>
        </div>
      </div>

      <div class="cdx-field" style="margin-top: 12px;">
        <div class="cdx-label">
          <label class="cdx-label__label" for="cbm-pattern">
            <span class="cdx-label__label__text">Search Pattern</span>
          </label>
          <span class="cdx-label__description">
            Enter a pattern to filter files (e.g., ,BLR.svg)
          </span>
        </div>
        <div class="cdx-field__control cbm-search-row">
          <div class="cdx-text-input" style="flex: 1;">
            <input id="cbm-pattern" class="cdx-text-input__input" type="text"
                   placeholder="e.g., ,BLR.svg">
          </div>
          <button id="cbm-search-btn"
                  class="cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium">
            Search
          </button>
        </div>
      </div>
    `;
    return div;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    document.getElementById('cbm-search-btn').addEventListener('click', () => {
      this.onSearch();
    });

    document.getElementById('cbm-pattern').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.onSearch();
      }
    });
  }
}

// === src/ui/components/FileList.js ===
/**
 * File list UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class FileList
 */
class FileList {
    /**
     * @param {Function} onSelectionChange - Callback when selection changes
     * @param {Function} onRemoveFile - Callback when remove button is clicked (receives index)
     * @constructor
     */
    constructor(onSelectionChange, onRemoveFile) {
        this.onSelectionChange = onSelectionChange;
        this.onRemoveFile = onRemoveFile;
    }

    /**
     * Render the file list using Codex CdxCheckbox CSS-only pattern.
     * @param {Array} files - Files to display
     */
    renderFileList(files) {
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

        listContainer.innerHTML = ''; files.forEach((file, index) => {
            const fileRow = document.createElement('div');
            fileRow.className = 'cbm-file-row';
            fileRow.dataset.index = index;

            fileRow.innerHTML = `
        <div class="cdx-checkbox cbm-file-checkbox-wrapper">
          <div class="cdx-checkbox__wrapper">
            <input id="file-${index}" class="cdx-checkbox__input cbm-file-checkbox"
                   type="checkbox" checked>
            <span class="cdx-checkbox__icon"></span>
            <div class="cdx-checkbox__label cdx-label">
              <label for="file-${index}" class="cdx-label__label">
                <span class="cdx-label__label__text">${file.title}</span>
              </label>
            </div>
          </div>
        </div>
        <button class="cdx-button cdx-button--action-destructive cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only cbm-remove-btn"
                data-index="${index}" aria-label="Remove file">&#215;</button>
      `;

            listContainer.appendChild(fileRow);
        });

        // Attach remove button listeners
        document.querySelectorAll('.cbm-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.onRemoveFile(index);
            });
        });

        // Attach checkbox listeners
        document.querySelectorAll('.cbm-file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedCount();
                if (this.onSelectionChange) {
                    this.onSelectionChange();
                }
            });
        });

        this.updateSelectedCount();
    }

    updateSelectedCount() {
        document.getElementById('cbm-selected').textContent = this.getSelectedCount();
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
 * Category inputs UI component with multiselect support.
 * Uses OOUI MenuTagMultidget and MediaWiki API for category suggestions.
 *
 * @requires mw.Api - MediaWiki API for category search
 * @requires OO.ui - OOUI library for multiselect widgets
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputs
 */


class CategoryInputs {
    /**
     * Create a new CategoryInputs component.
     * @param {APIService} apiService - API service instance for fetching categories
     */
    constructor(apiService = null) {
        this.apiService = apiService;
        this.addCategoriesWidget = null;
        this.removeCategoriesWidget = null;
        this.summaryWidget = null;

        // Store available categories for both widgets
        this.availableCategories = [];

        // Initialize mw.Api if not provided
        if (!this.apiService && typeof mw !== 'undefined' && mw.Api) {
            this.mwApi = new mw.Api();
        }
    }

    /**
     * Create the category inputs HTML element with OOUI multiselect widgets.
     * @returns {HTMLElement} The container element with all inputs
     */
    createElement() {
        const div = document.createElement('div');
        div.className = 'cbm-actions';

        // Create "Add Categories" multiselect widget container
        const addCatsField = this._createField(
            'cbm-add-cats',
            'Add Categories',
            'Search and select multiple categories to add',
            'Search categories...'
        );
        div.appendChild(addCatsField);

        // Create "Remove Categories" multiselect widget container
        const removeCatsField = this._createField(
            'cbm-remove-cats',
            'Remove Categories',
            'Search and select multiple categories to remove',
            'Search categories...'
        );
        div.appendChild(removeCatsField);

        // Create "Edit Summary" field (simple text input, no multiselect)
        const summaryField = this._createField(
            'cbm-summary',
            'Edit Summary',
            '',
            'Batch category update via Category Batch Manager',
            false
        );
        div.appendChild(summaryField);

        // Initialize OOUI widgets after DOM insertion
        setTimeout(() => this._initWidgets(), 0);

        return div;
    }

    /**
     * Initialize OOUI widgets for multiselect functionality.
     * @private
     */
    _initWidgets() {
        // Check if OOUI is available
        if (typeof OO === 'undefined' || !OO.ui) {
            console.warn('[CategoryInputs] OOUI not available, falling back to plain inputs');
            return;
        }

        // Check if MenuTagMultidget is available
        if (!OO.ui.MenuTagMultidget) {
            console.warn('[CategoryInputs] OO.ui.MenuTagMultidget not available, falling back to ComboBoxInputWidget');
            this._initComboBoxWidgets();
            return;
        }

        // Initialize Add Categories multiselect
        const addCatsContainer = document.getElementById('cbm-add-cats-container');
        if (addCatsContainer) {
            this.addCategoriesWidget = this._createMultiselectWidget(
                'cbm-add-cats',
                'Search categories...'
            );
            if (this.addCategoriesWidget) {
                addCatsContainer.appendChild(this.addCategoriesWidget.$element[0]);
            }
        }

        // Initialize Remove Categories multiselect
        const removeCatsContainer = document.getElementById('cbm-remove-cats-container');
        if (removeCatsContainer) {
            this.removeCategoriesWidget = this._createMultiselectWidget(
                'cbm-remove-cats',
                'Search categories...'
            );
            if (this.removeCategoriesWidget) {
                removeCatsContainer.appendChild(this.removeCategoriesWidget.$element[0]);
            }
        }

        // Initialize Summary widget (simple text input)
        const summaryInput = document.getElementById('cbm-summary');
        if (summaryInput && OO.ui.TextInputWidget) {
            this.summaryWidget = new OO.ui.TextInputWidget({
                $input: $(summaryInput),
                value: summaryInput.value
            });
        }
    }

    /**
     * Fallback: Initialize ComboBoxInputWidget if MenuTagMultidget is not available.
     * @private
     */
    _initComboBoxWidgets() {
        if (!OO.ui.ComboBoxInputWidget) return;

        const addCatsInput = document.getElementById('cbm-add-cats');
        if (addCatsInput) {
            this.addCategoriesWidget = this._createComboBoxWidget(
                'cbm-add-cats',
                'Category:Example'
            );
        }

        const removeCatsInput = document.getElementById('cbm-remove-cats');
        if (removeCatsInput) {
            this.removeCategoriesWidget = this._createComboBoxWidget(
                'cbm-remove-cats',
                'Category:Old'
            );
        }

        const summaryInput = document.getElementById('cbm-summary');
        if (summaryInput) {
            this.summaryWidget = new OO.ui.TextInputWidget({
                $input: $(summaryInput),
                value: summaryInput.value
            });
        }
    }

    /**
     * Create a multiselect widget using OOUI MenuTagMultidget.
     * @param {string} inputId - ID of the input element
     * @param {string} placeholder - Placeholder text
     * @returns {OO.ui.MenuTagMultidget|null} The widget or null if not available
     * @private
     */
    _createMultiselectWidget(inputId, placeholder) {
        if (typeof OO === 'undefined' || !OO.ui || !OO.ui.MenuTagMultidget) {
            return null;
        }

        const widget = new OO.ui.MenuTagMultidget({
            placeholder: placeholder,
            allowArbitrary: false, // Only allow selections from menu
            allowEditTags: false,  // Don't allow editing tags after selection
            tagLimit: 10,          // Maximum number of tags
            menu: {
                filterFromInput: true,
                highlightFooter: false,
                highlightFirst: true
            }
        });

        // Setup autocomplete search
        this._setupMultiselectSearch(widget);

        return widget;
    }

    /**
     * Create a fallback combobox widget.
     * @param {string} inputId - ID of the input element
     * @param {string} placeholder - Placeholder text
     * @returns {OO.ui.ComboBoxInputWidget|null} The widget or null if not available
     * @private
     */
    _createComboBoxWidget(inputId, placeholder) {
        if (typeof OO === 'undefined' || !OO.ui || !OO.ui.ComboBoxInputWidget) {
            return null;
        }

        const inputElement = document.getElementById(inputId);
        if (!inputElement) return null;

        const widget = new OO.ui.ComboBoxInputWidget({
            $input: $(inputElement),
            placeholder: placeholder,
            options: []
        });

        this._setupAutocompleteSearch(widget);
        return widget;
    }

    /**
     * Setup autocomplete search functionality for MenuTagMultidget.
     * @param {OO.ui.MenuTagMultidget} widget - The multiselect widget
     * @private
     */
    _setupMultiselectSearch(widget) {
        if (!widget) return;

        let searchTimeout = null;
        const SEARCH_DELAY = 300; // ms

        // Handle input changes for searching categories
        widget.on('inputChange', (value) => {
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // Don't search if value is empty or too short
            const trimmedValue = value.trim();
            if (trimmedValue.length < 2) {
                return;
            }

            // Debounce the search
            searchTimeout = setTimeout(() => {
                this._searchCategoriesForMultiselect(trimmedValue, widget);
            }, SEARCH_DELAY);
        });
    }

    /**
     * Setup autocomplete search for ComboBoxInputWidget (fallback).
     * @param {OO.ui.ComboBoxInputWidget} widget - The combobox widget
     * @private
     */
    _setupAutocompleteSearch(widget) {
        if (!widget) return;

        let searchTimeout = null;
        const SEARCH_DELAY = 300;

        widget.on('change', (value) => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            const trimmedValue = value.trim();
            if (trimmedValue.length < 2) {
                return;
            }

            searchTimeout = setTimeout(() => {
                this._searchCategoriesForCombobox(trimmedValue, widget);
            }, SEARCH_DELAY);
        });
    }

    /**
     * Search for categories matching the given query for MenuTagMultidget.
     * @param {string} query - Search query
     * @param {OO.ui.MenuTagMultidget} widget - The widget to update with results
     * @private
     */
    async _searchCategoriesForMultiselect(query, widget) {
        if (!widget) return;

        try {
            let categories = [];

            if (typeof mw !== 'undefined' && mw.Api) {
                const api = this.mwApi || new mw.Api();

                const data = await api.get({
                    action: 'opensearch',
                    namespace: 14,
                    search: query,
                    limit: 10,
                    redirects: 'resolve'
                });

                if (data && data[1]) {
                    categories = data[1].map(title => {
                        return title.startsWith('Category:') ? title : `Category:${title}`;
                    });
                }
            }

            // Update widget menu options
            if (categories.length > 0) {
                const menuOptions = categories.map(cat => ({
                    data: cat,
                    label: cat
                }));
                widget.clearOptions();
                menuOptions.forEach(option => widget.addOption(option));
            }

        } catch (error) {
            console.error('[CategoryInputs] Failed to search categories:', error);
        }
    }

    /**
     * Search for categories matching the given query for ComboBoxInputWidget.
     * @param {string} query - Search query
     * @param {OO.ui.ComboBoxInputWidget} widget - The widget to update with results
     * @private
     */
    async _searchCategoriesForCombobox(query, widget) {
        if (!widget) return;

        try {
            let categories = [];

            if (typeof mw !== 'undefined' && mw.Api) {
                const api = this.mwApi || new mw.Api();

                const data = await api.get({
                    action: 'opensearch',
                    namespace: 14,
                    search: query,
                    limit: 10,
                    redirects: 'resolve'
                });

                if (data && data[1]) {
                    categories = data[1].map(title => {
                        return title.startsWith('Category:') ? title : `Category:${title}`;
                    });
                }
            }

            if (categories.length > 0) {
                const options = categories.map(cat => ({ data: cat, label: cat }));
                widget.setOptions(options);
            }

        } catch (error) {
            console.error('[CategoryInputs] Failed to search categories:', error);
        }
    }

    /**
     * Create a labeled field container.
     * @param {string} inputId - ID for the input element
     * @param {string} labelText - Label text
     * @param {string} description - Optional description text
     * @param {string} placeholder - Placeholder text
     * @param {boolean} isMultiselect - Whether this field should use multiselect
     * @returns {HTMLElement} The field element
     * @private
     */
    _createField(inputId, labelText, description = '', placeholder = '', isMultiselect = true) {
        const wrapper = document.createElement('div');
        wrapper.className = 'cdx-field';

        let descriptionHtml = '';
        if (description) {
            descriptionHtml = `
        <span class="cdx-label__description">${description}</span>
      `;
        }

        if (isMultiselect) {
            // Create container for MenuTagMultidget
            wrapper.innerHTML = `
        <div class="cdx-label">
          <label class="cdx-label__label" for="${inputId}">
            <span class="cdx-label__label__text">${labelText}</span>
          </label>
          ${descriptionHtml}
        </div>
        <div class="cdx-field__control" id="${inputId}-container">
        </div>
      `;
        } else {
            // Create regular text input
            wrapper.innerHTML = `
        <div class="cdx-label">
          <label class="cdx-label__label" for="${inputId}">
            <span class="cdx-label__label__text">${labelText}</span>
          </label>
          ${descriptionHtml}
        </div>
        <div class="cdx-field__control">
          <div class="cdx-text-input">
            <input id="${inputId}" class="cdx-text-input__input" type="text" placeholder="${placeholder}">
          </div>
        </div>
      `;
        }

        return wrapper;
    }

    /**
     * Get categories to add from the multiselect widget.
     * @returns {Array<string>} Array of selected category names
     */
    getCategoriesToAdd() {
        if (this.addCategoriesWidget) {
            if (this.addCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
                // MenuTagMultidget: get selected tags data
                return this.addCategoriesWidget.getItems().map(item => item.data);
            } else if (this.addCategoriesWidget instanceof OO.ui.ComboBoxInputWidget) {
                // ComboBoxInputWidget: parse comma-separated value
                return this.parseCategories(this.addCategoriesWidget.getValue());
            } else if (this.addCategoriesWidget.getValue) {
                return this.parseCategories(this.addCategoriesWidget.getValue());
            }
        }

        // Fallback to plain input
        const input = document.getElementById('cbm-add-cats');
        if (input) {
            return this.parseCategories(input.value);
        }

        return [];
    }

    /**
     * Get categories to remove from the multiselect widget.
     * @returns {Array<string>} Array of selected category names
     */
    getCategoriesToRemove() {
        if (this.removeCategoriesWidget) {
            if (this.removeCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
                return this.removeCategoriesWidget.getItems().map(item => item.data);
            } else if (this.removeCategoriesWidget instanceof OO.ui.ComboBoxInputWidget) {
                return this.parseCategories(this.removeCategoriesWidget.getValue());
            } else if (this.removeCategoriesWidget.getValue) {
                return this.parseCategories(this.removeCategoriesWidget.getValue());
            }
        }

        const input = document.getElementById('cbm-remove-cats');
        if (input) {
            return this.parseCategories(input.value);
        }

        return [];
    }

    /**
     * Get edit summary
     * @returns {string} Edit summary text
     */
    getEditSummary() {
        if (this.summaryWidget && this.summaryWidget.getValue) {
            return this.summaryWidget.getValue();
        }

        const input = document.getElementById('cbm-summary');
        if (input) {
            return input.value;
        }

        return '';
    }

    /**
     * Parse comma-separated category input.
     * Handles various formats:
     * - "Category:Test" -> "Category:Test"
     * - "Test" -> "Category:Test"
     * - "Category:Test 1, Test 2" -> ["Category:Test 1", "Category:Test 2"]
     *
     * @param {string} input - Raw input string
     * @returns {Array<string>} Array of category names with "Category:" prefix
     */
    parseCategories(input) {
        if (!input || typeof input !== 'string') {
            return [];
        }
        return input
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0)
            .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
    }

    /**
     * Clear all input fields and widgets.
     */
    clear() {
        // Clear multiselect widgets
        if (this.addCategoriesWidget) {
            if (this.addCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
                this.addCategoriesWidget.clearItems();
            } else if (this.addCategoriesWidget.setValue) {
                this.addCategoriesWidget.setValue('');
            }
        }

        if (this.removeCategoriesWidget) {
            if (this.removeCategoriesWidget instanceof OO.ui.MenuTagMultidget) {
                this.removeCategoriesWidget.clearItems();
            } else if (this.removeCategoriesWidget.setValue) {
                this.removeCategoriesWidget.setValue('');
            }
        }

        // Clear summary widget
        if (this.summaryWidget && this.summaryWidget.setValue) {
            this.summaryWidget.setValue('Batch category update via Category Batch Manager');
        }

        // Clear plain inputs
        const addInput = document.getElementById('cbm-add-cats');
        const removeInput = document.getElementById('cbm-remove-cats');
        const summaryInput = document.getElementById('cbm-summary');

        if (addInput) addInput.value = '';
        if (removeInput) removeInput.value = '';
        if (summaryInput) summaryInput.value = 'Batch category update via Category Batch Manager';
    }

    /**
     * Cleanup widgets and remove references.
     */
    destroy() {
        if (this.addCategoriesWidget) {
            this.addCategoriesWidget.destroy();
            this.addCategoriesWidget = null;
        }
        if (this.removeCategoriesWidget) {
            this.removeCategoriesWidget.destroy();
            this.removeCategoriesWidget = null;
        }
        if (this.summaryWidget) {
            this.summaryWidget.destroy();
            this.summaryWidget = null;
        }
    }

}

// === src/ui/components/ProgressBar.js ===
/**
 * Progress bar UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class ProgressBar
 */
class ProgressBar {
  /**
   * Show the progress bar
   */
  createElement() {
    return `
      <div id="cbm-progress" class="cbm-progress hidden">
          <div class="cdx-progress-bar cdx-progress-bar--block" role="progressbar" aria-label="Batch processing progress">
              <div id="cbm-progress-fill" class="cdx-progress-bar__bar cbm-progress-fill"></div>
          </div>
          <div id="cbm-progress-text" class="cbm-progress-text">Processing...</div>
      </div>`;
  }
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
   * Update the progress bar.
   * Note: Codex CdxProgressBar is indeterminate only (CSS-only).
   * We keep the custom fill bar for determinate progress alongside Codex styling.
   * @param {number} percentage - Progress percentage (0-100)
   * @param {Object} results - Current results
   */
  update(percentage, results) {
    document.getElementById('cbm-progress-fill').style.width = `${percentage}%`;
    document.getElementById('cbm-progress-text').textContent =
      `Processing: ${results.processed}/${results.total} (${results.successful} successful, ${results.skipped || 0} skipped, ${results.failed} failed)`;
  }
}

// === src/ui/helpers/ValidationHelper.js ===
/**
 * Validation Helper
 *
 * @description
 * Shared validation logic for CategoryBatchManagerUI handlers.
 * Provides common validation functions used by PreviewHandler and ExecuteHandler.
 *
 * @requires Validator - For checking circular category references
 */



class ValidationHelper {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
    }

    /**
     * Get and validate selected files
     * @returns {Array|null} Array of selected files, or null if validation fails
     */
    getSelectedFiles() {
        const selectedFiles = this.ui.getSelectedFiles();
        console.log('[CBM-V] Selected files:', selectedFiles);
        if (selectedFiles.length === 0) {
            console.log('[CBM-V] No files selected');
            this.ui.showMessage('No files selected.', 'warning');
            return null;
        }
        return selectedFiles;
    }

    /**
     * Parse and validate category inputs
     * @returns {Object|null} Object with toAdd and toRemove arrays, or null if validation fails
     */
    parseCategoryInputs() {
        const toAdd = this.ui.categoryInputs.getCategoriesToAdd();
        const toRemove = this.ui.categoryInputs.getCategoriesToRemove();
        console.log('[CBM-V] Categories to add:', toAdd);
        console.log('[CBM-V] Categories to remove:', toRemove);

        if (toAdd.length === 0 && toRemove.length === 0) {
            console.log('[CBM-V] No categories specified');
            this.ui.showMessage('Please specify categories to add or remove.', 'warning');
            return null;
        }

        return { toAdd, toRemove };
    }

    /**
     * Check for circular category references and filter them out silently
     * Only shows error if ALL categories are circular
     * @param {Array<string>} categoriesToAdd - Categories to check for circular references
     * @returns {Array<string>|null} Filtered categories, or null if all are circular
     */
    filterCircularCategories(categoriesToAdd) {
        const sourceCategory = this.ui.state.sourceCategory;
        const circularCategories = [];
        const validCategories = [];

        for (const category of categoriesToAdd) {
            if (Validator.isCircularCategory(sourceCategory, category)) {
                console.log('[CBM-V] Circular category detected (silently removed):', category);
                circularCategories.push(category);
            } else {
                validCategories.push(category);
            }
        }

        // If all categories are circular, show error
        if (circularCategories.length > 0 && validCategories.length === 0) {
            this.ui.showMessage(
                `❌ Cannot add: all categorie(s) are circular references to the current page. Cannot add "${circularCategories.join(', ')}" to itself.`,
                'error'
            );
            return null;
        }

        // Silently filter circular categories if there are valid ones
        return validCategories;
    }

    /**
     * Perform all validation steps before a batch operation
     * @returns {Object|null} Object with selectedFiles, toAdd, toRemove, or null if validation fails
     */
    validateBatchOperation() {
        const selectedFiles = this.getSelectedFiles();
        if (!selectedFiles) return null;

        const categoryInputs = this.parseCategoryInputs();
        if (!categoryInputs) return null;

        // Filter out circular categories (returns null if ALL are circular)
        const filteredToAdd = this.filterCircularCategories(categoryInputs.toAdd);
        if (filteredToAdd === null) return null; // All categories were circular

        // Check if there are any valid operations remaining
        if (filteredToAdd.length === 0 && categoryInputs.toRemove.length === 0) {
            console.log('[CBM-V] No valid categories after filtering');
            this.ui.showMessage('No valid categories to add or remove.', 'warning');
            return null;
        }

        return {
            selectedFiles,
            toAdd: filteredToAdd,
            toRemove: categoryInputs.toRemove
        };
    }
}

// === src/ui/handlers/SearchHandler.js ===
/**
 * Search Handler
 *
 * @description
 * Handles all search-related functionality for CategoryBatchManagerUI.
 * Manages search execution, stopping, progress display, and button state.
 *
 * @requires UsageLogger - For logging search operations
 */



class SearchHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
    }

    /**
     * Handle search button click
     * If search is in progress, stops the search.
     * Otherwise, initiates a new search.
     */
    async handleSearch() {
        // إذا كان البحث جارياً، أوقفه
        if (this.ui.state.isSearching) {
            this.stopSearch();
            return;
        }

        const pattern = document.getElementById('cbm-pattern').value.trim();
        const sourceCategory = document.getElementById('cbm-source-category').value.trim();

        if (!pattern) {
            this.ui.showMessage('Please enter a search pattern.', 'warning');
            return;
        }

        if (!sourceCategory) {
            this.ui.showMessage('Please enter a source category.', 'warning');
            return;
        }

        this.ui.clearMessage();
        this.ui.state.isSearching = true;
        this.ui.state.searchAbortController = new AbortController();

        // تغيير زر البحث إلى زر إيقاف
        this.updateSearchButton(true);
        this.showSearchProgress();

        try {
            const files = await this.ui.fileService.searchFiles(
                sourceCategory,
                pattern,
                { signal: this.ui.state.searchAbortController.signal }
            );

            this.ui.state.files = files;
            this.ui.state.searchPattern = pattern;
            this.ui.state.sourceCategory = sourceCategory;
            this.ui.fileList.renderFileList(this.ui.state.files);
            this.hideSearchProgress();
            this.updateSearchButton(false);
            this.ui.state.isSearching = false;

            UsageLogger.logSearch(pattern, files.length);
        } catch (error) {
            this.hideSearchProgress();
            this.updateSearchButton(false);
            this.ui.state.isSearching = false;

            if (error.name === 'AbortError') {
                this.ui.showMessage('Search cancelled by user.', 'notice');
            } else {
                this.ui.showMessage(`Error searching files: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Stop the current search operation
     */
    stopSearch() {
        if (this.ui.state.searchAbortController) {
            this.ui.state.searchAbortController.abort();
            this.ui.state.searchAbortController = null;
        }
    }

    /**
     * Update the search button appearance based on search state
     * @param {boolean} isSearching - Whether search is in progress
     */
    updateSearchButton(isSearching) {
        const searchBtn = document.getElementById('cbm-search-btn');
        if (searchBtn) {
            if (isSearching) {
                searchBtn.textContent = 'Stop';
                searchBtn.className = 'cdx-button cdx-button--action-destructive cdx-button--weight-primary cdx-button--size-medium';
            } else {
                searchBtn.textContent = 'Search';
                searchBtn.className = 'cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium';
            }
        }
    }

    /**
     * Show search progress indicator
     */
    showSearchProgress() {
        const listContainer = document.getElementById('cbm-file-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; padding: 20px; justify-content: center;">
                    <div class="cdx-progress-bar cdx-progress-bar--inline" role="progressbar" aria-label="Searching">
                        <div class="cdx-progress-bar__bar"></div>
                    </div>
                    <span style="color: #54595d;">Searching for files...</span>
                </div>
            `;
        }
    }

    /**
     * Hide search progress indicator
     * Content will be replaced by FileList.renderFileList
     */
    hideSearchProgress() {
        // Content will be replaced by FileList.renderFileList
    }
}

// === src/ui/handlers/PreviewHandler.js ===
/**
 * Preview Handler
 *
 * @description
 * Handles all preview-related functionality for CategoryBatchManagerUI.
 * Manages preview generation, modal display, and validation.
 *
 * @requires ValidationHelper - For common validation logic
 */



class PreviewHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
     */
    constructor(ui) {
        this.ui = ui;
        this.validator = new ValidationHelper(ui);
    }

    /**
     * Handle preview button click
     * Generates and displays a preview of category changes
     */
    async handlePreview() {
        console.log('[CBM-P] Preview button clicked');

        // Use ValidationHelper for common validation
        const validation = this.validator.validateBatchOperation();
        if (!validation) return;

        const { selectedFiles, toAdd, toRemove } = validation;

        // Generate preview without affecting file list - no loading indicator
        try {
            console.log('[CBM-P] Calling batchProcessor.previewChanges');
            const preview = await this.ui.batchProcessor.previewChanges(
                selectedFiles,
                toAdd,
                toRemove
            );
            console.log('[CBM-P] Preview result:', preview);
            this.showPreviewModal(preview);

        } catch (error) {
            console.log('[CBM-P] Error in previewChanges:', error);
            // Check if error is about duplicate categories
            if (error.message.includes('already exist')) {
                this.ui.showMessage(`⚠️ ${error.message}`, 'warning');
            } else {
                this.ui.showMessage(`Error generating preview: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Show the preview modal with changes
     * @param {Array} preview - Array of preview items
     */
    showPreviewModal(preview) {
        const modal = document.getElementById('cbm-preview-modal');
        const content = document.getElementById('cbm-preview-content');
        if (!modal) {
            console.error('[CBM] Preview modal container not found');
            return;
        }
        if (!content) {
            console.error('[CBM] Preview content container not found');
            return;
        }
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

        if (changesCount === 0) {
            console.log('[CBM] No changes detected');
            this.ui.showMessage('ℹ️ No changes detected. The categories you are trying to add/remove result in the same category list.', 'notice');
            return;
        }

        html = `<p>${changesCount} files will be modified</p>` + html;

        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    /**
     * Hide the preview modal
     */
    hidePreviewModal() {
        const modal = document.getElementById('cbm-preview-modal');
        modal.classList.add('hidden');
    }
}

// === src/ui/handlers/ExecuteHandler.js ===
/**
 * Execute Handler
 *
 * @description
 * Handles all execute-related functionality for CategoryBatchManagerUI.
 * Manages batch execution, progress display, and result reporting.
 *
 * @requires ValidationHelper - For common validation logic
 * @requires UsageLogger - For logging batch operations
 * @requires ProgressBar - For progress display
 */



class ExecuteHandler {
    /**
     * @param {CategoryBatchManagerUI} ui - The main UI instance
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

// === src/ui/CategoryBatchManagerUI.js ===
/**
 * Category Batch Manager UI
 *
 * @description
 * Main UI class for the Category Batch Manager tool.
 * Manages the user interface, file selection, and batch operations.
 *
 * @requires OO.ui - MediaWiki's OOUI library for dialogs
 */



class CategoryBatchManagerUI {
    constructor() {
        this.apiService = new APIService();
        this.fileService = new FileService(this.apiService);
        this.categoryService = new CategoryService(this.apiService);
        this.batchProcessor = new BatchProcessor(this.categoryService);

        // Initialize UI components
        this.searchPanel = new SearchPanel(() => this.searchHandler.handleSearch());
        this.fileList = new FileList(
            () => this.updateSelectedCount(),
            (index) => this.removeFile(index)
        );

        // Initialize helpers and handlers
        this.validationHelper = new ValidationHelper(this);
        this.searchHandler = new SearchHandler(this);
        this.previewHandler = new PreviewHandler(this);
        this.executeHandler = new ExecuteHandler(this);
        this.progressBarHandler = new ProgressBar();

        this.state = {
            sourceCategory: mw.config.get('wgPageName'),
            searchPattern: '',
            files: [],
            selectedFiles: [],
            categoriesToAdd: [],
            categoriesToRemove: [],
            isProcessing: false,
            isSearching: false,
            searchAbortController: null,
            processAbortController: null
        };

        this.init();
    }

    init() {
        this.createUI();
        this.attachEventListeners();
    }

    createUI() {
        // Create reopen button
        const reopenBtn = document.createElement('button');
        reopenBtn.id = 'cbm-reopen-btn';
        reopenBtn.className = 'cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-large cdx-button--icon-only'; reopenBtn.setAttribute('aria-label', 'Open Category Batch Manager');
        reopenBtn.setAttribute('title', 'Open Category Batch Manager');
        reopenBtn.textContent = '☰';
        reopenBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 99; display: none;';
        document.body.appendChild(reopenBtn);

        // SearchPanel element
        const searchPanelElement = this.searchPanel.createElement(this.state.sourceCategory);
        // Create main container
        const container = this.buildContainer(searchPanelElement);
        document.body.appendChild(container);

        // Add reopen button listener
        reopenBtn.addEventListener('click', () => {
            this.reopenModal();
        });
    }

    buildContainer(searchPanelElement) {
        const ProgressBarElement = this.progressBarHandler.createElement();

        const div = document.createElement('div');
        div.id = 'category-batch-manager';
        div.className = 'cbm-container';
        div.innerHTML = `
            <div class="cbm-header">
                <h2>Category Batch Manager</h2>
                <div>
                    <button
                        class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only"
                        id="cbm-minimize" aria-label="Minimize" title="Minimize">−</button>
                    <button
                        class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium cdx-button--icon-only cbm-close"
                        id="cbm-close" aria-label="Close" title="Close">&#215;</button>
                </div>
            </div>

            <div class="cbm-body">
                <div class="cbm-main-layout">
                    <!-- Left Panel: Search and Actions -->
                    <div class="cbm-left-panel">
                        ${searchPanelElement.outerHTML}
                        <div id="cbm-results-message" class="hidden"></div>

                        <div class="cbm-actions">

                            <div class="cdx-field">
                                <div class="cdx-label">
                                    <label class="cdx-label__label" for="cbm-add-cats">
                                        <span class="cdx-label__label__text">Add Categories (comma-separated)</span>
                                    </label>
                                    <span class="cdx-label__description">
                                        e.g., Category:Belarus, Category:Europe
                                    </span>
                                </div>
                                <div class="cdx-field__control">
                                    <div class="cdx-text-input">
                                        <input id="cbm-add-cats" class="cdx-text-input__input" type="text" placeholder="Category:Example">
                                    </div>
                                </div>
                            </div>

                            <div class="cdx-field">
                                <div class="cdx-label">
                                    <label class="cdx-label__label" for="cbm-remove-cats">
                                        <span class="cdx-label__label__text">Remove Categories (comma-separated)</span>
                                    </label>
                                </div>
                                <div class="cdx-field__control">
                                    <div class="cdx-text-input">
                                        <input id="cbm-remove-cats" class="cdx-text-input__input" type="text" placeholder="Category:Old">
                                    </div>
                                </div>
                            </div>

                            <div class="cdx-field">
                                <div class="cdx-label">
                                    <label class="cdx-label__label" for="cbm-summary">
                                        <span class="cdx-label__label__text">Edit Summary</span>
                                    </label>
                                </div>
                                <div class="cdx-field__control">
                                    <div class="cdx-text-input">
                                        <input id="cbm-summary" class="cdx-text-input__input" type="text"
                                            value="Batch category update via Category Batch Manager">
                                    </div>
                                </div>
                            </div>

                            <div class="cbm-selected-count">
                                Selected: <strong id="cbm-selected">0</strong> files
                            </div>                            <div class="cbm-buttons">
                                <button id="cbm-preview"
                                    class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium">
                                    Preview Changes
                                </button>
                                <button id="cbm-execute"
                                    class="cdx-button cdx-button--action-progressive cdx-button--weight-primary cdx-button--size-medium">
                                    GO
                                </button>
                                <button id="cbm-stop" style="display: none;"
                                    class="cdx-button cdx-button--action-destructive cdx-button--weight-primary cdx-button--size-medium">
                                    Stop Process
                                </button>
                            </div>
                        </div>
                        ${ProgressBarElement}
                    </div>

                    <!-- Right Panel: File List -->
                    <div class="cbm-right-panel">
                        <div class="cbm-results">
                            <div id="cbm-results-header" class="cbm-results-header hidden">
                                <div class="cdx-info-chip cdx-info-chip--notice">
                                    <span class="cdx-info-chip__text">
                                        Found <strong id="cbm-count">0</strong> files
                                    </span>
                                </div>
                                <button id="cbm-select-all"
                                    class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium">
                                    Select All
                                </button>
                                <button id="cbm-deselect-all"
                                    class="cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--size-medium">
                                    Deselect All
                                </button>
                            </div>
                            <div id="cbm-file-list"></div>
                        </div>
                    </div>
                </div>
            </div>            <div id="cbm-preview-modal" class="cbm-modal hidden">
                <div class="cbm-modal-content">
                    <h3>Preview Changes</h3>
                    <div id="cbm-preview-content"></div>
                    <button id="cbm-preview-close"
                        class="cdx-button cdx-button--action-default cdx-button--weight-normal cdx-button--size-medium">
                        Close
                    </button>
                </div>
            </div>

        `;

        return div;
    }

    attachEventListeners() {
        // Search panel listeners
        this.searchPanel.attachListeners();

        document.getElementById('cbm-select-all').addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('cbm-deselect-all').addEventListener('click', () => {
            this.deselectAll();
        });

        document.getElementById('cbm-preview').addEventListener('click', () => {
            this.previewHandler.handlePreview();
        });
        document.getElementById('cbm-execute').addEventListener('click', () => {
            this.executeHandler.handleExecute();
        });

        document.getElementById('cbm-stop').addEventListener('click', () => {
            this.executeHandler.stopProcess();
        });

        document.getElementById('cbm-minimize').addEventListener('click', () => {
            this.minimizeModal();
        });

        document.getElementById('cbm-close').addEventListener('click', () => {
            this.close();
        });

        // Preview modal close button
        document.getElementById('cbm-preview-close').addEventListener('click', () => {
            this.previewHandler.hidePreviewModal();
        });

        // Close modal when clicking outside
        document.getElementById('cbm-preview-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cbm-preview-modal') {
                this.previewHandler.hidePreviewModal();
            }
        });
    }

    /**
     * Display a Codex CSS-only message banner above the file list.
     * @param {string} text - Message text
     * @param {string} type - One of 'notice', 'warning', 'error', 'success'
     */
    showMessage(text, type) {
        const messageContainer = document.getElementById('cbm-results-message');
        if (!messageContainer) {
            console.error('[CBM] Message container not found');
            return;
        }
        const ariaAttr = type === 'error' ? 'role="alert"' : 'aria-live="polite"';
        messageContainer.innerHTML = `
            <div class="cdx-message cdx-message--block cdx-message--${type}" ${ariaAttr}>
                <span class="cdx-message__icon"></span>
                <div class="cdx-message__content">${text}</div>
            </div>`;
        messageContainer.classList.remove('hidden');
    }

    /**
     * Clear any displayed messages
     */
    clearMessage() {
        const messageContainer = document.getElementById('cbm-results-message');
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }

    removeFile(index) {
        this.state.files.splice(index, 1);
        this.fileList.renderFileList(this.state.files);
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

    showLoading() {
        const listContainer = document.getElementById('cbm-file-list');
        if (listContainer) {
            listContainer.innerHTML = `
        <div class="cdx-progress-bar cdx-progress-bar--inline" role="progressbar"
             aria-label="Loading">
          <div class="cdx-progress-bar__bar"></div>
        </div>`;
        }
    }

    /**
     * Show a confirmation dialog using MediaWiki's OO.ui.confirm
     * @param {string} message - Dialog message
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    async showConfirmDialog(message, options = {}) {
        const title = options.title || 'Confirm';

        return new Promise((resolve) => {
            if (typeof OO === 'undefined' || !OO.ui || !OO.ui.confirm) {
                // Fallback to native confirm if OO.ui is not available
                resolve(confirm(message));
                return;
            }

            OO.ui.confirm(message, {
                title: title,
                actions: [
                    {
                        action: 'accept',
                        label: options.confirmLabel || 'Confirm',
                        flags: ['primary', 'progressive']
                    },
                    {
                        action: 'reject',
                        label: options.cancelLabel || 'Cancel',
                        flags: 'safe'
                    }
                ]
            }).done((confirmed) => {
                resolve(confirmed);
            });
        });
    }

    minimizeModal() {
        const modal = document.getElementById('category-batch-manager');
        const reopenBtn = document.getElementById('cbm-reopen-btn');
        if (modal) modal.style.display = 'none';
        if (reopenBtn) reopenBtn.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('category-batch-manager');
        const reopenBtn = document.getElementById('cbm-reopen-btn');
        if (modal) modal.style.display = 'none';
        if (reopenBtn) reopenBtn.style.display = 'block';
    }

    reopenModal() {
        const modal = document.getElementById('category-batch-manager');
        const reopenBtn = document.getElementById('cbm-reopen-btn');
        if (modal) modal.style.display = 'flex';
        if (reopenBtn) reopenBtn.style.display = 'none';
    }

    async close() {
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to close? Any unsaved changes will be lost.',
            {
                title: 'Close Category Batch Manager',
                confirmLabel: 'Close',
                cancelLabel: 'Cancel'
            }
        );

        if (confirmed) {
            const el = document.getElementById('category-batch-manager');
            const reopenBtn = document.getElementById('cbm-reopen-btn');
            if (el) el.remove();
            if (reopenBtn) reopenBtn.remove();
        }
    }
}

// === src/gadget-entry.js ===
/**
 * Gadget entry point for Category Batch Manager
 *
 * Adds a "Batch Manager" button to category pages in Wikimedia Commons.
 * When clicked, opens the Category Batch Manager UI.
 *
 * Codex CSS is loaded at runtime via mw.loader.using() so that all
 * Codex CSS-only classes (cdx-button, cdx-text-input, cdx-checkbox, etc.)
 * are available before the UI is rendered.
 */



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
    ); portletLink.addEventListener('click', function (e) {
      e.preventDefault();

      // Ensure Codex styles, mediawiki.api, and OO.ui are loaded, then open the UI
      mw.loader.using(['@wikimedia/codex', 'mediawiki.api', 'oojs-ui', 'oojs-ui-windows']).then(function () {
        // Check if modal exists and is hidden
        var existingModal = document.getElementById('category-batch-manager');
        var reopenBtn = document.getElementById('cbm-reopen-btn');

        if (existingModal && existingModal.style.display === 'none') {
          // Just show the existing modal
          existingModal.style.display = 'flex';
          if (reopenBtn) reopenBtn.style.display = 'none';
        } else if (!existingModal) {
          // Create new instance
          window.categoryBatchManager = new CategoryBatchManagerUI();
        }
      });
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addToolButton);
  } else {
    addToolButton();
  }

})();
