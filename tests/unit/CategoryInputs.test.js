const CategoryInputs = require('../../src/ui/components/CategoryInputs');

// Mock DOM elements
const mockElements = {
  'cbm-add-cats': { id: 'cbm-add-cats', value: '', className: 'cdx-text-input__input' },
  'cbm-remove-cats': { id: 'cbm-remove-cats', value: '', className: 'cdx-text-input__input' },
  'cbm-summary': { id: 'cbm-summary', value: 'Batch category update via Category Batch Manager', className: 'cdx-text-input__input' }
};

// Mock document
global.document = {
  getElementById: (id) => mockElements[id] || null,
  createElement: (tagName) => {
    let _innerHTML = '';
    return {
      tagName,
      className: '',
      id: '',
      get innerHTML() { return _innerHTML; },
      set innerHTML(value) { _innerHTML = value; },
      children: [],
      childNodes: [],
      querySelectorAll: () => [],
      appendChild: (child) => {}
    };
  }
};

describe('CategoryInputs', () => {
  let categoryInputs;

  beforeEach(() => {
    // Reset input values before each test
    mockElements['cbm-add-cats'].value = '';
    mockElements['cbm-remove-cats'].value = '';
    mockElements['cbm-summary'].value = 'Batch category update via Category Batch Manager';

    categoryInputs = new CategoryInputs();
  });

  describe('constructor', () => {
    test('should initialize with null apiService', () => {
      expect(categoryInputs.apiService).toBeNull();
    });

    test('should initialize with null widgets', () => {
      expect(categoryInputs.addCategoriesWidget).toBeNull();
      expect(categoryInputs.removeCategoriesWidget).toBeNull();
      expect(categoryInputs.summaryWidget).toBeNull();
    });
  });

  describe('parseCategories', () => {
    test('should parse single category with prefix', () => {
      const result = categoryInputs.parseCategories('Category:Test');
      expect(result).toEqual(['Category:Test']);
    });

    test('should add Category: prefix to category without prefix', () => {
      const result = categoryInputs.parseCategories('Test');
      expect(result).toEqual(['Category:Test']);
    });

    test('should parse multiple comma-separated categories', () => {
      const result = categoryInputs.parseCategories('Category:Belarus, Category:Europe, Test');
      expect(result).toEqual(['Category:Belarus', 'Category:Europe', 'Category:Test']);
    });

    test('should trim whitespace around categories', () => {
      const result = categoryInputs.parseCategories('  Category:Test  ,  Another  ');
      expect(result).toEqual(['Category:Test', 'Category:Another']);
    });

    test('should filter out empty strings', () => {
      const result = categoryInputs.parseCategories('Category:Test, , Category:Another');
      expect(result).toEqual(['Category:Test', 'Category:Another']);
    });

    test('should return empty array for empty input', () => {
      expect(categoryInputs.parseCategories('')).toEqual([]);
      expect(categoryInputs.parseCategories('   ')).toEqual([]);
      expect(categoryInputs.parseCategories(', , ,')).toEqual([]);
    });

    test('should handle category names with spaces', () => {
      const result = categoryInputs.parseCategories('Category:Our World in Data, Test Category');
      expect(result).toEqual(['Category:Our World in Data', 'Category:Test Category']);
    });

    test('should handle category names with underscores', () => {
      const result = categoryInputs.parseCategories('Category:Our_World_in_Data');
      expect(result).toEqual(['Category:Our_World_in_Data']);
    });
  });

  describe('getCategoriesToAdd', () => {
    test('should return empty array when input is empty', () => {
      expect(categoryInputs.getCategoriesToAdd()).toEqual([]);
    });

    test('should return parsed categories', () => {
      mockElements['cbm-add-cats'].value = 'Category:Belarus, Test';
      expect(categoryInputs.getCategoriesToAdd()).toEqual(['Category:Belarus', 'Category:Test']);
    });
  });

  describe('getCategoriesToRemove', () => {
    test('should return empty array when input is empty', () => {
      expect(categoryInputs.getCategoriesToRemove()).toEqual([]);
    });

    test('should return parsed categories', () => {
      mockElements['cbm-remove-cats'].value = 'Category:Old, Another';
      expect(categoryInputs.getCategoriesToRemove()).toEqual(['Category:Old', 'Category:Another']);
    });
  });

  describe('getEditSummary', () => {
    test('should return default summary', () => {
      expect(categoryInputs.getEditSummary()).toBe('Batch category update via Category Batch Manager');
    });

    test('should return custom summary', () => {
      mockElements['cbm-summary'].value = 'Custom summary';
      expect(categoryInputs.getEditSummary()).toBe('Custom summary');
    });

    test('should return empty string when input is missing', () => {
      const originalGetElementById = global.document.getElementById;
      global.document.getElementById = () => null;
      expect(categoryInputs.getEditSummary()).toBe('');
      global.document.getElementById = originalGetElementById;
    });
  });

  describe('clear', () => {
    test('should clear add categories input', () => {
      mockElements['cbm-add-cats'].value = 'Category:Test';
      categoryInputs.clear();
      expect(mockElements['cbm-add-cats'].value).toBe('');
    });

    test('should clear remove categories input', () => {
      mockElements['cbm-remove-cats'].value = 'Category:Old';
      categoryInputs.clear();
      expect(mockElements['cbm-remove-cats'].value).toBe('');
    });

    test('should reset summary to default', () => {
      mockElements['cbm-summary'].value = 'Custom summary';
      categoryInputs.clear();
      expect(mockElements['cbm-summary'].value).toBe('Batch category update via Category Batch Manager');
    });
  });

  describe('createElement', () => {
    test('should create element with className property', () => {
      const element = categoryInputs.createElement();
      expect(element).toHaveProperty('className', 'cbm-actions');
    });

    test('should return an element', () => {
      const element = categoryInputs.createElement();
      expect(element).toBeDefined();
      expect(typeof element).toBe('object');
    });
  });

  describe('destroy', () => {
    test('should set widgets to null', () => {
      // Mock widgets with destroy method
      categoryInputs.addCategoriesWidget = { destroy: () => {} };
      categoryInputs.removeCategoriesWidget = { destroy: () => {} };
      categoryInputs.summaryWidget = { destroy: () => {} };

      categoryInputs.destroy();

      expect(categoryInputs.addCategoriesWidget).toBeNull();
      expect(categoryInputs.removeCategoriesWidget).toBeNull();
      expect(categoryInputs.summaryWidget).toBeNull();
    });

    test('should call destroy on widgets', () => {
      let destroyCallCount = 0;
      const destroyMock = () => { destroyCallCount++; };
      categoryInputs.addCategoriesWidget = { destroy: destroyMock };
      categoryInputs.removeCategoriesWidget = { destroy: destroyMock };
      categoryInputs.summaryWidget = { destroy: destroyMock };

      categoryInputs.destroy();

      expect(destroyCallCount).toBe(3);
    });

    test('should handle null widgets gracefully', () => {
      expect(() => categoryInputs.destroy()).not.toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle null input in parseCategories', () => {
      // @ts-ignore - testing null input
      expect(() => categoryInputs.parseCategories(null)).not.toThrow();
    });

    test('should handle categories with only whitespace', () => {
      const result = categoryInputs.parseCategories('   ,  ,  ');
      expect(result).toEqual([]);
    });

    test('should handle mixed valid and invalid categories', () => {
      const result = categoryInputs.parseCategories('Category:Valid, , Another Valid, ,   ');
      expect(result).toEqual(['Category:Valid', 'Category:Another Valid']);
    });
  });
});
