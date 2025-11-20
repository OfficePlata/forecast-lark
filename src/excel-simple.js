/**
 * Simple Excel Generator for Cloudflare Workers
 * ExcelJSを使わずに、XMLベースで軽量にExcelファイルを生成
 */

export class ExcelSimple {
  /**
   * 本部提出書類を生成(軽量版)
   */
  async generateBudgetReport(groupedData, summary, year, term) {
    // XMLベースのExcelファイル(SpreadsheetML)を生成
    const xml = this.createSpreadsheetML(groupedData, summary, year, term);
    
    // UTF-8エンコード
    const encoder = new TextEncoder();
    const buffer = encoder.encode(xml);
    
    return buffer;
  }

  /**
   * SpreadsheetML形式のXMLを生成
   */
  createSpreadsheetML(groupedData, summary, year, term) {
    const rows = [];
    
    // ヘッダー行1: 書式番号
    rows.push(this.createRow([
      { value: '書式番号', type: 'String' },
      { value: '①', type: 'String' }
    ]));
    
    // ヘッダー行2: タイトル
    const title = `　　　　　　　${year}年度 ・${term} ・予算・見込機種別明細表`;
    rows.push(this.createRow([
      { value: title, type: 'String' },
      { value: '', type: 'String' },
      { value: '', type: 'String' },
      { value: '', type: 'String' },
      { value: '', type: 'String' },
      { value: '', type: 'String' },
      { value: '神戸', type: 'String' }
    ]));
    
    // 空行
    rows.push(this.createRow([]));
    
    // 列ヘッダー
    rows.push(this.createRow([
      { value: '品名', type: 'String', styleID: 'header' },
      { value: '数量', type: 'String', styleID: 'header' },
      { value: '売価', type: 'String', styleID: 'header' },
      { value: '原価', type: 'String', styleID: 'header' },
      { value: '工事', type: 'String', styleID: 'header' },
      { value: '利率', type: 'String', styleID: 'header' },
      { value: '利益', type: 'String', styleID: 'header' }
    ]));

    // カテゴリマッピング
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
      
      if (records.length === 0) continue;

      // カテゴリヘッダー行
      const categoryName = categoryMap[category] || category.replace(/^\d+_/, '');
      rows.push(this.createRow([
        { value: categoryName, type: 'String' }
      ]));

      let categorySalesPrice = 0;
      let categoryCost = 0;
      let categoryConstruction = 0;
      let categoryProfit = 0;

      // レコードを書き込む
      for (const record of records) {
        const salesPrice = Math.round((record.salesPrice || 0) / 1000);
        const cost = Math.round((record.cost || 0) / 1000);
        const construction = 0;
        const profit = salesPrice - cost - construction;
        const profitRate = salesPrice > 0 ? (profit / salesPrice * 100).toFixed(1) : '0.0';

        rows.push(this.createRow([
          { value: record.productModel || '', type: 'String' },
          { value: '', type: 'String' },
          { value: salesPrice, type: 'Number' },
          { value: cost, type: 'Number' },
          { value: construction, type: 'Number' },
          { value: profitRate, type: 'Number' },
          { value: profit, type: 'Number' }
        ]));

        categorySalesPrice += salesPrice;
        categoryCost += cost;
        categoryConstruction += construction;
        categoryProfit += profit;
      }

      // カテゴリ小計行
      const categoryProfitRate = categorySalesPrice > 0 
        ? (categoryProfit / categorySalesPrice * 100).toFixed(1) 
        : '0.0';

      rows.push(this.createRow([
        { value: '小計', type: 'String', styleID: 'subtotal' },
        { value: '', type: 'String' },
        { value: categorySalesPrice, type: 'Number', styleID: 'subtotal' },
        { value: categoryCost, type: 'Number', styleID: 'subtotal' },
        { value: categoryConstruction, type: 'Number', styleID: 'subtotal' },
        { value: categoryProfitRate, type: 'Number', styleID: 'subtotal' },
        { value: categoryProfit, type: 'Number', styleID: 'subtotal' }
      ]));

      totalSalesPrice += categorySalesPrice;
      totalCost += categoryCost;
      totalConstruction += categoryConstruction;
      totalProfit += categoryProfit;
    }

    // 合計行
    const totalProfitRate = totalSalesPrice > 0 
      ? (totalProfit / totalSalesPrice * 100).toFixed(1) 
      : '0.0';

    rows.push(this.createRow([
      { value: '合計', type: 'String', styleID: 'total' },
      { value: '', type: 'String' },
      { value: totalSalesPrice, type: 'Number', styleID: 'total' },
      { value: totalCost, type: 'Number', styleID: 'total' },
      { value: totalConstruction, type: 'Number', styleID: 'total' },
      { value: totalProfitRate, type: 'Number', styleID: 'total' },
      { value: totalProfit, type: 'Number', styleID: 'total' }
    ]));

    // SpreadsheetMLドキュメントを生成
    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Arial" ss:Size="11"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="header">
   <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtotal">
   <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="total">
   <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${year}・予算(${term})">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="60"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
${rows.join('\n')}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  /**
   * 行を生成
   */
  createRow(cells) {
    if (cells.length === 0) {
      return '   <Row/>';
    }

    const cellsXml = cells.map(cell => {
      const styleAttr = cell.styleID ? ` ss:StyleID="${cell.styleID}"` : '';
      return `    <Cell${styleAttr}><Data ss:Type="${cell.type}">${this.escapeXml(cell.value)}</Data></Cell>`;
    }).join('\n');

    return `   <Row>\n${cellsXml}\n   </Row>`;
  }

  /**
   * XML特殊文字をエスケープ
   */
  escapeXml(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
