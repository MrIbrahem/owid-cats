/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class SearchPanel
 */
class SearchPanel {
    /**
     */
    constructor() {
    }

    /**
     * Create the search panel HTML element with Codex components.
     */
    createElement() {
        return `
        <div style="margin-bottom: 25px;">
            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-source-category"
                    style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Source Category
                </cdx-label>
                <cdx-text-input id="cbm-source-category" v-model="sourceCategory"
                    placeholder="Category:Economic Data" />
            </div>

            <div style="margin-bottom: 15px;">
                <cdx-label input-id="cbm-pattern" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Search Pattern
                </cdx-label>
                <span style="display: block; color: #54595d; font-size: 0.875em; margin-bottom: 5px;">
                    Enter a pattern to filter files (e.g., ,BLR.svg)
                </span>
                <div style="display: flex; gap: 10px;">
                    <cdx-text-input id="cbm-pattern" v-model="searchPattern" placeholder="e.g., ,BLR.svg"
                        style="flex: 1;" />
                    <cdx-button @click="searchFiles" action="progressive" weight="primary">
                        Search
                    </cdx-button>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * searchFiles() {} to be moved from BatchManager.js to here.
     */

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchPanel;
}
