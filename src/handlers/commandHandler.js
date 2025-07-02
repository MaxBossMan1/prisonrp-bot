const fs = require('fs');
const path = require('path');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.client = bot.client;
        this.logger = bot.getLogger();
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
            this.logger.info('Created commands directory');
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                this.bot.commands.set(command.data.name, command);
                this.logger.debug(`Loaded command: ${command.data.name}`);
            } else {
                this.logger.warning(`Command at ${filePath} is missing required "data" or "execute" property`);
            }
        }

        this.logger.info(`Loaded ${commandFiles.length} commands`);
    }
}

module.exports = CommandHandler; 