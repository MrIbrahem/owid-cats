/**
 * @class ProgressSection
 */
class ProgressSection {
    /**
     */
    constructor() {
    }

    /**
     * Create the HTML structure for the progress section
     */
    createElement() {
        return `
        <div v-if="showProgress"
            style="margin-top: 20px; padding: 15px; background-color: #ffffff; border: 1px solid #c8ccd1; border-radius: 4px;">
            <div
                style="width: 100%; background-color: #eaecf0; border-radius: 2px; height: 20px; overflow: hidden; margin-bottom: 10px;">
                <div
                    :style="{ width: progressPercent + '%', height: '100%', backgroundColor: '#36c', transition: 'width 0.3s ease' }">
                </div>
            </div>
            <div style="text-align: center; color: #202122; font-weight: 500;">
                {{ progressText }}
            </div>
        </div>
    `;
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressSection;
}
