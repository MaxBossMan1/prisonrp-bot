const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-session')
        .setDescription('Reset your bot session if you\'re having menu issues'),

    async execute(interaction, bot) {
        const database = bot.getDatabase();
        const logger = bot.getLogger();

        try {
            // Clear the user's session
            await database.clearUserSession(interaction.user.id);
            
            // Log the action
            await database.insertBotLog('info', `User session reset for ${interaction.user.username}`, interaction.user.id, 'session_reset', {
                userId: interaction.user.id,
                username: interaction.user.username
            });

            await interaction.reply({
                content: '✅ **Session Reset Complete**\n\nYour bot session has been cleared. You can now DM the bot to start fresh with the main menu.',
                flags: MessageFlags.Ephemeral
            });

            logger.info(`Session reset for user ${interaction.user.username} (${interaction.user.id})`);

        } catch (error) {
            logger.error('Error in reset-session command:', error);
            await interaction.reply({
                content: '❌ An error occurred while resetting your session. Please contact an administrator.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}; 