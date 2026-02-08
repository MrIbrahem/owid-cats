/**
 * Search panel UI component using Codex CSS-only classes.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class SearchHandler
 */
class SearchHandler {
    /**
     */
    constructor() {
    }

    /**
     * Create the search panel HTML element with Codex components.
     */
    createElement() {
        return `
        <div class="cbm-search-panel">
            <div class="cbm-input-group">
                <cdx-label input-id="cbm-source-category" class="cbm-label">
                    Source Category
                </cdx-label>
                <cdx-text-input id="cbm-source-category" v-model="sourceCategory"
                    placeholder="Category:Our World in Data graphs of Austria" />
            </div>

            <div class="cbm-input-group">
                <cdx-label input-id="cbm-pattern" class="cbm-label">
                    Search Pattern
                </cdx-label>
                <span class="cbm-help-text">
                    Enter a pattern to filter files (e.g., ,BLR.svg)
                </span>
                <div class="cbm-input-button-group">
                    <cdx-text-input id="cbm-pattern" v-model="searchPattern" placeholder="e.g., ,BLR.svg" />
                    <cdx-button v-if="!isSearching" @click="searchFiles" action="progressive" weight="primary">
                        Search
                    </cdx-button>
                    <cdx-button v-if="isSearching" @click="stopSearch" action="destructive" weight="primary">
                        Stop Process
                    </cdx-button>
                </div>
            </div>
        </div>
        `;
    }

    searchFiles(self) {
        self.isSearching = true;
        self.file_service.executeFileSearch(self)
    }

    stopSearch(self) {
        self.isSearching = false;
        self.shouldStopSearch = true;
        // Implement logic to stop ongoing search if possible
    }

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchHandler;
}
