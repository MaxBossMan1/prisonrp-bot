const fs = require('fs');
const path = require('path');

class EventHandler {
    constructor(bot) {
        this.bot = bot;
        this.client = bot.client;
        this.logger = bot.getLogger();
    }

    async loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        
        if (!fs.existsSync(eventsPath)) {
            fs.mkdirSync(eventsPath, { recursive: true });
            this.logger.info('Created events directory');
        }

        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);

            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(...args, this.bot));
            } else {
                this.client.on(event.name, (...args) => event.execute(...args, this.bot));
            }

            this.logger.debug(`Loaded event: ${event.name}`);
        }

        this.logger.info(`Loaded ${eventFiles.length} events`);
    }
}

module.exports = EventHandler; 