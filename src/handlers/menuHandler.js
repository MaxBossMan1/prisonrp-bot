const { EmbedBuilder } = require('discord.js');
const { QAFlowManager } = require('../flows/qaFlows');

class MenuHandler {
    constructor(bot) {
        this.bot = bot;
        this.client = bot.client;
        this.database = bot.getDatabase();
        this.logger = bot.getLogger();
        this.qaFlowManager = new QAFlowManager(this.database, this.logger);
        
        // Menu tree structure
        this.menuTree = {
            main: {
                title: 'DigitalDeltaGaming PrisonRP Support',
                options: [
                    { number: 1, name: 'Support', value: 'support' },
                    { number: 2, name: 'Staff Applications', value: 'staff-applications' },
                    { number: 3, name: 'Reports', value: 'reports' },
                    { number: 4, name: 'Help', value: 'help' },
                    { number: 5, name: 'Cancel/Exit', value: 'cancel' }
                ]
            },
            support: {
                title: 'Support Menu',
                options: [
                    { number: 1, name: 'Warn Appeal', value: 'warn-appeal' },
                    { number: 2, name: 'Ban Appeal', value: 'ban-appeal' },
                    { number: 3, name: 'Donation Support', value: 'donation-support' },
                    { number: 4, name: 'General Support', value: 'general-support' },
                    { number: 5, name: 'Back', value: 'main' }
                ]
            },
            'staff-applications': {
                title: 'Staff Applications',
                options: [
                    { number: 1, name: 'Start Application', value: 'start-staff-application' },
                    { number: 2, name: 'Application FAQ', value: 'application-faq' },
                    { number: 3, name: 'Back', value: 'main' }
                ]
            },
            reports: {
                title: 'Reports Menu',
                options: [
                    { number: 1, name: 'Player Report', value: 'player-report' },
                    { number: 2, name: 'Staff Report', value: 'staff-report' },
                    { number: 3, name: 'Back', value: 'main' }
                ]
            }
        };
    }

    async handleMessage(message) {
        const userId = message.author.id;
        const content = message.content.trim();
        
        // Get or create user session
        let session = await this.database.getUserSession(userId);
        
        if (!session) {
            // New user - show main menu
            await this.showMenu(message, 'main');
            return;
        }

        // Handle special commands
        if (content.toLowerCase() === 'cancel' || content.toLowerCase() === 'exit') {
            await this.handleCancel(message);
            return;
        }

        if (content.toLowerCase() === 'menu' || content.toLowerCase() === 'main') {
            await this.showMenu(message, 'main');
            return;
        }

        // Check if user is in a Q&A flow
        if (session.current_flow && session.current_flow !== 'menu') {
            await this.handleQAResponse(message, session);
            return;
        }

        // Handle menu navigation
        await this.handleMenuNavigation(message, session);
    }

    async showMenu(message, menuKey) {
        this.logger.info(`Showing menu '${menuKey}' to user ${message.author.username}`);
        
        const menu = this.menuTree[menuKey];
        if (!menu) {
            this.logger.error(`Invalid menu key: ${menuKey}`);
            await message.reply('❌ Invalid menu. Returning to main menu.');
            await this.showMenu(message, 'main');
            return;
        }

        try {
            // Update session
            await this.database.updateUserSession(message.author.id, menuKey, 'menu', 0, {});
            this.logger.debug(`Updated session for user ${message.author.username}`);

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(menu.title)
                .setColor(0x0099FF)
                .setDescription('Please choose an option:')
                .setFooter({ text: 'Type the number or name of your choice' });

            // Add options
            let optionsText = '';
            for (const option of menu.options) {
                optionsText += `${option.number}. ${option.name}\n`;
            }
            embed.addFields({ name: 'Options', value: optionsText });

            this.logger.debug(`Sending menu embed to user ${message.author.username}`);
            await message.reply({ embeds: [embed] });
            this.logger.info(`Successfully sent menu to user ${message.author.username}`);
        } catch (error) {
            this.logger.error(`Error showing menu to user ${message.author.username}:`, error);
            await message.reply('❌ An error occurred while loading the menu. Please try again.');
        }
    }

    async handleMenuNavigation(message, session) {
        const content = message.content.trim();
        const currentMenu = this.menuTree[session.current_menu];
        
        if (!currentMenu) {
            await this.showMenu(message, 'main');
            return;
        }

        // Find matching option
        const selectedOption = this.findMenuOption(content, currentMenu.options);
        
        if (!selectedOption) {
            // If invalid selection, show current menu again with error message
            const optionNames = currentMenu.options.map(opt => opt.name).join(', ');
            await message.reply(`❌ Invalid selection. Please choose from: ${optionNames}`);
            
            // Show the menu again to help the user
            await this.showMenu(message, session.current_menu);
            return;
        }

        // Handle the selection
        await this.handleMenuSelection(message, selectedOption.value);
    }

    findMenuOption(input, options) {
        // Check if input is a number
        if (!isNaN(input)) {
            const num = parseInt(input);
            return options.find(opt => opt.number === num);
        }

        // Check if input matches a keyword
        const keyword = input.toLowerCase();
        return options.find(opt => 
            opt.name.toLowerCase().includes(keyword) || 
            opt.value.toLowerCase().includes(keyword) ||
            opt.name.toLowerCase().startsWith(keyword)
        );
    }

    async handleMenuSelection(message, selection) {
        switch (selection) {
            case 'main':
            case 'support':
            case 'staff-applications':
            case 'reports':
                await this.showMenu(message, selection);
                break;
            
            case 'help':
                await this.showHelp(message);
                break;
            
            case 'cancel':
                await this.handleCancel(message);
                break;
            
            case 'application-faq':
                await this.showApplicationFAQ(message);
                break;
            
            // Q&A flows
            case 'start-staff-application':
                await this.handleStaffApplicationStart(message);
                break;
            case 'ban-appeal':
                await this.startQAFlow(message, 'ban-appeal');
                break;
            case 'warn-appeal':
                await this.startQAFlow(message, 'warn-appeal');
                break;
            case 'donation-support':
                await this.startQAFlow(message, 'donation-support');
                break;
            case 'general-support':
                await this.startQAFlow(message, 'general-support');
                break;
            case 'player-report':
                await this.startQAFlow(message, 'player-report');
                break;
            case 'staff-report':
                await this.startQAFlow(message, 'staff-report');
                break;
            
            default:
                await message.reply('❌ Unknown option. Returning to main menu.');
                await this.showMenu(message, 'main');
        }
    }

    async handleStaffApplicationStart(message) {
        // Check if applications are open
        const applicationsOpen = await this.database.getConfig('staff_applications_open');
        if (!applicationsOpen || applicationsOpen.value !== 'true') {
            await message.reply('❌ Staff applications are currently closed. Please check back later or contact an administrator.');
            return;
        }

        // Check cooldown
        const isOnCooldown = await this.database.isUserOnCooldown(message.author.id, 'staff-application', 14);
        if (isOnCooldown) {
            const cooldown = await this.database.getUserApplicationCooldown(message.author.id);
            const lastDate = new Date(cooldown.last_application_date);
            const availableDate = new Date(lastDate.getTime() + (14 * 24 * 60 * 60 * 1000));
            
            await message.reply(`❌ You must wait 14 days between staff applications.\n\nYour last application was submitted on: ${lastDate.toDateString()}\nYou can apply again on: ${availableDate.toDateString()}`);
            return;
        }

        await this.startQAFlow(message, 'staff-application');
    }

    async startQAFlow(message, flowType) {
        const flow = this.qaFlowManager.getFlow(flowType);
        if (!flow) {
            await message.reply('❌ Invalid flow type. Returning to main menu.');
            await this.showMenu(message, 'main');
            return;
        }

        // Update session to start Q&A flow
        await this.database.updateUserSession(message.author.id, 'qa', flowType, 0, {});

        // Send introduction message
        const embed = new EmbedBuilder()
            .setTitle(`${flow.title} - Question & Answer`)
            .setColor(0xFFAA00)
            .setDescription(`You are about to start the ${flow.title} process. This will involve ${flow.questions.length} questions.\n\n**Important:**\n• Answer each question honestly and completely\n• Type "cancel" at any time to exit\n• Your answers will be reviewed by staff`)
            .setFooter({ text: 'Type anything to begin or "cancel" to exit' });

        await message.reply({ embeds: [embed] });
    }

    async handleQAResponse(message, session) {
        const content = message.content.trim();
        const flowType = session.current_flow;
        const currentQuestion = session.current_question;
        
        // Parse existing answers
        let answers = {};
        try {
            answers = session.answers ? JSON.parse(session.answers) : {};
        } catch (error) {
            this.logger.error('Error parsing session answers:', error);
            answers = {};
        }

        // Check if user wants to start (when on question 0 and no answers yet)
        if (currentQuestion === 0 && Object.keys(answers).length === 0) {
            await this.askQuestion(message, flowType, 0);
            return;
        }

        // Check if this question allows attachments
        const flow = this.qaFlowManager.getFlow(flowType);
        const currentQuestionData = flow?.questions[currentQuestion - 1];
        
        if (currentQuestionData?.allowAttachments) {
            // Handle attachment question
            if (content.toLowerCase() === 'none') {
                answers[currentQuestion - 1] = 'No attachments provided';
            } else if (message.attachments.size > 0) {
                // Process attachments
                const attachmentUrls = Array.from(message.attachments.values()).map(attachment => {
                    return `• [${attachment.name}](${attachment.url})`;
                });
                answers[currentQuestion - 1] = `Attachments provided:\n${attachmentUrls.join('\n')}`;
            } else {
                // No attachments and didn't say "none"
                await message.reply('❌ Please either attach files/screenshots or type "none" if you have no attachments.\n\nPlease try again:');
                return;
            }
        } else {
            // Regular text answer validation
            const validation = this.qaFlowManager.validateAnswer(flowType, currentQuestion - 1, content);
            if (!validation.valid) {
                await message.reply(`❌ ${validation.error}\n\nPlease try again:`);
                return;
            }
            
            // Store the answer
            answers[currentQuestion - 1] = content;
        }

        // Check if flow is complete
        if (this.qaFlowManager.isComplete(flowType, currentQuestion)) {
            await this.completeQAFlow(message, flowType, answers);
            return;
        }

        // Update session and ask next question
        await this.database.updateUserSession(message.author.id, 'qa', flowType, currentQuestion, answers);
        await this.askQuestion(message, flowType, currentQuestion);
    }

    async askQuestion(message, flowType, questionIndex) {
        const question = this.qaFlowManager.getQuestion(flowType, questionIndex);
        const totalQuestions = this.qaFlowManager.getTotalQuestions(flowType);
        
        if (!question) {
            await message.reply('❌ Error getting question. Returning to main menu.');
            await this.showMenu(message, 'main');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`Question ${questionIndex + 1} of ${totalQuestions}`)
            .setColor(0x00FF00)
            .setDescription(question.question)
            .setFooter({ text: 'Type your answer or "cancel" to exit' });

        // Add special instructions for attachment questions
        if (question.allowAttachments) {
            embed.addFields({
                name: '📎 Attachment Instructions',
                value: '• Attach screenshots/files directly to your message\n• Or type "none" if you have no attachments\n• Supported: Images, PDFs, text files, etc.',
                inline: false
            });
        }

        await message.reply({ embeds: [embed] });

        // Update session with current question
        const session = await this.database.getUserSession(message.author.id);
        const answers = session.answers ? JSON.parse(session.answers) : {};
        await this.database.updateUserSession(message.author.id, 'qa', flowType, questionIndex + 1, answers);
    }

    async completeQAFlow(message, flowType, answers) {
        try {
            // Format answers for submission
            const submission = this.qaFlowManager.formatAnswersForSubmission(flowType, answers);
            if (!submission) {
                throw new Error('Failed to format submission');
            }

            // Generate unique ID
            const submissionId = `${flowType}_${message.author.id}_${Date.now()}`;

            if (submission.postType === 'forum') {
                // Create forum post for applications and ban appeals
                await this.createForumPost(message, submissionId, submission);
                
                // Set cooldown for staff applications
                if (submission.type === 'staff-application') {
                    await this.database.setUserApplicationCooldown(message.author.id, 'staff-application');
                }
            } else {
                // Create support ticket for other flows
                await this.createSupportTicket(message, submissionId, submission);
            }

            // Clear user session
            await this.database.clearUserSession(message.author.id);

            // Send confirmation
            const embed = new EmbedBuilder()
                .setTitle('✅ Submission Complete!')
                .setColor(0x00FF00)
                .setDescription(`Your ${submission.title} has been submitted successfully!\n\n**What happens next:**\n• Staff will review your submission\n• You will be notified of any updates\n• Please be patient while we process your request`)
                .setFooter({ text: 'Thank you for using DigitalDeltaGaming PrisonRP Support!' });

            await message.reply({ embeds: [embed] });

            // Log submission
            await this.database.insertBotLog('info', `${submission.title} submitted`, message.author.id, 'submission_completed', {
                type: flowType,
                submissionId: submissionId
            });

        } catch (error) {
            this.logger.error('Error completing Q&A flow:', error);
            await message.reply('❌ An error occurred while submitting your request. Please try again later or contact an administrator.');
            
            // Clear session on error
            await this.database.clearUserSession(message.author.id);
        }
    }

    async createForumPost(message, submissionId, submission) {
        try {
            // Get the appropriate forum channel
            const forumChannelConfig = submission.type === 'staff-application' 
                ? await this.database.getConfig('staff_applications_forum_id')
                : await this.database.getConfig('ban_appeals_forum_id');
            const forumChannelId = forumChannelConfig?.value;
            
            if (!forumChannelId) {
                throw new Error('Forum channel not configured');
            }

            const forumChannel = this.client.channels.cache.get(forumChannelId);
            if (!forumChannel) {
                throw new Error('Forum channel not found');
            }

            let content;
            if (submission.type === 'staff-application' || submission.type === 'ban-appeal') {
                // Use plain text format for staff applications and ban appeals
                content = this.createPlainTextSubmission(submission, message.author);
            } else {
                // Use embed format for other applications
                content = { embeds: [this.createSubmissionEmbed(submission, message.author)] };
            }

            // Create the forum post
            const thread = await forumChannel.threads.create({
                name: `${submission.title} - ${message.author.username}`,
                message: typeof content === 'string' ? { content } : content,
                appliedTags: await this.getApplicableTags(forumChannel, 'Unreviewed')
            });

            // Store in database with forum post ID
            await this.database.createApplication(
                submissionId,
                message.author.id,
                submission.type,
                typeof submission.answers === 'string' ? submission.answers : JSON.stringify(submission.answers),
                thread.id,
                forumChannelId
            );

            this.logger.info(`Forum post created: ${thread.id} for user ${message.author.id}`);

        } catch (error) {
            this.logger.error('Error creating forum post:', error);
            
            // Fallback: Store in database without forum post
            const channelConfig = submission.type === 'staff-application' 
                ? await this.database.getConfig('staff_applications_forum_id')
                : await this.database.getConfig('ban_appeals_forum_id');
            const channelId = channelConfig?.value;
            
            await this.database.createApplication(
                submissionId,
                message.author.id,
                submission.type,
                typeof submission.answers === 'string' ? submission.answers : JSON.stringify(submission.answers),
                null,
                channelId
            );

            throw error;
        }
    }

    createPlainTextSubmission(submission, user) {
        const answers = typeof submission.answers === 'string' 
            ? JSON.parse(submission.answers) 
            : submission.answers;
        
        const flow = this.qaFlowManager.getFlow(submission.type);
        
        let content = `**${submission.title}**\n`;
        content += `**Submitted by:** ${user.username} (${user.id})\n`;
        content += `**Submitted on:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n`;
        
        if (flow && flow.questions) {
            flow.questions.forEach((question) => {
                const answer = answers[question.key] || 'No answer provided';
                content += `**${question.question}**\n${answer}\n\n`;
            });
        }
        
        return content;
    }

    async createSupportTicket(message, submissionId, submission) {
        try {
            // Get the support category
            const categoryConfig = await this.database.getConfig('support_reports_category_id');
            const categoryId = categoryConfig?.value;
            
            if (!categoryId) {
                throw new Error('Support category not configured');
            }

            const category = this.client.channels.cache.get(categoryId);
            if (!category) {
                throw new Error('Support category not found');
            }

            // Create the support ticket channel (hidden from ticket creator)
            const ticketChannel = await category.guild.channels.create({
                name: `${submission.type}-${message.author.username}`,
                type: 0, // Text Channel
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: category.guild.id, // @everyone
                        deny: ['ViewChannel']
                    },
                    {
                        id: message.author.id, // User - DENY access, they communicate via DM only
                        deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    },
                    {
                        id: (await this.database.getConfig('staff_role_id'))?.value, // Staff
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
                    }
                ].filter(override => override.id) // Remove any null/undefined IDs
            });

            // Send initial message in ticket (for staff only - user can't see this channel)
            const embed = this.createSubmissionEmbed(submission, message.author);
            embed.setTitle(`🎫 ${submission.title}`);
            
            // Get staff role for pinging
            const staffRoleConfig = await this.database.getConfig('staff_role_id');
            const staffRoleId = staffRoleConfig?.value;
            
            let content = `**New Support Ticket Created**\n`;
            content += `**User:** ${message.author.username} (${message.author.id})\n`;
            content += `**Type:** ${submission.type}\n\n`;
            content += `*Note: User cannot see this channel. Use \`/ticket-message\` to communicate with them via DM.*`;
            
            // Add staff ping if configured
            if (staffRoleId) {
                content += `\n\n<@&${staffRoleId}> New support ticket requires attention.`;
            }
            
            await ticketChannel.send({
                content: content,
                embeds: [embed]
            });

            // Store in database with channel ID
            await this.database.createTicket(
                submissionId,
                message.author.id,
                submission.type,
                typeof submission.answers === 'string' ? submission.answers : JSON.stringify(submission.answers),
                ticketChannel.id
            );

            this.logger.info(`Support ticket created: ${ticketChannel.id} for user ${message.author.id}`);

        } catch (error) {
            this.logger.error('Error creating support ticket:', error);
            
            // Fallback: Store in database without channel
            await this.database.createTicket(
                submissionId,
                message.author.id,
                submission.type,
                typeof submission.answers === 'string' ? submission.answers : JSON.stringify(submission.answers),
                null
            );

            throw error;
        }
    }

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('How to Use This Bot')
            .setColor(0x00FF00)
            .setDescription('Welcome to the DigitalDeltaGaming PrisonRP support bot!')
            .addFields(
                { name: 'Navigation', value: 'Type the number or name of an option to select it.' },
                { name: 'Commands', value: '• Type `menu` to return to the main menu\n• Type `cancel` or `exit` to end your session' },
                { name: 'Support', value: 'If you encounter any issues, please contact a staff member.' }
            )
            .setFooter({ text: 'Type "menu" to return to the main menu' });

        await message.reply({ embeds: [embed] });
    }

    async showApplicationFAQ(message) {
        const embed = new EmbedBuilder()
            .setTitle('Staff Application FAQ')
            .setColor(0xFFFF00)
            .addFields(
                { name: 'Minimum Requirements', value: '• Must be at least 15 years old\n• Must have 20+ hours of playtime\n• Must have a working microphone\n• Must be in our Discord server' },
                { name: 'Application Process', value: '• Complete the application questions\n• Your application will be posted publicly\n• Staff will review and respond\n• You will be notified of the decision' },
                { name: 'Tips', value: '• Be honest and detailed in your responses\n• Low-effort applications will be denied\n• Previous bans are not automatic disqualifiers if explained properly' }
            )
            .setFooter({ text: 'Type "menu" to return to the main menu' });

        await message.reply({ embeds: [embed] });
    }

    async handleCancel(message) {
        await this.database.clearUserSession(message.author.id);
        
        const embed = new EmbedBuilder()
            .setTitle('Session Ended')
            .setColor(0xFF0000)
            .setDescription('Your session has been cancelled. Type anything to start over.')
            .setFooter({ text: 'Thank you for using DigitalDeltaGaming PrisonRP Support!' });

        await message.reply({ embeds: [embed] });
    }

    createSubmissionEmbed(submission, user) {
        const embed = new EmbedBuilder()
            .setTitle(submission.title)
            .setColor(0x0099FF)
            .setAuthor({ 
                name: user.username, 
                iconURL: user.displayAvatarURL() 
            })
            .setTimestamp()
            .setFooter({ text: `Submitted by ${user.username}` });

        // Add answers as fields
        const answers = typeof submission.answers === 'string' 
            ? JSON.parse(submission.answers) 
            : submission.answers;
        
        const flow = this.qaFlowManager.getFlow(submission.type);
        
        if (flow && flow.questions) {
            flow.questions.forEach((question, index) => {
                const answer = answers[question.key] || 'No answer provided';
                embed.addFields({
                    name: question.question,
                    value: answer.length > 1024 ? answer.substring(0, 1021) + '...' : answer,
                    inline: false
                });
            });
        }

        return embed;
    }

    async getApplicableTags(forumChannel, tagName) {
        try {
            // Find existing tag
            const existingTag = forumChannel.availableTags.find(tag => tag.name === tagName);
            if (existingTag) {
                return [existingTag.id];
            }

            // Create new tag if possible
            if (forumChannel.availableTags.length < 20) {
                const newTags = [...forumChannel.availableTags, { name: tagName, emoji: '🔍' }];
                await forumChannel.setAvailableTags(newTags);
                const createdTag = forumChannel.availableTags.find(tag => tag.name === tagName);
                return createdTag ? [createdTag.id] : [];
            }

            return [];
        } catch (error) {
            this.logger.error('Error getting applicable tags:', error);
            return [];
        }
    }
}

module.exports = MenuHandler; 