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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressBar;
}
