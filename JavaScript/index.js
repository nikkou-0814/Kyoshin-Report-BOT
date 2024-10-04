const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, AttachmentBuilder } = require('discord.js');
const express = require('express');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const app = express();
app.use(express.json());

const channelId = process.env.ChannelID;

let browser;
let page;

async function initializePuppeteer() {
    try {
        console.log('強震モニタに接続中...');
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        page = await browser.newPage();
        const url = 'http://www.kmoni.bosai.go.jp/';
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.setViewport({ width: 1280, height: 800 });
        console.log('強震モニタに接続しました');
    } catch (error) {
        console.error('強震モニタの初期化中にエラーが発生しました:', error);
    }
}

async function closePuppeteer() {
    if (browser) {
        try {
            await browser.close();
            console.log('強震モニタを閉じました');
        } catch (error) {
            console.error('強震モニタのクローズ中にエラーが発生しました:', error);
        }
    }
}

client.once('ready', () => {
    console.log('DiscordBOT起動完了');
    client.user.setActivity({ name: "待機中", type: ActivityType.Custom });
});

client.login(process.env.TOKEN);

process.on('SIGINT', async () => {
    console.log('強震モニタを閉じます...');
    await closePuppeteer();
    process.exit();
});

process.on('SIGTERM', async () => {
    console.log('強震モニタを閉じます...');
    await closePuppeteer();
    process.exit();
});

initializePuppeteer();

app.post('/endpoint', async (req, res) => {
    try {
        const postData = req.body;
        const embedData = await createEmbed(postData);

        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await channel.send(embedData);
        } else {
            console.log("チャンネルが見つかりませんでした");
        }

        res.send('OK');
    } catch (error) {
        console.error('リクエストの処理中にエラーが発生しました:', error);
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
            intensityText = '微弱な揺れ';
            embed.setColor(0x0000FF);
            break;
        default:
            intensityText = '不明な震度';
            embed.setColor(0x808080);
    }

    const eventedAt = new Date(postData.EventedAt);
    const formattedEventedAt = eventedAt.toISOString().replace('T', ' ').substring(0, 19);

    embed.addFields(
        { name: '検知日時', value: formattedEventedAt, inline: true },
        { name: '震度', value: intensityText, inline: true },
        { name: '検知地域', value: postData.Regions.join(', '), inline: true }
    );

    embed.setFooter({ text: '強震モニタ' });

    const attachment = await captureScreenshot();

    embed.setImage('attachment://kmoni_screenshot.png');

    const embedData = { embeds: [embed], files: [attachment] };

    statusUpdate(postData);

    return embedData;
}

async function captureScreenshot() {
    const screenshotPath = path.join(__dirname, 'kmoni_screenshot.png');

    try {
        if (page) {
            setTimeout(async () => {
                try {
                    await page.screenshot({
                        path: screenshotPath,
                        clip: {
                            x: 5,
                            y: 130,
                            width: 360,
                            height: 477
                        }
                    });
                } catch (error) {
                    console.error('スクリーンショットの取得中にエラーが発生しました:', error);
                }
            }, 2000);
        } else {
            console.error('ページが初期化されていません');
        }
    } catch (error) {
        console.error('スクリーンショット中にエラーが発生しました:', error);
    }

    let attachment;
    try {
        const fileBuffer = fs.readFileSync(screenshotPath);
        attachment = new AttachmentBuilder(fileBuffer, { name: 'kmoni_screenshot.png' });
    } catch (error) {
        console.error('スクリーンショットの読み込み中にエラーが発生しました:', error);
        attachment = new AttachmentBuilder();
    }

    try {
        fs.unlinkSync(screenshotPath);
    } catch (error) {
        console.error('スクリーンショットの削除中にエラーが発生しました:', error);
    }

    return attachment;
}


async function statusUpdate(postData) {
    client.user.setActivity({ name: postData.Regions.join(", "), type: ActivityType.Custom });

    await new Promise(resolve => setTimeout(resolve, 10000));

    client.user.setActivity({ name: "待機中", type: ActivityType.Custom });
}

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`サーバーポート ${port} で起動しました`);
});