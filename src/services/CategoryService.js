/**
 * Service for category operations on files
 * @class CategoryService
 */

/* global WikitextParser */

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryService;
}
