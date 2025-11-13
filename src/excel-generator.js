/**
 * Excel生成機能
 * 本部提出書類フォーマットに合わせてExcelファイルを生成
 */

import ExcelJS from 'exceljs';

export class ExcelGenerator {
  constructor() {
    this.workbook = null;
  }

  /**
   * テンプレートファイルを読み込み
   * @param {ArrayBuffer} templateBuffer - テンプレートファイルのバッファ
   */
  async loadTemplate(templateBuffer) {
    this.workbook = new ExcelJS.Workbook();
    await this.workbook.xlsx.load(templateBuffer);
  }

  /**
   * 新しいワークブックを作成
   * @param {string} year - 年度
   * @param {string} term - 期
   */
  async createWorkbook(year, term) {
    this.workbook = new ExcelJS.Workbook();
    
    // 基本プロパティを設定
    this.workbook.creator = 'Lark Budget Export System';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();

    // シートを作成
    const sheetName = `${year}${term}・受`;
    const worksheet = this.workbook.addWorksheet(sheetName);

    // ヘッダー行を設定
    this.setupHeader(worksheet);

    return worksheet;
  }

  /**
   * ヘッダー行を設定
   * @param {Worksheet} worksheet - ワークシート
   */
  setupHeader(worksheet) {
    // 列幅を設定
    worksheet.columns = [
      { key: 'category', width: 20 },      // A列: 製品区分
      { key: 'productCode', width: 20 },   // B列: 製品型番
      { key: 'quantity', width: 10 },      // C列: 数量
      { key: 'salesPrice', width: 15 },    // D列: 売価
      { key: 'cost', width: 15 },          // E列: 原価
      { key: 'construction', width: 15 },  // F列: 工事費
      { key: 'profitRate', width: 10 },    // G列: 利益率
      { key: 'profit', width: 15 }         // H列: 利益
    ];

    // ヘッダー行を追加
    const headerRow = worksheet.addRow([
      '製品区分',
      '製品型番',
      '数量',
      '売価(千円)',
      '原価(千円)',
      '工事費(千円)',
      '利益率(%)',
      '利益(千円)'
    ]);

    // ヘッダーのスタイルを設定
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  /**
   * データをワークシートに書き込み
   * @param {Worksheet} worksheet - ワークシート
   * @param {Object} groupedData - グループ化されたデータ
   * @param {Object} summary - 集計データ
   */
  writeData(worksheet, groupedData, summary) {
    let currentRow = 2; // ヘッダーの次の行から開始

    // カテゴリ順序を定義
    const categoryOrder = [
      '01_電話',
      '02_火災警報',
      '03_船内指令',
      '04_時計',
      '06_特機',
      '07_A工注',
      'その他'
    ];

    for (const category of categoryOrder) {
      if (!groupedData[category]) continue;

      const items = groupedData[category];
      const categoryTotal = summary.byCategory[category];

      // カテゴリヘッダー行
      const categoryRow = worksheet.addRow([
        category,
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
      categoryRow.font = { bold: true, size: 11 };
      categoryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F2FF' }
      };
      currentRow++;

      // 各製品のデータ行
      for (const item of items) {
        const row = worksheet.addRow([
          '',
          item.productCode,
          item.quantity,
          item.salesPrice,
          item.cost,
          item.constructionCost,
          item.profitRate * 100, // パーセント表示
          item.profit
        ]);

        // 数値列のフォーマット
        row.getCell(3).numFmt = '#,##0'; // 数量
        row.getCell(4).numFmt = '#,##0'; // 売価
        row.getCell(5).numFmt = '#,##0'; // 原価
        row.getCell(6).numFmt = '#,##0'; // 工事費
        row.getCell(7).numFmt = '0.0%';  // 利益率
        row.getCell(8).numFmt = '#,##0'; // 利益

        // 罫線
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        currentRow++;
      }

      // カテゴリ小計行
      const subtotalRow = worksheet.addRow([
        '小計',
        '',
        '',
        categoryTotal.salesPrice,
        categoryTotal.cost,
        categoryTotal.constructionCost,
        categoryTotal.profitRate * 100,
        categoryTotal.profit
      ]);

      subtotalRow.font = { bold: true };
      subtotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD966' }
      };

      // 数値列のフォーマット
      subtotalRow.getCell(4).numFmt = '#,##0';
      subtotalRow.getCell(5).numFmt = '#,##0';
      subtotalRow.getCell(6).numFmt = '#,##0';
      subtotalRow.getCell(7).numFmt = '0.0%';
      subtotalRow.getCell(8).numFmt = '#,##0';

      currentRow++;
    }

    // 合計行
    currentRow++; // 空行
    const totalRow = worksheet.addRow([
      '合計',
      '',
      '',
      summary.total.salesPrice,
      summary.total.cost,
      summary.total.constructionCost,
      summary.total.profitRate * 100,
      summary.total.profit
    ]);

    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    };

    // 数値列のフォーマット
    totalRow.getCell(4).numFmt = '#,##0';
    totalRow.getCell(5).numFmt = '#,##0';
    totalRow.getCell(6).numFmt = '#,##0';
    totalRow.getCell(7).numFmt = '0.0%';
    totalRow.getCell(8).numFmt = '#,##0';
  }

  /**
   * Excelファイルをバッファとして出力
   * @returns {Promise<Buffer>} Excelファイルのバッファ
   */
  async toBuffer() {
    if (!this.workbook) {
      throw new Error('Workbook is not initialized');
    }

    return await this.workbook.xlsx.writeBuffer();
  }

  /**
   * 本部提出書類を生成
   * @param {Object} groupedData - グループ化されたデータ
   * @param {Object} summary - 集計データ
   * @param {string} year - 年度
   * @param {string} term - 期
   * @returns {Promise<Buffer>} Excelファイルのバッファ
   */
  async generateBudgetReport(groupedData, summary, year, term) {
    const worksheet = await this.createWorkbook(year, term);
    this.writeData(worksheet, groupedData, summary);
    return await this.toBuffer();
  }
}
