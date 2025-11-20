# 手動デプロイガイド

ビルドトークンエラーが発生した場合の手動デプロイ方法を説明します。

## 🚨 エラーの原因

```
Failed: The build token selected for this build has been deleted or rolled 
and cannot be used for this build.
```

このエラーは、GitHub ActionsからCloudflare Workersへの自動デプロイ時に使用するAPIトークンが無効になっている場合に発生します。

## 🛠️ 解決方法

### 方法1: Cloudflareダッシュボードから直接デプロイ(最も簡単)

#### ステップ1: GitHubリポジトリとCloudflareを連携

1. https://dash.cloudflare.com/ にログイン
2. 左メニューから「Workers & Pages」をクリック
3. 「Create application」をクリック
4. 「Pages」タブを選択
5. 「Connect to Git」をクリック
6. GitHubアカウントを連携
7. リポジトリ `OfficePlata/forecast-lark` を選択
8. 「Begin setup」をクリック

#### ステップ2: ビルド設定

- **Framework preset**: None
- **Build command**: 空欄のまま
- **Build output directory**: `/`
- **Root directory**: `/`

#### ステップ3: 環境変数を設定

「Environment variables」セクションで以下を追加:

```
LARK_APP_ID = cli_a99f079ae7f89e1c
LARK_APP_SECRET = 11H5ZzJaNPP3oBDxczeMvgVRe7CVnffz
LARK_APP_TOKEN = EXiXbTVHha8p7osOl4KjogMBp7e
LARK_TABLE_ID = tbl0Gz18u2wMAjWl
```

#### ステップ4: デプロイ

「Save and Deploy」をクリックすると、自動的にデプロイが開始されます。

以降、GitHubにプッシュするたびに自動的にデプロイされます。

---

### 方法2: Wrangler CLIで手動デプロイ

ローカル環境からコマンドラインでデプロイする方法です。

#### ステップ1: Node.jsとWranglerをインストール

```bash
# Node.jsがインストールされているか確認
node --version

# Wranglerをグローバルにインストール
npm install -g wrangler
```

#### ステップ2: Cloudflareにログイン

```bash
wrangler login
```

ブラウザが開くので、Cloudflareアカウントでログインします。

#### ステップ3: リポジトリをクローン

```bash
git clone https://github.com/OfficePlata/forecast-lark.git
cd forecast-lark
```

#### ステップ4: 依存関係をインストール

```bash
npm install
```

#### ステップ5: 環境変数を設定

`wrangler.toml`を編集して、環境変数を追加します:

```toml
[vars]
LARK_APP_ID = "cli_a99f079ae7f89e1c"
LARK_APP_SECRET = "11H5ZzJaNPP3oBDxczeMvgVRe7CVnffz"
LARK_APP_TOKEN = "EXiXbTVHha8p7osOl4KjogMBp7e"
LARK_TABLE_ID = "tbl0Gz18u2wMAjWl"
```

#### ステップ6: デプロイ

```bash
wrangler deploy
```

デプロイが完了すると、URLが表示されます:

```
Published lark-budget-export (1.23 sec)
  https://lark-budget-export.your-subdomain.workers.dev
```

---

### 方法3: GitHub Actionsのトークンを更新

既存のGitHub Actionsワークフローを使い続ける場合は、APIトークンを更新します。

#### ステップ1: 新しいCloudflare APIトークンを作成

1. https://dash.cloudflare.com/ にログイン
2. 右上のアイコン→「My Profile」→「API Tokens」
3. 「Create Token」をクリック
4. 「Edit Cloudflare Workers」テンプレートを選択
5. 「Continue to summary」→「Create Token」
6. トークンをコピー(一度しか表示されません!)

#### ステップ2: GitHub Secretsを更新

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Settings」→「Secrets and variables」→「Actions」
3. 「CLOUDFLARE_API_TOKEN」を選択
4. 「Update secret」をクリック
5. 新しいトークンを貼り付け
6. 「Update secret」をクリック

#### ステップ3: 再デプロイ

1. GitHubリポジトリの「Actions」タブをクリック
2. 最新のワークフローを選択
3. 「Re-run all jobs」をクリック

---

## 🎯 推奨方法

**方法1: Cloudflareダッシュボードから直接デプロイ**が最も簡単で推奨です。

理由:
- ✅ ローカル環境不要
- ✅ ブラウザだけで完結
- ✅ 自動デプロイが設定される
- ✅ トークン管理が不要

## 🔧 R2バケットとD1データベースのバインド

デプロイ後、R2バケットとD1データベースをバインドする必要があります。

### R2バケットのバインド

1. Cloudflareダッシュボードで「Workers & Pages」→`lark-budget-export`
2. 「Settings」→「Bindings」
3. 「Add binding」をクリック
4. Type: R2 Bucket
5. Variable name: `BUDGET_FILES`
6. R2 Bucket: `lark-budget-files`(事前に作成が必要)
7. 「Save」をクリック

### D1データベースのバインド

1. Cloudflareダッシュボードで「Workers & Pages」→`lark-budget-export`
2. 「Settings」→「Bindings」
3. 「Add binding」をクリック
4. Type: D1 Database
5. Variable name: `DB`
6. D1 Database: `lark-budget-db`(事前に作成が必要)
7. 「Save」をクリック

### R2バケットの作成

```bash
# Wrangler CLIで作成
wrangler r2 bucket create lark-budget-files
```

または、Cloudflareダッシュボードで:
1. 「R2」→「Create bucket」
2. Bucket name: `lark-budget-files`
3. 「Create bucket」をクリック

### D1データベースの作成

```bash
# Wrangler CLIで作成
wrangler d1 create lark-budget-db

# スキーマを適用
wrangler d1 execute lark-budget-db --file=schema.sql
```

または、Cloudflareダッシュボードで:
1. 「D1」→「Create database」
2. Database name: `lark-budget-db`
3. 「Create」をクリック
4. 「Console」タブでSQLを実行

## 🧪 デプロイ後の動作確認

デプロイが完了したら、以下のURLにアクセスして動作確認してください:

```
https://lark-budget-export.your-subdomain.workers.dev
```

1. 年度と期を選択
2. 「書類を生成」をクリック
3. Excelファイルがダウンロードされる
4. Excelで開いて内容を確認

## 📞 トラブルシューティング

### エラー: "Worker not found"

**原因**: デプロイが完了していない

**解決方法**: デプロイが完了するまで待つ(通常1〜2分)

### エラー: "BUDGET_FILES is not defined"

**原因**: R2バケットがバインドされていない

**解決方法**: 上記の「R2バケットのバインド」を実行

### エラー: "Unauthorized"

**原因**: Lark APIの認証情報が間違っている

**解決方法**: 環境変数を確認して修正

---

**作成者**: Manus AI  
**最終更新**: 2025年11月20日
