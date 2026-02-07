/**
 * Tests for CategoryBatchManagerUI
 * Testing the UI fixes: modal closing, file list persistence, message display
 */

// Mock dependencies
jest.mock('../../src/services/APIService');
jest.mock('../../src/services/FileService');
jest.mock('../../src/services/CategoryService');
jest.mock('../../src/services/BatchProcessor');

const CategoryBatchManagerUI = require('../../src/main');

describe('CategoryBatchManagerUI', () => {
  let ui;
  let mockApiService;
  let mockFileService;
  let mockCategoryService;
  let mockBatchProcessor;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';

    // Mock mw.config
    global.mw = {
      config: {
        get: jest.fn().mockReturnValue('Category:Test')
      }
    };

    // Mock services
    mockApiService = {};
    mockFileService = {
      searchFiles: jest.fn()
    };
    mockCategoryService = {};
    mockBatchProcessor = {
      previewChanges: jest.fn(),
      processBatch: jest.fn()
    };

    // Mock global UsageLogger
    global.UsageLogger = {
      logSearch: jest.fn(),
      logBatchOperation: jest.fn()
    };

    // Create UI instance
    ui = new CategoryBatchManagerUI();
  });

  afterEach(() => {
    delete global.mw;
    delete global.UsageLogger;
    jest.clearAllMocks();
  });

  describe('UI Creation', () => {
    test('should create main container', () => {
      const container = document.getElementById('category-batch-manager');
      expect(container).toBeTruthy();
      expect(container.className).toBe('cbm-container');
    });

    test('should create all required elements', () => {
      expect(document.getElementById('cbm-source-category')).toBeTruthy();
      expect(document.getElementById('cbm-pattern')).toBeTruthy();
      expect(document.getElementById('cbm-search-btn')).toBeTruthy();
      expect(document.getElementById('cbm-file-list')).toBeTruthy();
      expect(document.getElementById('cbm-results-message')).toBeTruthy();
      expect(document.getElementById('cbm-add-cats')).toBeTruthy();
      expect(document.getElementById('cbm-remove-cats')).toBeTruthy();
      expect(document.getElementById('cbm-preview')).toBeTruthy();
      expect(document.getElementById('cbm-execute')).toBeTruthy();
    });

    test('should create preview modal', () => {
      const modal = document.getElementById('cbm-preview-modal');
      expect(modal).toBeTruthy();
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('should create separate message area', () => {
      const messageArea = document.getElementById('cbm-results-message');
      const fileList = document.getElementById('cbm-file-list');

      expect(messageArea).toBeTruthy();
      expect(fileList).toBeTruthy();
      expect(messageArea).not.toBe(fileList);
    });
  });

  describe('Message Display (Bug Fix)', () => {
    test('should show message in message container, not file list', () => {
      ui.showMessage('Test message', 'notice');

      const messageContainer = document.getElementById('cbm-results-message');
      const fileList = document.getElementById('cbm-file-list');

      expect(messageContainer.innerHTML).toContain('Test message');
      expect(fileList.innerHTML).toBe('');
    });

    test('should display different message types', () => {
      const types = ['notice', 'warning', 'error', 'success'];

      types.forEach(type => {
        ui.showMessage(`Test ${type}`, type);
        const messageContainer = document.getElementById('cbm-results-message');
        expect(messageContainer.innerHTML).toContain(`cdx-message--${type}`);
      });
    });

    test('should clear messages', () => {
      ui.showMessage('Test message', 'notice');
      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).not.toBe('');

      ui.clearMessage();
      expect(messageContainer.innerHTML).toBe('');
    });
  });

  describe('File List Persistence (Bug Fix)', () => {
    beforeEach(() => {
      ui.state.files = [
        { title: 'File:Test1.svg' },
        { title: 'File:Test2.svg' },
        { title: 'File:Test3.svg' }
      ];
      ui.renderFileList();
    });

    test('should keep file list visible after showing message', () => {
      const fileListBefore = document.getElementById('cbm-file-list').innerHTML;

      ui.showMessage('Operation complete', 'success');

      const fileListAfter = document.getElementById('cbm-file-list').innerHTML;
      expect(fileListAfter).toBe(fileListBefore);
      expect(fileListAfter).toContain('File:Test1.svg');
    });

    test('should keep file list visible after showing results', () => {
      const fileListBefore = document.getElementById('cbm-file-list').innerHTML;

      ui.showResults({
        total: 3,
        successful: 3,
        failed: 0,
        errors: []
      });

      const fileListAfter = document.getElementById('cbm-file-list').innerHTML;
      expect(fileListAfter).toBe(fileListBefore);
      expect(fileListAfter).toContain('File:Test1.svg');
    });

    test('should display results above file list', () => {
      ui.showResults({
        total: 3,
        successful: 2,
        failed: 1,
        errors: [{ file: 'File:Test1.svg', error: 'Test error' }]
      });

      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).toContain('Batch process complete');
      expect(messageContainer.innerHTML).toContain('Total: 3');
      expect(messageContainer.innerHTML).toContain('Successful: 2');
      expect(messageContainer.innerHTML).toContain('Failed: 1');

      const fileList = document.getElementById('cbm-file-list');
      expect(fileList.innerHTML).toContain('File:Test1.svg');
    });
  });

  describe('Preview Modal (Bug Fix)', () => {
    test('should show preview modal', () => {
      const preview = [
        {
          file: 'File:Test.svg',
          willChange: true,
          currentCategories: ['Old'],
          newCategories: ['New']
        }
      ];

      ui.showPreviewModal(preview);

      const modal = document.getElementById('cbm-preview-modal');
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    test('should hide preview modal', () => {
      const modal = document.getElementById('cbm-preview-modal');
      modal.classList.remove('hidden');

      ui.hidePreviewModal();

      expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('should close modal when clicking close button', () => {
      const modal = document.getElementById('cbm-preview-modal');
      modal.classList.remove('hidden');

      const closeBtn = document.getElementById('cbm-preview-close');
      closeBtn.click();

      expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('should close modal when clicking outside', () => {
      const modal = document.getElementById('cbm-preview-modal');
      modal.classList.remove('hidden');

      // Simulate click on modal background
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(clickEvent, 'target', {
        value: modal,
        enumerable: true
      });

      modal.dispatchEvent(clickEvent);

      expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('should not close modal when clicking inside content', () => {
      const modal = document.getElementById('cbm-preview-modal');
      modal.classList.remove('hidden');

      const content = document.getElementById('cbm-preview-content');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(clickEvent, 'target', {
        value: content,
        enumerable: true
      });

      modal.dispatchEvent(clickEvent);

      // Should still be visible
      expect(modal.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    test('should clear messages when starting new search', async () => {
      ui.showMessage('Old message', 'notice');

      document.getElementById('cbm-pattern').value = 'test';
      document.getElementById('cbm-source-category').value = 'Category:Test';

      mockFileService.searchFiles.mockResolvedValue([
        { title: 'File:Test.svg' }
      ]);

      await ui.handleSearch();

      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).toBe('');
    });

    test('should show warning if pattern is empty', async () => {
      document.getElementById('cbm-pattern').value = '';
      document.getElementById('cbm-source-category').value = 'Category:Test';

      await ui.handleSearch();

      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).toContain('Please enter a search pattern');
    });

    test('should show warning if source category is empty', async () => {
      document.getElementById('cbm-pattern').value = 'test';
      document.getElementById('cbm-source-category').value = '';

      await ui.handleSearch();

      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).toContain('Please enter a source category');
    });
  });

  describe('File Selection', () => {
    beforeEach(() => {
      ui.state.files = [
        { title: 'File:Test1.svg' },
        { title: 'File:Test2.svg' },
        { title: 'File:Test3.svg' }
      ];
      ui.renderFileList();
    });

    test('should select all files', () => {
      ui.selectAll();

      const checkboxes = document.querySelectorAll('.cbm-file-checkbox:checked');
      expect(checkboxes.length).toBe(3);
    });

    test('should deselect all files', () => {
      ui.selectAll();
      ui.deselectAll();

      const checkboxes = document.querySelectorAll('.cbm-file-checkbox:checked');
      expect(checkboxes.length).toBe(0);
    });

    test('should update selected count', () => {
      ui.selectAll();
      ui.updateSelectedCount();

      const countElement = document.getElementById('cbm-selected');
      expect(countElement.textContent).toBe('3');
    });

    test('should get selected files', () => {
      ui.selectAll();
      const selected = ui.getSelectedFiles();

      expect(selected.length).toBe(3);
      expect(selected[0].title).toBe('File:Test1.svg');
    });
  });

  describe('Category Parsing', () => {
    test('should parse comma-separated categories', () => {
      const result = ui.parseCategories('Belarus, Europe, Maps');
      expect(result).toEqual([
        'Category:Belarus',
        'Category:Europe',
        'Category:Maps'
      ]);
    });

    test('should handle categories with Category: prefix', () => {
      const result = ui.parseCategories('Category:Belarus, Europe');
      expect(result).toEqual([
        'Category:Belarus',
        'Category:Europe'
      ]);
    });

    test('should trim whitespace', () => {
      const result = ui.parseCategories('  Belarus  ,  Europe  ');
      expect(result).toEqual([
        'Category:Belarus',
        'Category:Europe'
      ]);
    });

    test('should filter empty entries', () => {
      const result = ui.parseCategories('Belarus, , Europe,,');
      expect(result).toEqual([
        'Category:Belarus',
        'Category:Europe'
      ]);
    });
  });

  describe('Results Display', () => {
    test('should display success results', () => {
      ui.showResults({
        total: 5,
        successful: 5,
        failed: 0,
        errors: []
      });

      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).toContain('cdx-message--success');
      expect(messageContainer.innerHTML).toContain('Successful: 5');
      expect(messageContainer.innerHTML).toContain('Failed: 0');
    });

    test('should display warning results when there are failures', () => {
      ui.showResults({
        total: 5,
        successful: 3,
        failed: 2,
        errors: [
          { file: 'File:Test1.svg', error: 'Error 1' },
          { file: 'File:Test2.svg', error: 'Error 2' }
        ]
      });

      const messageContainer = document.getElementById('cbm-results-message');
      expect(messageContainer.innerHTML).toContain('cdx-message--warning');
      expect(messageContainer.innerHTML).toContain('Failed: 2');
      expect(messageContainer.innerHTML).toContain('Error 1');
      expect(messageContainer.innerHTML).toContain('Error 2');
    });
  });

  describe('UI Cleanup', () => {
    test('should remove UI when closed', () => {
      expect(document.getElementById('category-batch-manager')).toBeTruthy();

      ui.close();

      expect(document.getElementById('category-batch-manager')).toBeFalsy();
    });
  });

  describe('Integration - Multiple Operations', () => {
    test('should allow multiple operations on same search results', async () => {
      // Setup files
      ui.state.files = [
        { title: 'File:Test1.svg' },
        { title: 'File:Test2.svg' }
      ];
      ui.renderFileList();

      // First operation
      ui.showResults({
        total: 2,
        successful: 2,
        failed: 0,
        errors: []
      });

      // Files should still be visible
      const fileList = document.getElementById('cbm-file-list');
      expect(fileList.innerHTML).toContain('File:Test1.svg');
      expect(fileList.innerHTML).toContain('File:Test2.svg');

      // Second operation
      ui.showResults({
        total: 2,
        successful: 2,
        failed: 0,
        errors: []
      });

      // Files should STILL be visible
      expect(fileList.innerHTML).toContain('File:Test1.svg');
      expect(fileList.innerHTML).toContain('File:Test2.svg');
    });
  });
});
