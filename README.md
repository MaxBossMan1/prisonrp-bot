# DigitalDeltaGaming PrisonRP Discord Bot

A custom Discord bot designed for the DigitalDeltaGaming PrisonRP GMod server, providing DM-based menu navigation for staff applications, support tickets, and report handling.

## Features

- **DM-Based Menu System**: Interactive menu navigation through direct messages
- **Staff Applications**: Complete Q&A flow with public forum posting
- **Support Tickets**: Private ticket system for appeals and support
- **Report System**: Player and staff reporting functionality
- **Slash Commands**: Modern Discord slash commands for staff actions
- **SQLite Database**: Persistent data storage with session management
- **Error Handling**: Comprehensive error handling and logging

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. **Clone or download** this project
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   Edit `.env` and add your Discord bot token and other configuration.

4. **Start the bot**:
   ```bash
   npm start
   ```

### Scripts

```bash
npm test         # Test bot functionality
npm run deploy   # Deploy slash commands to Discord
npm start        # Start the bot
npm run dev      # Development mode with auto-restart
```

## Bot Setup

Once the bot is running and added to your server:

1. **Run the setup command**: `/setup`
2. **Provide channel and role IDs** when prompted
3. **Verify setup**: `/verify-setup`

The bot will guide you through configuring:
- Staff Applications Forum
- Ban Appeals Forum
- Support & Reports Category
- Bot Logs Channel
- Staff Role
- Admin Role (optional)

## Project Structure

```
src/
├── index.js              # Main bot entry point
├── database/
│   └── database.js       # SQLite database management
├── handlers/
│   ├── eventHandler.js   # Discord event handler
│   ├── commandHandler.js # Slash command handler
│   └── menuHandler.js    # DM menu navigation
├── events/
│   ├── ready.js          # Bot ready event
│   └── messageCreate.js  # DM message handling
├── commands/             # Slash commands (to be implemented)
└── utils/
    └── logger.js         # Logging utility
```

## Usage

### For Users

1. **Send a DM** to the bot
2. **Navigate menus** by typing numbers or option names
3. **Complete applications/reports** by following the Q&A prompts
4. **Use commands**:
   - `menu` - Return to main menu
   - `cancel` - End current session
   - `help` - Show help information

### For Staff

Staff can use slash commands in any channel:
- `/accept` - Accept applications/appeals
- `/deny` - Deny applications/appeals  
- `/close` - Close support tickets
- `/reopen` - Reopen closed items

## Configuration

The bot stores configuration in the database. Update settings using:
- `/setup` - Initial setup
- `/update-config` - Update existing configuration
- `/verify-setup` - Check current configuration

## Development Status

### ✅ Completed
- Complete project structure and SQLite database
- Full DM menu navigation system
- Event handling and command framework
- Q&A flow system (all 7 flow types)
- Slash commands: `/menu`, `/setup`, `/help`
- Interactive bot setup process
- Comprehensive error handling and logging
- Input validation and session management

### 🚧 In Progress
- Forum post creation for applications/appeals
- Support ticket channel creation
- Staff management commands

### 📋 Planned
- Application review system with voting
- Ticket tunneling between channels
- Advanced admin utilities
- Performance optimizations

## Contributing

1. Review the planning documents in the root directory
2. Follow the existing code structure
3. Test thoroughly before submitting changes
4. Update documentation as needed

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions about this bot, contact the DigitalDeltaGaming development team. 