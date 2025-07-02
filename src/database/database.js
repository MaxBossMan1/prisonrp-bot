const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class BotDatabase {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_PATH || './data/bot_data.db';
    }

    async init() {
        try {
            // Ensure data directory exists
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Initialize database
            this.db = new Database(this.dbPath);
            this.db.pragma('foreign_keys = ON');
            
            // Create tables
            this.createTables();
            this.createIndexes();
            
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    createTables() {
        // User Sessions Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                user_id TEXT PRIMARY KEY,
                current_menu TEXT DEFAULT 'main',
                current_flow TEXT,
                current_question INTEGER DEFAULT 0,
                answers TEXT,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Applications Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT DEFAULT 'unreviewed',
                forum_post_id TEXT,
                forum_channel_id TEXT,
                answers TEXT NOT NULL,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reviewed_by TEXT,
                reviewed_at DATETIME,
                review_reason TEXT,
                FOREIGN KEY (user_id) REFERENCES user_sessions(user_id)
            )
        `);

        // Support Tickets Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                channel_id TEXT,
                status TEXT DEFAULT 'open',
                answers TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME,
                closed_by TEXT,
                close_reason TEXT,
                FOREIGN KEY (user_id) REFERENCES user_sessions(user_id)
            )
        `);

        // Bot Logs Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS bot_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                user_id TEXT,
                action TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bot Configuration Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS bot_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    createIndexes() {
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
            CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
            CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
            CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
            CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
            CREATE INDEX IF NOT EXISTS idx_bot_logs_level ON bot_logs(level);
            CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON bot_logs(created_at);
        `);
    }

    // Session Management
    getUserSession(userId) {
        const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE user_id = ?');
        return stmt.get(userId);
    }

    updateUserSession(userId, menu, flow, question, answers) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_sessions 
            (user_id, current_menu, current_flow, current_question, answers, last_activity)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        return stmt.run(userId, menu, flow, question, JSON.stringify(answers));
    }

    clearUserSession(userId) {
        const stmt = this.db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
        return stmt.run(userId);
    }

    cleanOldSessions() {
        const stmt = this.db.prepare(`
            DELETE FROM user_sessions 
            WHERE last_activity < datetime('now', '-24 hours')
        `);
        return stmt.run();
    }

    // Application Management
    createApplication(appId, userId, type, answers, forumPostId, forumChannelId) {
        const stmt = this.db.prepare(`
            INSERT INTO applications (id, user_id, type, answers, forum_post_id, forum_channel_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(appId, userId, type, JSON.stringify(answers), forumPostId, forumChannelId);
    }

    updateApplicationStatus(appId, status, reviewedBy, reviewReason) {
        const stmt = this.db.prepare(`
            UPDATE applications 
            SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_reason = ?
            WHERE id = ?
        `);
        return stmt.run(status, reviewedBy, reviewReason, appId);
    }

    getApplicationsByStatus(status) {
        const stmt = this.db.prepare(`
            SELECT * FROM applications 
            WHERE status = ? 
            ORDER BY submitted_at DESC
        `);
        return stmt.all(status);
    }

    getApplicationByPostId(postId) {
        const stmt = this.db.prepare('SELECT * FROM applications WHERE forum_post_id = ?');
        return stmt.get(postId);
    }

    // Ticket Management
    createTicket(ticketId, userId, type, answers, channelId) {
        const stmt = this.db.prepare(`
            INSERT INTO tickets (id, user_id, type, answers, channel_id)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(ticketId, userId, type, JSON.stringify(answers), channelId);
    }

    closeTicket(ticketId, closedBy, closeReason) {
        const stmt = this.db.prepare(`
            UPDATE tickets 
            SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = ?, close_reason = ?
            WHERE id = ?
        `);
        return stmt.run(closedBy, closeReason, ticketId);
    }

    getOpenTickets() {
        const stmt = this.db.prepare(`
            SELECT * FROM tickets 
            WHERE status = 'open' 
            ORDER BY created_at DESC
        `);
        return stmt.all();
    }

    getTicketByChannelId(channelId) {
        const stmt = this.db.prepare('SELECT * FROM tickets WHERE channel_id = ?');
        return stmt.get(channelId);
    }

    // Configuration Management
    getConfig(key) {
        const stmt = this.db.prepare('SELECT value FROM bot_config WHERE key = ?');
        const result = stmt.get(key);
        return result ? result.value : null;
    }

    setConfig(key, value) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO bot_config (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `);
        return stmt.run(key, value);
    }

    getAllConfig() {
        const stmt = this.db.prepare('SELECT * FROM bot_config');
        return stmt.all();
    }

    // Logging
    insertBotLog(level, message, userId = null, action = null, details = null) {
        const stmt = this.db.prepare(`
            INSERT INTO bot_logs (level, message, user_id, action, details)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(level, message, userId, action, details ? JSON.stringify(details) : null);
    }

    getRecentLogs(limit = 100) {
        const stmt = this.db.prepare(`
            SELECT * FROM bot_logs 
            ORDER BY created_at DESC 
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    cleanOldLogs(days = 30) {
        const stmt = this.db.prepare(`
            DELETE FROM bot_logs 
            WHERE created_at < datetime('now', '-${days} days')
        `);
        return stmt.run();
    }

    // Maintenance
    vacuum() {
        this.db.exec('VACUUM');
    }

    async close() {
        if (this.db) {
            this.db.close();
            console.log('Database connection closed');
        }
    }
}

module.exports = BotDatabase; 