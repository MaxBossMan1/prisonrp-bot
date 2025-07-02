# DigitalDeltaGaming PrisonRP SQLite Data Storage Strategy

---

## Database Schema

### 1. User Sessions Table
```sql
CREATE TABLE user_sessions (
    user_id TEXT PRIMARY KEY,
    current_menu TEXT DEFAULT 'main',
    current_flow TEXT,
    current_question INTEGER DEFAULT 0,
    answers TEXT, -- JSON string of collected answers
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Applications Table
```sql
CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'staff-application', 'ban-appeal'
    status TEXT DEFAULT 'unreviewed', -- 'unreviewed', 'under_review', 'accepted', 'denied', 'on_hold'
    forum_post_id TEXT,
    forum_channel_id TEXT,
    answers TEXT NOT NULL, -- JSON string of all answers
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    review_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES user_sessions(user_id)
);
```

### 3. Support Tickets Table
```sql
CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'warn-appeal', 'donation-support', 'general-support', 'player-report', 'staff-report'
    channel_id TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'resolved'
    answers TEXT NOT NULL, -- JSON string of all answers
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    closed_by TEXT,
    close_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES user_sessions(user_id)
);
```

### 4. Bot Logs Table
```sql
CREATE TABLE bot_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL, -- 'info', 'warning', 'error'
    message TEXT NOT NULL,
    user_id TEXT,
    action TEXT, -- 'command_used', 'application_submitted', 'ticket_created', etc.
    details TEXT, -- JSON string of additional details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes for Performance
```sql
-- Indexes for better query performance
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_bot_logs_level ON bot_logs(level);
CREATE INDEX idx_bot_logs_created_at ON bot_logs(created_at);
```

---

## Key Operations

### Session Management
```sql
-- Create/update user session
INSERT OR REPLACE INTO user_sessions (user_id, current_menu, current_flow, current_question, answers, last_activity)
VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);

-- Get user session
SELECT * FROM user_sessions WHERE user_id = ?;

-- Clean old sessions (older than 24 hours)
DELETE FROM user_sessions WHERE last_activity < datetime('now', '-24 hours');
```

### Application Management
```sql
-- Create new application
INSERT INTO applications (id, user_id, type, answers, forum_post_id, forum_channel_id)
VALUES (?, ?, ?, ?, ?, ?);

-- Update application status
UPDATE applications 
SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_reason = ?
WHERE id = ?;

-- Get applications by status
SELECT * FROM applications WHERE status = ? ORDER BY submitted_at DESC;
```

### Ticket Management
```sql
-- Create new ticket
INSERT INTO tickets (id, user_id, type, answers, channel_id)
VALUES (?, ?, ?, ?, ?);

-- Close ticket
UPDATE tickets 
SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = ?, close_reason = ?
WHERE id = ?;

-- Get open tickets
SELECT * FROM tickets WHERE status = 'open' ORDER BY created_at DESC;
```

---

## Implementation with Node.js

### Database Setup
```javascript
const Database = require('better-sqlite3');
const db = new Database('bot_data.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (...);
    CREATE TABLE IF NOT EXISTS applications (...);
    CREATE TABLE IF NOT EXISTS tickets (...);
    CREATE TABLE IF NOT EXISTS bot_logs (...);
`);
```

### Helper Functions
```javascript
// Session management
function updateUserSession(userId, menu, flow, question, answers) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_sessions 
        (user_id, current_menu, current_flow, current_question, answers, last_activity)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(userId, menu, flow, question, JSON.stringify(answers));
}

// Application management
function createApplication(appId, userId, type, answers, forumPostId, forumChannelId) {
    const stmt = db.prepare(`
        INSERT INTO applications (id, user_id, type, answers, forum_post_id, forum_channel_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(appId, userId, type, JSON.stringify(answers), forumPostId, forumChannelId);
}
```

---

## Maintenance Tasks

### Scheduled Cleanup
```sql
-- Clean old sessions (run daily)
DELETE FROM user_sessions WHERE last_activity < datetime('now', '-24 hours');

-- Clean old logs (keep last 30 days)
DELETE FROM bot_logs WHERE created_at < datetime('now', '-30 days');

-- Archive old applications (older than 6 months)
UPDATE applications SET status = 'archived' 
WHERE submitted_at < datetime('now', '-6 months') AND status IN ('accepted', 'denied');
```

### Backup Strategy
- Regular database backups (daily/weekly)
- Version control for schema changes
- Test restore procedures

---

## Data Types and Formats

### JSON Answer Format Examples
```javascript
// Staff Application Answers
{
  "inGameName": "JohnDoe",
  "discordUsername": "john#1234",
  "age": "21",
  "steamId": "STEAM_123456789",
  "timezone": "EST, USA",
  "playtime": "50 hours",
  "activeTimes": "Weekdays 4 PM - 9 PM EST",
  "previousBans": "None",
  "experience": "Moderator on ServerX for 6 months",
  "motivation": "I want to help maintain a positive community...",
  "qualities": "Patient, fair, good communication skills",
  "roleUnderstanding": "To enforce rules fairly and help players...",
  "confirmation1": "Yes",
  "confirmation2": "Yes"
}

// Ban Appeal Answers
{
  "inGameName": "JohnDoe",
  "discordUsername": "john#1234",
  "steamId": "STEAM_123456789",
  "bannedBy": "AdminUser",
  "banDate": "2024-01-10 3:30 PM",
  "banReason": "RDM",
  "appealReason": "I was defending myself from another player...",
  "evidence": "I have a video recording of the incident..."
}
```

---

## Error Handling and Logging

### Database Error Logging
```javascript
function logDatabaseError(error, operation, userId = null) {
    const stmt = db.prepare(`
        INSERT INTO bot_logs (level, message, user_id, action, details)
        VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run('error', error.message, userId, operation, JSON.stringify({
        stack: error.stack,
        timestamp: new Date().toISOString()
    }));
}
```

### Transaction Safety
```javascript
function safeTransaction(operations) {
    const transaction = db.transaction(operations);
    try {
        return transaction();
    } catch (error) {
        logDatabaseError(error, 'transaction');
        throw error;
    }
}
``` 