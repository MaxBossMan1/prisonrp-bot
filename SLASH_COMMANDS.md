# DigitalDeltaGaming PrisonRP Slash Commands

---

## For Staff

### `/accept`
- **Description:** Accepts a staff application or ban appeal.
- **Usage Context:** In the relevant forum post thread (staff-applications or ban-appeals).
- **Parameters:**
  - `reason` (optional, string): Reason for acceptance (can be sent to the applicant).
- **Permissions:** Staff only
- **Effect:**  
  - Updates the forum post's tag to `Accepted`
  - Locks the post
  - Notifies the applicant via DM

---

### `/deny`
- **Description:** Denies a staff application or ban appeal.
- **Usage Context:** In the relevant forum post thread.
- **Parameters:**
  - `reason` (optional, string): Reason for denial (can be sent to the applicant).
- **Permissions:** Staff only
- **Effect:**  
  - Updates the forum post's tag to `Denied`
  - Locks the post
  - Notifies the applicant via DM

---

### `/close`
- **Description:** Closes a support or report ticket channel.
- **Usage Context:** In a support/report ticket channel.
- **Parameters:**
  - `reason` (optional, string): Reason for closing (can be sent to the user).
- **Permissions:** Staff only
- **Effect:**  
  - Archives or deletes the channel
  - Notifies the user via DM

---

### `/reopen`
- **Description:** Reopens a previously closed application, appeal, or ticket.
- **Usage Context:** In the relevant forum post or ticket channel.
- **Parameters:** None (or optionally, a reason)
- **Permissions:** Staff only
- **Effect:**  
  - Removes the locked status
  - Updates the tag to `Under Review`
  - Notifies the user

---

## For Users

### `/menu`
- **Description:** Shows the main menu in DM.
- **Usage Context:** In DM with the bot.
- **Parameters:** None
- **Permissions:** All users

---

### `/cancel`
- **Description:** Cancels the current flow or resets the session.
- **Usage Context:** In DM with the bot.
- **Parameters:** None
- **Permissions:** All users

---

### `/help`
- **Description:** Provides help information about the bot and its commands.
- **Usage Context:** Anywhere
- **Parameters:** None
- **Permissions:** All users

---

## Summary Table

| Command   | Who Can Use | Context                | Parameters         | Effect/Notes                                 |
|-----------|-------------|------------------------|--------------------|----------------------------------------------|
| /accept   | Staff       | Forum post thread      | reason (optional)  | Accepts, tags, locks, notifies applicant     |
| /deny     | Staff       | Forum post thread      | reason (optional)  | Denies, tags, locks, notifies applicant      |
| /close    | Staff       | Ticket channel         | reason (optional)  | Closes channel, notifies user                |
| /reopen   | Staff       | Forum/ticket channel   | reason (optional)  | Reopens, tags, notifies user                 |
| /menu     | All users   | DM                     | None               | Shows main menu                              |
| /cancel   | All users   | DM                     | None               | Cancels current flow                         |
| /help     | All users   | Anywhere               | None               | Shows help info                              | 