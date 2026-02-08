/**
 * Logger utility for debugging and monitoring
 * @class Logger
 */
class Logger {
    /**
     * Log a message at the specified level
     * @param {string} message - The message to log
     * @param {string} level - Log level: 'info', 'warn', 'error', 'debug'
     */
    static log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[CategoryBatchManager][${level.toUpperCase()}][${timestamp}]`;

        switch (level) {
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'debug':
                console.debug(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }

    /**
     * Log an error with optional error object
     * @param {string} message - The error message
     * @param {Error} error - The error object
     */
    static error(message, error) {
        Logger.log(`${message}: ${error && error.message ? error.message : error}`, 'error');
    }

    /**
     * Log a warning
     * @param {string} message - The warning message
     */
    static warn(message) {
        Logger.log(message, 'warn');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
