# Comprehensive Plan for AI Agent to Build Wikimedia Commons Category Batch Manager Tool

## Project Overview

**Tool Name:** Category Batch Manager for OWID Importer  
**Purpose:** Enable efficient batch categorization of images in Wikimedia Commons by filtering files within a category using pattern matching, allowing selective exclusion, and applying category additions/removals to the filtered set.

**Target Category:** `Category:Uploaded_by_OWID_importer_tool`  
**Primary Use Case:** Organize country-specific SVG files (e.g., files containing ",BLR.svg", ",USA.svg") by adding appropriate geographic categories.

---

## Phase 1: Research & Analysis

### Task 1.1: Study MediaWiki API Documentation
**Objective:** Understand the technical foundation

**Actions:**
1. Read MediaWiki API documentation at https://www.mediawiki.org/wiki/API:Main_page
2. Focus on these specific API modules:
   - `action=query&list=categorymembers` - for fetching files from a category
   - `action=query&prop=categories` - for getting current categories of a file
   - `action=query&prop=revisions&rvprop=content` - for getting page content
   - `action=edit` - for editing pages
   - `action=query&meta=tokens` - for CSRF tokens

3. Study pagination with `cmcontinue` parameter
4. Understand rate limits and best practices
5. Research CORS policies and cross-origin requests

**Deliverables:**
- Document summarizing relevant API endpoints
- Code snippets for each API call
- Notes on authentication requirements

### Task 1.2: Analyze Existing Tools
**Objective:** Learn from existing solutions

**Actions:**
1. Study Cat-a-lot gadget source code:
   - Location: `MediaWiki:Gadget-Cat-a-lot.js`
   - Understand its architecture
   - Identify reusable patterns

2. Research other batch editing tools on Commons
3. Identify gaps that the new tool will fill

**Deliverables:**
- Comparison document
- List of code patterns to reuse
- List of improvements over existing tools

### Task 1.3: Study Wikimedia Commons File Structure
**Objective:** Understand the data we're working with

**Actions:**
1. Examine sample files from `Category:Uploaded_by_OWID_importer_tool`
2. Analyze naming patterns (e.g., "File:Example,BLR.svg")
3. Study how categories are embedded in wikitext
4. Understand file page structure

**Deliverables:**
- Document with file naming conventions
- Sample wikitext structures
- Category syntax patterns

### Task 1.4: Determine Permission Requirements
**Objective:** Ensure proper access

**Actions:**
1. Research required user rights for editing
2. Understand OAuth vs. cookie-based authentication
3. Check if bot approval is needed
4. Verify Gadget deployment permissions

**Deliverables:**
- Permission requirements checklist
- Authentication strategy document

---

## Phase 2: Architecture Design

### Task 2.1: Design System Architecture
**Objective:** Create a scalable, maintainable structure

**System Components:**

```
┌─────────────────────────────────────────┐
│         UI Layer (View)                 │
│  - Search Interface                     │
│  - File List Display                    │
│  - Category Input Fields                │
│  - Progress Indicators                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Controller Layer                   │
│  - Event Handlers                       │
│  - State Management                     │
│  - Validation Logic                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Service Layer                      │
│  - APIService (MediaWiki API calls)     │
│  - CategoryService (category operations)│
│  - FileService (file operations)        │
│  - BatchProcessor (bulk operations)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Data Layer                         │
│  - File Model                           │
│  - Category Model                       │
│  - Cache Manager                        │
└─────────────────────────────────────────┘
```

**Deliverables:**
- Architecture diagram
- Component responsibility matrix
- Data flow diagrams

### Task 2.2: Design Data Models
**Objective:** Define data structures

**Models:**

```javascript
// FileModel
{
  title: String,           // "File:Example,BLR.svg"
  pageid: Number,          // Unique page ID
  selected: Boolean,       // Is file selected for operation?
  currentCategories: Array, // ["Category:SVG", "Category:Charts"]
  thumbnail: String,       // URL to thumbnail (optional)
  size: Number            // File size in bytes (optional)
}

// CategoryOperation
{
  sourceCategory: String,  // "Category:Uploaded_by_OWID_importer_tool"
  searchPattern: String,   // ",BLR.svg"
  files: Array<FileModel>,
  categoriesToAdd: Array<String>,
  categoriesToRemove: Array<String>,
  status: String          // "idle", "processing", "complete", "error"
}

// ProgressState
{
  total: Number,
  processed: Number,
  successful: Number,
  failed: Number,
  errors: Array<{file: String, error: String}>
}
```

**Deliverables:**
- Complete data model specifications
- Validation rules for each model
- State transition diagrams

### Task 2.3: Design User Interface
**Objective:** Create intuitive, efficient UI

**UI Mockup:**

```html
┌──────────────────────────────────────────────────┐
│  Category Batch Manager - OWID Importer Tool    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Source Category: Category:Uploaded_by_OWID...  │
│                                                  │
│  ┌──────────────────────────────────┐           │
│  │ Search Pattern: [,BLR.svg      ] │ [Search]  │
│  └──────────────────────────────────┘           │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Found 47 files matching ",BLR.svg"         │ │
│  │                                            │ │
│  │ ☑ File:Chart_GDP,BLR.svg           [X]    │ │
│  │ ☑ File:Population_density,BLR.svg  [X]    │ │
│  │ ☑ File:Unemployment_rate,BLR.svg   [X]    │ │
│  │ ☑ File:Literacy_rate,BLR.svg       [X]    │ │
│  │ ... (43 more)                              │ │
│  │                                            │ │
│  │ [Select All] [Deselect All]               │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Add Categories (comma-separated):        │   │
│  │ [Category:Belarus, Category:Europe]      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Remove Categories (comma-separated):     │   │
│  │ [Category:Unsorted]                      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Edit Summary:                                   │
│  [Adding country category via Batch Manager]    │
│                                                  │
│  Selected: 45 files                              │
│                                                  │
│  [Preview Changes]  [        GO        ]        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Color Scheme:**
- Primary: Blue (#0645AD - Wikipedia link blue)
- Success: Green (#00AF89)
- Danger: Red (#D33)
- Warning: Orange (#FF9500)
- Background: Light gray (#F8F9FA)

**Deliverables:**
- Detailed UI wireframes
- CSS framework choice (or custom CSS plan)
- Accessibility considerations document
- Responsive design specifications

### Task 2.4: Design Error Handling Strategy
**Objective:** Ensure robustness

**Error Types & Handling:**

1. **Network Errors**
   - Retry logic (3 attempts with exponential backoff)
   - User notification
   - Ability to resume

2. **Permission Errors**
   - Check permissions before starting
   - Clear error messages
   - Link to help documentation

3. **Rate Limit Errors**
   - Automatic throttling
   - Progress preservation
   - Wait and retry

4. **Edit Conflicts**
   - Detect conflicts
   - Retry with fresh content
   - Log unresolvable conflicts

5. **Invalid Input**
   - Client-side validation
   - Clear validation messages
   - Prevent submission until valid

**Deliverables:**
- Error handling flowcharts
- Error message templates
- Logging strategy document

---

## Phase 3: Development Setup

### Task 3.1: Set Up Development Environment
**Objective:** Prepare for coding

**Actions:**
1. Create project directory structure:
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
│   │   └── BatchProcessor.js
│   ├── models/
│   │   ├── FileModel.js
│   │   └── CategoryOperation.js
│   ├── utils/
│   │   ├── WikitextParser.js
│   │   ├── Validator.js
│   │   └── Logger.js
│   └── main.js
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
└── README.md
```

2. Set up version control (Git)
3. Create test account on Wikimedia Commons
4. Install browser developer tools
5. Set up local testing environment

**Deliverables:**
- Complete project structure
- Git repository initialized
- Development checklist

### Task 3.2: Create Development Utilities
**Objective:** Build helper functions

**Utilities to Create:**

```javascript
// Logger.js - For debugging and monitoring
class Logger {
  static log(message, level = 'info') {}
  static error(message, error) {}
  static warn(message) {}
}

// Validator.js - Input validation
class Validator {
  static isValidCategoryName(name) {}
  static isValidSearchPattern(pattern) {}
  static sanitizeInput(input) {}
}

// WikitextParser.js - Parse and modify wikitext
class WikitextParser {
  static extractCategories(wikitext) {}
  static addCategory(wikitext, category) {}
  static removeCategory(wikitext, category) {}
  static getCategorySyntax(categoryName) {}
}

// RateLimiter.js - Prevent API abuse
class RateLimiter {
  static async throttle(fn, delay) {}
  static async batch(items, batchSize, processor) {}
}
```

**Deliverables:**
- All utility classes implemented
- Unit tests for utilities
- Documentation for each utility

---

## Phase 4: Core Development

### Task 4.1: Implement API Service
**Objective:** Handle all MediaWiki API interactions

**Implementation Plan:**

```javascript
class APIService {
  constructor() {
    this.baseURL = 'https://commons.wikimedia.org/w/api.php';
    this.csrfToken = null;
  }

  // Step 1: Get CSRF token for editing
  async getCSRFToken() {
    const params = {
      action: 'query',
      meta: 'tokens',
      type: 'csrf',
      format: 'json'
    };
    // Implementation with error handling
  }

  // Step 2: Fetch files from category
  async getCategoryMembers(categoryName, options = {}) {
    const params = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: categoryName,
      cmtype: 'file',
      cmlimit: options.limit || 500,
      format: 'json'
    };
    // Implementation with pagination support
  }

  // Step 3: Get file details including categories
  async getFileInfo(titles) {
    const params = {
      action: 'query',
      titles: titles.join('|'),
      prop: 'categories|imageinfo',
      cllimit: 500,
      format: 'json'
    };
    // Implementation
  }

  // Step 4: Get page content (wikitext)
  async getPageContent(title) {
    const params = {
      action: 'query',
      titles: title,
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      format: 'json'
    };
    // Implementation
  }

  // Step 5: Edit page
  async editPage(title, content, summary) {
    if (!this.csrfToken) {
      await this.getCSRFToken();
    }
    
    const params = {
      action: 'edit',
      title: title,
      text: content,
      summary: summary,
      token: this.csrfToken,
      format: 'json'
    };
    // Implementation with error handling
  }

  // Helper: Make API request
  async makeRequest(params) {
    // Add origin parameter for CORS
    params.origin = '*';
    
    const url = new URL(this.baseURL);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.info);
      }
      
      return data;
    } catch (error) {
      Logger.error('API request failed', error);
      throw error;
    }
  }
}
```

**Testing Requirements:**
- Test each API method independently
- Test error scenarios
- Test rate limiting
- Test pagination

**Deliverables:**
- Complete APIService class
- Unit tests with >80% coverage
- API usage documentation

### Task 4.2: Implement File Service
**Objective:** Manage file operations

```javascript
class FileService {
  constructor(apiService) {
    this.api = apiService;
  }

  // Search files by pattern
  async searchFiles(categoryName, searchPattern) {
    // 1. Get all files from category
    const allFiles = await this.api.getCategoryMembers(categoryName);
    
    // 2. Filter by pattern
    const matchingFiles = allFiles.filter(file => 
      file.title.includes(searchPattern)
    );
    
    // 3. Get detailed info for matching files
    const filesWithInfo = await this.getFilesDetails(matchingFiles);
    
    return filesWithInfo;
  }

  async getFilesDetails(files) {
    // Batch process to get categories for each file
    const batchSize = 50; // API limit
    const batches = this.createBatches(files, batchSize);
    
    const results = [];
    for (const batch of batches) {
      const titles = batch.map(f => f.title);
      const info = await this.api.getFileInfo(titles);
      results.push(...this.parseFileInfo(info));
    }
    
    return results;
  }

  createBatches(array, size) {
    const batches = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  parseFileInfo(apiResponse) {
    // Convert API response to FileModel objects
  }
}
```

**Deliverables:**
- Complete FileService class
- Integration tests
- Performance benchmarks

### Task 4.3: Implement Category Service
**Objective:** Handle category operations

```javascript
class CategoryService {
  constructor(apiService) {
    this.api = apiService;
    this.parser = new WikitextParser();
  }

  // Add categories to a file
  async addCategories(fileTitle, categoriesToAdd) {
    // 1. Get current page content
    const wikitext = await this.api.getPageContent(fileTitle);
    
    // 2. Parse and modify
    let newWikitext = wikitext;
    for (const category of categoriesToAdd) {
      if (!this.parser.hasCategory(wikitext, category)) {
        newWikitext = this.parser.addCategory(newWikitext, category);
      }
    }
    
    // 3. Save if changed
    if (newWikitext !== wikitext) {
      await this.api.editPage(
        fileTitle,
        newWikitext,
        `Adding categories: ${categoriesToAdd.join(', ')}`
      );
    }
    
    return { success: true, modified: newWikitext !== wikitext };
  }

  // Remove categories from a file
  async removeCategories(fileTitle, categoriesToRemove) {
    const wikitext = await this.api.getPageContent(fileTitle);
    
    let newWikitext = wikitext;
    for (const category of categoriesToRemove) {
      newWikitext = this.parser.removeCategory(newWikitext, category);
    }
    
    if (newWikitext !== wikitext) {
      await this.api.editPage(
        fileTitle,
        newWikitext,
        `Removing categories: ${categoriesToRemove.join(', ')}`
      );
    }
    
    return { success: true, modified: newWikitext !== wikitext };
  }

  // Combined operation
  async updateCategories(fileTitle, toAdd, toRemove) {
    const wikitext = await this.api.getPageContent(fileTitle);
    let newWikitext = wikitext;
    
    // Remove first
    for (const category of toRemove) {
      newWikitext = this.parser.removeCategory(newWikitext, category);
    }
    
    // Then add
    for (const category of toAdd) {
      if (!this.parser.hasCategory(newWikitext, category)) {
        newWikitext = this.parser.addCategory(newWikitext, category);
      }
    }
    
    if (newWikitext !== wikitext) {
      const summary = this.buildEditSummary(toAdd, toRemove);
      await this.api.editPage(fileTitle, newWikitext, summary);
    }
    
    return { success: true, modified: newWikitext !== wikitext };
  }

  buildEditSummary(toAdd, toRemove) {
    const parts = [];
    if (toAdd.length) parts.push(`+${toAdd.join(', ')}`);
    if (toRemove.length) parts.push(`-${toRemove.join(', ')}`);
    return `Batch category update: ${parts.join('; ')} (via Category Batch Manager)`;
  }
}
```

**Deliverables:**
- Complete CategoryService class
- Tests for all category operations
- Edge case handling documentation

### Task 4.4: Implement Batch Processor
**Objective:** Process multiple files efficiently

```javascript
class BatchProcessor {
  constructor(categoryService) {
    this.categoryService = categoryService;
    this.rateLimiter = new RateLimiter();
  }

  async processBatch(files, categoriesToAdd, categoriesToRemove, callbacks = {}) {
    const {
      onProgress = () => {},
      onFileComplete = () => {},
      onError = () => {}
    } = callbacks;

    const results = {
      total: files.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process files sequentially with throttling
    for (const file of files) {
      try {
        // Wait to respect rate limits (1 edit per 2 seconds)
        await this.rateLimiter.wait(2000);
        
        // Update categories
        const result = await this.categoryService.updateCategories(
          file.title,
          categoriesToAdd,
          categoriesToRemove
        );
        
        results.processed++;
        if (result.success) {
          results.successful++;
          onFileComplete(file, true);
        }
        
        // Update progress
        const progress = (results.processed / results.total) * 100;
        onProgress(progress, results);
        
      } catch (error) {
        results.processed++;
        results.failed++;
        results.errors.push({
          file: file.title,
          error: error.message
        });
        
        onError(file, error);
        onProgress((results.processed / results.total) * 100, results);
      }
    }

    return results;
  }

  async previewChanges(files, categoriesToAdd, categoriesToRemove) {
    // Return what would change without actually editing
    const previews = [];
    
    for (const file of files) {
      const current = file.currentCategories;
      const after = [...current];
      
      // Simulate removal
      categoriesToRemove.forEach(cat => {
        const index = after.indexOf(cat);
        if (index > -1) after.splice(index, 1);
      });
      
      // Simulate addition
      categoriesToAdd.forEach(cat => {
        if (!after.includes(cat)) after.push(cat);
      });
      
      previews.push({
        file: file.title,
        currentCategories: current,
        newCategories: after,
        willChange: JSON.stringify(current) !== JSON.stringify(after)
      });
    }
    
    return previews;
  }
}
```

**Deliverables:**
- Complete BatchProcessor class
- Progress tracking implementation
- Rate limiting verification

### Task 4.5: Implement Wikitext Parser
**Objective:** Safely manipulate wikitext

```javascript
class WikitextParser {
  // Extract all categories from wikitext
  extractCategories(wikitext) {
    const categoryRegex = /\[\[Category:([^\]|]+)(?:\|[^\]]*)?\]\]/gi;
    const matches = [];
    let match;
    
    while ((match = categoryRegex.exec(wikitext)) !== null) {
      matches.push(`Category:${match[1].trim()}`);
    }
    
    return matches;
  }

  // Check if category exists in wikitext
  hasCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const regex = new RegExp(`\\[\\[Category:${this.escapeRegex(cleanName)}(?:\\|[^\\]]*)?\\]\\]`, 'i');
    return regex.test(wikitext);
  }

  // Add category to wikitext
  addCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const categorySyntax = `[[Category:${cleanName}]]`;
    
    // Find last category or end of file
    const lastCategoryMatch = wikitext.match(/\[\[Category:[^\]]+\]\]\s*$/);
    
    if (lastCategoryMatch) {
      // Add after last category
      return wikitext.replace(
        /(\[\[Category:[^\]]+\]\])\s*$/,
        `$1\n${categorySyntax}\n`
      );
    } else {
      // Add at end
      return wikitext.trim() + `\n${categorySyntax}\n`;
    }
  }

  // Remove category from wikitext
  removeCategory(wikitext, categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    const regex = new RegExp(`\\[\\[Category:${this.escapeRegex(cleanName)}(?:\\|[^\\]]*)?\\]\\]\\s*\\n?`, 'gi');
    return wikitext.replace(regex, '');
  }

  // Escape special regex characters
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get proper category syntax
  getCategorySyntax(categoryName) {
    const cleanName = categoryName.replace(/^Category:/i, '');
    return `[[Category:${cleanName}]]`;
  }
}
```

**Testing Focus:**
- Various wikitext formats
- Multiple categories
- Categories with sort keys
- Edge cases (empty files, malformed syntax)

**Deliverables:**
- Complete WikitextParser class
- Comprehensive test suite
- Edge case documentation

### Task 4.6: Implement User Interface
**Objective:** Create interactive UI

**Main UI Controller:**

```javascript
class CategoryBatchManagerUI {
  constructor() {
    this.apiService = new APIService();
    this.fileService = new FileService(this.apiService);
    this.categoryService = new CategoryService(this.apiService);
    this.batchProcessor = new BatchProcessor(this.categoryService);
    
    this.state = {
      sourceCategory: 'Category:Uploaded_by_OWID_importer_tool',
      searchPattern: '',
      files: [],
      selectedFiles: [],
      categoriesToAdd: [],
      categoriesToRemove: [],
      isProcessing: false
    };
    
    this.init();
  }

  init() {
    this.createUI();
    this.attachEventListeners();
  }

  createUI() {
    // Create and inject HTML structure
    const container = this.buildContainer();
    document.body.appendChild(container);
  }

  buildContainer() {
    const div = document.createElement('div');
    div.id = 'category-batch-manager';
    div.className = 'cbm-container';
    
    div.innerHTML = `
      <div class="cbm-header">
        <h2>Category Batch Manager</h2>
        <button class="cbm-close" id="cbm-close">×</button>
      </div>
      
      <div class="cbm-search">
        <label>Search Pattern:</label>
        <input type="text" id="cbm-pattern" placeholder="e.g., ,BLR.svg">
        <button id="cbm-search-btn">Search</button>
      </div>
      
      <div class="cbm-results">
        <div id="cbm-results-header" class="hidden">
          Found <span id="cbm-count">0</span> files
          <button id="cbm-select-all">Select All</button>
          <button id="cbm-deselect-all">Deselect All</button>
        </div>
        <div id="cbm-file-list"></div>
      </div>
      
      <div class="cbm-actions">
        <div class="cbm-input-group">
          <label>Add Categories (comma-separated):</label>
          <input type="text" id="cbm-add-cats" placeholder="Category:Example">
        </div>
        
        <div class="cbm-input-group">
          <label>Remove Categories (comma-separated):</label>
          <input type="text" id="cbm-remove-cats" placeholder="Category:Old">
        </div>
        
        <div class="cbm-input-group">
          <label>Edit Summary:</label>
          <input type="text" id="cbm-summary" 
                 value="Batch category update via Category Batch Manager">
        </div>
        
        <div class="cbm-selected-count">
          Selected: <span id="cbm-selected">0</span> files
        </div>
        
        <div class="cbm-buttons">
          <button id="cbm-preview" class="cbm-btn-secondary">Preview Changes</button>
          <button id="cbm-execute" class="cbm-btn-primary">GO</button>
        </div>
      </div>
      
      <div id="cbm-progress" class="cbm-progress hidden">
        <div class="cbm-progress-bar">
          <div id="cbm-progress-fill" style="width: 0%"></div>
        </div>
        <div id="cbm-progress-text">Processing...</div>
      </div>
      
      <div id="cbm-preview-modal" class="cbm-modal hidden">
        <div class="cbm-modal-content">
          <h3>Preview Changes</h3>
          <div id="cbm-preview-content"></div>
          <button id="cbm-preview-close">Close</button>
        </div>
      </div>
    `;
    
    return div;
  }

  attachEventListeners() {
    // Search button
    document.getElementById('cbm-search-btn').addEventListener('click', () => {
      this.handleSearch();
    });
    
    // Select/Deselect all
    document.getElementById('cbm-select-all').addEventListener('click', () => {
      this.selectAll();
    });
    
    document.getElementById('cbm-deselect-all').addEventListener('click', () => {
      this.deselectAll();
    });
    
    // Preview button
    document.getElementById('cbm-preview').addEventListener('click', () => {
      this.handlePreview();
    });
    
    // Execute button
    document.getElementById('cbm-execute').addEventListener('click', () => {
      this.handleExecute();
    });
    
    // Close button
    document.getElementById('cbm-close').addEventListener('click', () => {
      this.close();
    });
  }

  async handleSearch() {
    const pattern = document.getElementById('cbm-pattern').value.trim();
    
    if (!pattern) {
      alert('Please enter a search pattern');
      return;
    }
    
    this.showLoading();
    
    try {
      const files = await this.fileService.searchFiles(
        this.state.sourceCategory,
        pattern
      );
      
      this.state.files = files;
      this.state.searchPattern = pattern;
      this.renderFileList();
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      alert(`Error searching files: ${error.message}`);
    }
  }

  renderFileList() {
    const listContainer = document.getElementById('cbm-file-list');
    const countElement = document.getElementById('cbm-count');
    const headerElement = document.getElementById('cbm-results-header');
    
    if (this.state.files.length === 0) {
      listContainer.innerHTML = '<p>No files found matching the pattern.</p>';
      headerElement.classList.add('hidden');
      return;
    }
    
    countElement.textContent = this.state.files.length;
    headerElement.classList.remove('hidden');
    
    listContainer.innerHTML = '';
    
    this.state.files.forEach((file, index) => {
      const fileRow = document.createElement('div');
      fileRow.className = 'cbm-file-row';
      fileRow.dataset.index = index;
      
      fileRow.innerHTML = `
        <input type="checkbox" class="cbm-file-checkbox" 
               id="file-${index}" checked>
        <label for="file-${index}">${file.title}</label>
        <button class="cbm-remove-btn" data-index="${index}">×</button>
      `;
      
      listContainer.appendChild(fileRow);
    });
    
    // Attach remove button listeners
    document.querySelectorAll('.cbm-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeFile(index);
      });
    });
    
    // Attach checkbox listeners
    document.querySelectorAll('.cbm-file-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedCount();
      });
    });
    
    this.updateSelectedCount();
  }

  removeFile(index) {
    this.state.files.splice(index, 1);
    this.renderFileList();
  }

  selectAll() {
    document.querySelectorAll('.cbm-file-checkbox').forEach(cb => {
      cb.checked = true;
    });
    this.updateSelectedCount();
  }

  deselectAll() {
    document.querySelectorAll('.cbm-file-checkbox').forEach(cb => {
      cb.checked = false;
    });
    this.updateSelectedCount();
  }

  updateSelectedCount() {
    const selected = document.querySelectorAll('.cbm-file-checkbox:checked').length;
    document.getElementById('cbm-selected').textContent = selected;
  }

  getSelectedFiles() {
    const selected = [];
    document.querySelectorAll('.cbm-file-checkbox:checked').forEach(cb => {
      const index = parseInt(cb.id.replace('file-', ''));
      selected.push(this.state.files[index]);
    });
    return selected;
  }

  parseCategories(input) {
    return input
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
      .map(cat => cat.startsWith('Category:') ? cat : `Category:${cat}`);
  }

  async handlePreview() {
    const selectedFiles = this.getSelectedFiles();
    
    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }
    
    const toAdd = this.parseCategories(
      document.getElementById('cbm-add-cats').value
    );
    const toRemove = this.parseCategories(
      document.getElementById('cbm-remove-cats').value
    );
    
    this.showLoading();
    
    try {
      const preview = await this.batchProcessor.previewChanges(
        selectedFiles,
        toAdd,
        toRemove
      );
      
      this.showPreviewModal(preview);
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      alert(`Error generating preview: ${error.message}`);
    }
  }

  showPreviewModal(preview) {
    const modal = document.getElementById('cbm-preview-modal');
    const content = document.getElementById('cbm-preview-content');
    
    let html = '<table class="cbm-preview-table">';
    html += '<tr><th>File</th><th>Current Categories</th><th>New Categories</th></tr>';
    
    preview.forEach(item => {
      if (item.willChange) {
        html += `
          <tr>
            <td>${item.file}</td>
            <td>${item.currentCategories.join('<br>')}</td>
            <td>${item.newCategories.join('<br>')}</td>
          </tr>
        `;
      }
    });
    
    html += '</table>';
    
    const changesCount = preview.filter(p => p.willChange).length;
    html = `<p>${changesCount} files will be modified</p>` + html;
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
    
    document.getElementById('cbm-preview-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  async handleExecute() {
    const selectedFiles = this.getSelectedFiles();
    
    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }
    
    const toAdd = this.parseCategories(
      document.getElementById('cbm-add-cats').value
    );
    const toRemove = this.parseCategories(
      document.getElementById('cbm-remove-cats').value
    );
    
    if (toAdd.length === 0 && toRemove.length === 0) {
      alert('Please specify categories to add or remove');
      return;
    }
    
    const confirmed = confirm(
      `Are you sure you want to update ${selectedFiles.length} files?\n` +
      `Add: ${toAdd.join(', ') || 'none'}\n` +
      `Remove: ${toRemove.join(', ') || 'none'}`
    );
    
    if (!confirmed) return;
    
    this.state.isProcessing = true;
    this.showProgress();
    
    try {
      const results = await this.batchProcessor.processBatch(
        selectedFiles,
        toAdd,
        toRemove,
        {
          onProgress: (progress, results) => {
            this.updateProgress(progress, results);
          },
          onFileComplete: (file, success) => {
            console.log(`${file.title}: ${success ? 'success' : 'failed'}`);
          },
          onError: (file, error) => {
            console.error(`Error processing ${file.title}:`, error);
          }
        }
      );
      
      this.showResults(results);
      
    } catch (error) {
      alert(`Batch process failed: ${error.message}`);
    } finally {
      this.state.isProcessing = false;
      this.hideProgress();
    }
  }

  showProgress() {
    document.getElementById('cbm-progress').classList.remove('hidden');
    document.getElementById('cbm-execute').disabled = true;
  }

  hideProgress() {
    document.getElementById('cbm-progress').classList.add('hidden');
    document.getElementById('cbm-execute').disabled = false;
  }

  updateProgress(percentage, results) {
    document.getElementById('cbm-progress-fill').style.width = `${percentage}%`;
    document.getElementById('cbm-progress-text').textContent = 
      `Processing: ${results.processed}/${results.total} (${results.successful} successful, ${results.failed} failed)`;
  }

  showResults(results) {
    let message = `Batch process complete!\n\n`;
    message += `Total: ${results.total}\n`;
    message += `Successful: ${results.successful}\n`;
    message += `Failed: ${results.failed}\n`;
    
    if (results.errors.length > 0) {
      message += `\nErrors:\n`;
      results.errors.forEach(err => {
        message += `- ${err.file}: ${err.error}\n`;
      });
    }
    
    alert(message);
  }

  showLoading() {
    // Add loading spinner
  }

  hideLoading() {
    // Remove loading spinner
  }

  close() {
    document.getElementById('category-batch-manager').remove();
  }
}
```

**CSS Styling:**

```css
/* main.css */

.cbm-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  max-height: 90vh;
  background: white;
  border: 2px solid #a2a9b1;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cbm-header {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #a2a9b1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cbm-header h2 {
  margin: 0;
  font-size: 18px;
}

.cbm-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #72777d;
}

.cbm-close:hover {
  color: #202122;
}

.cbm-search {
  padding: 15px;
  border-bottom: 1px solid #eaecf0;
}

.cbm-search label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.cbm-search input {
  width: calc(100% - 100px);
  padding: 8px;
  border: 1px solid #a2a9b1;
  border-radius: 2px;
  margin-right: 10px;
}

.cbm-search button {
  padding: 8px 20px;
  background: #0645AD;
  color: white;
  border: none;
  border-radius: 2px;
  cursor: pointer;
}

.cbm-search button:hover {
  background: #0B0080;
}

.cbm-results {
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
  border-bottom: 1px solid #eaecf0;
}

#cbm-results-header {
  margin-bottom: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 2px;
}

#cbm-results-header button {
  margin-left: 10px;
  padding: 5px 10px;
  font-size: 12px;
}

.cbm-file-row {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eaecf0;
}

.cbm-file-row:hover {
  background: #f8f9fa;
}

.cbm-file-checkbox {
  margin-right: 10px;
}

.cbm-file-row label {
  flex: 1;
  cursor: pointer;
}

.cbm-remove-btn {
  background: #d33;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.cbm-remove-btn:hover {
  background: #b32424;
}

.cbm-actions {
  padding: 15px;
}

.cbm-input-group {
  margin-bottom: 15px;
}

.cbm-input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.cbm-input-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #a2a9b1;
  border-radius: 2px;
}

.cbm-selected-count {
  margin-bottom: 15px;
  font-weight: bold;
}

.cbm-buttons {
  display: flex;
  gap: 10px;
}

.cbm-btn-primary {
  flex: 1;
  padding: 12px;
  background: #00AF89;
  color: white;
  border: none;
  border-radius: 2px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.cbm-btn-primary:hover {
  background: #009270;
}

.cbm-btn-primary:disabled {
  background: #c8ccd1;
  cursor: not-allowed;
}

.cbm-btn-secondary {
  flex: 1;
  padding: 12px;
  background: #f8f9fa;
  color: #202122;
  border: 1px solid #a2a9b1;
  border-radius: 2px;
  font-size: 16px;
  cursor: pointer;
}

.cbm-btn-secondary:hover {
  background: #eaecf0;
}

.cbm-progress {
  padding: 15px;
  border-top: 1px solid #eaecf0;
}

.cbm-progress-bar {
  width: 100%;
  height: 24px;
  background: #eaecf0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

#cbm-progress-fill {
  height: 100%;
  background: #00AF89;
  transition: width 0.3s ease;
}

#cbm-progress-text {
  text-align: center;
  font-size: 14px;
}

.cbm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.cbm-modal-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
}

.cbm-preview-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.cbm-preview-table th,
.cbm-preview-table td {
  padding: 8px;
  border: 1px solid #a2a9b1;
  text-align: left;
}

.cbm-preview-table th {
  background: #f8f9fa;
  font-weight: bold;
}

.hidden {
  display: none !important;
}
```

**Deliverables:**
- Complete UI implementation
- Responsive design
- Accessibility features (ARIA labels, keyboard navigation)
- Cross-browser compatibility

---

## Phase 5: Integration & Enhancement

### Task 5.1: Add Gadget Entry Point
**Objective:** Make tool accessible from Commons

```javascript
// Create activation button
function addToolButton() {
  // Check if we're on a category page
  const isCategoryPage = mw.config.get('wgCanonicalNamespace') === 'Category';
  
  if (!isCategoryPage) return;
  
  // Add button to page
  const portletLink = mw.util.addPortletLink(
    'p-cactions',
    '#',
    'Batch Manager',
    'ca-batch-manager',
    'Open Category Batch Manager'
  );
  
  portletLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Initialize and show UI
    if (!window.categoryBatchManager) {
      window.categoryBatchManager = new CategoryBatchManagerUI();
    }
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addToolButton);
} else {
  addToolButton();
}
```

**Deliverables:**
- Entry point implementation
- Integration with MediaWiki interface
- User preference support

### Task 5.2: Add Error Recovery
**Objective:** Handle failures gracefully

```javascript
class ErrorRecovery {
  constructor() {
    this.failedOperations = [];
  }

  recordFailure(operation) {
    this.failedOperations.push({
      ...operation,
      timestamp: new Date(),
      attemptCount: (operation.attemptCount || 0) + 1
    });
    
    // Save to localStorage
    this.saveToStorage();
  }

  async retryFailed() {
    const toRetry = this.failedOperations.filter(
      op => op.attemptCount < 3
    );
    
    for (const operation of toRetry) {
      try {
        await this.executeOperation(operation);
        this.removeFailure(operation);
      } catch (error) {
        this.recordFailure(operation);
      }
    }
  }

  saveToStorage() {
    localStorage.setItem(
      'cbm-failed-operations',
      JSON.stringify(this.failedOperations)
    );
  }

  loadFromStorage() {
    const stored = localStorage.getItem('cbm-failed-operations');
    if (stored) {
      this.failedOperations = JSON.parse(stored);
    }
  }
}
```

**Deliverables:**
- Error recovery system
- Failed operations log
- Retry mechanism

### Task 5.3: Add Logging & Analytics
**Objective:** Monitor usage and issues

```javascript
class UsageLogger {
  static logSearch(pattern, resultsCount) {
    console.log(`Search: "${pattern}" - ${resultsCount} results`);
    // Could send to analytics service
  }

  static logBatchOperation(filesCount, categoriesAdded, categoriesRemoved) {
    console.log(`Batch: ${filesCount} files, +${categoriesAdded.length} -${categoriesRemoved.length} categories`);
  }

  static logError(context, error) {
    console.error(`Error in ${context}:`, error);
    // Could send to error tracking service
  }

  static logPerformance(operation, duration) {
    console.log(`Performance: ${operation} took ${duration}ms`);
  }
}
```

**Deliverables:**
- Logging system
- Performance monitoring
- Error tracking

---

## Phase 6: Testing

### Task 6.1: Unit Testing
**Objective:** Test individual components

**Test Cases:**

```javascript
// Example test structure
describe('WikitextParser', () => {
  describe('extractCategories', () => {
    test('should extract single category', () => {
      const wikitext = 'Some text [[Category:Test]] more text';
      const result = parser.extractCategories(wikitext);
      expect(result).toEqual(['Category:Test']);
    });

    test('should extract multiple categories', () => {
      const wikitext = '[[Category:A]] text [[Category:B]]';
      const result = parser.extractCategories(wikitext);
      expect(result).toEqual(['Category:A', 'Category:B']);
    });

    test('should handle categories with sort keys', () => {
      const wikitext = '[[Category:Test|Sort Key]]';
      const result = parser.extractCategories(wikitext);
      expect(result).toEqual(['Category:Test']);
    });
  });

  describe('addCategory', () => {
    test('should add category at end', () => {
      const wikitext = 'Text [[Category:A]]';
      const result = parser.addCategory(wikitext, 'Category:B');
      expect(result).toContain('[[Category:B]]');
    });

    test('should not add duplicate category', () => {
      const wikitext = '[[Category:Test]]';
      // Should check before adding
    });
  });
});

// Test API Service
describe('APIService', () => {
  test('should get category members', async () => {
    // Mock API response
    // Test pagination
    // Test error handling
  });
});

// Test CategoryService
describe('CategoryService', () => {
  test('should add categories correctly', async () => {
    // Mock dependencies
    // Test category addition
  });

  test('should handle edit conflicts', async () => {
    // Test conflict resolution
  });
});
```

**Test Coverage Goals:**
- WikitextParser: >95%
- APIService: >85%
- CategoryService: >90%
- FileService: >85%
- BatchProcessor: >85%

**Deliverables:**
- Complete unit test suite
- Test coverage report
- CI/CD integration (if applicable)

### Task 6.2: Integration Testing
**Objective:** Test component interactions

**Test Scenarios:**

1. **Complete Workflow Test**
   - Search for files
   - Select/deselect files
   - Add/remove categories
   - Execute batch operation
   - Verify results

2. **Large Batch Test**
   - Test with 100+ files
   - Verify rate limiting
   - Check performance
   - Verify all edits complete

3. **Error Scenario Tests**
   - Network failure during batch
   - Permission denied
   - Edit conflict
   - Invalid category names

4. **Edge Cases**
   - Empty search results
   - No categories to add/remove
   - All files deselected
   - Very long category names
   - Special characters in patterns

**Deliverables:**
- Integration test suite
- Test results documentation
- Performance benchmarks

### Task 6.3: User Acceptance Testing
**Objective:** Validate with real users

**Testing Plan:**

1. **Recruit Testers**
   - 3-5 Commons users
   - Varying experience levels
   - Regular category editors

2. **Testing Tasks**
   - Task 1: Search for country-specific files
   - Task 2: Add geographic categories
   - Task 3: Remove deprecated categories
   - Task 4: Process large batch
   - Task 5: Use preview feature

3. **Feedback Collection**
   - Usability survey
   - Bug reports
   - Feature requests
   - Performance feedback

**Deliverables:**
- UAT test plan
- Tester feedback report
- List of improvements needed
- Bug fix priorities

### Task 6.4: Browser Compatibility Testing
**Objective:** Ensure cross-browser functionality

**Test Matrix:**

| Browser | Version | Desktop | Mobile |
|---------|---------|---------|--------|
| Chrome | Latest | ✓ | ✓ |
| Firefox | Latest | ✓ | ✓ |
| Safari | Latest | ✓ | ✓ |
| Edge | Latest | ✓ | - |

**Test Checklist:**
- [ ] UI renders correctly
- [ ] All buttons functional
- [ ] API calls work
- [ ] Progress bars animate
- [ ] Modals display properly
- [ ] No console errors
- [ ] Performance acceptable

**Deliverables:**
- Compatibility test results
- Browser-specific fixes
- Fallback implementations

---

## Phase 7: Documentation

### Task 7.1: Code Documentation
**Objective:** Document for future developers

**Documentation Requirements:**

```javascript
/**
 * Category Batch Manager for Wikimedia Commons
 * 
 * @author [Your Name]
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * A tool for batch categorization of files in Wikimedia Commons.
 * Allows filtering files by pattern and applying category changes
 * to multiple files at once.
 */

/**
 * Service for interacting with MediaWiki API
 * @class APIService
 */
class APIService {
  /**
   * Get files from a category
   * @param {string} categoryName - Full category name including "Category:" prefix
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum files to retrieve
   * @returns {Promise<Array>} Array of file objects
   * @throws {Error} If API request fails
   */
  async getCategoryMembers(categoryName, options = {}) {
    // Implementation
  }
}
```

**Documentation Files:**
- `README.md` - Project overview
- `API.md` - API reference
- `ARCHITECTURE.md` - System design
- `CONTRIBUTING.md` - Contribution guide
- Inline JSDoc comments

**Deliverables:**
- Complete code documentation
- API reference
- Architecture documentation

### Task 7.2: User Documentation
**Objective:** Help users understand the tool

**Documentation Pages:**

1. **Quick Start Guide**
```markdown
# Category Batch Manager - Quick Start

## Installation
1. Go to your Commons preferences
2. Navigate to Gadgets tab
3. Enable "Category Batch Manager"
4. Save preferences

## Basic Usage
1. Navigate to any category page
2. Click "Batch Manager" in the page actions menu
3. Enter search pattern (e.g., ",USA.svg")
4. Click "Search"
5. Review results and remove unwanted files
6. Enter categories to add/remove
7. Click "GO"

## Example
To add "Category:United States" to all USA charts:
- Pattern: `,USA.svg`
- Add: `Category:United States`
- Remove: (leave empty if none)
```

2. **FAQ**
```markdown
# Frequently Asked Questions

## Q: Why can't I see the Batch Manager button?
A: Make sure you're on a category page and have enabled 
   the gadget in your preferences.

## Q: How many files can I process at once?
A: The tool can handle hundreds of files, but processes 
   them sequentially to respect rate limits.

## Q: What if the process fails halfway?
A: The tool logs all operations. Failed files can be 
   retried individually.

## Q: Can I undo changes?
A: Each edit has a clear edit summary. You can revert 
   individual edits through the file history.
```

3. **Troubleshooting Guide**
4. **Advanced Features Guide**
5. **Video Tutorial** (optional)

**Deliverables:**
- User guide (Commons wiki page)
- FAQ page
- Troubleshooting guide
- Tutorial video (optional)

### Task 7.3: Create Examples
**Objective:** Provide real-world usage examples

**Example Scenarios:**

1. **Organizing Country Charts**
```
Task: Add "Category:Belarus" to all Belarus charts

Steps:
1. Open Category:Uploaded_by_OWID_importer_tool
2. Open Batch Manager
3. Search: ",BLR.svg"
4. Add categories: "Category:Belarus, Category:Europe"
5. Execute
```

2. **Cleaning Up Old Categories**
```
Task: Remove deprecated category from indicator files

Steps:
1. Search: "_indicator_"
2. Remove categories: "Category:Old Indicators"
3. Add categories: "Category:Economic Indicators"
4. Execute
```

3. **Regional Categorization**
```
Task: Add regional categories to multiple countries

Process multiple searches:
- Search ",BLR.svg" → Add "Category:Eastern Europe"
- Search ",POL.svg" → Add "Category:Central Europe"
- Search ",UKR.svg" → Add "Category:Eastern Europe"
```

**Deliverables:**
- Example scenarios page
- Step-by-step screenshots
- Video demonstrations

---

## Phase 8: Deployment

### Task 8.1: Prepare for Production
**Objective:** Finalize code for deployment

**Pre-deployment Checklist:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] No console.log statements
- [ ] Error handling comprehensive
- [ ] Performance optimized
- [ ] Minification applied (if needed)
- [ ] License added
- [ ] Version number set

**Code Cleanup:**
```javascript
// Remove debug code
// console.log('Debug info');

// Add production error handling
try {
  // Operation
} catch (error) {
  Logger.error('Operation failed', error);
  // User-friendly error message
}

// Add version info
const VERSION = '1.0.0';
const LAST_UPDATED = '2026-02-06';
```

**Deliverables:**
- Production-ready code
- Deployment package
- Rollback plan

### Task 8.2: Create Gadget Pages on Commons
**Objective:** Deploy to Wikimedia Commons

**Required Pages:**

1. **MediaWiki:Gadget-CategoryBatchManager.js**
   - Upload main JavaScript file
   - Add version comment
   - Add license header

2. **MediaWiki:Gadget-CategoryBatchManager.css**
   - Upload CSS file
   - Optimize for performance

3. **MediaWiki:Gadgets-definition**
   - Add gadget definition:
```
* CategoryBatchManager[ResourceLoader|dependencies=mediawiki.util,jquery.ui]|CategoryBatchManager.js|CategoryBatchManager.css
```

4. **Commons:Category Batch Manager** (documentation page)
   - User guide
   - Examples
   - FAQ
   - Support information

**Deployment Steps:**
1. Create all required pages
2. Upload code
3. Update gadget definition
4. Test on live site
5. Announce to community

**Deliverables:**
- All MediaWiki pages created
- Gadget enabled and functional
- Announcement drafted

### Task 8.3: Community Announcement
**Objective:** Inform Commons community

**Announcement Template:**

```markdown
== New Tool: Category Batch Manager for OWID Importer ==

I'm pleased to announce a new gadget for efficiently 
categorizing files uploaded by the OWID importer tool.

=== Features ===
* Search files by pattern within a category
* Bulk add/remove categories
* Preview changes before applying
* Progress tracking
* Error handling and retry

=== How to Enable ===
Go to [[Special:Preferences#mw-prefsection-gadgets]] and 
enable "Category Batch Manager"

=== Documentation ===
Full guide: [[Commons:Category Batch Manager]]

=== Feedback ===
Please report bugs or suggest improvements at 
[[Commons talk:Category Batch Manager]]

Happy editing! ~~~~
```

**Announcement Locations:**
- Commons:Village pump
- Commons:Graphic Lab
- Relevant project talk pages
- User notification (if applicable)

**Deliverables:**
- Community announcement posted
- Feedback mechanism established
- Support channels set up

---

## Phase 9: Monitoring & Maintenance

### Task 9.1: Monitor Usage
**Objective:** Track adoption and issues

**Monitoring Plan:**
1. Track gadget enable/disable statistics
2. Monitor error logs
3. Collect user feedback
4. Track performance metrics

**Metrics to Track:**
- Number of active users
- Average files processed per session
- Error rate
- Performance (load time, API latency)
- User satisfaction

**Deliverables:**
- Monitoring dashboard (if applicable)
- Weekly usage reports
- Issue tracker

### Task 9.2: Handle Bug Reports
**Objective:** Fix issues quickly

**Bug Handling Process:**
1. User reports bug
2. Reproduce issue
3. Prioritize (Critical/High/Medium/Low)
4. Fix and test
5. Deploy fix
6. Notify reporter

**Bug Tracking:**
- Use Commons talk page or Phabricator
- Categorize by severity
- Document all fixes

**Deliverables:**
- Bug tracking system
- Fix deployment process
- Bug fix log

### Task 9.3: Plan Future Enhancements
**Objective:** Improve based on feedback

**Potential Features:**
1. **Advanced Search**
   - Regex support
   - Multiple pattern OR logic
   - Exclude patterns

2. **Templates**
   - Save common operations
   - Quick apply saved templates

3. **Undo Feature**
   - One-click undo of last batch

4. **Export Reports**
   - Download list of modified files
   - CSV export of changes

5. **Collaboration**
   - Share search/category sets
   - Team workflows

6. **Integration**
   - Work with HotCat
   - Work with Cat-a-lot
   - API for external tools

**Prioritization:**
- Gather community feedback
- Assess development effort
- Consider impact

**Deliverables:**
- Feature roadmap
- Community feedback survey
- Development priorities

---

## Phase 10: Knowledge Transfer

### Task 10.1: Create Handover Documentation
**Objective:** Enable others to maintain the tool

**Handover Package:**
1. **Technical Overview**
   - Architecture diagram
   - Component descriptions
   - Data flow
   - Dependencies

2. **Deployment Guide**
   - How to update code
   - Testing procedures
   - Rollback process

3. **Troubleshooting Guide**
   - Common issues
   - Debug procedures
   - Support resources

4. **Enhancement Guide**
   - How to add features
   - Coding standards
   - Testing requirements

**Deliverables:**
- Complete handover documentation
- Maintenance procedures
- Contact information

### Task 10.2: Train Maintainers
**Objective:** Prepare future developers

**Training Topics:**
- Code walkthrough
- MediaWiki API usage
- Deployment process
- Bug fixing workflow
- Feature development

**Training Format:**
- Live session or video
- Code review session
- Q&A documentation

**Deliverables:**
- Training materials
- Recorded sessions (if applicable)
- FAQ for maintainers

---

## Success Criteria

### Technical Success
- [ ] All features implemented
- [ ] >85% test coverage
- [ ] No critical bugs
- [ ] Performance <2s for search
- [ ] Handles 500+ files
- [ ] Works in all major browsers

### User Success
- [ ] >20 active users in first month
- [ ] >4/5 user satisfaction rating
- [ ] <5% error rate
- [ ] Positive community feedback

### Documentation Success
- [ ] Complete user guide
- [ ] Complete developer docs
- [ ] Video tutorial
- [ ] Active support channel

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| API changes | Low | High | Monitor MediaWiki updates |
| Rate limiting | Medium | Medium | Implement throttling |
| Edit conflicts | Medium | Low | Retry logic |
| Browser compatibility | Low | Medium | Extensive testing |
| Performance issues | Medium | Medium | Optimization, caching |

### Project Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Scope creep | Medium | Medium | Clear requirements |
| Timeline delays | Medium | Low | Buffer time included |
| User adoption | Low | High | Good documentation, announcement |
| Maintenance burden | Low | Medium | Clean code, documentation |

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Research | 5 days | None |
| 2. Design | 3 days | Phase 1 |
| 3. Setup | 2 days | Phase 2 |
| 4. Core Development | 10 days | Phase 3 |
| 5. Integration | 3 days | Phase 4 |
| 6. Testing | 7 days | Phase 5 |
| 7. Documentation | 3 days | Ongoing |
| 8. Deployment | 2 days | Phases 4-7 |
| 9. Monitoring | Ongoing | Phase 8 |
| 10. Knowledge Transfer | 2 days | Phase 8 |

**Total Estimated Time: 35-40 days**

---

## Resource Requirements

### Human Resources
- 1 Full-stack Developer (primary)
- 1 Tester (part-time)
- 1 Technical Writer (part-time)
- 3-5 Beta Testers (community volunteers)

### Technical Resources
- Wikimedia Commons account with edit rights
- Development environment (browser, IDE)
- Testing accounts
- Version control (Git)
- Documentation platform

### Knowledge Requirements
- JavaScript (ES6+)
- MediaWiki API
- CSS
- Wikimedia Commons policies
- Software testing
- Technical writing

---

## Conclusion

This comprehensive plan provides a complete roadmap for building the Category Batch Manager tool. The AI agent should follow this plan sequentially, completing each task and producing the specified deliverables. The plan emphasizes quality, testing, documentation, and community engagement to ensure a successful and sustainable tool.

**Key Success Factors:**
1. Thorough testing at every stage
2. Clear, comprehensive documentation
3. Active community engagement
4. Robust error handling
5. Performance optimization
6. Long-term maintainability

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: Research & Analysis
3. Set up project tracking
4. Establish communication channels
5. Start development

---

*This plan is a living document and should be updated as the project progresses and requirements evolve.*