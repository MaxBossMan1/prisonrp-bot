const { Events } = require('discord.js');
const MenuHandler = require('../handlers/menuHandler');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Only process DM messages
        if (message.guild) return;
        
        try {
            const menuHandler = new MenuHandler(bot);
            await menuHandler.handleMessage(message);
        } catch (error) {
            logger.error('Error handling DM message:', error);
            
            // Log error to database
            database.insertBotLog('error', 'Error handling DM message', message.author.id, 'message_error', {
                error: error.message,
                messageContent: message.content.substring(0, 100) // Limit content length
            });
            
            // Send error message to user
            try {
                await message.reply('❌ An unexpected error occurred. Please try again later or contact an administrator.');
            } catch (replyError) {
                logger.error('Failed to send error message to user:', replyError);
            }
        }
    }
}; 