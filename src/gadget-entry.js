/**
 * Gadget entry point for Category Batch Manager
 *
 * Adds a "Batch Manager" button to category pages in Wikimedia Commons.
 * When clicked, opens the Category Batch Manager UI.
 */

/* global mw, CategoryBatchManagerUI */

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
