/**
 * Lark Budget Export - Cloudflare Workers
 * Lark Baseから予実管理データを取得し、本部提出書類を自動生成
 */

import { LarkClient } from './lark-client.js';
import { ExcelGenerator } from './excel-generator.js';
import { ExcelFormatExact } from './excel-format-exact.js';
import { ExcelSimple } from './excel-simple.js';
import { SheetsClient } from './sheets-client.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORSヘッダーを設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // OPTIONSリクエスト(CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ルーティング
      if (url.pathname === '/') {
        return handleIndex(corsHeaders);
      } else if (url.pathname === '/api/export') {
        return await handleExport(request, env, corsHeaders);
      } else if (url.pathname === '/api/export-to-sheets') {
        return await handleExportToSheets(request, env, corsHeaders);
      } else if (url.pathname === '/api/status') {
        return handleStatus(env, corsHeaders);
      } else if (url.pathname.startsWith('/files/')) {
        return await handleFileDownload(url.pathname, env, corsHeaders);
      } else {
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * インデックスページ
 */
function handleIndex(corsHeaders) {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lark予実管理 - 本部提出書類自動生成</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 600px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }
    select, input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    select:focus, input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      display: none;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .status.loading {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
    .download-link {
      margin-top: 10px;
      display: inline-block;
      color: #667eea;
      text-decoration: none;
      font-weight: bold;
    }
    .download-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 本部提出書類 自動生成</h1>
    <p class="subtitle">Lark Base予実管理データから本部提出書類を自動生成します</p>
    
    <form id="exportForm">
      <div class="form-group">
        <label for="year">年度</label>
        <input type="number" id="year" name="year" value="2025" min="2020" max="2030" required>
      </div>
      
      <div class="form-group">
        <label for="term">期</label>
        <select id="term" name="term" required>
          <option value="上期">上期</option>
          <option value="下期" selected>下期</option>
        </select>
      </div>
      
      <button type="submit" id="exportBtn">
        📄 書類を生成
      </button>
    </form>
    
    <div id="status" class="status"></div>
  </div>

  <script>
    const form = document.getElementById('exportForm');
    const btn = document.getElementById('exportBtn');
    const status = document.getElementById('status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const year = document.getElementById('year').value;
      const term = document.getElementById('term').value;
      
      // ボタンを無効化
      btn.disabled = true;
      btn.textContent = '⏳ 生成中...';
      
      // ステータス表示
      status.className = 'status loading';
      status.style.display = 'block';
      status.textContent = 'Lark Baseからデータを取得中...';
      
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ year: parseInt(year), term })
        });
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          status.className = 'status success';
          status.innerHTML = \`
            ✅ 書類の生成が完了しました!<br>
            <a href="\${data.downloadUrl}" class="download-link" download>📥 ダウンロード</a>
          \`;
        } else {
          throw new Error(data.error || '生成に失敗しました');
        }
      } catch (error) {
        status.className = 'status error';
        status.textContent = \`❌ エラー: \${error.message}\`;
      } finally {
        btn.disabled = false;
        btn.textContent = '📄 書類を生成';
      }
    });
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

/**
 * 書類生成API
 */
/**
 * 書類生成API (エラーログ追加版)
 */
async function handleExport(request, env, corsHeaders) {
  try {
    console.log('[handleExport] Starting export process');
    
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { year, term } = await request.json();
    console.log('[handleExport] Request params:', { year, term });

    // バリデーション
    if (!year || !term) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '年度と期を指定してください' 
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Lark APIクライアントを初期化
    console.log('[handleExport] Initializing Lark client');
    console.log('[handleExport] Env vars:', {
      hasAppId: !!env.LARK_APP_ID,
      hasAppSecret: !!env.LARK_APP_SECRET,
      hasAppToken: !!env.LARK_APP_TOKEN,
      hasTableId: !!env.LARK_TABLE_ID
    });
    
    const larkClient = new LarkClient(
      env.LARK_APP_ID,
      env.LARK_APP_SECRET,
      env.LARK_APP_TOKEN,
      env.LARK_TABLE_ID
    );

    // データを取得
    console.log('[handleExport] Fetching records from Lark');
    const records = await larkClient.getForecastRecords({ year });
    console.log('[handleExport] Fetched records:', records ? records.length : 0);
    
    // データを処理
    console.log('[handleExport] Processing records');
    const groupedData = larkClient.processRecords(records, { 
      year, 
      term, 
      excludeStatus: ['キャンセル'] 
    });
    console.log('[handleExport] Grouped data categories:', Object.keys(groupedData));
    
    const summary = larkClient.calculateSummary(groupedData);
    console.log('[handleExport] Summary calculated');

    // Excelファイルを生成(軽量版 - Cloudflare Workers対応)
    console.log('[handleExport] Generating Excel file');
    const generator = new ExcelSimple();
    const buffer = await generator.generateBudgetReport(groupedData, summary, year, term);
    console.log('[handleExport] Excel file generated, size:', buffer.byteLength);

    // R2に保存
    const filename = `神戸予算_${year}${term}_${Date.now()}.xlsx`;
    const key = `exports/${year}/${term}/${filename}`;
    console.log('[handleExport] Saving to R2:', key);
    
    if (env.BUDGET_FILES) {
      await env.BUDGET_FILES.put(key, buffer, {
        httpMetadata: {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      console.log('[handleExport] Saved to R2');
    } else {
      console.log('[handleExport] R2 bucket not configured, skipping save');
    }

    // ダウンロードURLを生成
    const downloadUrl = `/files/${key}`;
    console.log('[handleExport] Download URL:', downloadUrl);

    // ログをD1に保存(オプション)
    if (env.DB) {
      try {
        await env.DB.prepare(
          'INSERT INTO export_logs (year, term, filename, created_at) VALUES (?, ?, ?, ?)'
        ).bind(year, term, filename, new Date().toISOString()).run();
        console.log('[handleExport] Log saved to D1');
      } catch (error) {
        console.error('[handleExport] Failed to save log:', error);
      }
    }

    console.log('[handleExport] Export completed successfully');
    
    // R2が設定されていない場合は、Excelファイルを直接返す
    if (!env.BUDGET_FILES) {
      return new Response(buffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
        }
      });
    }
    
    // R2が設定されている場合は、ダウンロードURLを返す
    return new Response(JSON.stringify({
      success: true,
      filename,
      downloadUrl,
      summary: {
        totalRecords: Object.values(groupedData).flat().length,
        totalSalesPrice: summary.total ? summary.total.salesPrice : 0,
        totalProfit: summary.total ? summary.total.profit : 0,
        profitRate: summary.total ? summary.total.profitRate : 0
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[handleExport] Error:', error);
    console.error('[handleExport] Error message:', error.message);
    console.error('[handleExport] Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

}

/**
 * ステータスAPI
 */
function handleStatus(env, corsHeaders) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      hasLarkConfig: !!(env.LARK_APP_ID && env.LARK_APP_SECRET),
      hasR2Bucket: !!env.BUDGET_FILES,
      hasDatabase: !!env.DB
    }
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * ファイルダウンロード
 */
/**
 * Googleスプレッドシートへのエクスポート
 */
async function handleExportToSheets(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const { year, term, spreadsheetId } = await request.json();

  // バリデーション
  if (!year || !term || !spreadsheetId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: '年度、期、スプレッドシートIDを指定してください' 
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  // Lark APIクライアントを初期化
  const larkClient = new LarkClient(
    env.LARK_APP_ID,
    env.LARK_APP_SECRET,
    env.LARK_APP_TOKEN,
    env.LARK_TABLE_ID
  );

  // データを取得
  const records = await larkClient.getForecastRecords({ year });
  
  // データを処理
  const groupedData = larkClient.processRecords(records, { 
    year, 
    term, 
    excludeStatus: ['キャンセル'] 
  });
  
  const summary = larkClient.calculateSummary(groupedData);

  // Google Sheetsクライアントを初期化
  const sheetsClient = new SheetsClient(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );

  // スプレッドシートに書き込む
  const result = await sheetsClient.writeBudgetData(
    spreadsheetId,
    groupedData,
    summary,
    year,
    term
  );

  // ログをD1に保存(オプション)
  if (env.DB) {
    try {
      await env.DB.prepare(
        'INSERT INTO export_logs (year, term, filename, created_at) VALUES (?, ?, ?, ?)'
      ).bind(year, term, `spreadsheet_${spreadsheetId}`, new Date().toISOString()).run();
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    spreadsheetUrl: result.spreadsheetUrl,
    rowsWritten: result.rowsWritten,
    summary: result.summary
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * ファイルダウンロード
 */
async function handleFileDownload(pathname, env, corsHeaders) {
  const key = pathname.replace('/files/', '');
  
  const object = await env.BUDGET_FILES.get(key);
  
  if (!object) {
    return new Response('File Not Found', { 
      status: 404, 
      headers: corsHeaders 
    });
  }

  return new Response(object.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`
    }
  });
}
