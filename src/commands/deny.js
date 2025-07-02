const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deny')
        .setDescription('Deny a staff application or ban appeal (Staff only)')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for denial (recommended)')
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

            // Check if this is a forum post
            if (!interaction.channel.isThread() || !interaction.channel.parent?.type === 15) { // 15 = Forum Channel
                await interaction.reply({ 
                    content: '❌ This command can only be used in forum post threads.', 
                    ephemeral: true 
                });
                return;
            }

            // Get the forum post ID (thread ID)
            const postId = interaction.channel.id;
            
            // Check if this is a valid application/appeal
            const application = await database.getApplicationByPostId(postId);
            if (!application) {
                await interaction.reply({ 
                    content: '❌ No application or appeal found for this forum post.', 
                    ephemeral: true 
                });
                return;
            }

            // Check if already reviewed
            if (application.status !== 'unreviewed') {
                await interaction.reply({ 
                    content: `❌ This ${application.type} has already been ${application.status}.`, 
                    ephemeral: true 
                });
                return;
            }

            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            // Update application status
            await database.updateApplicationStatus(application.id, 'denied', interaction.user.id, reason);
            
            // Update forum post tags
            const deniedTag = await this.findOrCreateTag(interaction.channel.parent, 'Denied', '❌');
            const unreviewedTag = await this.findTag(interaction.channel.parent, 'Unreviewed');
            
            // Update thread tags
            const newTags = interaction.channel.appliedTags.filter(tagId => tagId !== unreviewedTag?.id);
            if (deniedTag) {
                newTags.push(deniedTag.id);
            }
            
            await interaction.channel.setAppliedTags(newTags);
            
            // Lock the thread
            await interaction.channel.setLocked(true);
            
            // Send denial message in thread
            const embed = new EmbedBuilder()
                .setTitle('❌ Application Denied')
                .setColor(0xFF0000)
                .addFields(
                    { name: 'Reviewed by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Notify the applicant via DM
            try {
                const applicant = await bot.client.users.fetch(application.user_id);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('❌ Application Denied')
                    .setColor(0xFF0000)
                    .setDescription(`Your ${application.type.replace('-', ' ')} has been **denied**.`)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Reviewed by', value: interaction.user.username, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'You can reapply in the future following our guidelines.' });
                
                await applicant.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                logger.warning(`Failed to send DM to applicant ${application.user_id}:`, dmError);
            }
            
            // Log the action
            await database.insertBotLog(
                'info', 
                `Application denied by ${interaction.user.username}`, 
                application.user_id, 
                'application_denied',
                { 
                    applicationId: application.id, 
                    reviewedBy: interaction.user.id, 
                    reason: reason 
                }
            );
            
        } catch (error) {
            logger.error('Error in deny command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while processing the denial.', 
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