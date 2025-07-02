# DigitalDeltaGaming PrisonRP Permissions and Roles Structure

---

## Discord Roles Required

### Staff Roles
- **Role Name:** `Staff` (or your existing staff role name)
- **Permissions:**
  - Can use `/accept`, `/deny`, `/close`, `/reopen` commands
  - Can view and manage forum posts in `staff-applications` and `ban-appeals`
  - Can view and manage channels in `Support & Reports` category
  - Can view `bot-logs` channel
  - Can create, edit, and delete forum posts
  - Can manage tags in forum channels

### Admin Roles (Optional - for higher-level staff)
- **Role Name:** `Admin` (or your existing admin role name)
- **Permissions:**
  - All Staff permissions
  - Can manage bot settings (if needed)
  - Can view all logs and analytics

---

## Command Permissions

### Staff Commands (Require Staff role)
- `/accept` - Only usable by users with Staff role
- `/deny` - Only usable by users with Staff role
- `/close` - Only usable by users with Staff role
- `/reopen` - Only usable by users with Staff role

### User Commands (Available to all users)
- `/menu` - Available to all users
- `/cancel` - Available to all users
- `/help` - Available to all users

---

## Channel Permissions

### Forum Channels
- **`staff-applications`:**
  - **Public:** Read access for all users
  - **Staff:** Full access (create, edit, delete, manage tags)
- **`ban-appeals`:**
  - **Public:** Read access for all users
  - **Staff:** Full access (create, edit, delete, manage tags)

### Support & Reports Category
- **Public:** No access
- **Staff:** Full access (view, send messages, manage channels)
- **Bot:** Full access (create, edit, delete channels)

### Bot Logs Channel
- **Public:** No access
- **Staff:** Read access
- **Bot:** Full access (send messages, manage messages)

---

## Implementation Notes

### Role Checking
- The bot should check if a user has the Staff role before allowing them to use staff commands
- Use Discord's permission system to restrict channel access
- Consider using role IDs for more precise control

### Fallback Permissions
- If a user doesn't have the required role, the bot should respond with a permission error
- Consider logging unauthorized command attempts

---

## Summary Table

| Feature | Public Users | Staff Role | Admin Role |
|---------|--------------|------------|------------|
| `/menu`, `/cancel`, `/help` | ✅ | ✅ | ✅ |
| `/accept`, `/deny`, `/close`, `/reopen` | ❌ | ✅ | ✅ |
| View forum posts | ✅ | ✅ | ✅ |
| Manage forum posts/tags | ❌ | ✅ | ✅ |
| View Support & Reports channels | ❌ | ✅ | ✅ |
| View bot logs | ❌ | ✅ | ✅ |
| Manage bot settings | ❌ | ❌ | ✅ | 