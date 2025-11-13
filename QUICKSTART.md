# クイックスタートガイド - 10分でデプロイ

本ドキュメントでは、最短10分で本部提出書類自動生成システムをデプロイする手順を説明します。

## ⏱️ 所要時間

- **準備**: 5分
- **デプロイ**: 5分
- **合計**: **10分**

## 📋 事前準備

以下の情報を手元に用意してください:

### Lark情報

1. **App ID**: `cli_xxxxxxxxxxxxx`
2. **App Secret**: `xxxxxxxxxxxxxxxxxxxxx`
3. **App Token**: `bascnxxxxxxxxxxxxx`
4. **Table ID**: `tblxxxxxxxxxxxxx`

取得方法は`DEPLOYMENT_GUIDE.md`の「ステップ1」を参照してください。

### Cloudflareアカウント

https://dash.cloudflare.com/sign-up で無料アカウントを作成してください。

## 🚀 デプロイ手順

### ステップ1: プロジェクトの準備(2分)

```bash
# プロジェクトディレクトリに移動
cd lark-budget-export

# 依存関係をインストール
npm install

# Wrangler CLIをインストール(初回のみ)
npm install -g wrangler
```

### ステップ2: Cloudflareにログイン(1分)

```bash
wrangler login
```

ブラウザが開き、Cloudflareへのログインを求められます。「Allow」をクリックしてください。

### ステップ3: R2バケットを作成(1分)

```bash
wrangler r2 bucket create lark-budget-files
```

成功すると、以下のメッセージが表示されます:

```
✅ Created bucket lark-budget-files
```

### ステップ4: D1データベースを作成(1分)

```bash
wrangler d1 create lark-budget-db
```

出力されたデータベースIDをコピーしてください:

```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

スキーマを適用:

```bash
wrangler d1 execute lark-budget-db --file=schema.sql
```

### ステップ5: 設定ファイルを編集(3分)

`wrangler.toml`を開き、以下を設定します:

```toml
name = "lark-budget-export"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
LARK_APP_ID = "cli_xxxxxxxxxxxxx"           # 👈 ここを変更
LARK_APP_SECRET = "xxxxxxxxxxxxxxxxxxxxx"   # 👈 ここを変更
LARK_APP_TOKEN = "bascnxxxxxxxxxxxxx"       # 👈 ここを変更
LARK_TABLE_ID = "tblxxxxxxxxxxxxx"          # 👈 ここを変更

[[r2_buckets]]
binding = "BUDGET_FILES"
bucket_name = "lark-budget-files"

[[d1_databases]]
binding = "DB"
database_name = "lark-budget-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 👈 ここを変更
```

### ステップ6: デプロイ(2分)

```bash
npm run deploy
```

成功すると、以下のメッセージが表示されます:

```
✅ Successfully deployed to https://lark-budget-export.your-subdomain.workers.dev
```

## ✅ 動作確認

### 1. ブラウザで確認

表示されたURLにアクセス:

```
https://lark-budget-export.your-subdomain.workers.dev
```

### 2. テスト実行

1. 年度: `2025`
2. 期: `下期`
3. 「📄 書類を生成」をクリック

Excelファイルがダウンロードされれば成功です!

## 🔗 Lark Baseとの連携

### Lark Baseにボタンを追加

1. 「予実管理」テーブルを開く
2. 新しいフィールドを追加
   - タイプ: **ボタン**
   - 名前: **本部提出書類を生成**
   - ラベル: **📄 書類生成**
   - アクション: **URLを開く**
   - URL: `https://lark-budget-export.your-subdomain.workers.dev`

### 使用方法

1. Lark Baseで「予実管理」テーブルを開く
2. 「📄 書類生成」ボタンをクリック
3. 新しいタブでエクスポートページが開く
4. 年度と期を選択して「書類を生成」をクリック
5. Excelファイルがダウンロードされる

## 🎉 完了!

おめでとうございます! 本部提出書類自動生成システムのデプロイが完了しました。

## 📚 次のステップ

### カスタマイズ

- `src/excel-generator.js`: Excelフォーマットのカスタマイズ
- `src/lark-client.js`: データ取得ロジックのカスタマイズ
- `src/index.js`: UIのカスタマイズ

### 高度な設定

- カスタムドメインの設定
- 環境変数の暗号化
- ログの確認

詳細は`DEPLOYMENT_GUIDE.md`をご参照ください。

## 🐛 問題が発生した場合

### よくある問題

**Q: "Failed to get access token"エラーが出る**

A: `wrangler.toml`の`LARK_APP_ID`と`LARK_APP_SECRET`を確認してください。

**Q: "R2 bucket not found"エラーが出る**

A: `wrangler r2 bucket create lark-budget-files`を実行してください。

**Q: Excelファイルが空になる**

A: Lark Baseのフィールド名が想定と異なる可能性があります。`src/lark-client.js`を確認してください。

詳細は`DEPLOYMENT_GUIDE.md`の「トラブルシューティング」セクションをご参照ください。

## 📞 サポート

技術的な質問やバグ報告は、プロジェクトの担当者までお問い合わせください。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月13日
