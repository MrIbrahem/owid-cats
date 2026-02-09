/**
 * Category inputs message HTML element creator using Codex CSS-only classes.
 * Creates the HTML elements for displaying add/remove category messages.
 * @see https://doc.wikimedia.org/codex/latest/
 * @class CategoryInputsMessages
 */
class CategoryInputsMessages {
    /**
     */
    constructor() {
    }

    createAddElement() {
        return `
            <!-- Category Add Message -->
            <div v-if="addCategory.message.show" class="margin-bottom-20">
                <cdx-message
                allow-user-dismiss
                :type="addCategory.message.type"
                :inline="false"
                >
                    {{ addCategory.message.text }}
                </cdx-message>
            </div>
        `;
    }

    createRemoveElement() {
        return `
            <!-- Category Remove Message -->
            <div v-if="removeCategory.message.show" class="margin-bottom-20">
                <cdx-message
                allow-user-dismiss
                :type="removeCategory.message.type"
                :inline="false">
                    {{ removeCategory.message.text }}
                </cdx-message>
            </div>
    `;
    }


}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryInputsMessages;
}
