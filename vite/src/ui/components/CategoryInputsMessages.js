/**
 * Category inputs UI component using Codex CSS-only classes.
 * Manages the add categories, remove categories inputs with autocomplete.
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
            <div v-if="showAddCategoryMessage" class="margin-bottom-20">
                <cdx-message
                allow-user-dismiss
                type="{{ addCategoryMessageType }}"
                :inline="false"
                >
                    {{ addCategoryMessageText }}
                </cdx-message>
            </div>
        `;
    }

    createRemoveElement() {
        return `
            <!-- Category Remove Message -->
            <div v-if="showRemoveCategoryMessage" class="margin-bottom-20">
                <cdx-message
                allow-user-dismiss
                type="{{ removeCategoryMessageType }}"
                :inline="false">
                    {{ removeCategoryMessageText }}
                </cdx-message>
            </div>
    `;
    }

    displayCategoryMessage(self, text, type = 'error', msg_type = 'add') {
        console.log(`[CBM] Displaying ${msg_type} category message: ${text} (type: ${type})`);
        if (msg_type === 'add') {
            self.showAddCategoryMessage = true;
            self.addCategoryMessageType = type;
            self.addCategoryMessageText = text;
        } else if (msg_type === 'remove') {
            self.showRemoveCategoryMessage = true;
            self.removeCategoryMessageType = type;
            self.removeCategoryMessageText = text;
        }
    }

    hideCategoryMessage(self, msg_type = 'add') {
        console.log(`[CBM] Hiding ${msg_type} category message`);
        if (msg_type === 'add') {
            self.showAddCategoryMessage = false;
            self.addCategoryMessageText = '';
        } else if (msg_type === 'remove') {
            self.showRemoveCategoryMessage = false;
            self.removeCategoryMessageText = '';
        }
    }

}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryInputsMessages;
}
