const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('menu')
        .setDescription('Opens the support menu in DM'),
    
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        
        try {
            // Send DM to user
            const dmChannel = await interaction.user.createDM();
            await dmChannel.send('Welcome! The support menu will appear shortly.');
            
            // Trigger menu display by importing MenuHandler
            const MenuHandler = require('../handlers/menuHandler');
            const menuHandler = new MenuHandler(bot);
            
            // Create a mock message object for the menu handler
            const mockMessage = {
                author: interaction.user,
                reply: async (content) => await dmChannel.send(content)
            };
            
            await menuHandler.showMenu(mockMessage, 'main');
            
            // Respond to the interaction
            await interaction.reply({ 
                content: '✅ I\'ve sent you a DM with the support menu!', 
                ephemeral: true 
            });
            
        } catch (error) {
            logger.error('Error in menu command:', error);
            
            if (error.code === 50007) {
                // Cannot send DMs to user
                await interaction.reply({ 
                    content: '❌ I cannot send you a DM. Please check your privacy settings and try again.', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: '❌ An error occurred while opening the menu.', 
                    ephemeral: true 
                });
            }
        }
    }
}; 