# Cloudflare Pages セットアップガイド(APIトークン不要)

Cloudflare PagesではAPIトークンは不要です。GitHubアカウントで直接連携できます。

## 🎯 重要なポイント

**APIトークンが必要なのは、GitHub Actionsを使用する場合のみです。**

Cloudflare Pagesを使用する場合は、**APIトークンは一切不要**です。

## 🚀 セットアップ手順(5分)

### ステップ1: Cloudflareダッシュボードを開く

1. ブラウザで **https://dash.cloudflare.com/** にアクセス
2. Cloudflareアカウントでログイン

**アカウントが無い場合**:
1. 「Sign Up」をクリック
2. メールアドレスとパスワードを入力
3. メール認証を完了

### ステップ2: Workers & Pagesを開く

1. 左側のメニューから **「Workers & Pages」** をクリック
2. **「Create application」** ボタンをクリック

### ステップ3: Pagesタブを選択

1. **「Pages」** タブをクリック
2. **「Connect to Git」** ボタンをクリック

### ステップ4: GitHubアカウントを連携

1. **「GitHub」** を選択
2. GitHubのログイン画面が表示される
3. GitHubアカウントでログイン
4. Cloudflareに権限を付与

**権限の内容**:
- リポジトリの読み取り
- Webhookの作成(自動デプロイ用)

### ステップ5: リポジトリを選択

1. **「OfficePlata/forecast-lark」** を選択
2. **「Begin setup」** をクリック

**リポジトリが表示されない場合**:
1. 「Configure GitHub App」をクリック
2. リポジトリへのアクセスを許可
3. Cloudflareダッシュボードに戻る

### ステップ6: ビルド設定

以下の設定を入力:

| 項目 | 値 |
|------|-----|
| **Project name** | `forecast-lark` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | (空欄) |
| **Build output directory** | `/` |

### ステップ7: 環境変数を設定

**「Environment variables (advanced)」** セクションを展開して、以下を追加:

#### 変数1: LARK_APP_ID

- Variable name: `LARK_APP_ID`
- Value: `cli_a99f079ae7f89e1c`

#### 変数2: LARK_APP_SECRET

- Variable name: `LARK_APP_SECRET`
- Value: `11H5ZzJaNPP3oBDxczeMvgVRe7CVnffz`

#### 変数3: LARK_APP_TOKEN

- Variable name: `LARK_APP_TOKEN`
- Value: `EXiXbTVHha8p7osOl4KjogMBp7e`

#### 変数4: LARK_TABLE_ID

- Variable name: `LARK_TABLE_ID`
- Value: `tbl0Gz18u2wMAjWl`

### ステップ8: デプロイ

1. **「Save and Deploy」** ボタンをクリック
2. デプロイが開始される(1〜2分)
3. 完了を待つ

## ✅ デプロイ完了後

### URLを確認

デプロイが完了すると、以下のようなURLが表示されます:

```
https://forecast-lark.pages.dev
```

または

```
https://forecast-lark-xxx.pages.dev
```

### アプリケーションにアクセス

1. 表示されたURLをクリック
2. アプリケーションが開く
3. 年度と期を選択
4. 「書類を生成」をクリック
5. Excelファイルがダウンロードされる

## 🔄 今後の運用

### コードを更新

```bash
git add .
git commit -m "Update: ..."
git push origin main
```

GitHubにプッシュすると、Cloudflareが自動的に検知してデプロイを開始します。

### デプロイ履歴を確認

1. Cloudflareダッシュボード
2. 「Workers & Pages」→ `forecast-lark`
3. 「Deployments」タブ

### ロールバック

1. 「Deployments」タブで過去のデプロイを選択
2. 「Rollback to this deployment」をクリック

## 🛠️ トラブルシューティング

### Q1: リポジトリが表示されない

**A1**: GitHubアプリの権限を確認

1. GitHub → Settings → Applications
2. Cloudflare Pagesを選択
3. リポジトリへのアクセスを許可

### Q2: デプロイが失敗する

**A2**: ビルド設定を確認

- Framework preset: `None`
- Build command: 空欄
- Build output directory: `/`

### Q3: 環境変数が反映されない

**A3**: 環境変数を再設定

1. 「Settings」→「Environment variables」
2. 変数を削除して再度追加
3. 「Redeploy」をクリック

### Q4: APIエラーが発生する

**A4**: Lark APIの認証情報を確認

- LARK_APP_ID
- LARK_APP_SECRET
- LARK_APP_TOKEN
- LARK_TABLE_ID

すべて正しく設定されているか確認

## 📊 デプロイ後の確認項目

### ✅ チェックリスト

- [ ] デプロイが成功した
- [ ] URLにアクセスできる
- [ ] アプリケーションが表示される
- [ ] 年度と期を選択できる
- [ ] 「書類を生成」ボタンをクリックできる
- [ ] Excelファイルがダウンロードされる
- [ ] Excelファイルを開ける
- [ ] データが正しく表示される

## 🎉 完了!

これで、Cloudflare Pagesでのデプロイが完了しました。

**APIトークンは一切不要**で、GitHubアカウントだけで自動デプロイが実現できました。

---

## 📝 補足: APIトークンが必要な場合

以下の場合のみ、APIトークンが必要です:

### 1. GitHub Actionsを使用する場合

GitHub Actionsから直接Cloudflare Workersにデプロイする場合に必要です。

**ただし、Cloudflare Pagesを使用する場合は不要です。**

### 2. Wrangler CLIでデプロイする場合

ローカル環境からWrangler CLIを使用してデプロイする場合に必要です。

```bash
wrangler login
wrangler deploy
```

**ただし、Cloudflare Pagesを使用する場合は不要です。**

### 3. CI/CDパイプラインを自作する場合

独自のCI/CDパイプラインを構築する場合に必要です。

**ただし、Cloudflare Pagesを使用する場合は不要です。**

---

## 💡 まとめ

**Cloudflare Pagesを使用する場合、APIトークンは一切不要です。**

GitHubアカウントで直接連携できるため、セットアップが非常に簡単です。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月20日
