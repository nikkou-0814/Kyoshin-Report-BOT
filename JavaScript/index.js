const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const app = express();
app.use(express.json());

const channelId = process.env.ChannelID;

client.once('ready', () => {
    console.log('Bot is ready');
});

client.login(process.env.TOKEN);

app.post('/endpoint', async (req, res) => {
    try {
        const postData = req.body;
        const embed = await createEmbed(postData);

        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await channel.send(embed);
        } else {
            console.log("チャンネルが見つかりませんでした。");
        }

        res.send('OK');
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function createEmbed(postData) {
    const isTest = postData.IsTest;
    const title = isTest ? 'テスト' : '揺れを検知';
    const description = isTest ? 'これはテストです' : '揺れを検出しました';
    const color = isTest ? 0x0000FF : 0xFF0000;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    const intensity = postData.Level;
    let intensityText;
    switch (intensity) {
        case 'stronger':
            intensityText = '5弱以上';
            embed.setColor(0xFF0000);
            break;
        case 'strong':
            intensityText = '3以上';
            embed.setColor(0xFF0000);
            break;
        case 'medium':
            intensityText = '1以上';
            embed.setColor(0xFFA500);
            break;
        case 'weak':
            intensityText = '弱い揺れ';
            embed.setColor(0x0000FF);
            break;
        case 'weaker':
            intensityText = '微弱な揺れ'
            embed.setColor(0x0000FF);
    }

    const eventedAt = new Date(postData.EventedAt);
    const formattedEventedAt = eventedAt.toISOString().replace('T', ' ').substring(0, 19);

    embed.addFields(
        { name: '検知日時', value: formattedEventedAt, inline: true },
        { name: '震度', value: intensityText, inline: true },
        { name: '検知地域', value: postData.Regions.join(', '), inline: true }
    );
    
    embed.setFooter({ text: `イベントID: ${postData.EventId}\n検知ID: ${postData.KyoshinEventId}` });

    return { embeds: [embed]};
}

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
