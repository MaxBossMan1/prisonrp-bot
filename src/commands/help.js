const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows help information about the bot'),
    
    async execute(interaction, bot) {
        const database = bot.getDatabase();
        
        // Check if bot is configured
        const config = await database.getAllConfig();
        const isConfigured = config.length > 0;
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 DigitalDeltaGaming PrisonRP Bot')
            .setColor(0x0099FF)
            .setDescription('Welcome to the support bot for DigitalDeltaGaming PrisonRP server!')
            .addFields(
                {
                    name: '👥 For Users',
                    value: '• Use `/menu` to open the support menu in DM\n• Navigate using numbers or option names\n• Complete staff applications, appeals, and reports\n• Reply to tickets by sending DMs to this bot\n• Attach files to your messages for evidence\n• Get help with server issues'
                },
                {
                    name: '🛠️ For Staff',
                    value: '• Use `/accept` to approve applications/appeals\n• Use `/deny` to reject applications/appeals\n• Use `/close` to close support tickets\n• Use `/reopen` to reopen closed items\n• Use `/list-tickets` to view active tickets\n• Use `/ticket-message` to communicate with users\n• Use `/ticket-help` for detailed ticket help'
                },
                {
                    name: '⚙️ For Administrators',
                    value: isConfigured 
                        ? '• Use `/verify-setup` to check configuration\n• Use `/update-config` to modify settings'
                        : '• Use `/setup` to configure the bot\n• Use `/verify-setup` to check status'
                }
            )
            .addFields(
                {
                    name: '📋 Available Commands',
                    value: '`/menu` - Open support menu\n`/help` - Show this help\n`/setup` - Configure bot (Admin)\n`/verify-setup` - Check configuration\n`/ticket-help` - Ticket communication help\n`/list-tickets` - View tickets (Staff)\n`/ticket-message` - Send ticket reply (Staff)'
                },
                {
                    name: '🔧 Setup Status',
                    value: isConfigured ? '✅ Bot is configured' : '⚠️ Bot needs configuration'
                }
            )
            .setFooter({ 
                text: 'For technical support, contact the development team',
                iconURL: interaction.client.user.displayAvatarURL()
            });

        await interaction.reply({ embeds: [embed] });
    }
}; 