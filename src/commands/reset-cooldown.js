const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-cooldown')
        .setDescription('Reset a user\'s staff application cooldown')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose cooldown to reset')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for resetting the cooldown')
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

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if user has a cooldown
            const cooldown = await database.getUserApplicationCooldown(targetUser.id);
            if (!cooldown) {
                return await interaction.reply({
                    content: `❌ ${targetUser.username} does not have an active application cooldown.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Remove the cooldown
            await database.removeUserApplicationCooldown(targetUser.id);

            // Log the action
            await database.insertBotLog('info', `Application cooldown reset for user ${targetUser.username}`, interaction.user.id, 'cooldown_reset', {
                targetUserId: targetUser.id,
                targetUsername: targetUser.username,
                reason: reason
            });

            await interaction.reply({
                content: `✅ Successfully reset application cooldown for ${targetUser.username}.\n**Reason:** ${reason}`,
                flags: MessageFlags.Ephemeral
            });

            logger.info(`Application cooldown reset for ${targetUser.username} by ${interaction.user.username}`);

        } catch (error) {
            logger.error('Error in reset-cooldown command:', error);
            await interaction.followUp({
                content: '❌ An error occurred while resetting the cooldown.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}; 