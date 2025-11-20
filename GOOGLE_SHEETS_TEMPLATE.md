# Googleスプレッドシートテンプレート

本ドキュメントでは、Lark Baseから自動的にデータを書き込むためのGoogleスプレッドシートテンプレートの作成方法を説明します。

## 🎯 概要

Excelファイルをダウンロードする代わりに、**Googleスプレッドシートに直接書き込む**ことができます。

### メリット

1. **ダウンロード不要**: ブラウザで直接確認
2. **リアルタイム共有**: チームメンバーと即座に共有
3. **履歴管理**: 変更履歴を自動保存
4. **クラウド保存**: ファイルの紛失リスクゼロ
5. **モバイル対応**: スマートフォンでも確認可能

## 📋 テンプレート作成手順(5分)

### ステップ1: 新しいスプレッドシートを作成(1分)

1. https://sheets.google.com/ にアクセス
2. 「空白」をクリックして新しいスプレッドシートを作成
3. タイトルを変更: 「神戸営業所_予算書類_テンプレート」

### ステップ2: シート名を設定(30秒)

1. 左下のシートタブ「シート1」を右クリック
2. 「名前を変更」をクリック
3. シート名: 「予算データ」

### ステップ3: スプレッドシートIDを取得(30秒)

URLから`spreadsheetId`を取得します。

**URL例**:
```
https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
                                      ↑
                                  この部分がID
```

**スプレッドシートID**:
```
1ABC...XYZ
```

このIDをメモしてください。

### ステップ4: サービスアカウントに共有(2分)

#### 4-1. Google Cloud Platformでサービスアカウントを作成

1. https://console.cloud.google.com/ にアクセス
2. 新しいプロジェクトを作成: 「lark-budget-export」
3. 「APIとサービス」→「認証情報」をクリック
4. 「認証情報を作成」→「サービスアカウント」をクリック
5. サービスアカウント名: 「lark-budget-export」
6. 「作成して続行」をクリック
7. 「完了」をクリック

#### 4-2. サービスアカウントキーを作成

1. 作成したサービスアカウントをクリック
2. 「キー」タブをクリック
3. 「鍵を追加」→「新しい鍵を作成」をクリック
4. キーのタイプ: **JSON**
5. 「作成」をクリック
6. JSONファイルがダウンロードされる

#### 4-3. JSONファイルから情報を取得

ダウンロードしたJSONファイルを開き、以下の情報を取得:

```json
{
  "client_email": "lark-budget-export@project-id.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

- **`client_email`**: サービスアカウントのメールアドレス
- **`private_key`**: 秘密鍵

#### 4-4. スプレッドシートを共有

1. Googleスプレッドシートに戻る
2. 右上の「共有」をクリック
3. サービスアカウントのメールアドレスを入力
4. 権限: **編集者**
5. 「送信」をクリック

#### 4-5. Google Sheets APIを有効化

1. Google Cloud Platformに戻る
2. 「APIとサービス」→「ライブラリ」をクリック
3. 「Google Sheets API」を検索
4. 「有効にする」をクリック

### ステップ5: Cloudflare Workersに環境変数を設定(1分)

#### 5-1. wrangler.tomlに追加

`wrangler.toml`に以下を追加:

```toml
[vars]
GOOGLE_SERVICE_ACCOUNT_EMAIL = "lark-budget-export@project-id.iam.gserviceaccount.com"
```

#### 5-2. 秘密鍵をSecretとして設定

```bash
wrangler secret put GOOGLE_PRIVATE_KEY
```

プロンプトが表示されたら、`private_key`の値を貼り付けます。

⚠️ **注意**: 秘密鍵は改行を含むため、そのままコピー&ペーストしてください。

## 🚀 使用方法

### 方法1: APIを直接呼び出す

```bash
curl -X POST https://lark-budget-export.your-subdomain.workers.dev/api/export-to-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "term": "下期",
    "spreadsheetId": "1ABC...XYZ"
  }'
```

### 方法2: Webインターフェースから呼び出す(推奨)

#### 2-1. index.jsにUIを追加

`src/index.js`の`handleIndex`関数に、スプレッドシートエクスポート用のボタンを追加:

```javascript
<div class="form-group">
  <label for="spreadsheetId">スプレッドシートID(オプション)</label>
  <input type="text" id="spreadsheetId" name="spreadsheetId" placeholder="1ABC...XYZ">
  <small>入力すると、Googleスプレッドシートに直接書き込みます</small>
</div>
```

#### 2-2. JavaScriptを修正

```javascript
const spreadsheetId = document.getElementById('spreadsheetId').value;

if (spreadsheetId) {
  // Googleスプレッドシートに書き込む
  const response = await fetch('/api/export-to-sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ year: parseInt(year), term, spreadsheetId })
  });
  
  // ... 成功時の処理
  status.innerHTML = `
    ✅ スプレッドシートへの書き込みが完了しました!<br>
    <a href="${data.spreadsheetUrl}" class="download-link" target="_blank">📊 スプレッドシートを開く</a>
  `;
} else {
  // Excelファイルをダウンロード(既存の処理)
  // ...
}
```

### 方法3: Lark Baseのボタンから呼び出す

#### 3-1. Lark Baseにボタンを追加

1. 「予実管理」テーブルを開く
2. 新しいフィールドを追加
   - タイプ: **ボタン**
   - 名前: **スプレッドシートに出力**
   - ラベル: **📊 スプレッドシート出力**
   - アクション: **URLを開く**
   - URL: `https://lark-budget-export.your-subdomain.workers.dev?spreadsheetId=1ABC...XYZ`

#### 3-2. 使用方法

1. Lark Baseで「📊 スプレッドシート出力」ボタンをクリック
2. 新しいタブでエクスポートページが開く
3. 年度と期を選択
4. 「書類を生成」をクリック
5. Googleスプレッドシートに自動的に書き込まれる

## 📊 出力フォーマット

### ヘッダー行

```
神戸営業所 2025年度下期 予算
```

### 列ヘッダー

| カテゴリ | 型式 | 顧客名 | 売価(千円) | 原価(千円) | 利益(千円) | 利益率(%) |
|---------|------|--------|-----------|-----------|-----------|----------|

### データ行

製品区分ごとにグループ化され、各グループの最後に小計行が追加されます。

**例**:

```
電話    | PBX-1000 | 日本郵船 | 1,200 | 800 | 400 | 33.3
電話    | IP-PBX   | 川崎汽船 | 800   | 500 | 300 | 37.5
電話 小計|          |          | 2,000 | 1,300 | 700 | 35.0

火災警報 | FR-100   | 商船三井 | 500   | 300 | 200 | 40.0
火災警報 小計|       |          | 500   | 300 | 200 | 40.0

合計    |          |          | 2,500 | 1,600 | 900 | 36.0
```

### フォーマット

- **ヘッダー行**: 太字、フォントサイズ14
- **列ヘッダー**: 太字、背景色グレー
- **数値列**: 右揃え
- **小計行**: 太字(将来実装予定)
- **合計行**: 太字(将来実装予定)

## 🎨 カスタマイズ

### 列の追加

`src/sheets-client.js`の`writeBudgetData`メソッドを編集:

```javascript
// 列ヘッダー
values.push([
  'カテゴリ',
  '型式',
  '顧客名',
  '売価(千円)',
  '原価(千円)',
  '利益(千円)',
  '利益率(%)',
  '備考' // 新しい列を追加
]);

// データ行
values.push([
  category.replace(/^\d+_/, ''),
  record.productModel || '',
  record.customerName || '',
  salesPrice,
  cost,
  profit,
  profitRate,
  record.notes || '' // 新しい列のデータ
]);
```

### フォーマットの変更

`src/sheets-client.js`の`formatSheet`メソッドを編集:

```javascript
// 小計行を太字に
{
  repeatCell: {
    range: {
      sheetId: 0,
      startRowIndex: subtotalRowIndex,
      endRowIndex: subtotalRowIndex + 1,
      startColumnIndex: 0,
      endColumnIndex: 7
    },
    cell: {
      userEnteredFormat: {
        textFormat: {
          bold: true
        }
      }
    },
    fields: 'userEnteredFormat.textFormat'
  }
}
```

## 🐛 トラブルシューティング

### エラー: "Failed to get access token"

**原因**: サービスアカウントの認証情報が間違っている

**解決方法**:
1. `wrangler.toml`の`GOOGLE_SERVICE_ACCOUNT_EMAIL`を確認
2. `wrangler secret put GOOGLE_PRIVATE_KEY`で秘密鍵を再設定

### エラー: "Failed to write data"

**原因**: スプレッドシートがサービスアカウントに共有されていない

**解決方法**:
1. Googleスプレッドシートの「共有」をクリック
2. サービスアカウントのメールアドレスを追加
3. 権限: **編集者**

### エラー: "Google Sheets API has not been used"

**原因**: Google Sheets APIが有効化されていない

**解決方法**:
1. Google Cloud Platformで「APIとサービス」→「ライブラリ」
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

### データが正しく書き込まれない

**原因**: データの形式が想定と異なる

**解決方法**:
1. `src/sheets-client.js`の`writeBudgetData`メソッドを確認
2. Lark Baseのフィールド名を確認
3. `src/lark-client.js`の`processRecords`メソッドを調整

## 💡 ベストプラクティス

### 1. テンプレートを複製して使用

毎回新しいスプレッドシートを作成するのではなく、テンプレートを複製して使用します。

1. テンプレートを開く
2. 「ファイル」→「コピーを作成」
3. 名前: 「神戸予算_2025下期」
4. 新しいスプレッドシートIDを取得
5. APIを呼び出す

### 2. フォルダで整理

Google Driveでフォルダを作成し、年度・期ごとに整理します。

```
📁 神戸営業所_予算書類/
  📁 2024年度/
    📄 神戸予算_2024上期
    📄 神戸予算_2024下期
  📁 2025年度/
    📄 神戸予算_2025上期
    📄 神戸予算_2025下期
```

### 3. 権限管理

スプレッドシートの共有権限を適切に設定します。

- **閲覧者**: 本部メンバー
- **編集者**: 神戸営業所メンバー
- **オーナー**: 管理者

### 4. 自動化

Lark Baseの自動化機能を使用して、定期的にスプレッドシートを更新します。

1. Lark Baseで「自動化」を開く
2. トリガー: 「毎月1日」
3. アクション: 「Webhookを呼び出す」
4. URL: `https://lark-budget-export.your-subdomain.workers.dev/api/export-to-sheets`
5. ボディ: `{"year": 2025, "term": "下期", "spreadsheetId": "1ABC...XYZ"}`

## 📞 サポート

技術的な質問やバグ報告は、プロジェクトの担当者までお問い合わせください。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月13日
