// Q&A Flow definitions based on planning documents

const QA_FLOWS = {
    'staff-application': {
        title: 'Staff Application',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'age', question: 'How old are you?' },
            { key: 'steamId', question: 'What is your SteamID64? (You can find this at https://steamid.io/)' },
            { key: 'timezone', question: 'What is your timezone and country?' },
            { key: 'playtime', question: 'How long have you been playing on our server?' },
            { key: 'totalPlaytime', question: 'What is your approximate total playtime on the server?' },
            { key: 'activeTimes', question: 'What times are you most active on the server? (Please be specific, e.g., "Weekdays 4 PM - 9 PM EST, weekends vary")' },
            { key: 'previousBans', question: 'Have you ever been warned, kicked, or banned on our server? If so, please explain the situation. (Honesty is critical here. We will check your record.)' },
            { key: 'experience', question: 'Do you have any previous experience as a staff member on a GMod server (or any other game)? If yes, please detail:\n- Server Name & Gamemode:\n- Your Rank:\n- How long you were staff:\n- Reason for leaving:' },
            { key: 'motivation', question: 'Why do you want to be a staff member on this server specifically? (Do not say "to help people" or "to ban rulebreakers." Be detailed, 2 sentences at least.)' },
            { key: 'qualities', question: 'What qualities do you possess that would make you a good staff member?' },
            { key: 'roleUnderstanding', question: 'In your own words, what is the primary role of a staff member in a PrisonRP environment?' },
            { key: 'confirmation1', question: 'Do you understand that if you are accepted, you will be expected to be unbiased, professional, and mature at all times? (Yes/No)' },
            { key: 'confirmation2', question: 'Do you confirm that all the information provided in this application is truthful and accurate to the best of your knowledge? (Yes/No)' }
        ],
        postType: 'forum', // Will be posted to staff applications forum
        category: 'staff-applications'
    },

    'ban-appeal': {
        title: 'Ban Appeal',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'steamId', question: 'What is your SteamID64? (You can find this at https://steamid.io/)' },
            { key: 'bannedBy', question: 'Who banned you? (If known)' },
            { key: 'banDate', question: 'When were you banned? (Date and approximate time)' },
            { key: 'banReason', question: 'What was the reason given for your ban?' },
            { key: 'appealReason', question: 'Why do you believe your ban should be lifted? (Please provide a detailed explanation)' },
            { key: 'evidence', question: 'Do you have any evidence or additional information to support your appeal? (Provide links, descriptions, or attach screenshots)' },
            { key: 'attachments', question: 'Please attach any screenshots or evidence files now. Send them as attachments in your next message, or type "none" if you have no attachments.', allowAttachments: true }
        ],
        postType: 'forum', // Will be posted to ban appeals forum
        category: 'ban-appeals'
    },

    'warn-appeal': {
        title: 'Warn Appeal',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'steamId', question: 'What is your SteamID64?' },
            { key: 'warnedBy', question: 'Who warned you? (If known)' },
            { key: 'warnDate', question: 'When were you warned? (Date and approximate time)' },
            { key: 'warnReason', question: 'What was the reason given for your warning?' },
            { key: 'appealReason', question: 'Why do you believe this warning should be removed? (Please provide a detailed explanation)' },
            { key: 'evidence', question: 'Do you have any evidence or additional information to support your appeal?' }
        ],
        postType: 'ticket', // Will create a support ticket channel
        category: 'support-reports'
    },

    'donation-support': {
        title: 'Donation Support',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'steamId', question: 'What is your SteamID64?' },
            { key: 'transactionId', question: 'What is your Stripe transaction ID or email?' },
            { key: 'donationItem', question: 'What did you donate for? (Package, rank, etc.)' },
            { key: 'donationDate', question: 'When did you make the donation? (Date and time)' },
            { key: 'issue', question: 'What issue are you experiencing with your donation?' },
            { key: 'additionalInfo', question: 'Any additional information or evidence (e.g., screenshots, receipts)?' }
        ],
        postType: 'ticket',
        category: 'support-reports'
    },

    'general-support': {
        title: 'General Support',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'steamId', question: 'What is your SteamID64?' },
            { key: 'issue', question: 'Please describe the issue you are experiencing in as much detail as possible.' },
            { key: 'when', question: 'When did this issue occur? (Date and time)' },
            { key: 'steps', question: 'Have you tried any steps to resolve the issue? If so, what were they?' },
            { key: 'additionalInfo', question: 'Any additional information or evidence?' }
        ],
        postType: 'ticket',
        category: 'support-reports'
    },

    'player-report': {
        title: 'Player Report',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'steamId', question: 'What is your SteamID64?' },
            { key: 'reportedPlayer', question: 'Who are you reporting? (Player\'s in-game name)' },
            { key: 'reportedSteamId', question: 'What is the reported player\'s SteamID64? (If known)' },
            { key: 'when', question: 'When did this incident occur? (Date and approximate time)' },
            { key: 'rules', question: 'What rule(s) did the player break? (Please be specific)' },
            { key: 'description', question: 'Please describe what happened in detail:' },
            { key: 'evidence', question: 'Do you have any evidence? (Screenshots, videos, etc. - please provide links or details)' },
            { key: 'witnesses', question: 'Were there any witnesses? If yes, who?' },
            { key: 'additionalInfo', question: 'Any additional information you think is relevant?' }
        ],
        postType: 'ticket',
        category: 'support-reports'
    },

    'staff-report': {
        title: 'Staff Report',
        questions: [
            { key: 'inGameName', question: 'What is your in-game name?' },
            { key: 'discordUsername', question: 'What is your Discord username? (e.g., username#1234)' },
            { key: 'steamId', question: 'What is your SteamID64?' },
            { key: 'reportedStaff', question: 'Who are you reporting? (Staff member\'s name/rank)' },
            { key: 'when', question: 'When did this incident occur? (Date and approximate time)' },
            { key: 'nature', question: 'What is the nature of your report? (e.g., abuse of power, unprofessional behavior, etc.)' },
            { key: 'description', question: 'Please describe what happened in detail:' },
            { key: 'evidence', question: 'Do you have any evidence? (Screenshots, videos, etc. - please provide links or details)' },
            { key: 'witnesses', question: 'Were there any witnesses? If yes, who?' },
            { key: 'directContact', question: 'Have you tried to resolve this issue with the staff member directly?' },
            { key: 'additionalInfo', question: 'Any additional information you think is relevant?' }
        ],
        postType: 'ticket',
        category: 'support-reports'
    }
};

class QAFlowManager {
    constructor(database, logger) {
        this.database = database;
        this.logger = logger;
    }

    getFlow(flowType) {
        return QA_FLOWS[flowType] || null;
    }

    getQuestion(flowType, questionIndex) {
        const flow = this.getFlow(flowType);
        if (!flow || questionIndex >= flow.questions.length) {
            return null;
        }
        return flow.questions[questionIndex];
    }

    getTotalQuestions(flowType) {
        const flow = this.getFlow(flowType);
        return flow ? flow.questions.length : 0;
    }

    isComplete(flowType, questionIndex) {
        return questionIndex >= this.getTotalQuestions(flowType);
    }

    validateAnswer(flowType, questionIndex, answer) {
        const question = this.getQuestion(flowType, questionIndex);
        if (!question) return { valid: false, error: 'Invalid question' };

        // Basic validation (skip for attachment questions)
        if (question.allowAttachments) {
            return { valid: true }; // Attachment validation is handled in menuHandler
        }
        
        if (!answer || answer.trim().length === 0) {
            return { valid: false, error: 'Please provide an answer.' };
        }

        // Specific validations
        if (question.key === 'age') {
            const age = parseInt(answer);
            if (isNaN(age) || age < 13 || age > 100) {
                return { valid: false, error: 'Please provide a valid age between 13 and 100.' };
            }
        }

        if (question.key.includes('confirmation') || question.key === 'directContact') {
            const normalized = answer.toLowerCase().trim();
            if (!['yes', 'no', 'y', 'n'].includes(normalized)) {
                return { valid: false, error: 'Please answer with Yes or No.' };
            }
        }

        if (question.key.includes('steamId')) {
            // Basic Steam ID format validation
            if (!/^STEAM_[0-5]:[01]:\d+$|^\d{17}$/.test(answer.trim())) {
                return { valid: false, error: 'Please provide a valid SteamID64 or Steam ID format.' };
            }
        }

        return { valid: true };
    }

    formatAnswersForSubmission(flowType, answers) {
        const flow = this.getFlow(flowType);
        if (!flow) return null;

        const formatted = {};
        flow.questions.forEach((question, index) => {
            formatted[question.key] = answers[index] || '';
        });

        return {
            type: flowType,
            title: flow.title,
            answers: formatted,
            postType: flow.postType,
            category: flow.category
        };
    }
}

module.exports = { QAFlowManager, QA_FLOWS }; 