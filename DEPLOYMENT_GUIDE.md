# Lark Budget Export - デプロイガイド

本ドキュメントでは、Cloudflare Workersを使用した本部提出書類自動生成システムのデプロイ手順を説明します。

## 📋 前提条件

### 必要なアカウント

1. **Cloudflareアカウント**
   - 無料プランで利用可能
   - https://dash.cloudflare.com/sign-up

2. **Larkアカウント**
   - Lark Baseが使用可能
   - Lark Open Platformへのアクセス権限

### 必要なツール

1. **Node.js** (v18以上)
   - https://nodejs.org/

2. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

3. **Git** (オプション)
   - バージョン管理用

## 🚀 デプロイ手順

### ステップ1: Lark Open Platformでアプリを作成

#### 1-1. Lark Open Platformにアクセス

https://open.larksuite.com/ にアクセスし、ログインします。

#### 1-2. 新しいアプリを作成

1. 「アプリを作成」をクリック
2. アプリ名: 「予実管理エクスポート」
3. アプリの説明: 「予実管理データから本部提出書類を自動生成」
4. 「作成」をクリック

#### 1-3. 権限を設定

1. 左メニューの「権限管理」をクリック
2. 以下の権限を追加:
   - `bitable:app` - Baseアプリへのアクセス
   - `bitable:record` - レコードの読み取り

3. 「保存」をクリック

#### 1-4. 認証情報を取得

1. 左メニューの「認証情報」をクリック
2. 以下の情報をメモ:
   - **App ID**: `cli_xxxxxxxxxxxxx`
   - **App Secret**: `xxxxxxxxxxxxxxxxxxxxx`

#### 1-5. Baseのアプリトークンを取得

1. Lark Baseを開く
2. 右上の「...」メニュー→「設定」
3. 「高度な設定」→「APIアクセス」
4. 「アプリトークン」をコピー: `bascnxxxxxxxxxxxxx`

#### 1-6. テーブルIDを取得

1. Lark Baseで「予実管理」テーブルを開く
2. URLから`table_id`を確認: `tblxxxxxxxxxxxxx`

例: `https://example.larksuite.com/base/bascnxxxxxxxxxxxxx?table=tblxxxxxxxxxxxxx`

### ステップ2: Cloudflareの設定

#### 2-1. Cloudflareにログイン

```bash
wrangler login
```

ブラウザが開き、Cloudflareへのログインを求められます。

#### 2-2. R2バケットを作成

```bash
wrangler r2 bucket create lark-budget-files
```

成功すると、以下のメッセージが表示されます:

```
✅ Created bucket lark-budget-files
```

#### 2-3. D1データベースを作成(オプション)

```bash
wrangler d1 create lark-budget-db
```

出力されたデータベースIDをメモします:

```
✅ Successfully created DB 'lark-budget-db'

[[d1_databases]]
binding = "DB"
database_name = "lark-budget-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 2-4. データベーススキーマを適用

```bash
wrangler d1 execute lark-budget-db --file=schema.sql
```

### ステップ3: プロジェクトの設定

#### 3-1. プロジェクトをクローン

```bash
cd /path/to/your/workspace
# Gitリポジトリからクローン、または提供されたファイルを展開
```

#### 3-2. 依存関係をインストール

```bash
cd lark-budget-export
npm install
```

#### 3-3. wrangler.tomlを編集

`wrangler.toml`を開き、以下を設定します:

```toml
name = "lark-budget-export"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
LARK_APP_ID = "cli_xxxxxxxxxxxxx"           # ステップ1-4で取得
LARK_APP_SECRET = "xxxxxxxxxxxxxxxxxxxxx"   # ステップ1-4で取得
LARK_APP_TOKEN = "bascnxxxxxxxxxxxxx"       # ステップ1-5で取得
LARK_TABLE_ID = "tblxxxxxxxxxxxxx"          # ステップ1-6で取得

[[r2_buckets]]
binding = "BUDGET_FILES"
bucket_name = "lark-budget-files"

[[d1_databases]]
binding = "DB"
database_name = "lark-budget-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ステップ2-3で取得
```

### ステップ4: ローカルでテスト

#### 4-1. 開発サーバーを起動

```bash
npm run dev
```

または

```bash
wrangler dev
```

#### 4-2. ブラウザで確認

http://localhost:8787 にアクセスし、以下を確認:

1. ページが正しく表示される
2. 年度と期を選択して「書類を生成」をクリック
3. Excelファイルがダウンロードされる

### ステップ5: 本番環境へデプロイ

#### 5-1. デプロイを実行

```bash
npm run deploy
```

または

```bash
wrangler deploy
```

#### 5-2. デプロイ完了

成功すると、以下のメッセージが表示されます:

```
✅ Successfully deployed to https://lark-budget-export.your-subdomain.workers.dev
```

#### 5-3. 本番環境で確認

表示されたURLにアクセスし、動作を確認します。

### ステップ6: Lark Baseとの連携

#### 6-1. Lark Baseにボタンを追加

1. 「予実管理」テーブルを開く
2. 新しいフィールドを追加
3. フィールドタイプ: **ボタン**
4. フィールド名: **本部提出書類を生成**
5. ボタンラベル: **📄 書類生成**
6. アクション: **URLを開く**
7. URL: `https://lark-budget-export.your-subdomain.workers.dev`

#### 6-2. 動作確認

1. ボタンをクリック
2. 新しいタブでエクスポートページが開く
3. 年度と期を選択して「書類を生成」をクリック
4. Excelファイルがダウンロードされる

## 🔧 高度な設定

### カスタムドメインの設定

#### 1. Cloudflareダッシュボードで設定

1. https://dash.cloudflare.com/ にアクセス
2. 「Workers & Pages」→「lark-budget-export」を選択
3. 「Settings」→「Triggers」→「Custom Domains」
4. 「Add Custom Domain」をクリック
5. ドメインを入力: `budget.example.com`
6. 「Add Domain」をクリック

#### 2. Lark Baseのボタンを更新

ボタンのURLをカスタムドメインに変更:
```
https://budget.example.com
```

### 環境変数の暗号化

機密情報(App Secret)を暗号化して保存:

```bash
wrangler secret put LARK_APP_SECRET
```

プロンプトが表示されたら、App Secretを入力します。

`wrangler.toml`から`LARK_APP_SECRET`を削除:

```toml
[vars]
LARK_APP_ID = "cli_xxxxxxxxxxxxx"
# LARK_APP_SECRET は削除(secretで管理)
LARK_APP_TOKEN = "bascnxxxxxxxxxxxxx"
LARK_TABLE_ID = "tblxxxxxxxxxxxxx"
```

### ログの確認

#### リアルタイムログ

```bash
wrangler tail
```

#### 過去のログ

Cloudflareダッシュボードで確認:
1. 「Workers & Pages」→「lark-budget-export」
2. 「Logs」タブ

### パフォーマンスの最適化

#### キャッシュの有効化

`src/lark-client.js`で、アクセストークンをキャッシュ:

```javascript
// 既に実装済み
this.accessToken = data.tenant_access_token;
this.tokenExpiry = Date.now() + 3600 * 1000;
```

#### ページネーションの最適化

大量データの場合、ページサイズを調整:

```javascript
url.searchParams.set('page_size', '500'); // 最大500
```

## 🐛 トラブルシューティング

### エラー: "Failed to get access token"

**原因**: Lark APIの認証情報が間違っている

**解決方法**:
1. `wrangler.toml`の`LARK_APP_ID`と`LARK_APP_SECRET`を確認
2. Lark Open Platformで認証情報を再確認

### エラー: "Failed to fetch records"

**原因**: Lark BaseのアプリトークンまたはテーブルIDが間違っている

**解決方法**:
1. `wrangler.toml`の`LARK_APP_TOKEN`と`LARK_TABLE_ID`を確認
2. Lark Baseで正しいトークンとIDを取得

### エラー: "R2 bucket not found"

**原因**: R2バケットが作成されていない、または名前が間違っている

**解決方法**:
1. `wrangler r2 bucket list`でバケット一覧を確認
2. `wrangler r2 bucket create lark-budget-files`でバケットを作成

### エラー: "Database not found"

**原因**: D1データベースが作成されていない、またはIDが間違っている

**解決方法**:
1. `wrangler d1 list`でデータベース一覧を確認
2. `wrangler d1 create lark-budget-db`でデータベースを作成
3. `wrangler.toml`の`database_id`を正しいIDに更新

### Excelファイルが正しく生成されない

**原因**: データの形式が想定と異なる

**解決方法**:
1. Lark Baseの「予実管理」テーブルのフィールド名を確認
2. `src/lark-client.js`の`processRecords`メソッドでフィールド名を調整

### ダウンロードが遅い

**原因**: 大量データの処理に時間がかかる

**解決方法**:
1. フィルター条件を追加して、必要なデータのみを取得
2. Cloudflare Workersの実行時間制限(CPU時間: 10ms/リクエスト)に注意

## 📊 運用

### 定期的なメンテナンス

#### 1. ログの確認

月に1回、エラーログを確認:

```bash
wrangler tail --format=pretty
```

#### 2. R2バケットの容量確認

Cloudflareダッシュボードで確認:
1. 「R2」→「lark-budget-files」
2. 「Metrics」タブで容量を確認

#### 3. 古いファイルの削除

6ヶ月以上前のファイルを削除:

```bash
# R2バケットのファイル一覧を取得
wrangler r2 object list lark-budget-files --prefix=exports/

# 古いファイルを削除
wrangler r2 object delete lark-budget-files exports/2024/上期/神戸予算_2024上期_1234567890.xlsx
```

### バックアップ

#### コードのバックアップ

Gitリポジトリにコミット:

```bash
git add .
git commit -m "Update: 〇〇機能を追加"
git push origin main
```

#### データのバックアップ

D1データベースのバックアップ:

```bash
wrangler d1 export lark-budget-db --output=backup.sql
```

## 💰 コスト

### Cloudflare Workers

- **無料プラン**: 100,000リクエスト/日
- **有料プラン**: $5/月 + $0.50/100万リクエスト

### Cloudflare R2

- **無料枠**: 10GB保存、100万回読み取り/月
- **超過料金**: $0.015/GB/月、$0.36/100万回読み取り

### Cloudflare D1

- **無料枠**: 5GB保存、500万回読み取り/月
- **超過料金**: $0.75/GB/月、$0.001/1000回読み取り

### 想定コスト

月間100回のエクスポートを想定:

| 項目 | 無料枠 | 使用量 | コスト |
|------|--------|--------|--------|
| Workers | 100,000リクエスト/日 | 100リクエスト/月 | **無料** |
| R2保存 | 10GB | 0.1GB | **無料** |
| R2読み取り | 100万回/月 | 100回/月 | **無料** |
| D1保存 | 5GB | 0.001GB | **無料** |
| D1読み取り | 500万回/月 | 100回/月 | **無料** |
| **合計** | - | - | **無料** |

通常の使用では、**完全に無料**で運用できます。

## 📞 サポート

### Cloudflareサポート

- ドキュメント: https://developers.cloudflare.com/workers/
- コミュニティ: https://community.cloudflare.com/

### Larkサポート

- ドキュメント: https://open.larksuite.com/document/
- サポート: https://www.larksuite.com/support

### プロジェクトサポート

技術的な質問やバグ報告は、プロジェクトの担当者までお問い合わせください。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月13日  
**バージョン**: 1.0
