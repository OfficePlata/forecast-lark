# Excelフォーマット完全再現版

本ドキュメントでは、「神戸予算（25下）R1.xlsx」のフォーマットを完全に再現したExcel生成機能について説明します。

## 🎯 概要

Lark Baseから取得したデータを、**本部提出書類のフォーマットに完全準拠**したExcelファイルとして出力します。

### 再現したフォーマット

1. **ヘッダー行**: 書式番号、タイトル、営業所名
2. **列ヘッダー**: 品名、数量、売価、原価、工事、利率、利益
3. **カテゴリ別グループ化**: 交換機、火災警報、船内指令、時計、CCTV、衛星通信、積付計算機、その他
4. **小計行**: 各カテゴリの小計
5. **合計行**: 全体の合計
6. **数式**: 利率と利益の自動計算
7. **数値フォーマット**: 千円単位、パーセント表示
8. **セルのマージ**: カテゴリヘッダー行

## 📋 フォーマット詳細

### ヘッダー部分

| 行 | 内容 |
|----|------|
| 1行目 | 書式番号: ① |
| 2行目 | タイトル: 「2025年度 ・下期 ・予算・見込機種別明細表」、営業所名: 「神戸」 |
| 3行目 | 空行 |
| 4行目 | 列ヘッダー: 品名、数量、売価、原価、工事、利率、利益 |

### データ部分

#### カテゴリヘッダー行

```
交換機 | (B列からG列までマージ)
```

#### データ行

```
OAE-7224 | (空欄) | 452 | 501 | 0 | (数式) | (数式)
```

- **品名**: 製品型番
- **数量**: 空欄(将来的に数量を追加可能)
- **売価**: 千円単位
- **原価**: 千円単位
- **工事**: 千円単位(現在は0)
- **利率**: 数式 `=IF(C<行番号><>0,G<行番号>/C<行番号>,0)`
- **利益**: 数式 `=C<行番号>-D<行番号>-E<行番号>`

#### 小計行

```
小計 | (空欄) | 1015 | =SUM(D6:D28) | =SUM(E6:E28) | (数式) | =SUM(G6:G28)
```

#### 合計行

```
合計 | (空欄) | 12700 | 8500 | 0 | 33.1% | 4200
```

## 🔧 実装

### ExcelFormatExact クラス

`src/excel-format-exact.js`に実装されています。

#### 主要メソッド

**`generateBudgetReport(groupedData, summary, year, term)`**

- **引数**:
  - `groupedData`: カテゴリ別にグループ化されたデータ
  - `summary`: 集計データ
  - `year`: 年度
  - `term`: 期(上期/下期)
- **戻り値**: Excelファイルのバッファ

### データ構造

#### groupedData

```javascript
{
  '01_電話': [
    {
      productModel: 'OAE-7224',
      customerName: '日本郵船',
      salesPrice: 452000,
      cost: 501000
    },
    // ...
  ],
  '02_火災警報': [
    // ...
  ],
  // ...
}
```

#### summary

```javascript
{
  total: {
    salesPrice: 12700000,
    cost: 8500000,
    profit: 4200000,
    profitRate: 0.331
  },
  byCategory: {
    '01_電話': {
      salesPrice: 1015000,
      cost: 776000,
      profit: 239000,
      profitRate: 0.235
    },
    // ...
  }
}
```

## 📊 カテゴリマッピング

Lark Baseのカテゴリ名を、本部提出書類のカテゴリ名にマッピングします。

| Lark Base | 本部提出書類 |
|-----------|-------------|
| 01_電話 | 交換機 |
| 02_火災警報 | 火災警報 |
| 03_船内指令 | 船内指令 |
| 04_時計 | 時計 |
| 05_CCTV | CCTV |
| 06_衛星通信 | 衛星通信 |
| 07_積付計算機 | 積付計算機 |
| 08_その他 | その他 |

## 🎨 スタイル設定

### 列幅

| 列 | 幅 |
|----|-----|
| A (品名) | 20 |
| B (数量) | 8 |
| C (売価) | 10 |
| D (原価) | 10 |
| E (工事) | 10 |
| F (利率) | 10 |
| G (利益) | 10 |

### 背景色

- **列ヘッダー**: グレー (#FFD9D9D9)
- **カテゴリヘッダー**: 白 (#FFFFFFFF)

### 数値フォーマット

- **売価、原価、工事、利益**: `#,##0` (カンマ区切り)
- **利率**: `0.0%` (パーセント表示、小数点1桁)

### セルのマージ

- **カテゴリヘッダー行**: B列からG列までマージ

## 🚀 使用方法

### 1. Cloudflare Workersで使用

`src/index.js`で自動的に使用されます。

```javascript
import { ExcelFormatExact } from './excel-format-exact.js';

const generator = new ExcelFormatExact();
const buffer = await generator.generateBudgetReport(groupedData, summary, year, term);
```

### 2. ローカルでテスト

```javascript
import { ExcelFormatExact } from './src/excel-format-exact.js';
import fs from 'fs';

const generator = new ExcelFormatExact();

// テストデータ
const groupedData = {
  '01_電話': [
    {
      productModel: 'OAE-7224',
      customerName: '日本郵船',
      salesPrice: 452000,
      cost: 501000
    }
  ]
};

const summary = {
  total: {
    salesPrice: 452000,
    cost: 501000,
    profit: -49000,
    profitRate: -0.108
  }
};

const buffer = await generator.generateBudgetReport(groupedData, summary, 2025, '下期');

// ファイルに保存
fs.writeFileSync('test_output.xlsx', buffer);
```

## 🔄 元のExcelファイルとの違い

### 完全に再現した部分

- ✅ ヘッダー行のレイアウト
- ✅ 列ヘッダーの名称と順序
- ✅ カテゴリ別のグループ化
- ✅ 小計行と合計行
- ✅ 数式(利率と利益)
- ✅ 数値フォーマット
- ✅ セルのマージ

### 現在未実装の部分

- ⚠️ **数量列**: 現在は空欄(将来的に追加予定)
- ⚠️ **工事列**: 現在は0(将来的に実データを追加予定)
- ⚠️ **フォントサイズ**: デフォルトのまま
- ⚠️ **罫線**: 部分的に実装
- ⚠️ **印刷設定**: 未実装

### 将来的に追加予定の機能

1. **数量の自動入力**: Lark Baseから数量データを取得
2. **工事費の自動入力**: Lark Baseから工事費データを取得
3. **フォントサイズの調整**: 元のExcelと同じフォントサイズ
4. **罫線の完全再現**: すべてのセルに罫線を追加
5. **印刷設定**: ページ設定、余白、ヘッダー/フッター

## 🐛 トラブルシューティング

### エラー: "ExcelJS is not defined"

**原因**: ExcelJSがインストールされていない

**解決方法**:
```bash
npm install exceljs
```

### エラー: "Cannot read property 'productModel' of undefined"

**原因**: データ構造が想定と異なる

**解決方法**:
1. `groupedData`の構造を確認
2. Lark APIから取得したデータを確認
3. `src/lark-client.js`の`processRecords`メソッドを調整

### 数式が正しく計算されない

**原因**: 数式の参照が間違っている

**解決方法**:
1. Excelファイルを開いて数式を確認
2. `src/excel-format-exact.js`の数式を修正
3. 行番号が正しいか確認

### カテゴリの順序が間違っている

**原因**: `categoryOrder`の順序が間違っている

**解決方法**:
1. `src/excel-format-exact.js`の`categoryOrder`を確認
2. 元のExcelファイルのカテゴリ順序と比較
3. 必要に応じて順序を変更

## 💡 カスタマイズ

### カテゴリの追加

`src/excel-format-exact.js`を編集:

```javascript
const categoryMap = {
  '01_電話': '交換機',
  '02_火災警報': '火災警報',
  '03_船内指令': '船内指令',
  '04_時計': '時計',
  '05_CCTV': 'CCTV',
  '06_衛星通信': '衛星通信',
  '07_積付計算機': '積付計算機',
  '08_その他': 'その他',
  '09_新カテゴリ': '新カテゴリ名' // 追加
};

const categoryOrder = [
  '01_電話',
  '02_火災警報',
  '03_船内指令',
  '04_時計',
  '05_CCTV',
  '06_衛星通信',
  '07_積付計算機',
  '08_その他',
  '09_新カテゴリ' // 追加
];
```

### 列の追加

`src/excel-format-exact.js`を編集:

```javascript
// 列幅を設定
worksheet.columns = [
  { width: 20 }, // A: 品名
  { width: 8 },  // B: 数量
  { width: 10 }, // C: 売価
  { width: 10 }, // D: 原価
  { width: 10 }, // E: 工事
  { width: 10 }, // F: 利率
  { width: 10 }, // G: 利益
  { width: 15 }  // H: 備考(新規追加)
];

// 列ヘッダー
worksheet.getCell(`H${currentRow}`).value = '備考';

// データ行
worksheet.getCell(`H${currentRow}`).value = record.notes || '';
```

### フォーマットの変更

`src/excel-format-exact.js`を編集:

```javascript
// 背景色を変更
cell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFF0000' } // 赤色
};

// フォントを変更
cell.font = {
  name: 'Arial',
  size: 12,
  bold: true
};

// 罫線を追加
cell.border = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
};
```

## 📞 サポート

技術的な質問やバグ報告は、プロジェクトの担当者までお問い合わせください。

---

**作成者**: Manus AI  
**最終更新**: 2025年11月13日
