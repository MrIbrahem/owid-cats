/**
 * Tests for CategoryInputs UI component
 */

describe('CategoryInputs', () => {
    let CategoryInputs;

    beforeAll(() => {
        CategoryInputs = require('../../src/ui/components/CategoryInputs');
    });

    describe('parseCategories', () => {
        let inputs;

        beforeEach(() => {
            inputs = new CategoryInputs();
        });

        test('should parse comma-separated categories', () => {
            const result = inputs.parseCategories('Category:Test, Category:Example');
            expect(result).toEqual(['Category:Test', 'Category:Example']);
        });

        test('should auto-add Category: prefix if missing', () => {
            const result = inputs.parseCategories('Belarus, Europe');
            expect(result).toEqual(['Category:Belarus', 'Category:Europe']);
        });

        test('should handle mixed with and without prefix', () => {
            const result = inputs.parseCategories('Category:Belarus, Europe, Category:Asia');
            expect(result).toEqual(['Category:Belarus', 'Category:Europe', 'Category:Asia']);
        });

        test('should trim whitespace from category names', () => {
            const result = inputs.parseCategories('  Category:Test  ,  Category:Example  ');
            expect(result).toEqual(['Category:Test', 'Category:Example']);
        });

        test('should filter out empty strings', () => {
            const result = inputs.parseCategories('Category:Test, , Category:Example');
            expect(result).toEqual(['Category:Test', 'Category:Example']);
        });

        test('should return empty array for empty input', () => {
            expect(inputs.parseCategories('')).toEqual([]);
            expect(inputs.parseCategories('   ')).toEqual([]);
        });

        test('should return empty array for null input', () => {
            expect(inputs.parseCategories(null)).toEqual([]);
        });

        test('should return empty array for undefined input', () => {
            expect(inputs.parseCategories(undefined)).toEqual([]);
        });

        test('should handle single category', () => {
            const result = inputs.parseCategories('Category:Test');
            expect(result).toEqual(['Category:Test']);
        });

        test('should handle category with spaces after normalization', () => {
            const result = inputs.parseCategories('Our_World_in_Data');
            expect(result).toEqual(['Category:Our_World_in_Data']);
        });

        test('should handle categories with special characters', () => {
            const result = inputs.parseCategories('Category:Test-123, Category:Test_456');
            expect(result).toEqual(['Category:Test-123', 'Category:Test_456']);
        });

        test('should handle trailing commas', () => {
            const result = inputs.parseCategories('Category:Test, Category:Example,');
            expect(result).toEqual(['Category:Test', 'Category:Example']);
        });

        test('should handle leading commas', () => {
            const result = inputs.parseCategories(',Category:Test, Category:Example');
            expect(result).toEqual(['Category:Test', 'Category:Example']);
        });
    });
});
