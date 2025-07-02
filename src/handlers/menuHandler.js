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
        let session = this.database.getUserSession(userId);
        
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

        if (content.toLowerCase() === 'menu') {
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
        const menu = this.menuTree[menuKey];
        if (!menu) {
            await message.reply('❌ Invalid menu. Returning to main menu.');
            await this.showMenu(message, 'main');
            return;
        }

        // Update session
        this.database.updateUserSession(message.author.id, menuKey, 'menu', 0, {});

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

        await message.reply({ embeds: [embed] });
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
            const optionNames = currentMenu.options.map(opt => opt.name).join(', ');
            await message.reply(`❌ Invalid selection. Please choose from: ${optionNames}`);
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
                await this.startQAFlow(message, 'staff-application');
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

    async startQAFlow(message, flowType) {
        const flow = this.qaFlowManager.getFlow(flowType);
        if (!flow) {
            await message.reply('❌ Invalid flow type. Returning to main menu.');
            await this.showMenu(message, 'main');
            return;
        }

        // Update session to start Q&A flow
        this.database.updateUserSession(message.author.id, 'qa', flowType, 0, {});

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

        // Validate the current answer
        const validation = this.qaFlowManager.validateAnswer(flowType, currentQuestion - 1, content);
        if (!validation.valid) {
            await message.reply(`❌ ${validation.error}\n\nPlease try again:`);
            return;
        }

        // Store the answer
        answers[currentQuestion - 1] = content;

        // Check if flow is complete
        if (this.qaFlowManager.isComplete(flowType, currentQuestion)) {
            await this.completeQAFlow(message, flowType, answers);
            return;
        }

        // Update session and ask next question
        this.database.updateUserSession(message.author.id, 'qa', flowType, currentQuestion, answers);
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

        await message.reply({ embeds: [embed] });

        // Update session with current question
        const session = this.database.getUserSession(message.author.id);
        const answers = session.answers ? JSON.parse(session.answers) : {};
        this.database.updateUserSession(message.author.id, 'qa', flowType, questionIndex + 1, answers);
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
            } else {
                // Create support ticket for other flows
                await this.createSupportTicket(message, submissionId, submission);
            }

            // Clear user session
            this.database.clearUserSession(message.author.id);

            // Send confirmation
            const embed = new EmbedBuilder()
                .setTitle('✅ Submission Complete!')
                .setColor(0x00FF00)
                .setDescription(`Your ${submission.title} has been submitted successfully!\n\n**What happens next:**\n• Staff will review your submission\n• You will be notified of any updates\n• Please be patient while we process your request`)
                .setFooter({ text: 'Thank you for using DigitalDeltaGaming PrisonRP Support!' });

            await message.reply({ embeds: [embed] });

            // Log submission
            this.database.insertBotLog('info', `${submission.title} submitted`, message.author.id, 'submission_completed', {
                type: flowType,
                submissionId: submissionId
            });

        } catch (error) {
            this.logger.error('Error completing Q&A flow:', error);
            await message.reply('❌ An error occurred while submitting your request. Please try again later or contact an administrator.');
            
            // Clear session on error
            this.database.clearUserSession(message.author.id);
        }
    }

    async createForumPost(message, submissionId, submission) {
        // This will be implemented when we add forum integration
        // For now, store in database
        const channelId = this.database.getConfig(`${submission.category.replace('-', '_')}_forum_id`);
        
        this.database.createApplication(
            submissionId,
            message.author.id,
            submission.type,
            submission.answers,
            null, // Forum post ID - will be set when we implement forum posting
            channelId
        );

        await message.reply('🚧 Forum post creation coming soon! Your submission has been saved.');
    }

    async createSupportTicket(message, submissionId, submission) {
        // This will be implemented when we add ticket channel creation
        // For now, store in database
        const categoryId = this.database.getConfig('support_reports_category_id');
        
        this.database.createTicket(
            submissionId,
            message.author.id,
            submission.type,
            submission.answers,
            null // Channel ID - will be set when we implement channel creation
        );

        await message.reply('🚧 Support ticket creation coming soon! Your submission has been saved.');
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
        this.database.clearUserSession(message.author.id);
        
        const embed = new EmbedBuilder()
            .setTitle('Session Ended')
            .setColor(0xFF0000)
            .setDescription('Your session has been cancelled. Type anything to start over.')
            .setFooter({ text: 'Thank you for using DigitalDeltaGaming PrisonRP Support!' });

        await message.reply({ embeds: [embed] });
    }
}

module.exports = MenuHandler; 