/**
 * Tests for CategoryInputs UI component
 */

describe('CategoryInputs', () => {
    let CategoryInputs;
    let mockApiService;

    beforeAll(() => {
        CategoryInputs = require('../../src/ui/components/CategoryInputs');
    });

    beforeEach(() => {
        // Mock APIService
        mockApiService = {
            searchCategories: jest.fn().mockResolvedValue([])
        };
    });

    describe('constructor', () => {
        test('should store apiService', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.apiService).toBe(mockApiService);
        });

        test('should initialize with null activeDropdown', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.activeDropdown).toBeNull();
        });

        test('should initialize with selectedIndex -1', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.selectedIndex).toBe(-1);
        });
    });

    describe('parseCategories', () => {
        let inputs;

        beforeEach(() => {
            inputs = new CategoryInputs(mockApiService);
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

    describe('escapeHtml', () => {
        test('should escape HTML special characters', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.escapeHtml('<script>')).toBe('&lt;script&gt;');
            expect(inputs.escapeHtml('&')).toBe('&amp;');
            expect(inputs.escapeHtml('"')).toBe('&quot;');
            expect(inputs.escapeHtml("'")).toBe('&#039;');
        });

        test('should handle empty string', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.escapeHtml('')).toBe('');
        });

        test('should handle normal text', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.escapeHtml('Category:Test')).toBe('Category:Test');
        });

        test('should escape multiple special characters', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(inputs.escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#039;');
        });
    });

    describe('hideDropdown', () => {
        test('should set activeDropdown to null', () => {
            const inputs = new CategoryInputs(mockApiService);
            const mockDropdown = { remove: jest.fn() };
            inputs.activeDropdown = mockDropdown;
            inputs.selectedIndex = 5;

            inputs.hideDropdown();

            expect(mockDropdown.remove).toHaveBeenCalled();
            expect(inputs.activeDropdown).toBeNull();
            expect(inputs.selectedIndex).toBe(-1);
        });

        test('should handle null activeDropdown', () => {
            const inputs = new CategoryInputs(mockApiService);
            expect(() => inputs.hideDropdown()).not.toThrow();
        });
    });
});
