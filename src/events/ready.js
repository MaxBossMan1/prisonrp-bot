const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        logger.info(`Bot is ready! Logged in as ${client.user.tag}`);
        logger.info(`Bot is in ${client.guilds.cache.size} guilds`);
        
        // Set bot status
        client.user.setActivity('DMs for support', { type: ActivityType.Watching });
        
        // Clean old sessions and logs on startup
        try {
            const sessionsDeleted = await database.cleanOldSessions();
            const logsDeleted = await database.cleanOldLogs();
            
            if (sessionsDeleted.changes > 0) {
                logger.info(`Cleaned ${sessionsDeleted.changes} old sessions`);
            }
            
            if (logsDeleted.changes > 0) {
                logger.info(`Cleaned ${logsDeleted.changes} old logs`);
            }
        } catch (error) {
            logger.error('Error during startup cleanup:', error);
        }
        
        // Log startup to database
        await database.insertBotLog('info', 'Bot started successfully', null, 'bot_startup', {
            guilds: client.guilds.cache.size,
            users: client.users.cache.size
        });
    }
}; 