
// Mock data for preview
const mockFiles = [
    { title: 'File:GDP-per-capita,BLR.svg', selected: false },
    { title: 'File:Life-expectancy,BLR.svg', selected: false },
    { title: 'File:Population,BLR.svg', selected: false },
    { title: 'File:Unemployment-rate,BLR.svg', selected: false },
    { title: 'File:Literacy-rate,BLR.svg', selected: false },
    { title: 'File:Infant-mortality,BLR.svg', selected: false },
    { title: 'File:CO2-emissions,BLR.svg', selected: false },
    { title: 'File:Energy-consumption,BLR.svg', selected: false },
    { title: 'File:Life-expectancy,BLR1.svg', selected: false },
    { title: 'File:Population,BLR2.svg', selected: false },
    { title: 'File:Unemployment-rate,BLR3.svg', selected: false },
    { title: 'File:Literacy-rate,BLR4.svg', selected: false },
    { title: 'File:Infant-mortality,BLR5.svg', selected: false },
    { title: 'File:CO2-emissions,BLR.svg6', selected: false },
    { title: 'File:Energy-consumption,BLR7.svg', selected: false },
    { title: 'File:7Life-expectancy,BLR1.svg', selected: false },
    { title: 'File:6Population,BLR2.svg', selected: false },
    { title: 'File:5Unemployment-rate,BLR3.svg', selected: false },
    { title: 'File:4Literacy-rate,BLR4.svg', selected: false },
    { title: 'File:3Infant-mortality,BLR5.svg', selected: false },
    { title: 'File:2CO2-emissions,BLR.svg6', selected: false },
    { title: 'File:1Energy-consumption,BLR7.svg', selected: false },

];

let currentFiles = [];

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
    attachEventListeners();
    console.log('Category Batch Manager Preview - Ready');
});

function attachEventListeners() {
    // Search button
    document.getElementById('cbm-search-btn').addEventListener('click', handleSearch);

    // Pattern input - Enter key
    document.getElementById('cbm-pattern').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleSearch();
    });

    // Select/Deselect all
    document.getElementById('cbm-select-all').addEventListener('click', selectAll);
    document.getElementById('cbm-deselect-all').addEventListener('click', deselectAll);

    // Preview and Execute
    document.getElementById('cbm-preview').addEventListener('click', handlePreview);
    document.getElementById('cbm-execute').addEventListener('click', handleExecute);

    // Minimize and Close buttons
    document.getElementById('cbm-minimize').addEventListener('click', minimizeModal);
    document.getElementById('cbm-close').addEventListener('click', close);
    document.getElementById('cbm-preview-close').addEventListener('click', hidePreviewModal);

    // Reopen button
    document.getElementById('cbm-reopen-btn').addEventListener('click', reopenModal);

    // Close modal when clicking outside
    document.getElementById('cbm-preview-modal').addEventListener('click', function (e) {
        if (e.target.id === 'cbm-preview-modal') {
            hidePreviewModal();
        }
    });
}

function handleSearch() {
    const pattern = document.getElementById('cbm-pattern').value.trim();

    clearMessage();
    showLoading();

    // Simulate API delay
    setTimeout(function () {
        // Filter files by pattern
        currentFiles = pattern
            ? mockFiles.filter(f => f.title.includes(pattern))
            : [...mockFiles];

        if (currentFiles.length === 0) {
            showMessage('No files found matching the pattern.', 'error');
            document.getElementById('cbm-results-header').classList.add('hidden');
        } else {
            showMessage(`Found ${currentFiles.length} files matching the pattern.`, 'success');
            document.getElementById('cbm-results-header').classList.remove('hidden');
            document.getElementById('cbm-count').textContent = currentFiles.length;
        }

        renderFileList();
        hideLoading();
    }, 500);
}

function renderFileList() {
    const listContainer = document.getElementById('cbm-file-list');
    listContainer.innerHTML = '';

    if (currentFiles.length === 0) {
        return;
    }

    currentFiles.forEach(function (file, index) {
        const fileRow = document.createElement('div');
        fileRow.className = 'cbm-file-row';
        fileRow.innerHTML = `
                    <input type="checkbox" class="cbm-file-checkbox" id="file-${index}"
                        ${file.selected ? 'checked' : ''}>
                    <label for="file-${index}">${file.title}</label>
                    <button class="cbm-remove-btn" data-index="${index}">×</button>
                `;
        listContainer.appendChild(fileRow);
    });

    // Attach checkbox listeners
    document.querySelectorAll('.cbm-file-checkbox').forEach(function (checkbox) {
        checkbox.addEventListener('change', function (e) {
            const index = parseInt(e.target.id.replace('file-', ''));
            currentFiles[index].selected = e.target.checked;
            updateSelectedCount();
        });
    });

    // Attach remove button listeners
    document.querySelectorAll('.cbm-remove-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const index = parseInt(e.target.dataset.index);
            removeFile(index);
        });
    });

    updateSelectedCount();
}

function removeFile(index) {
    currentFiles.splice(index, 1);
    document.getElementById('cbm-count').textContent = currentFiles.length;
    renderFileList();

    if (currentFiles.length === 0) {
        document.getElementById('cbm-results-header').classList.add('hidden');
        showMessage('All files removed.', 'notice');
    }
}

function selectAll() {
    currentFiles.forEach(f => f.selected = true);
    document.querySelectorAll('.cbm-file-checkbox').forEach(cb => cb.checked = true);
    updateSelectedCount();
}

function deselectAll() {
    currentFiles.forEach(f => f.selected = false);
    document.querySelectorAll('.cbm-file-checkbox').forEach(cb => cb.checked = false);
    updateSelectedCount();
}

function updateSelectedCount() {
    const selectedCount = currentFiles.filter(f => f.selected).length;
    document.getElementById('cbm-selected').textContent = selectedCount;
}

function getSelectedFiles() {
    return currentFiles.filter(f => f.selected);
}

function handlePreview() {
    const selectedFiles = getSelectedFiles();

    if (selectedFiles.length === 0) {
        showMessage('Please select at least one file.', 'warning');
        return;
    }

    const toAdd = parseCategories(document.getElementById('cbm-add-cats').value);
    const toRemove = parseCategories(document.getElementById('cbm-remove-cats').value);

    if (toAdd.length === 0 && toRemove.length === 0) {
        showMessage('Please specify categories to add or remove.', 'warning');
        return;
    }

    // Generate preview without affecting file list
    const preview = selectedFiles.map(function (file) {
        return {
            file: file.title,
            currentCategories: ['Belarus', 'Economic Data'],
            newCategories: ['Belarus', 'Economic Data', ...toAdd].filter(c => !toRemove.includes(c)),
            willChange: true
        };
    });

    showPreviewModal(preview);
}

function showPreviewModal(preview) {
    const modal = document.getElementById('cbm-preview-modal');
    const content = document.getElementById('cbm-preview-content');

    let html = '<table class="cbm-preview-table">';
    html += '<tr><th>File</th><th>Current Categories</th><th>New Categories</th></tr>';

    preview.forEach(function (item) {
        if (item.willChange) {
            html += `
                        <tr>
                            <td>${item.file}</td>
                            <td>${item.currentCategories.join(', ')}</td>
                            <td>${item.newCategories.join(', ')}</td>
                        </tr>
                    `;
        }
    });

    html += '</table>';

    const changesCount = preview.filter(p => p.willChange).length;
    html = `<p><strong>${changesCount} files</strong> will be modified</p>` + html;

    content.innerHTML = html;
    modal.classList.remove('hidden');
}

function hidePreviewModal() {
    document.getElementById('cbm-preview-modal').classList.add('hidden');
}

function handleExecute() {
    const selectedFiles = getSelectedFiles();

    if (selectedFiles.length === 0) {
        showMessage('Please select at least one file.', 'warning');
        return;
    }

    const toAdd = parseCategories(document.getElementById('cbm-add-cats').value);
    const toRemove = parseCategories(document.getElementById('cbm-remove-cats').value);

    if (toAdd.length === 0 && toRemove.length === 0) {
        showMessage('Please specify categories to add or remove.', 'warning');
        return;
    }

    const summary = document.getElementById('cbm-summary').value.trim();
    if (!summary) {
        showMessage('Please provide an edit summary.', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to update ${selectedFiles.length} files?`)) {
        return;
    }

    showProgress();
    clearMessage();

    // Simulate batch processing
    let processed = 0;
    const total = selectedFiles.length;
    const interval = setInterval(function () {
        processed++;
        const percentage = Math.round((processed / total) * 100);
        updateProgress(percentage, { success: processed, failed: 0 });

        if (processed >= total) {
            clearInterval(interval);
            setTimeout(function () {
                hideProgress();
                showResults({
                    success: processed,
                    failed: 0,
                    skipped: 0
                });
            }, 500);
        }
    }, 200);
}

function showProgress() {
    document.getElementById('cbm-progress').classList.remove('hidden');
    updateProgress(0, { success: 0, failed: 0 });
}

function hideProgress() {
    document.getElementById('cbm-progress').classList.add('hidden');
}

function updateProgress(percentage, results) {
    document.getElementById('cbm-progress-fill').style.width = percentage + '%';
    document.getElementById('cbm-progress-text').textContent =
        `Processing... ${percentage}% (${results.success} succeeded, ${results.failed} failed)`;
}

function showResults(results) {
    const message = `
                Batch operation completed!
                <br>✅ Success: ${results.success}
                <br>❌ Failed: ${results.failed}
                <br>⏭️ Skipped: ${results.skipped}
            `;
    showMessage(message, 'success');
}

function showMessage(text, type) {
    const container = document.getElementById('cbm-results-message');
    container.classList.remove('hidden');

    const typeClass = type === 'error' ? 'cdx-message--error'
        : type === 'warning' ? 'cdx-message--warning'
            : type === 'success' ? 'cdx-message--success'
                : 'cdx-message--notice';

    container.innerHTML = `
                <div class="cdx-message cdx-message--block ${typeClass}" role="alert">
                    <span class="cdx-message__icon"></span>
                    <div class="cdx-message__content">${text}</div>
                </div>
            `;
}

function clearMessage() {
    const container = document.getElementById('cbm-results-message');
    container.innerHTML = '';
    container.classList.add('hidden');
}

function showLoading() {
    const listContainer = document.getElementById('cbm-file-list');
    listContainer.innerHTML = `
                <div class="cdx-progress-bar cdx-progress-bar--inline" role="progressbar" aria-label="Loading">
                    <div class="cdx-progress-bar__bar"></div>
                </div>
            `;
}

function hideLoading() {
    // Loading will be replaced by renderFileList()
}

function parseCategories(input) {
    if (!input || !input.trim()) {
        return [];
    }

    return input.split(',')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
        .map(cat => {
            // Normalize category names
            if (!cat.startsWith('Category:')) {
                cat = 'Category:' + cat;
            }
            // Remove "Category:" prefix for internal use
            return cat.replace(/^Category:/i, '');
        });
}

function close() {
    if (confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
        document.getElementById('category-batch-manager').style.display = 'none';
        // في الاستخدام الفعلي، سيتم إعادة فتح القائمة من زر الويكي
        // في الديمو، نظهر زر إعادة الفتح
        document.getElementById('cbm-reopen-btn').style.display = 'block';
    }
}

function minimizeModal() {
    document.getElementById('category-batch-manager').style.display = 'none';
    document.getElementById('cbm-reopen-btn').style.display = 'block';
}

function reopenModal() {
    document.getElementById('category-batch-manager').style.display = 'flex';
    document.getElementById('cbm-reopen-btn').style.display = 'none';
}
