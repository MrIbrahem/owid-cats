const FileService = require('../../src/services/FileService');

describe('FileService', () => {
  let service;
  let mockApi;

  beforeEach(() => {
    mockApi = {
      getCategoryMembers: jest.fn(),
      getFileInfo: jest.fn()
    };
    service = new FileService(mockApi);
  });

  describe('createBatches', () => {
    test('should create batches of specified size', () => {
      const items = [1, 2, 3, 4, 5];
      const batches = service.createBatches(items, 2);
      expect(batches).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('should handle empty array', () => {
      const batches = service.createBatches([], 2);
      expect(batches).toEqual([]);
    });

    test('should handle array smaller than batch size', () => {
      const items = [1, 2];
      const batches = service.createBatches(items, 5);
      expect(batches).toEqual([[1, 2]]);
    });

    test('should handle array equal to batch size', () => {
      const items = [1, 2, 3];
      const batches = service.createBatches(items, 3);
      expect(batches).toEqual([[1, 2, 3]]);
    });
  });

  describe('searchFiles', () => {
    test('should filter files by pattern', async () => {
      mockApi.getCategoryMembers.mockResolvedValue([
        { title: 'File:Chart,BLR.svg', pageid: 1 },
        { title: 'File:Chart,USA.svg', pageid: 2 },
        { title: 'File:Chart,BLR_2.svg', pageid: 3 }
      ]);

      mockApi.getFileInfo.mockResolvedValue({
        query: {
          pages: {
            '1': { title: 'File:Chart,BLR.svg', pageid: 1, categories: [] },
            '3': { title: 'File:Chart,BLR_2.svg', pageid: 3, categories: [] }
          }
        }
      });

      const result = await service.searchFiles(
        'Category:Test',
        ',BLR'
      );

      expect(result).toHaveLength(2);
    });

    test('should return empty array when no matches', async () => {
      mockApi.getCategoryMembers.mockResolvedValue([
        { title: 'File:Chart,USA.svg', pageid: 1 }
      ]);

      const result = await service.searchFiles(
        'Category:Test',
        ',BLR'
      );

      expect(result).toEqual([]);
    });
  });

  describe('parseFileInfo', () => {
    test('should parse API response into file models', () => {
      const apiResponse = {
        query: {
          pages: {
            '123': {
              title: 'File:Test.svg',
              pageid: 123,
              categories: [
                { title: 'Category:A' },
                { title: 'Category:B' }
              ]
            }
          }
        }
      };

      const result = service.parseFileInfo(apiResponse);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('File:Test.svg');
      expect(result[0].pageid).toBe(123);
      expect(result[0].currentCategories).toEqual(['Category:A', 'Category:B']);
    });

    test('should skip missing pages (negative ids)', () => {
      const apiResponse = {
        query: {
          pages: {
            '-1': { title: 'File:Missing.svg', missing: '' }
          }
        }
      };

      const result = service.parseFileInfo(apiResponse);
      expect(result).toHaveLength(0);
    });
  });
});
