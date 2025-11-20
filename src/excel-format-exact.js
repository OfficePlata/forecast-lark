/**
 * Excel Format Exact Generator
 * 神戸予算（25下）R1.xlsxのフォーマットを完全に再現
 */

import ExcelJS from 'exceljs';

export class ExcelFormatExact {
  /**
   * 本部提出書類を生成(フォーマット完全再現版)
   */
  async generateBudgetReport(groupedData, summary, year, term) {
    const workbook = new ExcelJS.Workbook();
    
    // シートを作成
    const worksheet = workbook.addWorksheet(`${year}・予算(${term})`);

    // 列幅を設定
    worksheet.columns = [
      { width: 20 }, // A: 品名
      { width: 8 },  // B: 数量
      { width: 10 }, // C: 売価
      { width: 10 }, // D: 原価
      { width: 10 }, // E: 工事
      { width: 10 }, // F: 利率
      { width: 10 }, // G: 利益
      { width: 10 }  // H: (予備)
    ];

    let currentRow = 1;

    // ヘッダー行1: 書式番号
    worksheet.getCell('A1').value = '書式番号';
    worksheet.getCell('B1').value = '①';
    currentRow++;

    // ヘッダー行2: タイトル
    const title = `　　　　　　　${year}年度 ・${term} ・予算・見込機種別明細表`;
    worksheet.getCell('A2').value = title;
    worksheet.getCell('G2').value = '神戸';
    currentRow++;

    // 空行
    currentRow++;

    // 列ヘッダー
    worksheet.getCell(`A${currentRow}`).value = '品名';
    worksheet.getCell(`B${currentRow}`).value = '数量';
    worksheet.getCell(`C${currentRow}`).value = '売価';
    worksheet.getCell(`D${currentRow}`).value = '原価';
    worksheet.getCell(`E${currentRow}`).value = '工事';
    worksheet.getCell(`F${currentRow}`).value = '利率';
    worksheet.getCell(`G${currentRow}`).value = '利益';
    
    // 列ヘッダーの背景色を設定
    for (let col = 1; col <= 7; col++) {
      const cell = worksheet.getCell(currentRow, col);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    currentRow++;

    // カテゴリ順序
    const categoryMap = {
      '01_電話': '交換機',
      '02_火災警報': '火災警報',
      '03_船内指令': '船内指令',
      '04_時計': '時計',
      '05_CCTV': 'CCTV',
      '06_衛星通信': '衛星通信',
      '07_積付計算機': '積付計算機',
      '08_その他': 'その他'
    };

    const categoryOrder = [
      '01_電話',
      '02_火災警報',
      '03_船内指令',
      '04_時計',
      '05_CCTV',
      '06_衛星通信',
      '07_積付計算機',
      '08_その他'
    ];

    let totalSalesPrice = 0;
    let totalCost = 0;
    let totalConstruction = 0;
    let totalProfit = 0;

    // カテゴリごとにデータを書き込む
    for (const category of categoryOrder) {
      const records = groupedData[category] || [];
      
      // カテゴリヘッダー行
      const categoryName = categoryMap[category] || category.replace(/^\d+_/, '');
      worksheet.getCell(`A${currentRow}`).value = categoryName;
      
      // カテゴリヘッダー行をマージ(B列からG列まで)
      worksheet.mergeCells(`B${currentRow}:G${currentRow}`);
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
      
      currentRow++;

      const categoryStartRow = currentRow;
      let categorySalesPrice = 0;
      let categoryCost = 0;
      let categoryConstruction = 0;
      let categoryProfit = 0;

      // レコードを書き込む
      for (const record of records) {
        const salesPrice = Math.round((record.salesPrice || 0) / 1000);
        const cost = Math.round((record.cost || 0) / 1000);
        const construction = 0; // 工事費は0と仮定
        const profit = salesPrice - cost - construction;
        const profitRate = salesPrice > 0 ? profit / salesPrice : 0;

        // 型式
        worksheet.getCell(`A${currentRow}`).value = record.productModel || '';
        
        // 数量(空欄)
        worksheet.getCell(`B${currentRow}`).value = '';
        
        // 売価
        worksheet.getCell(`C${currentRow}`).value = salesPrice;
        worksheet.getCell(`C${currentRow}`).numFmt = '#,##0';
        
        // 原価
        worksheet.getCell(`D${currentRow}`).value = cost;
        worksheet.getCell(`D${currentRow}`).numFmt = '#,##0';
        
        // 工事
        worksheet.getCell(`E${currentRow}`).value = construction;
        worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
        
        // 利率(数式)
        worksheet.getCell(`F${currentRow}`).value = {
          formula: `IF(C${currentRow}<>0,G${currentRow}/C${currentRow},0)`,
          result: profitRate
        };
        worksheet.getCell(`F${currentRow}`).numFmt = '0.0%';
        
        // 利益(数式)
        worksheet.getCell(`G${currentRow}`).value = {
          formula: `C${currentRow}-D${currentRow}-E${currentRow}`,
          result: profit
        };
        worksheet.getCell(`G${currentRow}`).numFmt = '#,##0';

        categorySalesPrice += salesPrice;
        categoryCost += cost;
        categoryConstruction += construction;
        categoryProfit += profit;

        currentRow++;
      }

      // カテゴリ小計行
      worksheet.getCell(`A${currentRow}`).value = '小計';
      worksheet.getCell(`B${currentRow}`).value = '';
      
      // 小計の数式
      worksheet.getCell(`C${currentRow}`).value = categorySalesPrice;
      worksheet.getCell(`C${currentRow}`).numFmt = '#,##0';
      
      worksheet.getCell(`D${currentRow}`).value = {
        formula: `SUM(D${categoryStartRow}:D${currentRow - 1})`,
        result: categoryCost
      };
      worksheet.getCell(`D${currentRow}`).numFmt = '#,##0';
      
      worksheet.getCell(`E${currentRow}`).value = {
        formula: `SUM(E${categoryStartRow}:E${currentRow - 1})`,
        result: categoryConstruction
      };
      worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
      
      worksheet.getCell(`F${currentRow}`).value = {
        formula: `IF(C${currentRow}<>0,G${currentRow}/C${currentRow},0)`,
        result: categorySalesPrice > 0 ? categoryProfit / categorySalesPrice : 0
      };
      worksheet.getCell(`F${currentRow}`).numFmt = '0.0%';
      
      worksheet.getCell(`G${currentRow}`).value = {
        formula: `SUM(G${categoryStartRow}:G${currentRow - 1})`,
        result: categoryProfit
      };
      worksheet.getCell(`G${currentRow}`).numFmt = '#,##0';

      totalSalesPrice += categorySalesPrice;
      totalCost += categoryCost;
      totalConstruction += categoryConstruction;
      totalProfit += categoryProfit;

      currentRow++;
    }

    // 合計行
    worksheet.getCell(`A${currentRow}`).value = '合計';
    worksheet.getCell(`C${currentRow}`).value = totalSalesPrice;
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0';
    worksheet.getCell(`D${currentRow}`).value = totalCost;
    worksheet.getCell(`D${currentRow}`).numFmt = '#,##0';
    worksheet.getCell(`E${currentRow}`).value = totalConstruction;
    worksheet.getCell(`E${currentRow}`).numFmt = '#,##0';
    worksheet.getCell(`F${currentRow}`).value = totalSalesPrice > 0 ? totalProfit / totalSalesPrice : 0;
    worksheet.getCell(`F${currentRow}`).numFmt = '0.0%';
    worksheet.getCell(`G${currentRow}`).value = totalProfit;
    worksheet.getCell(`G${currentRow}`).numFmt = '#,##0';

    // Excelファイルをバッファに書き込む
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
