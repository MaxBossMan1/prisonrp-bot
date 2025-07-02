const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class BotDatabase {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_PATH || './data/bot_data.db';
    }

    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Ensure data directory exists
                const dir = path.dirname(this.dbPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Initialize database
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        console.error('Failed to connect to database:', err);
                        reject(err);
                        return;
                    }
                    
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON', (err) => {
                        if (err) {
                            console.error('Failed to enable foreign keys:', err);
                            reject(err);
                            return;
                        }
                        
                        // Create tables
                        this.createTables()
                            .then(() => this.createIndexes())
                            .then(() => {
                                console.log('Database initialized successfully');
                                resolve();
                            })
                            .catch(reject);
                    });
                });
            } catch (error) {
                console.error('Failed to initialize database:', error);
                reject(error);
            }
        });
    }

    async createTables() {
        const tables = [
            // User Sessions Table
            `CREATE TABLE IF NOT EXISTS user_sessions (
                user_id TEXT PRIMARY KEY,
                current_menu TEXT DEFAULT 'main',
                current_flow TEXT,
                current_question INTEGER DEFAULT 0,
                answers TEXT,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Applications Table
            `CREATE TABLE IF NOT EXISTS applications (
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
                review_reason TEXT
            )`,
            
            // Support Tickets Table
            `CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                channel_id TEXT,
                status TEXT DEFAULT 'open',
                answers TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME,
                closed_by TEXT,
                close_reason TEXT
            )`,
            
            // Bot Logs Table
            `CREATE TABLE IF NOT EXISTS bot_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                user_id TEXT,
                action TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Bot Configuration Table
            `CREATE TABLE IF NOT EXISTS bot_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Application Cooldowns Table
            `CREATE TABLE IF NOT EXISTS application_cooldowns (
                user_id TEXT PRIMARY KEY,
                last_application_date DATETIME NOT NULL,
                application_type TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const sql of tables) {
            await this.run(sql);
        }
    }

    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity)',
            'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)',
            'CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type)',
            'CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)',
            'CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type)',
            'CREATE INDEX IF NOT EXISTS idx_bot_logs_level ON bot_logs(level)',
            'CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON bot_logs(created_at)'
        ];

        for (const sql of indexes) {
            await this.run(sql);
        }
    }

    // Helper methods for async operations
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Session Management
    async getUserSession(userId) {
        return await this.get('SELECT * FROM user_sessions WHERE user_id = ?', [userId]);
    }

    async updateUserSession(userId, menu, flow, question, answers) {
        return await this.run(
            `INSERT OR REPLACE INTO user_sessions 
            (user_id, current_menu, current_flow, current_question, answers, last_activity)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, menu, flow, question, JSON.stringify(answers)]
        );
    }

    async clearUserSession(userId) {
        return await this.run('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
    }

    async cleanOldSessions() {
        return await this.run(`
            DELETE FROM user_sessions 
            WHERE last_activity < datetime('now', '-24 hours')
        `);
    }

    // Application Management
    async createApplication(appId, userId, type, answers, forumPostId, forumChannelId) {
        return await this.run(
            `INSERT INTO applications (id, user_id, type, answers, forum_post_id, forum_channel_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [appId, userId, type, JSON.stringify(answers), forumPostId, forumChannelId]
        );
    }

    async updateApplicationStatus(appId, status, reviewedBy, reviewReason) {
        return await this.run(
            `UPDATE applications 
            SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_reason = ?
            WHERE id = ?`,
            [status, reviewedBy, reviewReason, appId]
        );
    }

    async getApplicationsByStatus(status) {
        return await this.all(
            `SELECT * FROM applications 
            WHERE status = ? 
            ORDER BY submitted_at DESC`,
            [status]
        );
    }

    async getApplicationByPostId(postId) {
        return await this.get('SELECT * FROM applications WHERE forum_post_id = ?', [postId]);
    }

    // Application Cooldown Management
    async getUserApplicationCooldown(userId) {
        return await this.get('SELECT * FROM application_cooldowns WHERE user_id = ?', [userId]);
    }

    async setUserApplicationCooldown(userId, applicationType) {
        return await this.run(
            `INSERT OR REPLACE INTO application_cooldowns (user_id, last_application_date, application_type)
            VALUES (?, CURRENT_TIMESTAMP, ?)`,
            [userId, applicationType]
        );
    }

    async removeUserApplicationCooldown(userId) {
        return await this.run('DELETE FROM application_cooldowns WHERE user_id = ?', [userId]);
    }

    async isUserOnCooldown(userId, applicationType, cooldownDays = 14) {
        const cooldown = await this.getUserApplicationCooldown(userId);
        if (!cooldown || cooldown.application_type !== applicationType) {
            return false;
        }
        
        const cooldownDate = new Date(cooldown.last_application_date);
        const now = new Date();
        const daysDiff = (now - cooldownDate) / (1000 * 60 * 60 * 24);
        
        return daysDiff < cooldownDays;
    }

    // Ticket Management
    async createTicket(ticketId, userId, type, answers, channelId) {
        return await this.run(
            `INSERT INTO tickets (id, user_id, type, answers, channel_id)
            VALUES (?, ?, ?, ?, ?)`,
            [ticketId, userId, type, JSON.stringify(answers), channelId]
        );
    }

    async closeTicket(ticketId, closedBy, closeReason) {
        return await this.run(
            `UPDATE tickets 
            SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = ?, close_reason = ?
            WHERE id = ?`,
            [closedBy, closeReason, ticketId]
        );
    }

    async updateTicketStatus(ticketId, status, updatedBy, reason) {
        return await this.run(
            `UPDATE tickets 
            SET status = ?, closed_at = ${status === 'closed' ? 'CURRENT_TIMESTAMP' : 'NULL'}, 
                closed_by = ?, close_reason = ?
            WHERE id = ?`,
            [status, updatedBy, reason, ticketId]
        );
    }

    async getOpenTickets() {
        return await this.all(
            `SELECT * FROM tickets 
            WHERE status = 'open' 
            ORDER BY created_at DESC`
        );
    }

    async getTicketByChannelId(channelId) {
        return await this.get('SELECT * FROM tickets WHERE channel_id = ?', [channelId]);
    }

    async getTicketById(ticketId) {
        return await this.get('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    }

    // Configuration Management
    async getConfig(key) {
        const result = await this.get('SELECT value FROM bot_config WHERE key = ?', [key]);
        return result ? { value: result.value } : null;
    }

    async setConfig(key, value) {
        return await this.run(
            `INSERT OR REPLACE INTO bot_config (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [key, value]
        );
    }

    async getAllConfig() {
        return await this.all('SELECT * FROM bot_config');
    }

    // Logging
    async insertBotLog(level, message, userId = null, action = null, details = null) {
        return await this.run(
            `INSERT INTO bot_logs (level, message, user_id, action, details)
            VALUES (?, ?, ?, ?, ?)`,
            [level, message, userId, action, details ? JSON.stringify(details) : null]
        );
    }

    async getRecentLogs(limit = 100) {
        return await this.all(
            `SELECT * FROM bot_logs 
            ORDER BY created_at DESC 
            LIMIT ?`,
            [limit]
        );
    }

    async cleanOldLogs(days = 30) {
        return await this.run(
            `DELETE FROM bot_logs 
            WHERE created_at < datetime('now', '-${days} days')`
        );
    }

    // Maintenance
    async vacuum() {
        return await this.run('VACUUM');
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = BotDatabase; 