const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

// Web server to keep bot alive
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Bot is online!');
});

app.listen(PORT, () => {
    console.log(`Web server is running on http://localhost:${PORT}`);
});

// Constants
const OWNER_ID = '1336450372398612521';
const ALLOWED_CHANNEL_ID = '1390507210421043290';
const ALLOWED_SERVER_ID = '1345474714331643956';
const INVITE_LINK = 'https://discord.com/oauth2/authorize?client_id=1391678741717192807&permissions=8&integration_type=0&scope=bot';

const inviteCommands = ['!invite', ',invite', '?invite', '-invite', '!bot', ',bot', '?bot'];

// Delete old messages in allowed channel
async function clearAllowedChannel() {
    const channel = client.channels.cache.get(ALLOWED_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        for (const [id, msg] of messages) {
            if (!msg.pinned) {
                await msg.delete().catch(() => {});
            }
        }
    } catch (err) {
        console.error("Error clearing channel:", err);
    }
}

// Run every 5 seconds
setInterval(clearAllowedChannel, 5000);

// On ready
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// On guild join
client.on('guildCreate', (guild) => {
    if (guild.id !== ALLOWED_SERVER_ID) {
        guild.leave()
            .then(() => console.log(`Left unauthorized server: ${guild.name}`))
            .catch(console.error);
    }
});

// Message handler
client.on('messageCreate', async (message) => {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    const content = message.content.toLowerCase();

    // Handle invite/bot commands
    if (inviteCommands.some(cmd => content === cmd)) {
        if (message.channel.id !== ALLOWED_CHANNEL_ID) {
            try {
                await message.delete();
                await message.reply({ content: `<@${message.author.id}> CUNT only in <#1390507210421043290>`, ephemeral: true });
            } catch (err) {
                console.error("Could not delete message or reply:", err);
            }
            return;
        }

        // Build embeds
        const commandEmbed = new EmbedBuilder()
            .setTitle('Bot Commands')
            .setDescription([
                '`.rip = nuke`',
                '`.ba = ban all (not working rn)`',
                '`.help for in-bot help menu`'
            ].join('\n'))
            .setColor('#FF0000')
            .setFooter({ text: '⚠️ This is a nuke bot' });

        const inviteEmbed = new EmbedBuilder()
            .setDescription(`[Click here to invite me](${INVITE_LINK})`)
            .setColor('#00BFFF');

        // Send DM
        try {
            await message.author.send({ embeds: [commandEmbed, inviteEmbed] });

            // Reply in channel
            const reply = await message.reply({ content: 'Sent you a DM!', ephemeral: false });

            // Delete reply + original message after 5 seconds
            setTimeout(async () => {
                try {
                    await reply.delete();
                } catch {}
                try {
                    await message.delete();
                } catch {}
            }, 5000);

        } catch (err) {
            message.reply({ content: "I couldn't send you a DM. Please check your privacy settings.", ephemeral: true });
        }
    }

    // Owner-only commands
    if (message.author.id !== OWNER_ID) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'giverole') {
        const user = message.mentions.users.first();
        const role = message.mentions.roles.first();

        if (!user || !role) {
            return message.reply('Usage: `!giverole @user @role`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('User not found.');

        member.roles.add(role).catch(console.error);
        message.reply(`Gave ${role} to ${user.username}`);
    }

    if (command === 'addbot') {
        message.reply('This command is restricted.');
    }

    // Add more owner-only commands below
});

// Start bot
client.login(process.env.BOT_TOKEN);
