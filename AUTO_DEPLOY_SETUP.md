# 自動デプロイセットアップ完全ガイド

GitHub Actionsを使用した自動デプロイを設定します。

## 🎯 概要

GitHubにコードをプッシュするだけで、自動的にCloudflare Workersにデプロイされるようになります。

## 📋 前提条件

- ✅ GitHubアカウント
- ✅ Cloudflareアカウント
- ✅ リポジトリ `OfficePlata/forecast-lark` へのアクセス権

## 🚀 セットアップ手順(10分で完了)

### ステップ1: GitHub Actionsワークフローファイルを作成(3分)

GitHubのWebインターフェースから直接作成します。

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Add file」→「Create new file」をクリック
3. ファイル名に以下を入力:
   ```
   .github/workflows/deploy.yml
   ```
4. 以下の内容を貼り付け:

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
    name: Deploy to Cloudflare Workers
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install --production

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

5. 「Commit changes」をクリック
6. 「Commit directly to the main branch」を選択
7. 「Commit changes」をクリック

### ステップ2: Cloudflare APIトークンを取得(3分)

1. https://dash.cloudflare.com/ にログイン
2. 右上のアイコン→「My Profile」→「API Tokens」
3. 「Create Token」をクリック
4. 「Edit Cloudflare Workers」テンプレートを選択
5. 「Continue to summary」→「Create Token」をクリック
6. **トークンをコピー**(一度しか表示されません!)

### ステップ3: CloudflareアカウントIDを取得(1分)

1. https://dash.cloudflare.com/ にログイン
2. 左メニューから「Workers & Pages」をクリック
3. 右側に表示される「Account ID」をコピー

### ステップ4: GitHub Secretsを設定(3分)

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Settings」→「Secrets and variables」→「Actions」
3. 「New repository secret」をクリック

#### CLOUDFLARE_API_TOKENを追加

- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: ステップ2でコピーしたAPIトークン
- 「Add secret」をクリック

#### CLOUDFLARE_ACCOUNT_IDを追加

- 「New repository secret」をクリック
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: ステップ3でコピーしたアカウントID
- 「Add secret」をクリック

## ✅ セットアップ完了の確認

### Secretsの確認

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Settings」→「Secrets and variables」→「Actions」
3. 以下の2つのSecretsが表示されていることを確認:
   - ✓ CLOUDFLARE_API_TOKEN
   - ✓ CLOUDFLARE_ACCOUNT_ID

### ワークフローの確認

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Actions」タブをクリック
3. 「Deploy to Cloudflare Workers」が表示されることを確認

## 🧪 自動デプロイのテスト

### 方法1: 手動トリガー(推奨)

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Actions」タブをクリック
3. 左メニューから「Deploy to Cloudflare Workers」をクリック
4. 「Run workflow」→「Run workflow」をクリック
5. ワークフローが実行されることを確認

### 方法2: コードをプッシュ

```bash
# 何か変更を加える(例: READMEを編集)
echo "# Test auto deploy" >> README.md

# コミットしてプッシュ
git add README.md
git commit -m "Test: Trigger auto deploy"
git push origin main
```

GitHubの「Actions」タブで、自動的にワークフローが実行されることを確認します。

## 📊 デプロイ状況の確認

### GitHub Actionsで確認

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Actions」タブをクリック
3. 最新のワークフロー実行をクリック
4. 各ステップの実行状況を確認

### 成功時

✅ すべてのステップが緑色のチェックマークで表示されます。

```
✓ Checkout code
✓ Setup Node.js
✓ Install dependencies
✓ Deploy to Cloudflare Workers
```

### 失敗時

❌ 赤色のXマークが表示されます。

エラーメッセージをクリックして詳細を確認してください。

### Cloudflareで確認

1. https://dash.cloudflare.com/ にログイン
2. 「Workers & Pages」をクリック
3. `forecast-lark`が表示されることを確認
4. クリックして詳細を確認
5. 「Visit」をクリックしてアプリケーションにアクセス

## 🔧 R2バケットとD1データベースの設定

デプロイが成功したら、R2バケットとD1データベースを設定します。

### R2バケットの作成

1. https://dash.cloudflare.com/ にログイン
2. 「R2」→「Create bucket」
3. Bucket name: `lark-budget-files`
4. 「Create bucket」をクリック

### R2バケットのバインド

1. 「Workers & Pages」→`forecast-lark`
2. 「Settings」→「Bindings」→「Add binding」
3. Type: **R2 Bucket**
4. Variable name: **`BUDGET_FILES`**
5. R2 Bucket: **`lark-budget-files`**
6. 「Save」をクリック

### D1データベースの作成(オプション)

ログ記録が必要な場合のみ:

1. https://dash.cloudflare.com/ にログイン
2. 「D1」→「Create database」
3. Database name: `lark-budget-db`
4. 「Create」をクリック
5. Database IDをコピー
6. `wrangler.toml`の`database_id`を更新

### D1データベースのバインド(オプション)

1. 「Workers & Pages」→`forecast-lark`
2. 「Settings」→「Bindings」→「Add binding」
3. Type: **D1 Database**
4. Variable name: **`DB`**
5. D1 Database: **`lark-budget-db`**
6. 「Save」をクリック

## 🎉 完了!

これで、GitHubにコードをプッシュするだけで、自動的にCloudflare Workersにデプロイされるようになりました!

### 動作確認

デプロイされたアプリケーションにアクセスして動作確認してください:

```
https://forecast-lark.your-subdomain.workers.dev
```

1. 年度と期を選択(例: 2025、下期)
2. 「書類を生成」をクリック
3. Excelファイルがダウンロードされる
4. Excelで開いて内容を確認

## 🔄 今後の運用

### コードの更新

```bash
# コードを編集
vim src/index.js

# コミットしてプッシュ
git add .
git commit -m "Update: ..."
git push origin main
```

GitHubにプッシュすると、自動的にデプロイされます。

### デプロイの確認

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Actions」タブをクリック
3. 最新のワークフロー実行を確認

### ロールバック

問題が発生した場合は、以前のコミットに戻します:

```bash
# 以前のコミットを確認
git log --oneline

# 特定のコミットに戻す
git revert <commit-hash>
git push origin main
```

## 🐛 トラブルシューティング

### エラー: "Authentication error"

**原因**: APIトークンが間違っている、または期限切れ

**解決方法**:
1. 新しいAPIトークンを作成
2. GitHub Secretsの`CLOUDFLARE_API_TOKEN`を更新

### エラー: "Account ID is required"

**原因**: CLOUDFLARE_ACCOUNT_IDが設定されていない

**解決方法**:
1. CloudflareアカウントIDを取得
2. GitHub Secretsに`CLOUDFLARE_ACCOUNT_ID`を追加

### エラー: "Bucket not found"

**原因**: R2バケットが作成されていない、またはバインドされていない

**解決方法**:
1. R2バケット`lark-budget-files`を作成
2. Workerにバインド

### エラー: "npm install failed"

**原因**: package.jsonまたはpackage-lock.jsonに問題がある

**解決方法**:
1. ローカルで`npm install`を実行
2. エラーを修正
3. コミットしてプッシュ

### ワークフローが実行されない

**原因**: ワークフローファイルが正しく作成されていない

**解決方法**:
1. `.github/workflows/deploy.yml`が存在することを確認
2. YAMLの構文が正しいことを確認
3. mainブランチにコミットされていることを確認

## 📚 参考資料

- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)

---

**作成者**: Manus AI  
**最終更新**: 2025年11月20日
