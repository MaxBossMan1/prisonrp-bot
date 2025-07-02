const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-message')
        .setDescription('Send a message to a ticket creator')
        .addStringOption(option =>
            option.setName('ticket-id')
                .setDescription('The ticket ID or channel ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send to the user')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('Optional file attachment')
                .setRequired(false)),

    async execute(interaction, bot) {
        const database = bot.getDatabase();
        const logger = bot.getLogger();

        try {
            // Check if user has staff permissions
            const staffRoleConfig = await database.getConfig('staff_role_id');
            const adminRoleConfig = await database.getConfig('admin_role_id');
            const staffRoleId = staffRoleConfig?.value;
            const adminRoleId = adminRoleConfig?.value;
            
            if (!staffRoleId || (!interaction.member.roles.cache.has(staffRoleId) && !interaction.member.roles.cache.has(adminRoleId))) {
                return await interaction.reply({
                    content: '❌ You do not have permission to use this command.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const ticketId = interaction.options.getString('ticket-id');
            const message = interaction.options.getString('message');
            const attachment = interaction.options.getAttachment('attachment');

            // Find the ticket - try by channel ID first, then by ticket ID
            let ticket = await database.getTicketByChannelId(ticketId);
            if (!ticket) {
                ticket = await database.getTicketById(ticketId);
            }

            if (!ticket) {
                return await interaction.reply({
                    content: '❌ Ticket not found. Please provide a valid ticket ID or channel ID.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Get the user
            const user = await interaction.client.users.fetch(ticket.user_id);
            if (!user) {
                return await interaction.reply({
                    content: '❌ Could not find the ticket creator.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Create the message embed for the user
            const embed = new EmbedBuilder()
                .setTitle('📞 Message from Staff')
                .setColor(0x0099FF)
                .setDescription(message)
                .addFields(
                    { name: 'Ticket ID', value: ticket.id, inline: true },
                    { name: 'Staff Member', value: interaction.user.username, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Reply by DMing this bot. Your message will be forwarded to staff.' });

            // Prepare the DM content
            const dmContent = { embeds: [embed] };
            
            // Add attachment if provided
            if (attachment) {
                dmContent.files = [{ attachment: attachment.url, name: attachment.name }];
                embed.addFields({ name: '📎 Attachment', value: `[${attachment.name}](${attachment.url})`, inline: false });
            }

            // Send DM to user
            try {
                await user.send(dmContent);
            } catch (dmError) {
                return await interaction.reply({
                    content: '❌ Could not send DM to user. They may have DMs disabled.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Log the message in the ticket channel
            const ticketChannel = interaction.guild.channels.cache.get(ticket.channel_id);
            if (ticketChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📤 Message Sent to User')
                    .setColor(0x00FF00)
                    .setDescription(message)
                    .addFields({ name: 'Sent by', value: interaction.user.username, inline: true })
                    .setTimestamp();

                if (attachment) {
                    logEmbed.addFields({ name: '📎 Attachment', value: `[${attachment.name}](${attachment.url})`, inline: false });
                }

                await ticketChannel.send({ embeds: [logEmbed] });
            }

            // Log to database
            await database.insertBotLog('info', `Ticket message sent to user ${user.username}`, interaction.user.id, 'ticket_message', {
                ticketId: ticket.id,
                userId: ticket.user_id,
                message: message.substring(0, 100),
                hasAttachment: !!attachment
            });

            await interaction.reply({
                content: `✅ Message sent successfully to ${user.username}`,
                flags: MessageFlags.Ephemeral
            });

            logger.info(`Ticket message sent by ${interaction.user.username} to ${user.username} for ticket ${ticket.id}`);

        } catch (error) {
            logger.error('Error in ticket-message command:', error);
            await interaction.reply({
                content: '❌ An error occurred while sending the message.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}; 