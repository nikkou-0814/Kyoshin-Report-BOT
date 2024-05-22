# Kyoshin Report BOT
> [!WARNING]
> プログラミング弱者が作ったコードなのでエラーが発生する可能性があります。

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

3. ChannelID=<DISCORD_ChannelID>

## 依存関係のインストールと起動

```bash
pip install -r requirements.txt

python app.py
```

## KyoshinEewViewer for ingenをインストール

### <a href="https://github.com/ingen084/KyoshinEewViewerIngen">こちらからダウンロード</a>

### ワークフローの設定

設定 → ワークフロー → 新規追加 →

トリガー → ```(強振モニタ)揺れ検知```

アクション → ```指定したURLに内容をPOST```

URL → ```http://localhost:8000/endpoint```


## 謝礼

### KyoshinEewViewer for ingen (ingen様)