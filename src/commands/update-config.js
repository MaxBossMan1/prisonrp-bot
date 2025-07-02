const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-config')
        .setDescription('Update a specific bot configuration setting')
        .addStringOption(option =>
            option.setName('setting')
                .setDescription('The configuration setting to update')
                .setRequired(true)
                .addChoices(
                    { name: 'Staff Applications Forum', value: 'staff_applications_forum_id' },
                    { name: 'Ban Appeals Forum', value: 'ban_appeals_forum_id' },
                    { name: 'Support Reports Category', value: 'support_reports_category_id' },
                    { name: 'Archive Category', value: 'archive_category_id' },
                    { name: 'Bot Logs Channel', value: 'bot_logs_channel_id' },
                    { name: 'Staff Role', value: 'staff_role_id' },
                    { name: 'Admin Role', value: 'admin_role_id' }
                ))
        .addStringOption(option =>
            option.setName('value')
                .setDescription('The new value (Channel ID or Role ID)')
                .setRequired(true)),

    async execute(interaction, bot) {
        const database = bot.getDatabase();
        const logger = bot.getLogger();

        try {
            // Check if user has admin permissions
            const adminRoleConfig = await database.getConfig('admin_role_id');
            const adminRoleId = adminRoleConfig?.value;
            
            if (!adminRoleId || !interaction.member.roles.cache.has(adminRoleId)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to use this command.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const setting = interaction.options.getString('setting');
            const value = interaction.options.getString('value').trim();

            // Validate the input based on setting type
            const validation = await this.validateConfigValue(setting, value, interaction.guild);
            
            if (!validation.valid) {
                return await interaction.reply({
                    content: `❌ ${validation.error}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Get the old value for logging
            const oldConfig = await database.getConfig(setting);
            const oldValue = oldConfig?.value || 'Not set';

            // Update the configuration
            await database.setConfig(setting, value);

            // Log the change
            await database.insertBotLog('info', `Configuration updated: ${setting}`, interaction.user.id, 'config_update', {
                setting: setting,
                oldValue: oldValue,
                newValue: value,
                resourceName: validation.name
            });

            // Get friendly name for the setting
            const settingNames = {
                'staff_applications_forum_id': 'Staff Applications Forum',
                'ban_appeals_forum_id': 'Ban Appeals Forum',
                'support_reports_category_id': 'Support Reports Category',
                'archive_category_id': 'Archive Category',
                'bot_logs_channel_id': 'Bot Logs Channel',
                'staff_role_id': 'Staff Role',
                'admin_role_id': 'Admin Role'
            };

            const friendlyName = settingNames[setting] || setting;

            await interaction.reply({
                content: `✅ **Configuration Updated**\n\n**Setting:** ${friendlyName}\n**New Value:** ${validation.name}\n**Updated by:** ${interaction.user.username}`,
                flags: MessageFlags.Ephemeral
            });

            logger.info(`Configuration ${setting} updated to ${value} by ${interaction.user.username}`);

        } catch (error) {
            logger.error('Error in update-config command:', error);
            await interaction.reply({
                content: '❌ An error occurred while updating the configuration.',
                flags: MessageFlags.Ephemeral
            });
        }
    },

    async validateConfigValue(setting, value, guild) {
        try {
            if (setting.includes('role')) {
                // Validate role ID
                const role = await guild.roles.fetch(value);
                if (!role) {
                    return { valid: false, error: 'Invalid role ID or role does not exist.' };
                }
                return { valid: true, name: role.name, resource: role };
            } else {
                // Validate channel ID
                const channel = await guild.channels.fetch(value);
                if (!channel) {
                    return { valid: false, error: 'Invalid channel ID or channel does not exist.' };
                }

                // Check channel type based on setting
                if (setting.includes('forum') && channel.type !== 15) {
                    return { valid: false, error: 'This setting requires a Forum channel.' };
                }
                if (setting.includes('category') && channel.type !== 4) {
                    return { valid: false, error: 'This setting requires a Category channel.' };
                }
                if (setting === 'bot_logs_channel_id' && channel.type !== 0) {
                    return { valid: false, error: 'Bot logs channel must be a text channel.' };
                }

                return { valid: true, name: channel.name, resource: channel };
            }
        } catch (error) {
            return { valid: false, error: 'Invalid ID format or the resource does not exist.' };
        }
    }
}; 