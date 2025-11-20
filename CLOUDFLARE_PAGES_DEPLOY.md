# Cloudflare Pages 自動デプロイガイド

GitHub Actionsの代わりに、Cloudflare PagesでGitHubリポジトリを直接監視して自動デプロイします。

## 🎯 メリット

### GitHub Actionsと比較して

| 項目 | Cloudflare Pages | GitHub Actions |
|------|-----------------|----------------|
| 設定の簡単さ | ⭐⭐⭐ 非常に簡単 | ⭐⭐ 中程度 |
| トラブルシューティング | ⭐⭐⭐ 簡単 | ⭐ 難しい |
| APIトークン管理 | ⭐⭐⭐ 不要 | ⭐ 必要 |
| デプロイ速度 | ⭐⭐⭐ 高速 | ⭐⭐ 中程度 |
| ログの確認 | ⭐⭐⭐ 分かりやすい | ⭐⭐ 分かりにくい |

## 🚀 セットアップ手順(5分で完了)

### ステップ1: Cloudflare Pagesプロジェクトを作成(3分)

1. **https://dash.cloudflare.com/ にログイン**

2. **左メニューから「Workers & Pages」をクリック**

3. **「Create application」をクリック**

4. **「Pages」タブを選択**

5. **「Connect to Git」をクリック**

6. **GitHubアカウントを連携**
   - 「Connect GitHub」をクリック
   - GitHubのログイン画面が表示されたらログイン
   - 「Authorize Cloudflare Pages」をクリック

7. **リポジトリを選択**
   - 「Select a repository」で`OfficePlata/forecast-lark`を選択
   - 「Begin setup」をクリック

8. **ビルド設定**
   - **Project name**: `forecast-lark`(そのまま)
   - **Production branch**: `main`(そのまま)
   - **Framework preset**: `None`を選択
   - **Build command**: 空欄のまま
   - **Build output directory**: `/`

9. **環境変数を設定**
   - 「Environment variables (advanced)」を展開
   - 「Add variable」をクリックして以下を追加:

   ```
   Variable name: LARK_APP_ID
   Value: cli_a99f079ae7f89e1c
   
   Variable name: LARK_APP_SECRET
   Value: 11H5ZzJaNPP3oBDxczeMvgVRe7CVnffz
   
   Variable name: LARK_APP_TOKEN
   Value: EXiXbTVHha8p7osOl4KjogMBp7e
   
   Variable name: LARK_TABLE_ID
   Value: tbl0Gz18u2wMAjWl
   ```

10. **「Save and Deploy」をクリック**

デプロイが開始されます。通常1〜2分で完了します。

### ステップ2: デプロイ状況を確認(1分)

1. デプロイが完了すると、「Success!」と表示されます

2. **「Continue to project」をクリック**

3. プロジェクトページで以下を確認:
   - **Production**: デプロイ済み
   - **URL**: `https://forecast-lark.pages.dev`(自動生成)

4. **「Visit site」をクリックしてアプリケーションにアクセス**

### ステップ3: 動作確認(1分)

1. アプリケーションが開いたら、以下を確認:
   - 年度と期の選択フォームが表示される
   - 「書類を生成」ボタンが表示される

2. **動作テスト**:
   - 年度: `2025`
   - 期: `下期`
   - 「書類を生成」をクリック
   - Excelファイルがダウンロードされる
   - Excelで開いて内容を確認

## ✅ セットアップ完了!

これで、GitHubにコードをプッシュするだけで、自動的にCloudflare Pagesにデプロイされるようになりました!

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

GitHubにプッシュすると、Cloudflareが自動的に検知してデプロイを開始します。

### デプロイの確認

1. https://dash.cloudflare.com/ にログイン
2. 「Workers & Pages」→`forecast-lark`
3. 「Deployments」タブでデプロイ履歴を確認

### ログの確認

1. 「Workers & Pages」→`forecast-lark`
2. 「Logs」タブでリアルタイムログを確認
3. エラーが発生した場合、詳細なログが表示されます

## 🔧 R2バケットの追加(オプション)

Excelファイルを保存して後からダウンロードできるようにしたい場合は、R2バケットを追加します。

### R2バケットの作成

1. https://dash.cloudflare.com/ → 「R2」→「Create bucket」
2. Bucket name: `lark-budget-files`
3. 「Create bucket」をクリック

### R2バケットのバインド

1. 「Workers & Pages」→`forecast-lark`
2. 「Settings」→「Functions」→「R2 bucket bindings」
3. 「Add binding」をクリック
4. Variable name: **`BUDGET_FILES`**
5. R2 bucket: **`lark-budget-files`**
6. 「Save」をクリック

### wrangler.tomlの更新

R2バケットを追加したら、`wrangler.toml`のコメントを外します:

```toml
# R2バケット(ファイル保存用)
[[r2_buckets]]
binding = "BUDGET_FILES"
bucket_name = "lark-budget-files"
```

コミットしてプッシュすると、自動的に再デプロイされます。

## 📊 デプロイ履歴

Cloudflare Pagesでは、すべてのデプロイが履歴として保存されます。

### デプロイ履歴の確認

1. 「Workers & Pages」→`forecast-lark`
2. 「Deployments」タブ
3. 各デプロイをクリックして詳細を確認

### ロールバック

問題が発生した場合は、以前のデプロイに簡単にロールバックできます:

1. 「Deployments」タブで以前のデプロイを選択
2. 「Rollback to this deployment」をクリック

## 🐛 トラブルシューティング

### エラー: "Build failed"

**原因**: ビルド設定が間違っている

**解決方法**:
1. 「Settings」→「Builds & deployments」
2. **Build command**: 空欄
3. **Build output directory**: `/`
4. 「Save」をクリック
5. 「Deployments」→「Retry deployment」

### エラー: "Function invocation failed"

**原因**: 環境変数が設定されていない

**解決方法**:
1. 「Settings」→「Environment variables」
2. 必要な環境変数を追加:
   - LARK_APP_ID
   - LARK_APP_SECRET
   - LARK_APP_TOKEN
   - LARK_TABLE_ID
3. 「Save」をクリック
4. 「Deployments」→「Retry deployment」

### エラー: "R2 bucket not found"

**原因**: R2バケットが作成されていない、またはバインドされていない

**解決方法**:
1. R2バケット`lark-budget-files`を作成
2. 「Settings」→「Functions」→「R2 bucket bindings」
3. バインディングを追加

## 📚 参考資料

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 ドキュメント](https://developers.cloudflare.com/r2/)

## 💡 GitHub Actionsとの比較

### Cloudflare Pages(推奨)

✅ **メリット**:
- 設定が簡単(5分で完了)
- APIトークン管理不要
- デプロイログが分かりやすい
- ロールバックが簡単
- トラブルシューティングが簡単

❌ **デメリット**:
- Cloudflareのプラットフォームに依存

### GitHub Actions

✅ **メリット**:
- カスタマイズ性が高い
- 複雑なワークフローに対応

❌ **デメリット**:
- 設定が複雑
- APIトークン管理が必要
- トラブルシューティングが難しい
- エラーメッセージが分かりにくい

## 🎉 まとめ

Cloudflare Pagesを使用することで、GitHub Actionsの複雑な設定やトラブルシューティングを回避し、簡単に自動デプロイを実現できます。

**推奨**: Cloudflare Pagesを使用してください。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月20日
