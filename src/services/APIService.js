/**
 * Service for interacting with MediaWiki API
 * @class APIService
 */

/* global Logger */

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
}
