const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config();

// Import bot modules
const Database = require('./database/database');
const EventHandler = require('./handlers/eventHandler');
const CommandHandler = require('./handlers/commandHandler');
const MenuHandler = require('./handlers/menuHandler');
const Logger = require('./utils/logger');

class PrisonRPBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.database = null;
        this.logger = new Logger();
    }

    async start() {
        try {
            // Initialize database
            this.database = new Database();
            await this.database.init();

            // Initialize handlers
            const eventHandler = new EventHandler(this);
            const commandHandler = new CommandHandler(this);
            const menuHandler = new MenuHandler(this);

            // Load events and commands
            await eventHandler.loadEvents();
            await commandHandler.loadCommands();

            // Login to Discord
            await this.client.login(process.env.DISCORD_TOKEN);
            
            this.logger.info('Bot started successfully');
        } catch (error) {
            this.logger.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    getDatabase() {
        return this.database;
    }

    getLogger() {
        return this.logger;
    }
}

// Start the bot
const bot = new PrisonRPBot();
bot.start();

// Handle process termination
process.on('SIGINT', async () => {
    bot.logger.info('Shutting down bot...');
    if (bot.database) {
        await bot.database.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    bot.logger.info('Shutting down bot...');
    if (bot.database) {
        await bot.database.close();
    }
    process.exit(0);
}); 