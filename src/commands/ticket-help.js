const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-help')
        .setDescription('Get help with ticket communication and management'),

    async execute(interaction, bot) {
        const database = bot.getDatabase();
        const logger = bot.getLogger();

        try {
            // Check if user has staff permissions
            const staffRoleConfig = await database.getConfig('staff_role_id');
            const adminRoleConfig = await database.getConfig('admin_role_id');
            const staffRoleId = staffRoleConfig?.value;
            const adminRoleId = adminRoleConfig?.value;
            
            const isStaff = staffRoleId && (interaction.member.roles.cache.has(staffRoleId) || interaction.member.roles.cache.has(adminRoleId));

            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket Communication Help')
                .setColor(0x0099FF)
                .setTimestamp();

            if (isStaff) {
                // Staff help
                embed.setDescription('**Staff Ticket Management Commands**')
                    .addFields(
                        {
                            name: '📋 List Tickets',
                            value: '`/list-tickets` - View all active tickets\n`/list-tickets status:all` - View all tickets (including closed)',
                            inline: false
                        },
                        {
                            name: '💬 Send Messages',
                            value: '`/ticket-message <ticket-id> <message>` - Send a message to ticket creator\n• **OR** simply type in the ticket channel directly\n• You can attach files to your messages\n• Messages are logged and forwarded automatically',
                            inline: false
                        },
                        {
                            name: '🔧 Ticket Management',
                            value: '`/close [reason]` - Close a support ticket (use in ticket channel)\n`/reopen <ticket-id>` - Reopen a closed ticket\n• Closed tickets are archived if archive category is configured',
                            inline: false
                        },
                        {
                            name: '📊 Getting Ticket IDs',
                            value: '• Use `/list-tickets` to see all ticket IDs\n• Check the ticket channel name (contains the ID)\n• Look at the ticket creation message',
                            inline: false
                        },
                        {
                            name: '💡 Tips',
                            value: '• Users can reply to tickets by DMing the bot\n• Staff can type directly in ticket channels\n• All communication is logged for transparency\n• Attachments are supported in both directions\n• Messages get ✅ reaction when sent successfully',
                            inline: false
                        }
                    );
            } else {
                // User help
                embed.setDescription('**How to Communicate with Support**')
                    .addFields(
                        {
                            name: '📝 Creating Tickets',
                            value: 'DM this bot and use the menu system to create support tickets, reports, or submit applications.',
                            inline: false
                        },
                        {
                            name: '💬 Replying to Tickets',
                            value: 'If you have an open support ticket, you can reply by simply sending a DM to this bot.\n• Your message will be automatically forwarded to staff\n• You can send attachments (images, files, etc.)\n• No special commands needed - just type your message',
                            inline: false
                        },
                        {
                            name: '🔍 Multiple Tickets',
                            value: 'If you have multiple open tickets, your messages will go to the most recent one.\nThe bot will tell you which ticket ID received your message.',
                            inline: false
                        },
                        {
                            name: '📋 Using the Menu',
                            value: 'To access the main menu instead of replying to a ticket, send:\n• `menu` or `main`\n• Any number (1-9) for menu options',
                            inline: false
                        },
                        {
                            name: '⚠️ Important Notes',
                            value: '• Keep your DMs open to receive staff replies\n• All communication is logged for your protection\n• Be patient - staff will respond as soon as possible',
                            inline: false
                        }
                    );
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

            logger.info(`${interaction.user.username} viewed ticket help (staff: ${isStaff})`);

        } catch (error) {
            logger.error('Error in ticket-help command:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading help information.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}; 