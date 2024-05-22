# Kyoshin Report BOT

## 環境構築

> [!WARNING]
> python3 がインストールされている前提です。

### クローン

GitHub からリポジトリをクローンします。

```bash
git clone https://github.com/nikkou-0814/Kyoshin-Report-BOT.git
```

### 環境変数

1. .env をコピーします。

```bash
cp .env.example .env
```

Discord BOT のトークンとチャンネルIDを記載します。

2. TOKEN=<DISOCRD_TOKEN>

3. channelid=<DISCORD_ChannelID>

## 依存関係のインストールと起動

依存関係の管理は Poetry を使用しています。

```bash
poetry env use <which python>
poetry install
poetry run python app.py
```