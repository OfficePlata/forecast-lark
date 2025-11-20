# Cloudflare Pages クイックスタート

5分で自動デプロイを完了させる簡易ガイドです。

## 🚀 今すぐ始める

### ステップ1: Cloudflareダッシュボードを開く(30秒)

1. **https://dash.cloudflare.com/** にアクセス
2. Cloudflareアカウントでログイン

### ステップ2: Pagesプロジェクトを作成(1分)

1. 左メニューから **「Workers & Pages」** をクリック
2. **「Create application」** をクリック
3. **「Pages」** タブを選択
4. **「Connect to Git」** をクリック

### ステップ3: GitHubを連携(1分)

1. **「Connect GitHub」** をクリック
2. GitHubのログイン画面が表示されたらログイン
3. **「Authorize Cloudflare Pages」** をクリック
4. **「Select a repository」** で `OfficePlata/forecast-lark` を選択
5. **「Begin setup」** をクリック

### ステップ4: ビルド設定(1分)

以下の設定を入力:

| 項目 | 値 |
|------|-----|
| **Project name** | `forecast-lark` (そのまま) |
| **Production branch** | `main` (そのまま) |
| **Framework preset** | `None` を選択 |
| **Build command** | 空欄のまま |
| **Build output directory** | `/` |

### ステップ5: 環境変数を設定(2分)

**「Environment variables (advanced)」** を展開して、以下を追加:

```
LARK_APP_ID = cli_a99f079ae7f89e1c
LARK_APP_SECRET = 11H5ZzJaNPP3oBDxczeMvgVRe7CVnffz
LARK_APP_TOKEN = EXiXbTVHha8p7osOl4KjogMBp7e
LARK_TABLE_ID = tbl0Gz18u2wMAjWl
```

各環境変数を追加する手順:

1. **「Add variable」** をクリック
2. **Variable name** に `LARK_APP_ID` と入力
3. **Value** に `cli_a99f079ae7f89e1c` と入力
4. 他の3つの環境変数も同様に追加

### ステップ6: デプロイ開始(30秒)

1. **「Save and Deploy」** をクリック
2. デプロイが開始されます(1〜2分で完了)

## ✅ デプロイ完了!

デプロイが完了すると、「Success!」と表示されます。

### アプリケーションにアクセス

1. **「Continue to project」** をクリック
2. **「Visit site」** をクリック
3. アプリケーションが開きます

デプロイされたURL:
```
https://forecast-lark.pages.dev
```

## 🧪 動作確認

1. 年度: `2025`
2. 期: `下期`
3. **「書類を生成」** をクリック
4. Excelファイルがダウンロードされる
5. Excelで開いて内容を確認

## 🎉 完了!

これで、GitHubにコードをプッシュするだけで、自動的にCloudflare Pagesにデプロイされるようになりました!

## 🔄 今後の運用

### コードを更新

```bash
# コードを編集
vim src/index.js

# コミットしてプッシュ
git add .
git commit -m "Update: ..."
git push origin main
```

GitHubにプッシュすると、Cloudflareが自動的に検知してデプロイを開始します。

### デプロイを確認

1. https://dash.cloudflare.com/ にアクセス
2. **「Workers & Pages」** → `forecast-lark`
3. **「Deployments」** タブでデプロイ履歴を確認

## 🐛 トラブルシューティング

### エラー: "Build failed"

**解決方法**:

1. **「Settings」** → **「Builds & deployments」**
2. **Build command**: 空欄
3. **Build output directory**: `/`
4. **「Save」** をクリック
5. **「Deployments」** → **「Retry deployment」**

### エラー: "Function invocation failed"

**解決方法**:

1. **「Settings」** → **「Environment variables」**
2. 4つの環境変数が設定されていることを確認:
   - LARK_APP_ID
   - LARK_APP_SECRET
   - LARK_APP_TOKEN
   - LARK_TABLE_ID
3. 不足している場合は追加
4. **「Deployments」** → **「Retry deployment」**

### エラー: "HTTP error! status: 500"

**原因**: Lark APIの認証情報が間違っている

**解決方法**:

1. **「Settings」** → **「Environment variables」**
2. 各環境変数の値を確認
3. 間違っている場合は修正
4. **「Deployments」** → **「Retry deployment」**

## 📚 詳細ガイド

より詳しい情報は、以下のドキュメントをご参照ください:

- **CLOUDFLARE_PAGES_DEPLOY.md**: 詳細なデプロイガイド
- **README.md**: プロジェクト概要
- **DEPLOYMENT_GUIDE.md**: 代替デプロイ方法

## 💡 ヒント

### カスタムドメインを追加

1. **「Settings」** → **「Custom domains」**
2. **「Set up a custom domain」** をクリック
3. ドメイン名を入力
4. DNSレコードを設定

### R2バケットを追加

Excelファイルを保存したい場合:

1. **「R2」** → **「Create bucket」**
2. Bucket name: `lark-budget-files`
3. **「Workers & Pages」** → `forecast-lark` → **「Settings」** → **「Functions」**
4. **「R2 bucket bindings」** → **「Add binding」**
5. Variable name: `BUDGET_FILES`
6. R2 bucket: `lark-budget-files`

---

**作成者**: Manus AI  
**最終更新**: 2025年11月20日
