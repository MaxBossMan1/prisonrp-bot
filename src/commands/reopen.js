const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reopen')
        .setDescription('Reopen a closed application, appeal, or ticket (Staff only)')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for reopening')
                .setRequired(false)
        ),
    
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        try {
            // Check if user has staff permissions
            const staffRoleId = (await database.getConfig('staff_role_id'))?.value;
            const adminRoleId = (await database.getConfig('admin_role_id'))?.value;
            
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

            const reason = interaction.options.getString('reason') || 'No reason provided';
            let success = false;
            let type = '';

            // Check if this is a forum post (application/appeal)
            if (interaction.channel.isThread() && interaction.channel.parent?.type === 15) {
                const postId = interaction.channel.id;
                const application = await database.getApplicationByPostId(postId);
                
                if (application && (application.status === 'accepted' || application.status === 'denied')) {
                    // Update application status
                    await database.updateApplicationStatus(application.id, 'unreviewed', interaction.user.id, reason);
                    
                    // Update forum post tags
                    const underReviewTag = await this.findOrCreateTag(interaction.channel.parent, 'Under Review', '🔄');
                    const acceptedTag = await this.findTag(interaction.channel.parent, 'Accepted');
                    const deniedTag = await this.findTag(interaction.channel.parent, 'Denied');
                    
                    // Remove old status tags and add under review
                    let newTags = interaction.channel.appliedTags.filter(tagId => 
                        tagId !== acceptedTag?.id && tagId !== deniedTag?.id
                    );
                    if (underReviewTag) {
                        newTags.push(underReviewTag.id);
                    }
                    
                    await interaction.channel.setAppliedTags(newTags);
                    
                    // Unlock the thread
                    await interaction.channel.setLocked(false);
                    
                    success = true;
                    type = application.type;
                    
                    // Notify the applicant via DM
                    try {
                        const applicant = await bot.client.users.fetch(application.user_id);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('🔄 Application Reopened')
                            .setColor(0x0099FF)
                            .setDescription(`Your ${application.type.replace('-', ' ')} has been **reopened** for further review.`)
                            .addFields(
                                { name: 'Server', value: interaction.guild.name, inline: true },
                                { name: 'Reopened by', value: interaction.user.username, inline: true },
                                { name: 'Reason', value: reason, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Your application is now under review again.' });
                        
                        await applicant.send({ embeds: [dmEmbed] });
                    } catch (dmError) {
                        logger.warning(`Failed to send DM to applicant ${application.user_id}:`, dmError);
                    }
                    
                    // Log the action
                    await database.insertBotLog(
                        'info', 
                        `Application reopened by ${interaction.user.username}`, 
                        application.user_id, 
                        'application_reopened',
                        { 
                            applicationId: application.id, 
                            reopenedBy: interaction.user.id, 
                            reason: reason 
                        }
                    );
                }
            }
            
            // Check if this is a support ticket channel
            if (!success) {
                const channelId = interaction.channel.id;
                const ticket = await database.getTicketByChannelId(channelId);
                
                if (ticket && ticket.status === 'closed') {
                    // Reopen ticket (update status)
                    await database.updateTicketStatus(ticket.id, 'open', interaction.user.id, reason);
                    
                    success = true;
                    type = ticket.type;
                    
                    // Notify the user via DM
                    try {
                        const user = await bot.client.users.fetch(ticket.user_id);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('🔄 Support Ticket Reopened')
                            .setColor(0x0099FF)
                            .setDescription(`Your support ticket has been **reopened**.`)
                            .addFields(
                                { name: 'Server', value: interaction.guild.name, inline: true },
                                { name: 'Ticket Type', value: ticket.type.replace('-', ' '), inline: true },
                                { name: 'Reopened by', value: interaction.user.username, inline: true },
                                { name: 'Reason', value: reason, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'You can continue the conversation in this ticket.' });
                        
                        await user.send({ embeds: [dmEmbed] });
                    } catch (dmError) {
                        logger.warning(`Failed to send DM to user ${ticket.user_id}:`, dmError);
                    }
                    
                    // Log the action
                    await database.insertBotLog(
                        'info', 
                        `Support ticket reopened by ${interaction.user.username}`, 
                        ticket.user_id, 
                        'ticket_reopened',
                        { 
                            ticketId: ticket.id, 
                            reopenedBy: interaction.user.id, 
                            reason: reason 
                        }
                    );
                }
            }

            if (success) {
                // Send success message
                const embed = new EmbedBuilder()
                    .setTitle('🔄 Reopened Successfully')
                    .setColor(0x0099FF)
                    .addFields(
                        { name: 'Type', value: type.replace('-', ' '), inline: true },
                        { name: 'Reopened by', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ 
                    content: '❌ Nothing to reopen. This channel is not a closed application/appeal or support ticket.', 
                    ephemeral: true 
                });
            }
            
        } catch (error) {
            logger.error('Error in reopen command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while reopening.', 
                ephemeral: true 
            });
        }
    },

    async findOrCreateTag(forumChannel, name, emoji) {
        // Find existing tag
        const existingTag = forumChannel.availableTags.find(tag => tag.name === name);
        if (existingTag) return existingTag;
        
        // Create new tag if we can
        if (forumChannel.availableTags.length < 20) {
            try {
                const newTags = [...forumChannel.availableTags, { name, emoji }];
                await forumChannel.setAvailableTags(newTags);
                return forumChannel.availableTags.find(tag => tag.name === name);
            } catch (error) {
                console.error('Failed to create tag:', error);
                return null;
            }
        }
        
        return null;
    },

    async findTag(forumChannel, name) {
        return forumChannel.availableTags.find(tag => tag.name === name);
    }
}; 