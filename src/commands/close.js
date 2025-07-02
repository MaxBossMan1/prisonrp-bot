const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a support ticket channel (Staff only)')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for closing the ticket')
                .setRequired(false)
        ),
    
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        try {
            // Check if user has staff permissions
            const staffRoleConfig = await database.getConfig('staff_role_id');
            const adminRoleConfig = await database.getConfig('admin_role_id');
            const staffRoleId = staffRoleConfig?.value;
            const adminRoleId = adminRoleConfig?.value;
            
            const hasStaffRole = staffRoleId && interaction.member.roles.cache.has(staffRoleId);
            const hasAdminRole = adminRoleId && interaction.member.roles.cache.has(adminRoleId);
            const hasAdminPermission = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            
            if (!hasStaffRole && !hasAdminRole && !hasAdminPermission) {
                await interaction.reply({ 
                    content: '❌ You need Staff permissions to use this command.', 
                    ephemeral: true 
                });
                return;
            }

            // Check if this is a support ticket channel
            const channelId = interaction.channel.id;
            const ticket = await database.getTicketByChannelId(channelId);
            
            if (!ticket) {
                await interaction.reply({ 
                    content: '❌ This channel is not a support ticket.', 
                    ephemeral: true 
                });
                return;
            }

            // Check if ticket is already closed
            if (ticket.status === 'closed') {
                await interaction.reply({ 
                    content: '❌ This ticket is already closed.', 
                    ephemeral: true 
                });
                return;
            }

            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            // Update ticket status in database
            await database.closeTicket(ticket.id, interaction.user.id, reason);
            
            // Send closure message in channel
            const embed = new EmbedBuilder()
                .setTitle('🔒 Ticket Closed')
                .setColor(0xFF6600)
                .addFields(
                    { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Status', value: 'This channel will be archived or deleted in 30 seconds.', inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Notify the user via DM
            try {
                const user = await bot.client.users.fetch(ticket.user_id);
                const ticketAnswers = JSON.parse(ticket.answers);
                
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔒 Support Ticket Closed')
                    .setColor(0xFF6600)
                    .setDescription(`Your support ticket has been closed.`)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Ticket Type', value: ticket.type.replace('-', ' '), inline: true },
                        { name: 'Closed by', value: interaction.user.username, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Thank you for using our support system.' });
                
                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                logger.warning(`Failed to send DM to user ${ticket.user_id}:`, dmError);
            }
            
            // Log the action
            await database.insertBotLog(
                'info', 
                `Support ticket closed by ${interaction.user.username}`, 
                ticket.user_id, 
                'ticket_closed',
                { 
                    ticketId: ticket.id, 
                    closedBy: interaction.user.id, 
                    reason: reason 
                }
            );
            
            // Archive or delete the channel after a delay
            setTimeout(async () => {
                try {
                    // Check if archive category is configured
                    const archiveCategoryConfig = await database.getConfig('archive_category_id');
                    if (archiveCategoryConfig?.value) {
                        const archiveCategory = interaction.guild.channels.cache.get(archiveCategoryConfig.value);
                        if (archiveCategory && archiveCategory.type === 4) { // Category channel
                            await interaction.channel.setParent(archiveCategory.id);
                            
                            // Lock the channel for regular users
                            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                                SendMessages: false,
                                AddReactions: false
                            });
                            
                            // Update channel name to show it's closed
                            const newName = interaction.channel.name.startsWith('closed-') ? 
                                interaction.channel.name : `closed-${interaction.channel.name}`;
                            await interaction.channel.setName(newName);
                            
                            logger.info(`Ticket channel ${interaction.channel.name} moved to archive category`);
                            return;
                        } else {
                            logger.warn('Archive category not found or invalid, deleting channel instead');
                        }
                    }
                    
                    // No archive category configured or invalid, delete the channel
                    await interaction.channel.delete();
                    logger.info(`Ticket channel deleted after closure`);
                } catch (error) {
                    logger.error('Error archiving/deleting ticket channel:', error);
                }
            }, 30000); // 30 seconds delay
            
        } catch (error) {
            logger.error('Error in close command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while closing the ticket.', 
                ephemeral: true 
            });
        }
    }
}; 