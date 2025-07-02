const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();

        if (!interaction.isChatInputCommand()) return;

        const command = bot.commands.get(interaction.commandName);

        if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, bot);
            
            // Log command usage
            database.insertBotLog('info', `Command used: ${interaction.commandName}`, interaction.user.id, 'command_used', {
                commandName: interaction.commandName,
                guildId: interaction.guildId,
                channelId: interaction.channelId
            });
            
        } catch (error) {
            logger.error('Error executing command:', error);
            
            // Log error
            database.insertBotLog('error', `Command error: ${interaction.commandName}`, interaction.user.id, 'command_error', {
                error: error.message,
                commandName: interaction.commandName
            });

            // Reply with error message
            const errorMessage = '❌ There was an error while executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
}; 