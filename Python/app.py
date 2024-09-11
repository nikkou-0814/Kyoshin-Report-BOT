import discord
import asyncio
import aiohttp
from aiohttp import web
from discord.ext import commands
import threading
import logging
import json
import datetime
from dotenv import load_dotenv
import os

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

load_dotenv()

channel_id = int(os.getenv('ChannelID'))

async def send_to_discord(embed):
    channel = client.get_channel(channel_id)
    if channel is not None:
        await channel.send(embed=embed)
    else:
        print("チャンネルが見つかりませんでした。")


async def handle(request):
    post_data = await request.read()
    await create_embed(post_data.decode("utf-8"))
    return web.Response(text="OK")

async def create_embed(post_data):
    post_data_dict = json.loads(post_data)
    embed = discord.Embed(
        title="テスト" if post_data_dict["IsTest"] else "揺れを検知",
        description="強震モニタで揺れを検知しました" if not post_data_dict["IsTest"] else "これはテストです",
        color=discord.Color.red() if not post_data_dict["IsTest"] else discord.Color.blue()
    )

    intensity = post_data_dict["Level"]
    if intensity == "stronger":
        intensity_text = "5弱以上"
        embed.color = discord.Color.red()

    elif intensity == "strong":
        intensity_text = "3以上"
        embed.color = discord.Color.red()

    elif intensity == "medium":
        intensity_text = "1以上"
        embed.color = discord.Color.orange()

    elif intensity == "weak":
        intensity_text = "弱い揺れ"
        embed.color = discord.Color.blue()
    
    elif intensity == "weaker":
        intensity_text = "微弱な揺れ"
        embed.color = discord.Color.blue()

    evented_at = datetime.datetime.fromisoformat(post_data_dict["EventedAt"])
    formatted_evented_at = evented_at.strftime('%Y-%m-%d %H:%M:%S')

    embed.add_field(name="検知日時", value=formatted_evented_at, inline=True)
    embed.add_field(name="震度", value=intensity_text, inline=True)
    embed.add_field(name="検知地域", value=", ".join(post_data_dict["Regions"]), inline=True)
    embed.set_footer(text=f"イベントID: {post_data_dict['EventId']}\n検知ID: {post_data_dict["KyoshinEventId"]}")
    await send_to_discord(embed)
    await client.change_presence(status=discord.Status.online, activity=discord.CustomActivity(name=", ".join(post_data_dict["Regions"])))
    await asyncio.sleep(10)
    await client.change_presence(status=discord.Status.online, activity=discord.CustomActivity(name="待機中"))

async def start_server():
    app = web.Application()
    app.router.add_post('/endpoint', handle)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8000)
    await site.start()

@client.event
async def on_ready():
    await client.change_presence(status=discord.Status.online, activity=discord.CustomActivity(name="待機中"))

async def run_bot():
    await client.start(os.getenv('TOKEN'))

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    loop = asyncio.get_event_loop()
    loop.create_task(start_server())
    loop.create_task(run_bot())
    loop.run_forever()
