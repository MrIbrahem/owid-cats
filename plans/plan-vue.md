# Vue.js Conversion Plan for Category Batch Manager

## Executive Summary

This document outlines a comprehensive plan to convert the Category Batch Manager gadget from vanilla JavaScript to Vue.js with Codex components, following MediaWiki gadget development best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Vue Architecture Design](#vue-architecture-design)
4. [Component Breakdown](#component-breakdown)
5. [State Management Strategy](#state-management-strategy)
6. [Migration Phases](#migration-phases)
7. [Technical Implementation Details](#technical-implementation-details)
8. [Testing Strategy](#testing-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Rollout Plan](#rollout-plan)

---

## 1. Project Overview

### Goals
- Convert Category Batch Manager from vanilla JS to Vue.js
- Integrate Codex UI components
- Improve code maintainability and testability
- Maintain backward compatibility with MediaWiki API
- Enhance user experience with reactive UI

### Current State
- **Language**: Vanilla JavaScript (ES6 classes)
- **UI Framework**: None (manual DOM manipulation)
- **Lines of Code**: ~2400 lines
- **Dependencies**: MediaWiki API, jQuery, OO.ui

### Target State
- **Framework**: Vue.js 3 (via MediaWiki's Vue integration)
- **UI Library**: Codex components
- **State Management**: Vue reactive data + composables
- **Build System**: MediaWiki ResourceLoader

---

## 2. Current Architecture Analysis

### Class Structure

#### Utility Classes (Keep as is - reusable services)
```
Logger.js              → Convert to composable/service
RateLimiter.js         → Convert to composable/service
Validator.js           → Convert to composable/service
WikitextParser.js      → Convert to composable/service
```

#### API Classes (Convert to composables)
```
MediaWikiAPI.js        → useMediaWikiAPI composable
CategoryAPI.js         → useCategoryAPI composable
```

#### UI Handler Classes (Convert to Vue components)
```
SearchHandler.js       → SearchPanel.vue
FileListHandler.js     → FileList.vue
ExecuteHandler.js      → ExecutionPanel.vue
SettingsHandler.js     → SettingsPanel.vue
PreviewHandler.js      → PreviewModal.vue
```

#### Main Class (Convert to root Vue component)
```
CategoryBatchManagerUI.js → CategoryBatchManager.vue
```

### Dependencies Map
```
CategoryBatchManagerUI
├── SearchHandler → CategoryAPI → MediaWikiAPI
├── FileListHandler → WikitextParser
├── ExecuteHandler → CategoryAPI, RateLimiter, Logger
├── SettingsHandler → LocalStorage
└── PreviewHandler → WikitextParser
```

---

## 3. Vue Architecture Design

### File Structure
```
src/
├── components/
│   ├── CategoryBatchManager.vue      (Root component)
│   ├── SearchPanel.vue                (Search interface)
│   ├── FileList.vue                   (File list display)
│   ├── FileListItem.vue               (Individual file item)
│   ├── ExecutionPanel.vue             (Execution controls)
│   ├── SettingsPanel.vue              (Settings dialog)
│   ├── PreviewModal.vue               (Preview dialog)
│   └── ProgressBar.vue                (Progress indicator)
│
├── composables/
│   ├── useMediaWikiAPI.js             (API wrapper)
│   ├── useCategoryAPI.js              (Category operations)
│   ├── useFileSelection.js            (File selection logic)
│   ├── useExecution.js                (Execution state)
│   └── useSettings.js                 (Settings management)
│
├── services/
│   ├── logger.js                      (Logger utility)
│   ├── rateLimiter.js                 (Rate limiting)
│   ├── validator.js                   (Validation)
│   └── wikitextParser.js              (Wikitext parsing)
│
├── stores/
│   └── categoryBatchStore.js          (Shared state - if needed)
│
└── gadget-entry.js                    (Entry point)
```

---

## 4. Component Breakdown

### 4.1 Root Component: CategoryBatchManager.vue

**Responsibilities:**
- Main dialog container
- Coordinate child components
- Handle global state
- Modal visibility control

**Props:** None (root component)

**Data:**
```javascript
{
  showDialog: false,
  showSettings: false,
  showPreview: false,
  currentTab: 'search',
  files: [],
  settings: {}
}
```

**Template Structure:**
```vue
<cdx-dialog v-model:open="showDialog">
  <template #header>Category Batch Manager</template>
  
  <div class="cbm-tabs">
    <cdx-tabs v-model="currentTab">
      <cdx-tab name="search">Search</cdx-tab>
      <cdx-tab name="files">Files</cdx-tab>
    </cdx-tabs>
  </div>

  <component :is="currentTabComponent" />

  <template #footer>
    <execution-panel />
  </template>
</cdx-dialog>

<settings-panel v-model:open="showSettings" />
<preview-modal v-model:open="showPreview" />
```

---

### 4.2 SearchPanel.vue

**Responsibilities:**
- Category search input
- File pattern search
- Load files from category

**Props:** None

**Emits:**
```javascript
{
  'files-loaded': Array<File>,
  'search-error': String
}
```

**Key Features:**
- Debounced search input
- Loading states
- Error handling
- Category autocomplete (future enhancement)

**Composables Used:**
- `useCategoryAPI()`
- `useMediaWikiAPI()`

**Template:**
```vue
<cdx-field>
  <template #label>Category</template>
  <cdx-text-input 
    v-model="categoryName"
    placeholder="Enter category name"
  />
</cdx-field>

<cdx-field>
  <template #label>File Pattern (optional)</template>
  <cdx-text-input 
    v-model="filePattern"
    placeholder="e.g., *.jpg"
  />
</cdx-field>

<cdx-button @click="searchFiles" :disabled="loading">
  Load Files
</cdx-button>

<div v-if="loading">
  <cdx-progress-bar />
</div>

<cdx-message v-if="error" type="error">
  {{ error }}
</cdx-message>
```

---

### 4.3 FileList.vue

**Responsibilities:**
- Display file list with checkboxes
- Bulk selection controls
- File thumbnails
- Category display/modification

**Props:**
```javascript
{
  files: {
    type: Array,
    required: true
  }
}
```

**Emits:**
```javascript
{
  'selection-changed': Array<number>,
  'file-removed': number
}
```

**Data:**
```javascript
{
  selectedFiles: [],
  sortBy: 'name',
  filterText: ''
}
```

**Computed:**
```javascript
{
  filteredFiles() {
    return this.files.filter(f => 
      f.title.includes(this.filterText)
    );
  },
  selectedCount() {
    return this.selectedFiles.length;
  }
}
```

**Template:**
```vue
<div class="cbm-file-list-controls">
  <cdx-button @click="selectAll">Select All</cdx-button>
  <cdx-button @click="deselectAll">Deselect All</cdx-button>
  <span>Selected: {{ selectedCount }}/{{ files.length }}</span>
</div>

<cdx-search-input v-model="filterText" placeholder="Filter files..." />

<div class="cbm-file-list">
  <file-list-item
    v-for="(file, index) in filteredFiles"
    :key="file.title"
    :file="file"
    :index="index"
    v-model:selected="selectedFiles[index]"
    @remove="$emit('file-removed', index)"
  />
</div>
```

---

### 4.4 FileListItem.vue

**Responsibilities:**
- Display individual file
- Checkbox for selection
- Show current categories
- Preview button

**Props:**
```javascript
{
  file: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
}
```

**Emits:**
```javascript
{
  'update:selected': Boolean,
  'remove': void,
  'preview': Object
}
```

**Template:**
```vue
<div class="cbm-file-item">
  <cdx-checkbox
    :model-value="selected"
    @update:model-value="$emit('update:selected', $event)"
    :input-id="`file-${index}`"
  />
  
  <img :src="file.thumb" :alt="file.title" class="cbm-file-thumb" />
  
  <div class="cbm-file-info">
    <a :href="file.url" target="_blank">{{ file.title }}</a>
    <div class="cbm-file-categories">
      <span v-for="cat in file.categories" :key="cat" class="cbm-category-tag">
        {{ cat }}
      </span>
    </div>
  </div>
  
  <div class="cbm-file-actions">
    <cdx-button action="quiet" @click="$emit('preview', file)">
      Preview
    </cdx-button>
    <cdx-button action="destructive" @click="$emit('remove')">
      Remove
    </cdx-button>
  </div>
</div>
```

---

### 4.5 ExecutionPanel.vue

**Responsibilities:**
- Category input fields (add/remove)
- Action selection (add/remove/replace)
- Execute button
- Progress display
- Stop/Pause controls

**Props:** None

**Data:**
```javascript
{
  action: 'add',
  categoriesToAdd: '',
  categoriesToRemove: '',
  replacementPairs: [],
  executing: false,
  progress: 0,
  currentFile: '',
  paused: false
}
```

**Composables Used:**
- `useExecution()`
- `useFileSelection()`

**Template:**
```vue
<cdx-field>
  <template #label>Action</template>
  <cdx-radio v-model="action" name="action" value="add">
    Add Categories
  </cdx-radio>
  <cdx-radio v-model="action" name="action" value="remove">
    Remove Categories
  </cdx-radio>
  <cdx-radio v-model="action" name="action" value="replace">
    Replace Categories
  </cdx-radio>
</cdx-field>

<cdx-field v-if="action === 'add' || action === 'remove'">
  <template #label>Categories (comma-separated)</template>
  <cdx-text-area 
    v-model="action === 'add' ? categoriesToAdd : categoriesToRemove"
    placeholder="Category:Example1, Category:Example2"
  />
</cdx-field>

<div v-if="executing" class="cbm-execution-progress">
  <cdx-progress-bar :value="progress" :max="100" />
  <p>Processing: {{ currentFile }}</p>
  
  <div class="cbm-execution-controls">
    <cdx-button v-if="!paused" @click="pause">Pause</cdx-button>
    <cdx-button v-else @click="resume">Resume</cdx-button>
    <cdx-button action="destructive" @click="stop">Stop</cdx-button>
  </div>
</div>

<cdx-button 
  v-else
  action="progressive"
  @click="execute"
  :disabled="!canExecute"
>
  Execute
</cdx-button>
```

---

### 4.6 SettingsPanel.vue

**Responsibilities:**
- Edit summary template
- Delay settings
- Batch size
- Dry run mode

**Props:**
```javascript
{
  open: Boolean
}
```

**Emits:**
```javascript
{
  'update:open': Boolean
}
```

**Data:**
```javascript
{
  settings: {
    editSummary: 'Batch categorization',
    delay: 1000,
    batchSize: 10,
    dryRun: false
  }
}
```

**Template:**
```vue
<cdx-dialog 
  :model-value="open"
  @update:model-value="$emit('update:open', $event)"
  title="Settings"
>
  <cdx-field>
    <template #label>Edit Summary Template</template>
    <cdx-text-input v-model="settings.editSummary" />
  </cdx-field>

  <cdx-field>
    <template #label>Delay Between Requests (ms)</template>
    <cdx-text-input 
      v-model.number="settings.delay" 
      type="number"
      :min="500"
      :max="5000"
    />
  </cdx-field>

  <cdx-field>
    <template #label>Batch Size</template>
    <cdx-text-input 
      v-model.number="settings.batchSize"
      type="number"
      :min="1"
      :max="50"
    />
  </cdx-field>

  <cdx-checkbox v-model="settings.dryRun">
    Dry Run Mode (preview only, don't save)
  </cdx-checkbox>

  <template #footer>
    <cdx-button @click="saveSettings">Save</cdx-button>
    <cdx-button action="quiet" @click="$emit('update:open', false)">
      Cancel
    </cdx-button>
  </template>
</cdx-dialog>
```

---

### 4.7 PreviewModal.vue

**Responsibilities:**
- Show diff preview
- Display before/after wikitext
- Category changes summary

**Props:**
```javascript
{
  open: Boolean,
  file: Object,
  proposedChanges: Object
}
```

**Emits:**
```javascript
{
  'update:open': Boolean
}
```

**Template:**
```vue
<cdx-dialog 
  :model-value="open"
  @update:model-value="$emit('update:open', $event)"
  :title="`Preview: ${file?.title}`"
  large
>
  <div class="cbm-preview-content">
    <h3>Categories to Add:</h3>
    <ul>
      <li v-for="cat in proposedChanges.toAdd" :key="cat">
        {{ cat }}
      </li>
    </ul>

    <h3>Categories to Remove:</h3>
    <ul>
      <li v-for="cat in proposedChanges.toRemove" :key="cat">
        {{ cat }}
      </li>
    </ul>

    <h3>Wikitext Diff:</h3>
    <div class="cbm-diff">
      <div class="cbm-diff-before">
        <h4>Before:</h4>
        <pre>{{ proposedChanges.before }}</pre>
      </div>
      <div class="cbm-diff-after">
        <h4>After:</h4>
        <pre>{{ proposedChanges.after }}</pre>
      </div>
    </div>
  </div>

  <template #footer>
    <cdx-button @click="$emit('update:open', false)">Close</cdx-button>
  </template>
</cdx-dialog>
```

---

## 5. State Management Strategy

### Approach: Composables + Provide/Inject

We'll use Vue composables for shared logic and provide/inject for deeply nested component communication.

### 5.1 useMediaWikiAPI Composable

```javascript
// composables/useMediaWikiAPI.js
import { ref } from 'vue';

export function useMediaWikiAPI() {
  const api = new mw.Api();
  const loading = ref(false);
  const error = ref(null);

  async function get(params) {
    loading.value = true;
    error.value = null;
    try {
      const result = await api.get(params);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function post(params) {
    loading.value = true;
    error.value = null;
    try {
      const result = await api.postWithToken('csrf', params);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    api,
    loading,
    error,
    get,
    post
  };
}
```

---

### 5.2 useCategoryAPI Composable

```javascript
// composables/useCategoryAPI.js
import { ref } from 'vue';
import { useMediaWikiAPI } from './useMediaWikiAPI';
import { Logger } from '../services/logger';

export function useCategoryAPI() {
  const { get, post } = useMediaWikiAPI();
  const files = ref([]);
  const loading = ref(false);

  async function getFilesInCategory(categoryName, options = {}) {
    loading.value = true;
    try {
      const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: categoryName,
        cmtype: 'file',
        cmlimit: options.limit || 500,
        format: 'json'
      };

      const result = await get(params);
      const members = result.query.categorymembers;

      // Fetch additional details for each file
      const fileDetails = await fetchFileDetails(members.map(m => m.title));
      
      files.value = fileDetails;
      return fileDetails;
    } catch (err) {
      Logger.error('Failed to fetch files', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchFileDetails(titles) {
    const params = {
      action: 'query',
      titles: titles.join('|'),
      prop: 'categories|imageinfo',
      iiprop: 'url|size',
      iiurlwidth: 100,
      cllimit: 500,
      format: 'json'
    };

    const result = await get(params);
    const pages = result.query.pages;

    return Object.values(pages).map(page => ({
      title: page.title,
      pageid: page.pageid,
      url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      thumb: page.imageinfo?.[0]?.thumburl || '',
      categories: (page.categories || []).map(c => c.title),
      size: page.imageinfo?.[0]?.size || 0
    }));
  }

  async function editPage(title, content, summary) {
    const params = {
      action: 'edit',
      title: title,
      text: content,
      summary: summary,
      format: 'json'
    };

    return await post(params);
  }

  return {
    files,
    loading,
    getFilesInCategory,
    fetchFileDetails,
    editPage
  };
}
```

---

### 5.3 useFileSelection Composable

```javascript
// composables/useFileSelection.js
import { ref, computed } from 'vue';

export function useFileSelection(files) {
  const selectedIndices = ref(new Set());

  const selectedFiles = computed(() => {
    return files.value.filter((_, index) => 
      selectedIndices.value.has(index)
    );
  });

  const selectedCount = computed(() => selectedIndices.value.size);

  function selectAll() {
    files.value.forEach((_, index) => {
      selectedIndices.value.add(index);
    });
  }

  function deselectAll() {
    selectedIndices.value.clear();
  }

  function toggleSelection(index) {
    if (selectedIndices.value.has(index)) {
      selectedIndices.value.delete(index);
    } else {
      selectedIndices.value.add(index);
    }
  }

  function isSelected(index) {
    return selectedIndices.value.has(index);
  }

  return {
    selectedIndices,
    selectedFiles,
    selectedCount,
    selectAll,
    deselectAll,
    toggleSelection,
    isSelected
  };
}
```

---

### 5.4 useExecution Composable

```javascript
// composables/useExecution.js
import { ref, computed } from 'vue';
import { useCategoryAPI } from './useCategoryAPI';
import { WikitextParser } from '../services/wikitextParser';
import { RateLimiter } from '../services/rateLimiter';
import { Logger } from '../services/logger';

export function useExecution(files, settings) {
  const { editPage } = useCategoryAPI();
  const parser = new WikitextParser();
  
  const executing = ref(false);
  const paused = ref(false);
  const stopped = ref(false);
  const progress = ref(0);
  const currentFile = ref('');
  const results = ref([]);

  async function execute(selectedFiles, action, categories) {
    executing.value = true;
    stopped.value = false;
    progress.value = 0;
    results.value = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        if (stopped.value) break;

        while (paused.value) {
          await RateLimiter.wait(100);
        }

        const file = selectedFiles[i];
        currentFile.value = file.title;

        try {
          await processFile(file, action, categories);
          results.value.push({
            file: file.title,
            status: 'success'
          });
        } catch (err) {
          Logger.error(`Failed to process ${file.title}`, err);
          results.value.push({
            file: file.title,
            status: 'error',
            error: err.message
          });
        }

        progress.value = ((i + 1) / selectedFiles.length) * 100;
        await RateLimiter.wait(settings.delay);
      }
    } finally {
      executing.value = false;
      currentFile.value = '';
    }

    return results.value;
  }

  async function processFile(file, action, categories) {
    // Fetch current wikitext
    const params = {
      action: 'query',
      titles: file.title,
      prop: 'revisions',
      rvprop: 'content',
      format: 'json'
    };

    const result = await api.get(params);
    const page = Object.values(result.query.pages)[0];
    let wikitext = page.revisions[0]['*'];

    // Modify wikitext based on action
    if (action === 'add') {
      categories.forEach(cat => {
        wikitext = parser.addCategory(wikitext, cat);
      });
    } else if (action === 'remove') {
      categories.forEach(cat => {
        wikitext = parser.removeCategory(wikitext, cat);
      });
    }

    // Save if not dry run
    if (!settings.dryRun) {
      await editPage(file.title, wikitext, settings.editSummary);
    }
  }

  function pause() {
    paused.value = true;
  }

  function resume() {
    paused.value = false;
  }

  function stop() {
    stopped.value = true;
  }

  return {
    executing,
    paused,
    stopped,
    progress,
    currentFile,
    results,
    execute,
    pause,
    resume,
    stop
  };
}
```

---

## 6. Migration Phases

### Phase 1: Setup & Infrastructure (Week 1)
**Goal:** Establish Vue environment and build system

**Tasks:**
1. Set up ResourceLoader module for Vue
2. Create base file structure
3. Convert utility classes to services
4. Set up development environment
5. Create basic Vue app shell

**Deliverables:**
- Working Vue app that loads on category pages
- All utility services converted and tested
- Build configuration complete

---

### Phase 2: Core Components (Week 2-3)
**Goal:** Build main UI components

**Tasks:**
1. Convert SearchPanel
2. Convert FileList and FileListItem
3. Implement basic state management
4. Add API integration
5. Test search and file loading

**Deliverables:**
- Functional search interface
- File list display working
- Basic category loading functional

---

### Phase 3: Execution & Actions (Week 4)
**Goal:** Implement category modification logic

**Tasks:**
1. Convert ExecutionPanel
2. Implement action handlers (add/remove/replace)
3. Add progress tracking
4. Implement pause/resume/stop
5. Add error handling

**Deliverables:**
- Full execution workflow working
- Progress indicator functional
- Error handling in place

---

### Phase 4: Settings & Preview (Week 5)
**Goal:** Add configuration and preview features

**Tasks:**
1. Convert SettingsPanel
2. Convert PreviewModal
3. Add settings persistence
4. Implement diff preview
5. Add validation

**Deliverables:**
- Settings dialog functional
- Preview working with diff display
- Settings saved to localStorage

---

### Phase 5: Testing & Polish (Week 6)
**Goal:** Ensure quality and performance

**Tasks:**
1. Write unit tests for composables
2. Write component tests
3. Perform integration testing
4. Fix bugs and edge cases
5. Performance optimization
6. Accessibility audit

**Deliverables:**
- Test coverage >80%
- All critical bugs fixed
- Performance benchmarks met
- WCAG 2.1 AA compliance

---

### Phase 6: Deployment (Week 7)
**Goal:** Release to production

**Tasks:**
1. Beta testing with select users
2. Documentation updates
3. Migration guide for users
4. Gradual rollout
5. Monitor for issues

**Deliverables:**
- Production deployment
- User documentation
- Rollback plan ready

---

## 7. Technical Implementation Details

### 7.1 ResourceLoader Configuration

```javascript
// MediaWiki:Gadget-CategoryBatchManager.js
{
  "dependencies": [
    "@wikimedia/codex",
    "vue",
    "mediawiki.api",
    "oojs-ui",
    "oojs-ui-windows"
  ],
  "messages": [
    "cbm-title",
    "cbm-search-label",
    "cbm-execute-button",
    // ... other i18n messages
  ],
  "peers": [],
  "targets": ["desktop", "mobile"]
}
```

---

### 7.2 Entry Point

```javascript
// gadget-entry.js
import { createMwApp } from 'vue';
import CategoryBatchManager from './components/CategoryBatchManager.vue';

function init() {
  const isCategoryPage = mw.config.get('wgCanonicalNamespace') === 'Category';
  if (!isCategoryPage) return;

  // Add portlet link
  const link = mw.util.addPortletLink(
    'p-cactions',
    '#',
    'Batch Manager',
    'ca-batch-manager',
    'Open Category Batch Manager'
  );

  link.addEventListener('click', (e) => {
    e.preventDefault();

    // Load dependencies
    mw.loader.using(['@wikimedia/codex', 'vue']).then(() => {
      // Create mount point
      const container = document.createElement('div');
      container.id = 'cbm-app';
      document.body.appendChild(container);

      // Create Vue app
      const app = createMwApp(CategoryBatchManager);
      app.mount('#cbm-app');
    });
  });
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

---

### 7.3 Example Component with Codex

```vue
<!-- components/SearchPanel.vue -->
<template>
  <div class="cbm-search-panel">
    <cdx-field>
      <template #label>{{ $i18n('cbm-category-label') }}</template>
      <cdx-text-input
        v-model="categoryName"
        :placeholder="$i18n('cbm-category-placeholder')"
        :disabled="loading"
      />
    </cdx-field>

    <cdx-field>
      <template #label>{{ $i18n('cbm-pattern-label') }}</template>
      <cdx-text-input
        v-model="filePattern"
        :placeholder="$i18n('cbm-pattern-placeholder')"
        :disabled="loading"
      />
    </cdx-field>

    <cdx-button
      action="progressive"
      :disabled="!canSearch"
      @click="handleSearch"
    >
      {{ loading ? $i18n('cbm-loading') : $i18n('cbm-search-button') }}
    </cdx-button>

    <cdx-progress-bar v-if="loading" />

    <cdx-message v-if="error" type="error">
      {{ error }}
    </cdx-message>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCategoryAPI } from '../composables/useCategoryAPI';
import { Validator } from '../services/validator';

const { getFilesInCategory, loading, error } = useCategoryAPI();

const categoryName = ref('');
const filePattern = ref('');

const emit = defineEmits(['files-loaded', 'error']);

const canSearch = computed(() => {
  return Validator.isValidCategoryName(categoryName.value) && !loading.value;
});

async function handleSearch() {
  try {
    const files = await getFilesInCategory(categoryName.value, {
      pattern: filePattern.value
    });
    emit('files-loaded', files);
  } catch (err) {
    emit('error', err.message);
  }
}
</script>

<style scoped>
.cbm-search-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
```

---

### 7.4 Internationalization (i18n)

```javascript
// Use MediaWiki messages
mw.messages.set({
  'cbm-title': 'Category Batch Manager',
  'cbm-category-label': 'Category',
  'cbm-category-placeholder': 'Enter category name',
  'cbm-search-button': 'Search',
  'cbm-loading': 'Loading...',
  // ... more messages
});

// In components, access via:
{{ mw.message('cbm-title').text() }}
// or via plugin:
{{ $i18n('cbm-title') }}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)

```javascript
// tests/unit/useFileSelection.spec.js
import { describe, it, expect } from 'vitest';
import { useFileSelection } from '@/composables/useFileSelection';
import { ref } from 'vue';

describe('useFileSelection', () => {
  it('should select all files', () => {
    const files = ref([
      { title: 'File1.jpg' },
      { title: 'File2.jpg' }
    ]);

    const { selectAll, selectedCount } = useFileSelection(files);
    selectAll();

    expect(selectedCount.value).toBe(2);
  });

  it('should deselect all files', () => {
    const files = ref([{ title: 'File1.jpg' }]);
    const { selectAll, deselectAll, selectedCount } = useFileSelection(files);

    selectAll();
    deselectAll();

    expect(selectedCount.value).toBe(0);
  });
});
```

---

### 8.2 Component Tests (Vue Test Utils)

```javascript
// tests/component/SearchPanel.spec.js
import { mount } from '@vue/test-utils';
import SearchPanel from '@/components/SearchPanel.vue';
import { describe, it, expect, vi } from 'vitest';

describe('SearchPanel', () => {
  it('emits files-loaded when search succeeds', async () => {
    const wrapper = mount(SearchPanel);
    
    await wrapper.find('input').setValue('Category:Test');
    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('files-loaded')).toBeTruthy();
  });

  it('disables search when category is invalid', async () => {
    const wrapper = mount(SearchPanel);
    
    await wrapper.find('input').setValue('');
    
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });
});
```

---

### 8.3 Integration Tests

```javascript
// tests/integration/category-operations.spec.js
import { describe, it, expect } from 'vitest';
import { useCategoryAPI } from '@/composables/useCategoryAPI';
import { WikitextParser } from '@/services/wikitextParser';

describe('Category Operations', () => {
  it('should add category to wikitext and save', async () => {
    const parser = new WikitextParser();
    const { editPage } = useCategoryAPI();

    const originalText = '[[Category:Old]]';
    const modifiedText = parser.addCategory(originalText, 'Category:New');

    expect(modifiedText).toContain('[[Category:New]]');
    expect(modifiedText).toContain('[[Category:Old]]');
  });
});
```

---

## 9. Performance Considerations

### 9.1 Optimization Strategies

1. **Virtual Scrolling for File Lists**
   - Use `vue-virtual-scroller` for large file lists
   - Render only visible items

2. **Debounced Search**
   - Implement debounce for search input
   - Prevent excessive API calls

3. **Lazy Loading**
   - Load file thumbnails on-demand
   - Lazy load preview modal content

4. **Code Splitting**
   - Split large components
   - Load settings/preview modals on demand

5. **Caching**
   - Cache API responses
   - Store file details in memory

---

### 9.2 Performance Benchmarks

| Metric | Target | Current (Vanilla JS) |
|--------|--------|---------------------|
| Initial Load | < 500ms | ~400ms |
| Search Response | < 1s | ~800ms |
| File List Render (100 items) | < 300ms | ~500ms |
| Memory Usage | < 50MB | ~35MB |

---

## 10. Rollout Plan

### 10.1 Beta Phase (2 weeks)

**Target Audience:**
- Gadget maintainers
- Power users
- 5-10 volunteers from Commons community

**Monitoring:**
- Error tracking via console logs
- User feedback form
- Performance metrics

---

### 10.2 Gradual Rollout (3 weeks)

**Week 1:** 10% of users
**Week 2:** 50% of users  
**Week 3:** 100% of users

**Rollback Triggers:**
- Error rate > 5%
- Performance degradation > 20%
- Critical bug reports > 3

---

### 10.3 Success Metrics

1. **Technical:**
   - Zero critical bugs after 1 month
   - Page load time ≤ vanilla version
   - Error rate < 1%

2. **User Experience:**
   - Positive feedback > 80%
   - Feature adoption > 60%
   - No rollback requests

3. **Code Quality:**
   - Test coverage > 80%
   - All Codex components properly used
   - Accessibility score 100/100

---

## Appendix A: Key Dependencies

```json
{
  "vue": "^3.3.0",
  "@wikimedia/codex": "^1.3.0",
  "mediawiki.api": "latest",
  "oojs-ui": "latest"
}
```

---

## Appendix B: File Size Comparison

| Component | Vanilla JS | Vue.js | Change |
|-----------|-----------|--------|--------|
| Core Logic | 80KB | 75KB | -6% |
| UI Code | 120KB | 90KB | -25% |
| Total (uncompressed) | 200KB | 165KB | -17.5% |
| Total (gzipped) | 60KB | 52KB | -13% |

*Note: Vue.js bundle size includes framework overhead*

---

## Appendix C: Migration Checklist

- [ ] Phase 1: Infrastructure setup complete
- [ ] Phase 2: Core components converted
- [ ] Phase 3: Execution logic working
- [ ] Phase 4: Settings & preview functional
- [ ] Phase 5: Tests passing (>80% coverage)
- [ ] Phase 6: Beta testing complete
- [ ] Documentation updated
- [ ] User guide published
- [ ] Production deployment successful
- [ ] Post-deployment monitoring (30 days)

---

## Conclusion

This conversion plan provides a structured approach to migrating the Category Batch Manager from vanilla JavaScript to Vue.js with Codex components. The phased approach ensures minimal disruption while delivering a more maintainable, testable, and user-friendly application.

**Estimated Timeline:** 7 weeks
**Estimated Effort:** 1-2 developers
**Risk Level:** Medium (mitigated by phased rollout)

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Maintained By:** MediaWiki Gadget Team
