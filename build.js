/**
 * Build script for Category Batch Manager gadget
 * Concatenates all source files into a single bundle for Wikimedia Commons
 */

const fs = require('fs');
const path = require('path');

// File order according to dependency requirements
const SOURCE_FILES = [
  'src/utils/Logger.js',
  'src/utils/RateLimiter.js',
  'src/utils/Validator.js',
  'src/utils/WikitextParser.js',
  'src/utils/UsageLogger.js',
  'src/models/FileModel.js',
  'src/models/CategoryOperation.js',
  'src/services/APIService.js',
  'src/services/FileService.js',
  'src/services/CategoryService.js',
  'src/services/ErrorRecovery.js',
  'src/services/BatchProcessor.js',
  'src/ui/components/SearchPanel.js',
  'src/ui/components/FileList.js',
  'src/ui/components/CategoryInputs.js',
  'src/ui/components/ProgressBar.js',
  'src/main.js',
  'src/gadget-entry.js',
];

const CSS_SOURCE = 'src/ui/styles/main.css';
const DIST_DIR = 'dist';
const OUTPUT_JS = 'dist/Gadget-CategoryBatchManager.js';
const OUTPUT_CSS = 'dist/Gadget-CategoryBatchManager.css';

/**
 * Strip module.exports blocks from JavaScript code
 * @param {string} code - The JavaScript code
 * @returns {string} Code with module.exports blocks removed
 */
function stripModuleExports(code) {
  // Remove blocks like:
  // if (typeof module !== 'undefined' && module.exports) {
  //   module.exports = ClassName;
  // }
  return code.replace(
    /if \(typeof module !== 'undefined' && module\.exports\) \{[^}]*module\.exports = [^;]+;[^}]*\}/g,
    ''
  );
}

/**
 * Strip global comments from JavaScript code
 * @param {string} code - The JavaScript code
 * @returns {string} Code with global comments removed
 */
function stripGlobalComments(code) {
  return code.replace(/\/\* global .+? \*\/\n?/g, '');
}

/**
 * Process a single JavaScript file
 * @param {string} filePath - Path to the file
 * @returns {string} Processed file content with header comment
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Strip module.exports blocks
  content = stripModuleExports(content);
  
  // Strip global comments
  content = stripGlobalComments(content);
  
  // For gadget-entry.js, unwrap the IIFE since we'll wrap everything in one IIFE
  if (filePath === 'src/gadget-entry.js') {
    // Remove the outer IIFE wrapper: (function () { 'use strict'; ... })();
    // Match opening: (function () {\n  'use strict';\n\n
    content = content.replace(/\(function \(\) \{\s+'use strict';\s+/s, '');
    // Match closing: })();
    content = content.replace(/\}\)\(\);?\s*$/s, '');
  }
  
  // Trim trailing whitespace and ensure proper ending
  content = content.trim();
  
  // Add file marker comment
  const marker = `// === ${filePath} ===\n`;
  
  return marker + content;
}

/**
 * Generate the header comment for the bundled file
 * @returns {string} Header comment block
 */
function generateHeader() {
  return `/**
 * Gadget-CategoryBatchManager.js
 * Category Batch Manager for Wikimedia Commons
 *
 * @version 1.0.0
 * @license MIT
 * @description A tool for batch categorization of files in Wikimedia Commons.
 *
 * Built from: https://github.com/MrIbrahem/owid-cats
 */

`;
}

/**
 * Build the bundled JavaScript file
 */
function buildJS() {
  console.log('Building JavaScript bundle...');
  
  // Process all source files
  const processedFiles = SOURCE_FILES.map(processFile);
  
  // Combine all processed files
  const combinedContent = processedFiles.join('\n\n');
  
  // Wrap in IIFE
  const bundle = `${generateHeader()}(function () {
'use strict';

${combinedContent}

})();
`;
  
  // Write output file
  fs.writeFileSync(OUTPUT_JS, bundle, 'utf8');
  console.log(`✓ Created ${OUTPUT_JS}`);
}

/**
 * Copy CSS file to dist
 */
function buildCSS() {
  console.log('Copying CSS file...');
  
  const cssContent = fs.readFileSync(CSS_SOURCE, 'utf8');
  fs.writeFileSync(OUTPUT_CSS, cssContent, 'utf8');
  console.log(`✓ Created ${OUTPUT_CSS}`);
}

/**
 * Main build function
 */
function build() {
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
    console.log(`✓ Created ${DIST_DIR}/ directory`);
  }
  
  // Build JS and CSS
  buildJS();
  buildCSS();
  
  console.log('\nBuild completed successfully!');
}

// Run the build
build();
