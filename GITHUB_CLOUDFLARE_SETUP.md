# GitHub + Cloudflare 自動デプロイ設定ガイド

本ドキュメントでは、**ローカル環境を使わず**、GitHubとCloudflareだけで完結する自動デプロイの設定方法を説明します。

## 🎯 概要

コードをGitHubにプッシュするだけで、自動的にCloudflare Workersにデプロイされます。

```
GitHub (コード管理)
  ↓ push
GitHub Actions (自動ビルド)
  ↓ deploy
Cloudflare Workers (本番環境)
```

## ⏱️ 所要時間

- **Cloudflare設定**: 5分
- **GitHub設定**: 3分
- **合計**: **8分**

## 📋 前提条件

- GitHubアカウント
- Cloudflareアカウント
- リポジトリ: `OfficePlata/forecast-lark` (既に作成済み)

## 🚀 セットアップ手順

### ステップ1: Cloudflare APIトークンを取得(3分)

#### 1-1. Cloudflareダッシュボードにアクセス

https://dash.cloudflare.com/ にアクセスし、ログインします。

#### 1-2. APIトークンを作成

1. 右上のアイコン→「My Profile」をクリック
2. 左メニューの「API Tokens」をクリック
3. 「Create Token」をクリック
4. 「Edit Cloudflare Workers」テンプレートの「Use template」をクリック

#### 1-3. トークンの権限を設定

以下の権限が設定されていることを確認:

- **Account Resources**:
  - Account Settings: Read
  - Workers Scripts: Edit
  - Workers R2 Storage: Edit
  - D1: Edit

- **Zone Resources**:
  - 不要(Workersのみ使用)

#### 1-4. トークンを生成

1. 「Continue to summary」をクリック
2. 「Create Token」をクリック
3. 表示されたトークンをコピー: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **重要**: トークンは一度しか表示されません。必ずコピーしてください。

#### 1-5. Account IDを取得

1. Cloudflareダッシュボードのトップページに戻る
2. 右側の「Account ID」をコピー: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### ステップ2: R2バケットとD1データベースを作成(2分)

#### 2-1. R2バケットを作成

1. Cloudflareダッシュボードで「R2」をクリック
2. 「Create bucket」をクリック
3. バケット名: `lark-budget-files`
4. 「Create bucket」をクリック

#### 2-2. D1データベースを作成

1. Cloudflareダッシュボードで「Workers & Pages」をクリック
2. 「D1」タブをクリック
3. 「Create database」をクリック
4. データベース名: `lark-budget-db`
5. 「Create」をクリック

#### 2-3. データベースIDを確認

作成されたデータベースの詳細ページで、Database IDを確認:

```
c0f7d03a-e128-4a22-b990-720df872301f
```

⚠️ **注意**: このIDは既に`wrangler.toml`に設定済みです。

#### 2-4. データベーススキーマを適用

1. データベースの詳細ページで「Console」タブをクリック
2. 以下のSQLを実行:

```sql
CREATE TABLE IF NOT EXISTS export_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  term TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_export_logs_year_term ON export_logs(year, term);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at);
```

3. 「Execute」をクリック

### ステップ3: GitHub Secretsを設定(3分)

#### 3-1. GitHubリポジトリにアクセス

https://github.com/OfficePlata/forecast-lark にアクセスします。

#### 3-2. Secretsを追加

1. 「Settings」タブをクリック
2. 左メニューの「Secrets and variables」→「Actions」をクリック
3. 「New repository secret」をクリック

#### 3-3. CLOUDFLARE_API_TOKENを追加

- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: ステップ1-4でコピーしたAPIトークン
- 「Add secret」をクリック

#### 3-4. CLOUDFLARE_ACCOUNT_IDを追加

- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: ステップ1-5でコピーしたAccount ID
- 「Add secret」をクリック

### ステップ4: GitHub Actionsワークフローを追加(手動)

⚠️ **注意**: GitHub Appの権限制限により、ワークフローファイルは手動で追加する必要があります。

#### 4-1. GitHubのWebエディタでファイルを作成

1. GitHubリポジトリのトップページで「Add file」→「Create new file」をクリック
2. ファイル名: `.github/workflows/deploy.yml`
3. 以下の内容を貼り付け:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

4. 「Commit changes」をクリック
5. コミットメッセージ: `Add GitHub Actions workflow`
6. 「Commit changes」をクリック

### ステップ5: 自動デプロイの確認(1分)

#### 5-1. GitHub Actionsの実行を確認

1. GitHubリポジトリの「Actions」タブをクリック
2. 「Deploy to Cloudflare Workers」ワークフローが実行されていることを確認
3. ワークフローをクリックして詳細を表示
4. 全てのステップが緑色のチェックマークになれば成功

#### 5-2. デプロイされたURLを確認

1. Cloudflareダッシュボードで「Workers & Pages」をクリック
2. 「lark-budget-export」をクリック
3. URLを確認: `https://lark-budget-export.your-subdomain.workers.dev`

#### 5-3. 動作確認

1. ブラウザでURLにアクセス
2. 年度と期を選択
3. 「📄 書類を生成」をクリック
4. Excelファイルがダウンロードされれば成功!

## 🔄 運用方法

### コードを更新する

#### 方法1: GitHubのWebエディタで編集

1. GitHubリポジトリで編集したいファイルを開く
2. 右上の鉛筆アイコン(Edit)をクリック
3. コードを編集
4. 「Commit changes」をクリック
5. **自動的にデプロイが開始される**

#### 方法2: ローカルで編集してプッシュ(オプション)

```bash
git clone https://github.com/OfficePlata/forecast-lark.git
cd forecast-lark
# ファイルを編集
git add .
git commit -m "Update: 〇〇機能を追加"
git push origin main
# 自動的にデプロイが開始される
```

### デプロイ履歴を確認

1. GitHubリポジトリの「Actions」タブをクリック
2. 過去のデプロイ履歴を確認

### 手動でデプロイする

1. GitHubリポジトリの「Actions」タブをクリック
2. 「Deploy to Cloudflare Workers」をクリック
3. 「Run workflow」→「Run workflow」をクリック

## 🎨 カスタマイズ例

### Excelフォーマットを変更

1. GitHubで`src/excel-generator.js`を開く
2. 「Edit」をクリック
3. `writeData`メソッドを編集
4. 「Commit changes」をクリック
5. 自動的にデプロイされる

### UIをカスタマイズ

1. GitHubで`src/index.js`を開く
2. 「Edit」をクリック
3. `handleIndex`関数のHTMLを編集
4. 「Commit changes」をクリック
5. 自動的にデプロイされる

## 🐛 トラブルシューティング

### GitHub Actionsが失敗する

#### エラー: "Authentication error"

**原因**: Cloudflare APIトークンが間違っている

**解決方法**:
1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」
2. `CLOUDFLARE_API_TOKEN`を削除
3. 正しいトークンで再作成

#### エラー: "R2 bucket not found"

**原因**: R2バケットが作成されていない

**解決方法**:
1. Cloudflareダッシュボードで「R2」をクリック
2. 「Create bucket」をクリック
3. バケット名: `lark-budget-files`

#### エラー: "D1 database not found"

**原因**: D1データベースが作成されていない、またはIDが間違っている

**解決方法**:
1. Cloudflareダッシュボードで「Workers & Pages」→「D1」をクリック
2. データベースが存在するか確認
3. Database IDを確認
4. `wrangler.toml`の`database_id`を更新

### デプロイは成功するが、動作しない

#### エラー: "Failed to get access token"

**原因**: Lark APIの認証情報が間違っている

**解決方法**:
1. GitHubで`wrangler.toml`を開く
2. 「Edit」をクリック
3. `LARK_APP_ID`、`LARK_APP_SECRET`、`LARK_APP_TOKEN`、`LARK_TABLE_ID`を確認
4. 正しい値に更新
5. 「Commit changes」をクリック

#### エラー: Excelファイルが空

**原因**: Lark Baseのフィールド名が想定と異なる

**解決方法**:
1. Lark Baseで「予実管理」テーブルのフィールド名を確認
2. GitHubで`src/lark-client.js`を開く
3. `processRecords`メソッドのフィールド名を修正
4. 「Commit changes」をクリック

## 📊 デプロイの仕組み

### GitHub Actionsワークフロー

```yaml
on:
  push:
    branches:
      - main  # mainブランチにプッシュされたら実行
  workflow_dispatch:  # 手動実行も可能
```

### デプロイステップ

1. **Checkout code**: GitHubからコードを取得
2. **Setup Node.js**: Node.js環境をセットアップ
3. **Install dependencies**: `npm ci`で依存関係をインストール
4. **Deploy**: Wrangler CLIでCloudflare Workersにデプロイ

### 実行時間

- 通常: 1〜2分
- 初回: 2〜3分(依存関係のキャッシュ作成)

## 💰 コスト

### GitHub Actions

- **無料枠**: 2,000分/月(パブリックリポジトリは無制限)
- **使用量**: 約2分/デプロイ
- **月間100回デプロイ**: **無料**

### Cloudflare Workers

- **無料枠**: 100,000リクエスト/日
- **使用量**: 約100リクエスト/月
- **コスト**: **無料**

### 合計

**完全に無料**で運用できます。

## 🎉 完了!

おめでとうございます! GitHub + Cloudflareの自動デプロイ設定が完了しました。

これで、GitHubにコードをプッシュするだけで、自動的にCloudflare Workersにデプロイされます。

## 📚 次のステップ

### Lark Baseとの連携

1. Lark Baseで「予実管理」テーブルを開く
2. 新しいフィールドを追加
   - タイプ: **ボタン**
   - 名前: **本部提出書類を生成**
   - ラベル: **📄 書類生成**
   - アクション: **URLを開く**
   - URL: `https://lark-budget-export.your-subdomain.workers.dev`

### カスタムドメインの設定

1. Cloudflareダッシュボードで「Workers & Pages」→「lark-budget-export」
2. 「Settings」→「Triggers」→「Custom Domains」
3. 「Add Custom Domain」をクリック
4. ドメインを入力: `budget.example.com`

### 監視とアラート

1. Cloudflareダッシュボードで「Workers & Pages」→「lark-budget-export」
2. 「Logs」タブでログを確認
3. 「Metrics」タブでリクエスト数を確認

## 📞 サポート

技術的な質問やバグ報告は、プロジェクトの担当者までお問い合わせください。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月13日
