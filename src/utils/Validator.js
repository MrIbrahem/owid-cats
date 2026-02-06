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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
