const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-tickets')
        .setDescription('List all active support tickets')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Filter by ticket status')
                .addChoices(
                    { name: 'Open', value: 'open' },
                    { name: 'All', value: 'all' }
                )
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

            const statusFilter = interaction.options.getString('status') || 'open';
            
            // Get tickets based on filter
            let tickets;
            if (statusFilter === 'all') {
                tickets = await database.all('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 50');
            } else {
                tickets = await database.all('SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC LIMIT 50', [statusFilter]);
            }

            if (tickets.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('🎫 Support Tickets')
                    .setColor(0x0099FF)
                    .setDescription(`No ${statusFilter === 'all' ? '' : statusFilter + ' '}tickets found.`)
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Create embed with ticket list
            const embed = new EmbedBuilder()
                .setTitle(`🎫 Support Tickets (${statusFilter === 'all' ? 'All' : 'Open'})`)
                .setColor(0x0099FF)
                .setTimestamp()
                .setFooter({ text: `Showing ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}` });

            // Group tickets by type
            const ticketsByType = {};
            for (const ticket of tickets) {
                if (!ticketsByType[ticket.type]) {
                    ticketsByType[ticket.type] = [];
                }
                ticketsByType[ticket.type].push(ticket);
            }

            // Add fields for each type
            for (const [type, typeTickets] of Object.entries(ticketsByType)) {
                const typeTitle = type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');

                let fieldValue = '';
                for (const ticket of typeTickets.slice(0, 10)) { // Limit to 10 per type
                    const user = await interaction.client.users.fetch(ticket.user_id).catch(() => null);
                    const username = user ? user.username : 'Unknown User';
                    const channel = interaction.guild.channels.cache.get(ticket.channel_id);
                    const channelMention = channel ? `<#${channel.id}>` : 'Channel not found';
                    
                    const statusEmoji = ticket.status === 'open' ? '🟢' : 
                                       ticket.status === 'closed' ? '🔴' : '🟡';
                    
                    const createdAt = new Date(ticket.created_at);
                    const timeAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
                    
                    fieldValue += `${statusEmoji} **${ticket.id}** - ${username}\n`;
                    fieldValue += `${channelMention} • ${timeAgo}h ago\n\n`;
                }

                if (typeTickets.length > 10) {
                    fieldValue += `... and ${typeTickets.length - 10} more`;
                }

                embed.addFields({
                    name: `${typeTitle} (${typeTickets.length})`,
                    value: fieldValue || 'No tickets',
                    inline: false
                });
            }

            // Add usage instructions
            embed.addFields({
                name: '💡 How to Reply',
                value: 'Use `/ticket-message <ticket-id> <message>` to send a message to the ticket creator.\nYou can also attach files to your replies.',
                inline: false
            });

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

            logger.info(`${interaction.user.username} listed tickets (filter: ${statusFilter})`);

        } catch (error) {
            logger.error('Error in list-tickets command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching tickets.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}; 