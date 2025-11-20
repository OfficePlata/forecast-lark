# GitHub Secrets セットアップガイド

GitHub Actionsの自動デプロイに必要なSecretsを設定します。

## 🔐 必要なSecrets

以下の2つのSecretsを設定する必要があります:

1. **CLOUDFLARE_API_TOKEN** - Cloudflare APIトークン
2. **CLOUDFLARE_ACCOUNT_ID** - CloudflareアカウントID

## 📋 セットアップ手順

### ステップ1: Cloudflare APIトークンを取得

1. https://dash.cloudflare.com/ にログイン
2. 右上のアイコンをクリック→「My Profile」
3. 左メニューから「API Tokens」をクリック
4. 「Create Token」をクリック
5. 「Edit Cloudflare Workers」テンプレートを選択
6. 「Continue to summary」をクリック
7. 「Create Token」をクリック
8. **トークンをコピー**(一度しか表示されません!)

### ステップ2: CloudflareアカウントIDを取得

1. https://dash.cloudflare.com/ にログイン
2. 左メニューから「Workers & Pages」をクリック
3. 右側に表示される「Account ID」をコピー

または、URLから取得:
```
https://dash.cloudflare.com/[ここがアカウントID]/workers-and-pages
```

### ステップ3: GitHub Secretsを設定

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Settings」タブをクリック
3. 左メニューから「Secrets and variables」→「Actions」をクリック
4. 「New repository secret」をクリック

#### CLOUDFLARE_API_TOKENを追加

- **Name**: `CLOUDFLARE_API_TOKEN`
- **Secret**: ステップ1でコピーしたAPIトークンを貼り付け
- 「Add secret」をクリック

#### CLOUDFLARE_ACCOUNT_IDを追加

- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Secret**: ステップ2でコピーしたアカウントIDを貼り付け
- 「Add secret」をクリック

## ✅ 設定完了の確認

Secretsが正しく設定されているか確認します:

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Settings」→「Secrets and variables」→「Actions」
3. 以下の2つのSecretsが表示されていることを確認:
   - ✓ CLOUDFLARE_API_TOKEN
   - ✓ CLOUDFLARE_ACCOUNT_ID

## 🚀 自動デプロイのテスト

Secretsの設定が完了したら、自動デプロイをテストします:

### 方法1: コードをプッシュ

```bash
# 何か変更を加える(例: READMEを編集)
echo "# Test" >> README.md

# コミットしてプッシュ
git add README.md
git commit -m "Test auto deploy"
git push origin main
```

### 方法2: 手動トリガー

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Actions」タブをクリック
3. 左メニューから「Deploy to Cloudflare Workers」をクリック
4. 「Run workflow」→「Run workflow」をクリック

## 📊 デプロイ状況の確認

1. https://github.com/OfficePlata/forecast-lark にアクセス
2. 「Actions」タブをクリック
3. 最新のワークフロー実行をクリック
4. 各ステップの実行状況を確認

### 成功時

✅ すべてのステップが緑色のチェックマークで表示されます。

デプロイされたURLは、Cloudflareダッシュボードで確認できます:
```
https://forecast-lark.your-subdomain.workers.dev
```

### 失敗時

❌ 赤色のXマークが表示されます。

エラーメッセージを確認して、以下をチェックしてください:

1. **Secretsが正しく設定されているか**
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ACCOUNT_ID

2. **APIトークンの権限が正しいか**
   - 「Edit Cloudflare Workers」権限が必要

3. **wrangler.tomlが正しいか**
   - プロジェクト名、バインディングなど

## 🔧 トラブルシューティング

### エラー: "Authentication error"

**原因**: APIトークンが間違っている、または期限切れ

**解決方法**:
1. 新しいAPIトークンを作成
2. GitHub Secretsを更新

### エラー: "Account ID is required"

**原因**: CLOUDFLARE_ACCOUNT_IDが設定されていない

**解決方法**:
1. CloudflareアカウントIDを取得
2. GitHub Secretsに追加

### エラー: "Bucket not found"

**原因**: R2バケットが作成されていない

**解決方法**:
1. Cloudflareダッシュボードで「R2」→「Create bucket」
2. Bucket name: `lark-budget-files`
3. wrangler.tomlのbucket_nameと一致させる

### エラー: "Database not found"

**原因**: D1データベースが作成されていない

**解決方法**:
1. Cloudflareダッシュボードで「D1」→「Create database」
2. Database name: `lark-budget-db`
3. wrangler.tomlのdatabase_idを更新

## 📝 注意事項

### APIトークンのセキュリティ

- ❌ APIトークンをコードに直接書かない
- ❌ APIトークンを公開リポジトリにコミットしない
- ✅ GitHub Secretsを使用する
- ✅ 定期的にトークンをローテーションする

### APIトークンの権限

最小限の権限を付与してください:

- ✅ 「Edit Cloudflare Workers」権限のみ
- ❌ 「Global API Key」は使用しない

### トークンの有効期限

APIトークンには有効期限を設定することを推奨します:

- 推奨: 90日または1年
- 期限切れ前に新しいトークンを作成して更新

## 🎉 完了

これで、GitHubにコードをプッシュするだけで、自動的にCloudflare Workersにデプロイされるようになりました!

---

**作成者**: Manus AI  
**最終更新**: 2025年11月20日
