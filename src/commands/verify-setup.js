const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-setup')
        .setDescription('Verify the bot configuration (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        try {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({ 
                    content: '❌ You need Administrator permissions to use this command.', 
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // Get all configuration
            const allConfig = await database.getAllConfig();
            const configMap = {};
            allConfig.forEach(config => {
                configMap[config.key] = config.value;
            });

            // Required configurations
            const requiredConfigs = {
                'staff_applications_forum_id': 'Staff Applications Forum',
                'ban_appeals_forum_id': 'Ban Appeals Forum',
                'support_reports_category_id': 'Support & Reports Category',
                'bot_logs_channel_id': 'Bot Logs Channel',
                'staff_role_id': 'Staff Role'
            };

            // Optional configurations
            const optionalConfigs = {
                'admin_role_id': 'Admin Role',
                'archive_category_id': 'Archive Category'
            };

            const embed = new EmbedBuilder()
                .setTitle('🔧 Bot Configuration Status')
                .setColor(0x0099FF)
                .setTimestamp();

            let allConfigured = true;
            let configStatus = '';

            // Check required configurations
            for (const [key, name] of Object.entries(requiredConfigs)) {
                const value = configMap[key];
                if (value) {
                    // Try to verify the channel/role exists
                    const verification = await this.verifyResource(interaction.guild, key, value);
                    if (verification.exists) {
                        configStatus += `✅ **${name}**: ${verification.name}\n`;
                    } else {
                        configStatus += `⚠️ **${name}**: Configured but ${verification.type} not found\n`;
                        allConfigured = false;
                    }
                } else {
                    configStatus += `❌ **${name}**: Not configured\n`;
                    allConfigured = false;
                }
            }

            configStatus += '\n**Optional:**\n';

            // Check optional configurations
            for (const [key, name] of Object.entries(optionalConfigs)) {
                const value = configMap[key];
                if (value) {
                    const verification = await this.verifyResource(interaction.guild, key, value);
                    if (verification.exists) {
                        configStatus += `✅ **${name}**: ${verification.name}\n`;
                    } else {
                        configStatus += `⚠️ **${name}**: Configured but ${verification.type} not found\n`;
                    }
                } else {
                    configStatus += `⚪ **${name}**: Not configured (optional)\n`;
                }
            }

            embed.setDescription(configStatus);

            if (allConfigured) {
                embed.setColor(0x00FF00);
                embed.addFields({
                    name: '🎉 Setup Complete!',
                    value: 'Your bot is fully configured and ready to use.',
                    inline: false
                });
            } else {
                embed.setColor(0xFFAA00);
                embed.addFields({
                    name: '⚠️ Setup Incomplete',
                    value: 'Some required configurations are missing. Run `/setup` to complete the configuration.',
                    inline: false
                });
            }

            // Add usage stats
            const stats = await this.getUsageStats(database);
            if (stats.totalSubmissions > 0) {
                embed.addFields({
                    name: '📊 Usage Statistics',
                    value: `• Applications: ${stats.applications}\n• Support Tickets: ${stats.tickets}\n• Total Submissions: ${stats.totalSubmissions}`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in verify-setup command:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while verifying the setup.', 
                flags: MessageFlags.Ephemeral
            });
        }
    },

    async verifyResource(guild, configKey, resourceId) {
        try {
            if (configKey.includes('role')) {
                const role = guild.roles.cache.get(resourceId);
                return {
                    exists: !!role,
                    name: role ? role.name : 'Unknown Role',
                    type: 'role'
                };
            } else {
                const channel = guild.channels.cache.get(resourceId);
                return {
                    exists: !!channel,
                    name: channel ? channel.name : 'Unknown Channel',
                    type: 'channel'
                };
            }
        } catch (error) {
            return {
                exists: false,
                name: 'Error verifying',
                type: configKey.includes('role') ? 'role' : 'channel'
            };
        }
    },

    async getUsageStats(database) {
        try {
            const unreviwedApps = await database.getApplicationsByStatus('unreviewed');
            const acceptedApps = await database.getApplicationsByStatus('accepted');
            const deniedApps = await database.getApplicationsByStatus('denied');
            const applications = unreviwedApps.length + acceptedApps.length + deniedApps.length;
            
            const openTickets = await database.getOpenTickets();
            const tickets = openTickets.length;
            
            return {
                applications,
                tickets,
                totalSubmissions: applications + tickets
            };
        } catch (error) {
            return {
                applications: 0,
                tickets: 0,
                totalSubmissions: 0
            };
        }
    }
}; 