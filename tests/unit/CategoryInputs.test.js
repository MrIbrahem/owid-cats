const CategoryInputs = require('../../src/ui/components/CategoryInputs');

// Mock DOM elements
function createMockElement(id, value) {
  const element = {
    id,
    value,
    className: 'cdx-text-input__input'
  };
  return element;
}

// Mock document.getElementById
global.document = {
  getElementById: (id) => {
    const elements = {
      'cbm-add-cats': createMockElement('cbm-add-cats', ''),
      'cbm-remove-cats': createMockElement('cbm-remove-cats', ''),
      'cbm-summary': createMockElement('cbm-summary', 'Batch category update via Category Batch Manager')
    };
    return elements[id] || null;
  }
};

describe('CategoryInputs', () => {
  let categoryInputs;

  beforeEach(() => {
    categoryInputs = new CategoryInputs();
    // Reset input values
    global.document.getElementById('cbm-add-cats').value = '';
    global.document.getElementById('cbm-remove-cats').value = '';
    global.document.getElementById('cbm-summary').value = 'Batch category update via Category Batch Manager';
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
      global.document.getElementById('cbm-add-cats').value = 'Category:Belarus, Test';
      expect(categoryInputs.getCategoriesToAdd()).toEqual(['Category:Belarus', 'Category:Test']);
    });
  });

  describe('getCategoriesToRemove', () => {
    test('should return empty array when input is empty', () => {
      expect(categoryInputs.getCategoriesToRemove()).toEqual([]);
    });

    test('should return parsed categories', () => {
      global.document.getElementById('cbm-remove-cats').value = 'Category:Old, Another';
      expect(categoryInputs.getCategoriesToRemove()).toEqual(['Category:Old', 'Category:Another']);
    });
  });

  describe('getEditSummary', () => {
    test('should return default summary', () => {
      expect(categoryInputs.getEditSummary()).toBe('Batch category update via Category Batch Manager');
    });

    test('should return custom summary', () => {
      global.document.getElementById('cbm-summary').value = 'Custom summary';
      expect(categoryInputs.getEditSummary()).toBe('Custom summary');
    });

    test('should return empty string when input is missing', () => {
      global.document.getElementById = () => null;
      expect(categoryInputs.getEditSummary()).toBe('');
    });
  });

  describe('clear', () => {
    test('should clear add categories input', () => {
      global.document.getElementById('cbm-add-cats').value = 'Category:Test';
      categoryInputs.clear();
      expect(global.document.getElementById('cbm-add-cats').value).toBe('');
    });

    test('should clear remove categories input', () => {
      global.document.getElementById('cbm-remove-cats').value = 'Category:Old';
      categoryInputs.clear();
      expect(global.document.getElementById('cbm-remove-cats').value).toBe('');
    });

    test('should reset summary to default', () => {
      global.document.getElementById('cbm-summary').value = 'Custom summary';
      categoryInputs.clear();
      expect(global.document.getElementById('cbm-summary').value).toBe('Batch category update via Category Batch Manager');
    });
  });

  describe('createElement', () => {
    test('should create container with correct class', () => {
      const element = categoryInputs.createElement();
      expect(element.className).toBe('cbm-actions');
    });

    test('should create three input fields', () => {
      const element = categoryInputs.createElement();
      expect(element.children.length).toBe(3);
    });

    test('should have correct field labels', () => {
      const element = categoryInputs.createElement();
      const labels = element.querySelectorAll('.cdx-label__label__text');
      expect(labels.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('destroy', () => {
    test('should set widgets to null', () => {
      // Mock widgets with destroy method
      categoryInputs.addCategoriesWidget = { destroy: jest.fn() };
      categoryInputs.removeCategoriesWidget = { destroy: jest.fn() };
      categoryInputs.summaryWidget = { destroy: jest.fn() };

      categoryInputs.destroy();

      expect(categoryInputs.addCategoriesWidget).toBeNull();
      expect(categoryInputs.removeCategoriesWidget).toBeNull();
      expect(categoryInputs.summaryWidget).toBeNull();
    });

    test('should call destroy on widgets', () => {
      const destroyMock = jest.fn();
      categoryInputs.addCategoriesWidget = { destroy: destroyMock };
      categoryInputs.removeCategoriesWidget = { destroy: destroyMock };
      categoryInputs.summaryWidget = { destroy: destroyMock };

      categoryInputs.destroy();

      expect(destroyMock).toHaveBeenCalledTimes(3);
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
