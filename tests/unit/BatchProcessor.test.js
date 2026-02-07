const BatchProcessor = require('../../src/services/BatchProcessor');

// Mock RateLimiter
global.RateLimiter = class {
  async wait() { return Promise.resolve(); }
};

describe('BatchProcessor', () => {
  let processor;
  let mockCategoryService;

  beforeEach(() => {
    mockCategoryService = {
      updateCategories: jest.fn().mockResolvedValue({ success: true, modified: true })
    };
    processor = new BatchProcessor(mockCategoryService);
  });

  describe('previewChanges', () => {
    test('should show files that will change', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A'] }
      ];

      const result = await processor.previewChanges(
        files,
        ['Category:B'],
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(true);
      expect(result[0].newCategories).toContain('Category:B');
      expect(result[0].newCategories).toContain('Category:A');
    });

    test('should show files that will not change', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A'] }
      ];

      const result = await processor.previewChanges(
        files,
        ['Category:A'],
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(false);
    });

    test('should handle removal preview', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A', 'Category:B'] }
      ];

      const result = await processor.previewChanges(
        files,
        [],
        ['Category:A']
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(true);
      expect(result[0].newCategories).toEqual(['Category:B']);
    });

    test('should handle combined add and remove', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:Old'] }
      ];

      const result = await processor.previewChanges(
        files,
        ['Category:New'],
        ['Category:Old']
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(true);
      expect(result[0].newCategories).toEqual(['Category:New']);
    });

    test('should handle empty files array', async () => {
      const result = await processor.previewChanges([], ['Category:A'], []);
      expect(result).toEqual([]);
    });

    test('should handle files without currentCategories', async () => {
      const files = [
        { title: 'File:Test.svg' }
      ];

      const result = await processor.previewChanges(
        files,
        ['Category:A'],
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(true);
      expect(result[0].newCategories).toEqual(['Category:A']);
    });

    test('should throw error when trying to add duplicate categories', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A', 'Category:B'] }
      ];

      await expect(
        processor.previewChanges(files, ['Category:A'], [])
      ).rejects.toThrow('The following categories already exist and cannot be added: Category:A');
    });

    test('should throw error for multiple duplicate categories', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A', 'Category:B', 'Category:C'] }
      ];

      await expect(
        processor.previewChanges(files, ['Category:A', 'Category:B'], [])
      ).rejects.toThrow('The following categories already exist and cannot be added: Category:A, Category:B');
    });

    test('should allow removing duplicate categories', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A', 'Category:B'] }
      ];

      const result = await processor.previewChanges(
        files,
        [],
        ['Category:A']
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(true);
      expect(result[0].newCategories).toEqual(['Category:B']);
    });

    test('should allow adding and removing different categories', async () => {
      const files = [
        { title: 'File:Test.svg', currentCategories: ['Category:A'] }
      ];

      const result = await processor.previewChanges(
        files,
        ['Category:B'],
        ['Category:A']
      );

      expect(result).toHaveLength(1);
      expect(result[0].willChange).toBe(true);
      expect(result[0].newCategories).toEqual(['Category:B']);
    });
  });

  describe('processBatch', () => {
    test('should process all files successfully', async () => {
      const files = [
        { title: 'File:A.svg' },
        { title: 'File:B.svg' }
      ];

      const results = await processor.processBatch(
        files,
        ['Category:Test'],
        []
      );

      expect(results.total).toBe(2);
      expect(results.processed).toBe(2);
      expect(results.successful).toBe(2);
      expect(results.skipped).toBe(0);
      expect(results.failed).toBe(0);
      expect(results.errors).toHaveLength(0);
    }); test('should handle errors in individual files', async () => {
      mockCategoryService.updateCategories
        .mockResolvedValueOnce({ success: true, modified: true })
        .mockRejectedValueOnce(new Error('Edit conflict'));

      const files = [
        { title: 'File:A.svg' },
        { title: 'File:B.svg' }
      ];

      const results = await processor.processBatch(
        files,
        ['Category:Test'],
        []
      );

      expect(results.total).toBe(2);
      expect(results.processed).toBe(2);
      expect(results.successful).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.errors).toHaveLength(1);
      expect(results.errors[0].file).toBe('File:B.svg');
    });

    test('should count skipped files when no changes made', async () => {
      mockCategoryService.updateCategories
        .mockResolvedValueOnce({ success: true, modified: true })
        .mockResolvedValueOnce({ success: true, modified: false });

      const files = [
        { title: 'File:A.svg' },
        { title: 'File:B.svg' }
      ];

      const results = await processor.processBatch(
        files,
        ['Category:Test'],
        []
      );

      expect(results.total).toBe(2);
      expect(results.processed).toBe(2);
      expect(results.successful).toBe(1);
      expect(results.skipped).toBe(1);
      expect(results.failed).toBe(0);
    });

    test('should call progress callback', async () => {
      const onProgress = jest.fn();
      const files = [{ title: 'File:A.svg' }];

      await processor.processBatch(
        files,
        ['Category:Test'],
        [],
        { onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
    });

    test('should call onFileComplete callback', async () => {
      const onFileComplete = jest.fn();
      const files = [{ title: 'File:A.svg' }];

      await processor.processBatch(
        files,
        ['Category:Test'],
        [],
        { onFileComplete }
      );

      expect(onFileComplete).toHaveBeenCalledWith(files[0], true);
    });

    test('should call onError callback on failure', async () => {
      mockCategoryService.updateCategories.mockRejectedValue(new Error('fail'));
      const onError = jest.fn();
      const files = [{ title: 'File:A.svg' }];

      await processor.processBatch(
        files,
        ['Category:Test'],
        [],
        { onError }
      );

      expect(onError).toHaveBeenCalled();
    });
  });
});
