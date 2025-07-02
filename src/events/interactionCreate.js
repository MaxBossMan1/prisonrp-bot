const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        if (!interaction.isChatInputCommand()) return;

        const command = bot.commands.get(interaction.commandName);

        if (!command) {
            logger.warning(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, bot);
            
            // Log command usage
            await database.insertBotLog(
                'info', 
                `Command executed: ${interaction.commandName}`, 
                interaction.user.id, 
                'command_executed',
                { 
                    commandName: interaction.commandName,
                    guildId: interaction.guild?.id,
                    channelId: interaction.channel?.id
                }
            );
            
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}:`, error);
            
            // Log error to database
            await database.insertBotLog(
                'error', 
                `Command error: ${interaction.commandName}`, 
                interaction.user.id, 
                'command_error',
                { 
                    commandName: interaction.commandName,
                    error: error.message
                }
            );

            // Send error message to user
            const errorMessage = '❌ There was an error while executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        }
    }
}; 