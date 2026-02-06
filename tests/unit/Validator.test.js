const Validator = require('../../src/utils/Validator');

describe('Validator', () => {
  describe('isValidCategoryName', () => {
    test('should accept valid category name', () => {
      expect(Validator.isValidCategoryName('Category:Test')).toBe(true);
    });

    test('should accept name without prefix', () => {
      expect(Validator.isValidCategoryName('Test Category')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(Validator.isValidCategoryName('')).toBe(false);
    });

    test('should reject null', () => {
      expect(Validator.isValidCategoryName(null)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(Validator.isValidCategoryName(undefined)).toBe(false);
    });

    test('should reject names with invalid characters', () => {
      expect(Validator.isValidCategoryName('Test#Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test<Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test>Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test[Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test]Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test{Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test}Name')).toBe(false);
      expect(Validator.isValidCategoryName('Test|Name')).toBe(false);
    });

    test('should reject whitespace-only', () => {
      expect(Validator.isValidCategoryName('   ')).toBe(false);
    });

    test('should reject Category: prefix only', () => {
      expect(Validator.isValidCategoryName('Category:')).toBe(false);
    });
  });

  describe('isValidSearchPattern', () => {
    test('should accept valid pattern', () => {
      expect(Validator.isValidSearchPattern(',BLR.svg')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(Validator.isValidSearchPattern('')).toBe(false);
    });

    test('should reject null', () => {
      expect(Validator.isValidSearchPattern(null)).toBe(false);
    });

    test('should reject undefined', () => {
      expect(Validator.isValidSearchPattern(undefined)).toBe(false);
    });

    test('should reject whitespace-only', () => {
      expect(Validator.isValidSearchPattern('   ')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should trim whitespace', () => {
      expect(Validator.sanitizeInput('  hello  ')).toBe('hello');
    });

    test('should return empty string for null', () => {
      expect(Validator.sanitizeInput(null)).toBe('');
    });

    test('should return empty string for undefined', () => {
      expect(Validator.sanitizeInput(undefined)).toBe('');
    });

    test('should return empty string for non-string', () => {
      expect(Validator.sanitizeInput(123)).toBe('');
    });

    test('should handle empty string', () => {
      expect(Validator.sanitizeInput('')).toBe('');
    });
  });
});
