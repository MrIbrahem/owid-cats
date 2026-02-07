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

/* global Logger, mw */

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
   * Edit a page.
   *
   * Delegates to `mw.Api.postWithToken('csrf', …)` which handles
   * token fetching, caching, and automatic retry on `badtoken` errors.
   *
   * @param {string} title   - Page title
   * @param {string} content - New page content (wikitext)
   * @param {string} summary - Edit summary
   * @returns {Promise<Object>} API response
   */
  async editPage(title, content, summary) {
    const api = this._getMwApi();
    return api.postWithToken('csrf', {
      action: 'edit',
      title: title,
      text: content,
      summary: summary,
      format: 'json'
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
}
