# DigitalDeltaGaming PrisonRP Bot Setup Process

---

## Pre-Setup Requirements
1. **Bot Token:** Your Discord bot token from the Discord Developer Portal
2. **Channel/Role IDs:** You'll need to provide IDs for existing channels and roles
3. **Discord Server Access:** The bot must be added to your server

---

## Setup Commands

### 1. Initial Setup Command
```
/setup
```
- **Who can use:** Server administrators only
- **What it does:**
  - Prompts you to provide IDs for all required channels and roles
  - Validates that the provided IDs exist and are accessible
  - Creates the database and initializes tables
  - Saves the configuration for future use
  - Sends a setup completion message

### 2. Configuration Update Command
```
/update-config
```
- **Who can use:** Server administrators only
- **What it does:**
  - Allows you to update any channel or role IDs
  - Validates the new IDs
  - Updates the configuration

### 3. Configuration Verification Command
```
/verify-setup
```
- **Who can use:** Server administrators only
- **What it does:**
  - Checks if all configured channels/roles exist
  - Verifies bot has proper permissions
  - Tests database connectivity
  - Reports any issues

---

## Required IDs to Collect

### Forum Channels
- **Staff Applications Forum ID:** Where staff applications will be posted
- **Ban Appeals Forum ID:** Where ban appeals will be posted

### Categories
- **Support & Reports Category ID:** Where support ticket channels will be created

### Channels
- **Bot Logs Channel ID:** Where bot logs will be sent

### Roles
- **Staff Role ID:** Role that can use staff commands
- **Admin Role ID:** Role with additional permissions (optional)

---

## Setup Process Flow

### Step 1: Collect Required IDs
1. **Enable Developer Mode** in Discord (User Settings > Advanced > Developer Mode)
2. **Right-click** on each required channel/role and copy the ID
3. **Note down** all the IDs you'll need

### Step 2: Run Setup
1. Run `/setup` in any channel
2. The bot will prompt you for each ID one by one
3. Paste each ID when prompted
4. The bot will validate each ID and confirm

### Step 3: Verify Setup
1. Run `/verify-setup`
2. Review the status report
3. Fix any issues if reported

---

## Setup Command Flow Example

```
User: /setup

Bot: Welcome to the DigitalDeltaGaming PrisonRP Bot Setup!
Let's configure your bot step by step.

First, I need the ID of your Staff Applications forum channel.
Please provide the channel ID:

User: 123456789012345678

Bot: ✅ Staff Applications forum found: #staff-applications
Next, I need the ID of your Ban Appeals forum channel.
Please provide the channel ID:

User: 234567890123456789

Bot: ✅ Ban Appeals forum found: #ban-appeals
Next, I need the ID of your Support & Reports category.
Please provide the category ID:

User: 345678901234567890

Bot: ✅ Support & Reports category found: Support & Reports
Next, I need the ID of your Bot Logs channel.
Please provide the channel ID:

User: 456789012345678901

Bot: ✅ Bot Logs channel found: #bot-logs
Next, I need the ID of your Staff role.
Please provide the role ID:

User: 567890123456789012

Bot: ✅ Staff role found: Staff
Finally, I need the ID of your Admin role (optional - type 'skip' if not needed).
Please provide the role ID:

User: 678901234567890123

Bot: ✅ Admin role found: Admin

🎉 Setup Complete!
All channels and roles have been configured.
Run /verify-setup to check everything is working correctly.
```

---

## Configuration Storage

The bot will store the configuration in the database:

```sql
CREATE TABLE bot_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Stored Configuration:**
- `staff_applications_forum_id`
- `ban_appeals_forum_id`
- `support_reports_category_id`
- `bot_logs_channel_id`
- `staff_role_id`
- `admin_role_id`

---

## Update Configuration Command

```
User: /update-config

Bot: Which configuration would you like to update?
1. Staff Applications Forum ID
2. Ban Appeals Forum ID
3. Support & Reports Category ID
4. Bot Logs Channel ID
5. Staff Role ID
6. Admin Role ID

User: 1

Bot: Please provide the new Staff Applications Forum ID:

User: 123456789012345678

Bot: ✅ Configuration updated successfully!
```

---

## Verification Report Example

```
✅ Setup Verification Report

Channels:
✅ Staff Applications Forum: #staff-applications (ID: 123456789012345678)
✅ Ban Appeals Forum: #ban-appeals (ID: 234567890123456789)
✅ Support & Reports Category: Support & Reports (ID: 345678901234567890)
✅ Bot Logs Channel: #bot-logs (ID: 456789012345678901)

Roles:
✅ Staff Role: Staff (ID: 567890123456789012)
✅ Admin Role: Admin (ID: 678901234567890123)

Bot Permissions:
✅ Can read messages in all configured channels
✅ Can send messages in all configured channels
✅ Can manage forum posts
✅ Can manage roles

Database:
✅ Database accessible
✅ Configuration stored

Setup Status: 100% Complete ✅
All systems operational!
```

---

## Troubleshooting

### Common Issues
1. **Invalid Channel ID:** Make sure you're copying the correct ID and the bot has access to that channel
2. **Invalid Role ID:** Ensure the role exists and the bot can see it
3. **Permission Errors:** The bot needs proper permissions in the configured channels

### Reset Configuration
If you need to start over, you can manually delete the `bot_config` table from the database and run `/setup` again.

---

## Required Bot Permissions

The bot needs the following permissions:
- **Manage Channels:** To create support ticket channels
- **Manage Roles:** To check role permissions
- **Send Messages:** To send responses and logs
- **Read Message History:** To read forum posts and channel messages
- **Use Slash Commands:** To register and use slash commands
- **Manage Forum Posts:** To create and manage forum posts
- **Embed Links:** To send formatted messages
- **Attach Files:** To send logs and attachments 