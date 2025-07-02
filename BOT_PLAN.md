# DigitalDeltaGaming PrisonRP Discord Bot Plan

## Overview
A custom Discord bot for DigitalDeltaGaming PrisonRP (GMod roleplay server) focused on DM-based menu navigation, staff applications, support tickets, and report handling. The bot will use Node.js and discord.js, leveraging slash commands for staff actions and user interactions.

---

## 1. User DM Menu System
- **DM-Only Interaction:** Bot responds only to direct messages from users.
- **Main Menu:**
  - Presents options such as:
    1. Support
    2. Staff Applications
    3. Reports
    4. Other
  - Users can select options by typing the number or name.
- **Submenus:**
  - Each main option can have submenus (e.g., Support → Ban Appeals, Warn Appeals, Donation Support).
  - Users can navigate by typing numbers or keywords.
- **Input Handling:**
  - Accept both numbers and keywords.
  - Gracefully handle invalid input.
  - Allow users to go back or restart the menu.

---

## 2. State Management
- Track each user's current position in the menu tree (session state).
- Store answers for Q&A flows (e.g., staff applications).
- Handle session timeouts or resets if users stop responding.

---

## 3. Staff Applications (Q&A Flow)
- **Dynamic Questioning:**
  - After selecting "Staff Applications," the bot asks a series of questions (e.g., Steam ID, age, experience).
  - Collect answers in order.
- **Submission:**
  - Format responses into a single message.
  - Create a new post in a Discord forum channel.
  - Add tags such as "Unreviewed."
- **Forum Post Management:**
  - Use tags like "Unreviewed," "Accepted," "Denied."
  - Lock the post when accepted/denied.
  - Notify the applicant via DM.

---

## 4. Support Tickets (Channel Tunneling)
- **Channel Creation:**
  - For support options, create a private text channel named after the support type (e.g., "ban-appeal-username").
- **Tunnel Communication:**
  - Relay messages between the user (in DM) and staff (in the support channel).
- **Channel Management:**
  - Close/delete the channel when resolved.
  - Optionally log the conversation.

---

## 5. Reports
- Allow users to submit staff or player reports via menu navigation.
- Collect necessary details through Q&A.
- Post reports to a designated staff channel or forum.

---

## 6. Slash Commands
- **For Staff:**
  - `/accept [application] [optional reason]`: Accepts an application, updates tags, locks post, notifies applicant.
  - `/deny [application] [optional reason]`: Denies an application, updates tags, locks post, notifies applicant.
  - `/close [ticket] [optional reason]`: Closes a support ticket channel, notifies user.
  - `/reopen [application/ticket]`: Optionally reopens a closed application or ticket.
- **For Users:**
  - `/menu`: Shows the main menu in DM.
  - `/cancel`: Cancels the current flow or resets session.
  - `/help`: Provides help information.
- **Permissions:**
  - Restrict staff commands to staff roles only.

---

## 7. Technical Considerations
- Use discord.js for bot development.
- Use a menu tree structure (object/JSON) for easy menu updates.
- Store application/support data securely.
- Ensure privacy and data retention compliance.
- Make the system extensible for future features.

---

## 8. Next Steps
- Map out the full menu tree and Q&A flows.
- Define the list of questions for staff applications and support tickets.
- Plan forum and channel structure in Discord.
- Design slash command structure and permissions.
- Decide on data storage (in-memory vs. database). 