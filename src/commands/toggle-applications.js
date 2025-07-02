const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle-applications')
        .setDescription('Toggle staff applications open or closed')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Set applications to open or closed')
                .setRequired(true)
                .addChoices(
                    { name: 'Open', value: 'open' },
                    { name: 'Closed', value: 'closed' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for changing application status')
                .setRequired(false)),

    async execute(interaction, bot) {
        const database = bot.getDatabase();
        const logger = bot.getLogger();

        try {
            // Check if user has permission (admin role)
            const adminRoleConfig = await database.getConfig('admin_role_id');
            const adminRoleId = adminRoleConfig?.value;
            
            if (!adminRoleId || !interaction.member.roles.cache.has(adminRoleId)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to use this command.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const status = interaction.options.getString('status');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const isOpen = status === 'open';

            // Update the configuration
            await database.setConfig('staff_applications_open', isOpen ? 'true' : 'false');

            // Log the action
            await database.insertBotLog('info', `Staff applications ${status}`, interaction.user.id, 'applications_toggle', {
                status: status,
                reason: reason
            });

            const statusEmoji = isOpen ? '🟢' : '🔴';
            const statusText = isOpen ? 'OPEN' : 'CLOSED';

            await interaction.reply({
                content: `${statusEmoji} **Staff applications are now ${statusText}**\n**Changed by:** ${interaction.user.username}\n**Reason:** ${reason}`,
                flags: MessageFlags.Ephemeral
            });

            // Send a general announcement (optional - you can remove this if you don't want public announcements)
            try {
                const staffChannelConfig = await database.getConfig('staff_applications_forum_id');
                if (staffChannelConfig?.value) {
                    const staffChannel = interaction.guild.channels.cache.get(staffChannelConfig.value);
                    if (staffChannel && staffChannel.parent) {
                        // Send announcement in the parent category or a general channel
                        const announcementContent = `${statusEmoji} **Staff Applications ${statusText}**\n\n${isOpen ? 'We are now accepting new staff applications! Use the bot DM system to apply.' : 'Staff applications have been temporarily closed.'}\n\n**Reason:** ${reason}`;
                        
                        // You can modify this to send to a specific announcement channel instead
                        // await someAnnouncementChannel.send(announcementContent);
                    }
                }
            } catch (announcementError) {
                logger.warn('Could not send application status announcement:', announcementError);
            }

            logger.info(`Staff applications ${status} by ${interaction.user.username}`);

        } catch (error) {
            logger.error('Error in toggle-applications command:', error);
            await interaction.followUp({
                content: '❌ An error occurred while updating application status.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}; 