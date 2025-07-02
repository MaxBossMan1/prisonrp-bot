class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.levels = {
            error: 0,
            warning: 1,
            info: 2,
            debug: 3
        };
    }

    log(level, message, ...args) {
        if (this.levels[level] <= this.levels[this.logLevel]) {
            const timestamp = new Date().toISOString();
            const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
            
            switch (level) {
                case 'error':
                    console.error(formattedMessage, ...args);
                    break;
                case 'warning':
                    console.warn(formattedMessage, ...args);
                    break;
                case 'info':
                    console.info(formattedMessage, ...args);
                    break;
                case 'debug':
                    console.debug(formattedMessage, ...args);
                    break;
                default:
                    console.log(formattedMessage, ...args);
            }
        }
    }

    error(message, ...args) {
        this.log('error', message, ...args);
    }

    warning(message, ...args) {
        this.log('warning', message, ...args);
    }

    info(message, ...args) {
        this.log('info', message, ...args);
    }

    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
}

module.exports = Logger; 