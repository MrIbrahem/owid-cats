# Category Batch Manager for OWID Importer

A Wikimedia Commons gadget for efficient batch categorization of images uploaded by the OWID importer tool.

## Features

- **Pattern-based Search**: Search files within a category using pattern matching (e.g., `,BLR.svg` to find Belarus charts)
- **Optimized Performance**: Uses MediaWiki Search API for lightning-fast results even in categories with 100,000+ files (see [PERFORMANCE.md](PERFORMANCE.md))
- **MediaWiki API Integration**: Uses native `mw.Api.edit()` and `mw.Api.getCategories()` for better conflict handling and performance (see [API_IMPROVEMENTS.md](API_IMPROVEMENTS.md))
- **Bulk Category Operations**: Add or remove categories from multiple files at once
- **Preview Changes**: Review what will change before applying edits
- **Progress Tracking**: Real-time progress bar with success/failure counts
- **Error Recovery**: Failed operations are logged and can be retried
- **Rate Limiting**: Automatic throttling to respect API limits
- **Flexible Source**: Search in any category, not just the current page

## Installation

### As a Wikimedia Commons Gadget

1. Go to your [Commons preferences](https://commons.wikimedia.org/wiki/Special:Preferences#mw-prefsection-gadgets)
2. Navigate to the Gadgets tab
3. Enable "Category Batch Manager"
4. Save preferences

### Manual Installation

Add the following to your `common.js` on Wikimedia Commons:

```javascript
mw.loader.load('//commons.wikimedia.org/w/index.php?title=MediaWiki:Gadget-CategoryBatchManager.js&action=raw&ctype=text/javascript');
```

## Usage

1. Navigate to any category page on Wikimedia Commons
2. Click "Batch Manager" in the page actions menu
3. Enter a search pattern (e.g., `,BLR.svg`)
4. Click "Search"
5. Review results and remove unwanted files using the ✕ button
6. Enter categories to add and/or remove (comma-separated)
7. Optionally click "Preview Changes" to see what will be modified
8. Click "GO" to execute the batch operation

## Example

To add `Category:Belarus` and `Category:Europe` to all Belarus charts:

1. Open `Category:Uploaded_by_OWID_importer_tool`
2. Open Batch Manager
3. Search pattern: `,BLR.svg`
4. Add categories: `Category:Belarus, Category:Europe`
5. Click "GO"

## Project Structure

```
category-batch-manager/
├── src/
│   ├── ui/
│   │   ├── components/
│   │   │   ├── SearchPanel.js
│   │   │   ├── FileList.js
│   │   │   ├── CategoryInputs.js
│   │   │   └── ProgressBar.js
│   │   └── styles/
│   │       └── main.css
│   ├── services/
│   │   ├── APIService.js
│   │   ├── CategoryService.js
│   │   ├── FileService.js
│   │   ├── BatchProcessor.js
│   │   └── ErrorRecovery.js
│   ├── models/
│   │   ├── FileModel.js
│   │   └── CategoryOperation.js
│   ├── utils/
│   │   ├── WikitextParser.js
│   │   ├── Validator.js
│   │   ├── Logger.js
│   │   ├── RateLimiter.js
│   │   └── UsageLogger.js
│   ├── main.js
│   └── gadget-entry.js
├── tests/
│   └── unit/
│       ├── WikitextParser.test.js
│       ├── Validator.test.js
│       ├── BatchProcessor.test.js
│       ├── CategoryService.test.js
│       └── FileService.test.js
├── docs/
├── gplan.md
├── package.json
└── README.md
```

## Development

### Prerequisites

- Node.js (for running tests)

### Running Tests

```bash
npm install
npm test
```

### Architecture

The tool follows a layered architecture:

- **UI Layer**: Components for search, file list, category inputs, progress display
- **Controller Layer**: `CategoryBatchManagerUI` manages state and user interactions
- **Service Layer**: `APIService`, `FileService`, `CategoryService`, `BatchProcessor`
- **Data Layer**: `FileModel`, `CategoryOperation` models
- **Utilities**: `WikitextParser`, `Validator`, `Logger`, `RateLimiter`

## API

### WikitextParser

```javascript
const parser = new WikitextParser();
parser.extractCategories(wikitext);   // Returns array of category names
parser.hasCategory(wikitext, name);   // Returns boolean
parser.addCategory(wikitext, name);   // Returns modified wikitext
parser.removeCategory(wikitext, name); // Returns modified wikitext
```

### BatchProcessor

```javascript
const processor = new BatchProcessor(categoryService);
await processor.previewChanges(files, toAdd, toRemove);
await processor.processBatch(files, toAdd, toRemove, callbacks);
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request
