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

/* global APIService, FileService, CategoryService, BatchProcessor, UsageLogger */

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryBatchManagerUI;
}
