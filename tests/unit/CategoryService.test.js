const CategoryService = require('../../src/services/CategoryService');
const WikitextParser = require('../../src/utils/WikitextParser');

// Make WikitextParser available globally for CategoryService
global.WikitextParser = WikitextParser;

describe('CategoryService', () => {
  let service;
  let mockApi;

  beforeEach(() => {
    mockApi = {
      getPageContent: jest.fn(),
      editPage: jest.fn().mockResolvedValue({ edit: { result: 'Success' } })
    };
    service = new CategoryService(mockApi);
  });

  describe('addCategories', () => {
    test('should add new category to page', async () => {
      mockApi.getPageContent.mockResolvedValue(
        'Some text\n[[Category:Existing]]'
      );

      const result = await service.addCategories('File:Test.svg', ['Category:New']);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(mockApi.editPage).toHaveBeenCalled();
    });

    test('should not edit if category already exists', async () => {
      mockApi.getPageContent.mockResolvedValue(
        'Some text\n[[Category:Existing]]'
      );

      const result = await service.addCategories('File:Test.svg', ['Category:Existing']);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
      expect(mockApi.editPage).not.toHaveBeenCalled();
    });
  });

  describe('removeCategories', () => {
    test('should remove existing category', async () => {
      mockApi.getPageContent.mockResolvedValue(
        'Some text\n[[Category:ToRemove]]\n[[Category:Keep]]'
      );

      const result = await service.removeCategories('File:Test.svg', ['Category:ToRemove']);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(mockApi.editPage).toHaveBeenCalled();
    });

    test('should not edit if category does not exist', async () => {
      mockApi.getPageContent.mockResolvedValue(
        'Some text\n[[Category:Keep]]'
      );

      const result = await service.removeCategories('File:Test.svg', ['Category:NonExistent']);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
      expect(mockApi.editPage).not.toHaveBeenCalled();
    });
  });

  describe('updateCategories', () => {
    test('should add and remove in single operation', async () => {
      mockApi.getPageContent.mockResolvedValue(
        'Some text\n[[Category:Old]]'
      );

      const result = await service.updateCategories(
        'File:Test.svg',
        ['Category:New'],
        ['Category:Old']
      );

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(mockApi.editPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('buildEditSummary', () => {
    test('should build summary with additions', () => {
      const summary = service.buildEditSummary(['Category:A'], []);
      expect(summary).toContain('+Category:A');
    });

    test('should build summary with removals', () => {
      const summary = service.buildEditSummary([], ['Category:B']);
      expect(summary).toContain('-Category:B');
    });

    test('should build summary with both', () => {
      const summary = service.buildEditSummary(['Category:A'], ['Category:B']);
      expect(summary).toContain('+Category:A');
      expect(summary).toContain('-Category:B');
    });
  });
});
