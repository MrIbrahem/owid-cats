/**
 * Service for interacting with MediaWiki API
 *
 * When running inside MediaWiki (mw.Api available), all requests go through
 * mw.Api which handles CSRF-token management, automatic bad-token retry,
 * and correct origin headers.  A plain fetch() fallback is kept for the
 * Node / test environment where mw is not available.
 *
 * @class APIService
 */

/* global Logger, mw */

class APIService {
  constructor() {
    /** @type {string} Fallback endpoint used when mw.Api is unavailable */
    this.baseURL = 'https://commons.wikimedia.org/w/api.php';

    /**
     * Native MediaWiki API helper – instantiated lazily on first use.
     * @type {mw.Api|null}
     */
    this.mwApi = null;

    /** @type {string|null} CSRF token cache (fetch-fallback only) */
    this.csrfToken = null;
  }

  /* ------------------------------------------------------------------ */
  /*  mw.Api helper                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Return (and lazily create) an mw.Api instance.
   * Returns null when mw.Api is not available (e.g. in tests).
   * @returns {mw.Api|null}
   */
  _getMwApi() {
    if (this.mwApi) return this.mwApi;
    if (typeof mw !== 'undefined' && mw.Api) {
      this.mwApi = new mw.Api();
    }
    return this.mwApi;
  }

  /* ------------------------------------------------------------------ */
  /*  Public helpers used by other services                              */
  /* ------------------------------------------------------------------ */

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
   * Edit a page.
   *
   * When mw.Api is available the call is delegated to
   * `api.postWithToken('csrf', …)` which handles token fetching,
   * caching **and** automatic retry on `badtoken` errors.
   *
   * @param {string} title   - Page title
   * @param {string} content - New page content (wikitext)
   * @param {string} summary - Edit summary
   * @returns {Promise<Object>} API response
   */
  async editPage(title, content, summary) {
    const api = this._getMwApi();

    if (api) {
      // ── mw.Api path (production) ──────────────────────────────
      return api.postWithToken('csrf', {
        action: 'edit',
        title: title,
        text: content,
        summary: summary,
        format: 'json'
      });
    }

    // ── fetch fallback (tests / non-MW environments) ───────────
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

  /* ------------------------------------------------------------------ */
  /*  Low-level request methods                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Get CSRF token for editing (fetch-fallback only).
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

    if (!data.query || !data.query.tokens || !data.query.tokens.csrftoken) {
      throw new Error('Failed to obtain CSRF token – are you logged in?');
    }

    this.csrfToken = data.query.tokens.csrftoken;
    return this.csrfToken;
  }

  /**
   * Make a GET request to the MediaWiki API.
   *
   * Uses mw.Api.get() when available, otherwise falls back to fetch().
   *
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Parsed JSON response
   */
  async makeRequest(params) {
    const api = this._getMwApi();

    if (api) {
      return api.get(params);
    }

    // ── fetch fallback ─────────────────────────────────────────
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
   * Make a POST request to the MediaWiki API (fetch-fallback only).
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
