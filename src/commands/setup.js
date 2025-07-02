const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure the bot for your server (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        try {
            // Check if user has admin permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({ 
                    content: '❌ You need Administrator permissions to use this command.', 
                    ephemeral: true 
                });
                return;
            }

            // Check if setup is already complete
            const existingConfig = database.getAllConfig();
            const requiredConfigs = [
                'staff_applications_forum_id',
                'ban_appeals_forum_id', 
                'support_reports_category_id',
                'bot_logs_channel_id',
                'staff_role_id'
            ];

            const missingConfigs = requiredConfigs.filter(config => 
                !existingConfig.find(c => c.key === config)
            );

            if (missingConfigs.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Bot Already Configured')
                    .setColor(0xFFAA00)
                    .setDescription('The bot appears to already be configured. Use `/verify-setup` to check the current configuration or `/update-config` to modify settings.')
                    .setFooter({ text: 'Use /update-config to change existing settings' });

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Start setup process
            const embed = new EmbedBuilder()
                .setTitle('🔧 DigitalDeltaGaming PrisonRP Bot Setup')
                .setColor(0x0099FF)
                .setDescription('Welcome to the bot setup process! I\'ll guide you through configuring the bot for your server.\n\n**What you\'ll need:**\n• Staff Applications Forum Channel ID\n• Ban Appeals Forum Channel ID\n• Support & Reports Category ID\n• Bot Logs Channel ID\n• Staff Role ID\n• Admin Role ID (optional)')
                .addFields(
                    { 
                        name: '📋 How to get Channel/Role IDs', 
                        value: '1. Enable Developer Mode in Discord\n2. Right-click on channels/roles\n3. Select "Copy ID"' 
                    },
                    { 
                        name: '⚡ Quick Setup', 
                        value: 'I\'ll ask for each ID one by one. Type the ID when prompted, or type "skip" for optional items.' 
                    }
                )
                .setFooter({ text: 'This process will take about 2 minutes' });

            await interaction.reply({ embeds: [embed] });

            // Start the setup conversation in this channel
            await this.startSetupConversation(interaction, bot);

        } catch (error) {
            logger.error('Error in setup command:', error);
            await interaction.followUp({ 
                content: '❌ An error occurred during setup. Please try again.', 
                ephemeral: true 
            });
        }
    },

    async startSetupConversation(interaction, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        const setupSteps = [
            { 
                key: 'staff_applications_forum_id', 
                prompt: '📝 Please provide the **Staff Applications Forum Channel ID**:',
                validation: 'forum'
            },
            { 
                key: 'ban_appeals_forum_id', 
                prompt: '⚖️ Please provide the **Ban Appeals Forum Channel ID**:',
                validation: 'forum'
            },
            { 
                key: 'support_reports_category_id', 
                prompt: '📁 Please provide the **Support & Reports Category ID**:',
                validation: 'category'
            },
            { 
                key: 'bot_logs_channel_id', 
                prompt: '📋 Please provide the **Bot Logs Channel ID**:',
                validation: 'text'
            },
            { 
                key: 'staff_role_id', 
                prompt: '👮 Please provide the **Staff Role ID**:',
                validation: 'role'
            },
            { 
                key: 'admin_role_id', 
                prompt: '👑 Please provide the **Admin Role ID** (or type "skip"):',
                validation: 'role',
                optional: true
            }
        ];

        let currentStep = 0;
        const responses = {};

        const filter = (msg) => msg.author.id === interaction.user.id && msg.channel.id === interaction.channel.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 300000 }); // 5 minutes

        // Send first prompt
        await interaction.followUp(setupSteps[0].prompt);

        collector.on('collect', async (message) => {
            const content = message.content.trim();
            const step = setupSteps[currentStep];

            // Handle cancel
            if (content.toLowerCase() === 'cancel') {
                collector.stop('cancelled');
                return;
            }

            // Handle skip for optional fields
            if (step.optional && content.toLowerCase() === 'skip') {
                currentStep++;
                if (currentStep >= setupSteps.length) {
                    collector.stop('completed');
                    return;
                }
                await message.reply(setupSteps[currentStep].prompt);
                return;
            }

            // Validate the input
            const validation = await this.validateSetupInput(content, step.validation, interaction.guild);
            
            if (!validation.valid) {
                await message.reply(`❌ ${validation.error}\n\nPlease try again:`);
                return;
            }

            // Store the response
            responses[step.key] = content;
            await message.react('✅');

            // Move to next step
            currentStep++;
            if (currentStep >= setupSteps.length) {
                collector.stop('completed');
                return;
            }

            // Send next prompt
            await message.reply(setupSteps[currentStep].prompt);
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'cancelled') {
                await interaction.followUp('❌ Setup cancelled.');
                return;
            }

            if (reason === 'time') {
                await interaction.followUp('⏰ Setup timed out. Please run `/setup` again.');
                return;
            }

            if (reason === 'completed') {
                // Save all configurations
                for (const [key, value] of Object.entries(responses)) {
                    database.setConfig(key, value);
                }

                // Create success embed
                const embed = new EmbedBuilder()
                    .setTitle('✅ Setup Complete!')
                    .setColor(0x00FF00)
                    .setDescription('The bot has been successfully configured for your server!')
                    .addFields(
                        { name: 'Next Steps', value: '• Run `/verify-setup` to check configuration\n• Test the bot by using `/menu`\n• Train your staff on using the slash commands' }
                    )
                    .setFooter({ text: 'Your bot is now ready to use!' });

                await interaction.followUp({ embeds: [embed] });

                // Log setup completion
                database.insertBotLog('info', 'Bot setup completed', interaction.user.id, 'setup_completed', responses);
            }
        });
    },

    async validateSetupInput(input, type, guild) {
        try {
            switch (type) {
                case 'forum':
                    const forumChannel = await guild.channels.fetch(input);
                    if (!forumChannel || forumChannel.type !== 15) { // 15 = Forum channel
                        return { valid: false, error: 'This is not a valid forum channel ID.' };
                    }
                    return { valid: true, channel: forumChannel };

                case 'category':
                    const category = await guild.channels.fetch(input);
                    if (!category || category.type !== 4) { // 4 = Category channel
                        return { valid: false, error: 'This is not a valid category ID.' };
                    }
                    return { valid: true, channel: category };

                case 'text':
                    const textChannel = await guild.channels.fetch(input);
                    if (!textChannel || textChannel.type !== 0) { // 0 = Text channel
                        return { valid: false, error: 'This is not a valid text channel ID.' };
                    }
                    return { valid: true, channel: textChannel };

                case 'role':
                    const role = await guild.roles.fetch(input);
                    if (!role) {
                        return { valid: false, error: 'This is not a valid role ID.' };
                    }
                    return { valid: true, role: role };

                default:
                    return { valid: true };
            }
        } catch (error) {
            return { valid: false, error: 'Invalid ID format or the item does not exist.' };
        }
    }
}; 