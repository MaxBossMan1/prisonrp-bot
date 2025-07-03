const { Events, EmbedBuilder } = require('discord.js');
const MenuHandler = require('../handlers/menuHandler');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, bot) {
        const logger = bot.getLogger();
        const database = bot.getDatabase();
        
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Handle guild messages (for ticket channels)
        if (message.guild) {
            logger.debug(`Guild message from ${message.author.username}: ${message.content}`);
            
            // Check if this is a ticket channel and the user is staff
            try {
                await handleTicketChannelMessage(message, bot);
            } catch (error) {
                logger.error('Error handling ticket channel message:', error);
            }
            return;
        } else {
            logger.info(`DM message from ${message.author.username}: ${message.content}`);
        }
        
        try {
            // Check if user has an open ticket and this might be a reply
            const openTickets = await database.all('SELECT * FROM tickets WHERE user_id = ? AND status = "open"', [message.author.id]);
            
            if (openTickets.length > 0) {
                // Check if message starts with common menu keywords
                const menuKeywords = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'main', 'back', 'menu'];
                const isMenuCommand = menuKeywords.some(keyword => 
                    message.content.toLowerCase().trim() === keyword || 
                    message.content.toLowerCase().startsWith(keyword + ' ')
                );
                
                if (!isMenuCommand) {
                    // This looks like a ticket reply, handle it
                    await handleTicketReply(message, openTickets, bot);
                    return;
                }
            }
            
            // Handle as normal menu interaction
            const menuHandler = new MenuHandler(bot);
            await menuHandler.handleMessage(message);
        } catch (error) {
            logger.error('Error handling DM message:', error);
            
            // Log error to database
            await database.insertBotLog('error', 'Error handling DM message', message.author.id, 'message_error', {
                error: error.message,
                messageContent: message.content.substring(0, 100) // Limit content length
            });
            
            // Send error message to user
            try {
                await message.reply('❌ An unexpected error occurred. Please try again later or contact an administrator.');
            } catch (replyError) {
                logger.error('Failed to send error message to user:', replyError);
            }
        }
    }
}; 

async function handleTicketReply(message, openTickets, bot) {
    const logger = bot.getLogger();
    const database = bot.getDatabase();
    
    try {
        // If user has multiple tickets, use the most recent one
        const ticket = openTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        // Get the ticket channel
        const guild = message.client.guilds.cache.values().next().value; // Get first guild
        if (!guild) {
            await message.reply('❌ Could not find the server to forward your message.');
            return;
        }
        
        const ticketChannel = guild.channels.cache.get(ticket.channel_id);
        if (!ticketChannel) {
            await message.reply('❌ Your ticket channel could not be found. It may have been deleted.');
            return;
        }
        
        // Create embed for the ticket channel
        const embed = new EmbedBuilder()
            .setTitle('💬 User Reply')
            .setColor(0xFF9900)
            .addFields(
                { name: 'User', value: `${message.author.username} (${message.author.id})`, inline: true },
                { name: 'Ticket ID', value: ticket.id, inline: true }
            )
            .setTimestamp()
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'Use /ticket-message to reply' });

                 // Only set description if message has content
         if (message.content && message.content.trim().length > 0) {
             embed.setDescription(message.content);
         } else if (message.attachments.size === 0) {
             // If no content and no attachments, don't process this message
             return;
         } else {
             // Attachment-only message
             embed.setDescription('*User sent attachment(s) without text*');
         }
         
         // Handle attachments
        const channelContent = { embeds: [embed] };
        if (message.attachments.size > 0) {
            const attachments = Array.from(message.attachments.values());
            channelContent.files = attachments.map(att => ({ attachment: att.url, name: att.name }));
            
            // Add attachment info to embed
            const attachmentList = attachments.map(att => `[${att.name}](${att.url})`).join('\n');
            embed.addFields({ name: '📎 Attachments', value: attachmentList, inline: false });
        }
        
        // Send to ticket channel
        await ticketChannel.send(channelContent);
        
        // Confirm to user
        let confirmMessage = '✅ Your message has been forwarded to staff.';
        if (openTickets.length > 1) {
            confirmMessage += `\n📋 **Ticket ID:** ${ticket.id} (you have ${openTickets.length} open tickets)`;
        }
        
        await message.reply(confirmMessage);
        
        // Log the interaction
        await database.insertBotLog('info', `Ticket reply from user ${message.author.username}`, message.author.id, 'ticket_reply', {
            ticketId: ticket.id,
            messageLength: message.content.length,
            hasAttachments: message.attachments.size > 0,
            attachmentCount: message.attachments.size
        });
        
        logger.info(`Ticket reply forwarded from ${message.author.username} to ticket ${ticket.id}`);
        
    } catch (error) {
        logger.error('Error handling ticket reply:', error);
        await message.reply('❌ An error occurred while forwarding your message. Please try again or contact an administrator.');
    }
}

async function handleTicketChannelMessage(message, bot) {
    const logger = bot.getLogger();
    const database = bot.getDatabase();
    
    try {
        // Check if this is a ticket channel
        const ticket = await database.getTicketByChannelId(message.channel.id);
        if (!ticket) return; // Not a ticket channel
        
        // Check if ticket is still open
        if (ticket.status !== 'open') return; // Ticket is closed
        
        // Check if user has staff permissions
        const staffRoleConfig = await database.getConfig('staff_role_id');
        const adminRoleConfig = await database.getConfig('admin_role_id');
        const staffRoleId = staffRoleConfig?.value;
        const adminRoleId = adminRoleConfig?.value;
        
        const isStaff = (staffRoleId && message.member.roles.cache.has(staffRoleId)) ||
                       (adminRoleId && message.member.roles.cache.has(adminRoleId)) ||
                       message.member.permissions.has('Administrator');
        
        if (!isStaff) return; // Not staff
        
        // Get the ticket creator
        const user = await message.client.users.fetch(ticket.user_id);
        if (!user) {
            logger.warn(`Could not find user ${ticket.user_id} for ticket ${ticket.id}`);
            return;
        }
        
        // Create the message embed for the user
        const embed = new EmbedBuilder()
            .setTitle('💬 Message from Staff')
            .setColor(0x0099FF)
            .addFields(
                { name: 'Ticket ID', value: ticket.id, inline: true },
                { name: 'Staff Member', value: message.author.username, inline: true }
            )
            .setTimestamp()
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'Reply by DMing this bot. Your message will be forwarded to staff.' });

                 // Only set description if message has content
         if (message.content && message.content.trim().length > 0) {
             embed.setDescription(message.content);
         } else if (message.attachments.size === 0) {
             // If no content and no attachments, don't process this message
             return;
         } else {
             // Attachment-only message
             embed.setDescription('*Staff sent attachment(s) without text*');
         }
 
         // Prepare the DM content
        const dmContent = { embeds: [embed] };
        
        // Handle attachments
        if (message.attachments.size > 0) {
            const attachments = Array.from(message.attachments.values());
            dmContent.files = attachments.map(att => ({ attachment: att.url, name: att.name }));
            
            // Add attachment info to embed
            const attachmentList = attachments.map(att => `[${att.name}](${att.url})`).join('\n');
            embed.addFields({ name: '📎 Attachments', value: attachmentList, inline: false });
        }

        // Send DM to user
        try {
            await user.send(dmContent);
            
            // React to the staff message to confirm it was sent
            await message.react('✅');
            
            // Log the interaction
            await database.insertBotLog('info', `Ticket message sent by staff ${message.author.username}`, ticket.user_id, 'staff_ticket_message', {
                ticketId: ticket.id,
                staffId: message.author.id,
                messageLength: message.content.length,
                hasAttachments: message.attachments.size > 0,
                attachmentCount: message.attachments.size
            });
            
            logger.info(`Staff message forwarded from ${message.author.username} to user ${user.username} for ticket ${ticket.id}`);
            
        } catch (dmError) {
            logger.error('Error sending DM to user:', dmError);
            await message.react('❌');
            
            // Send error message in the channel
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Message Not Delivered')
                .setColor(0xFF0000)
                .setDescription('Could not send DM to user. They may have DMs disabled.')
                .addFields({ name: 'User', value: `${user.username} (${user.id})`, inline: true })
                .setTimestamp();
                
            await message.reply({ embeds: [errorEmbed] });
        }
        
    } catch (error) {
        logger.error('Error in handleTicketChannelMessage:', error);
    }
} 