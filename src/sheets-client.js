/**
 * Google Sheets APIクライアント
 * Cloudflare WorkersからGoogle Sheetsに書き込む
 */

export class SheetsClient {
  constructor(serviceAccountEmail, privateKey) {
    this.serviceAccountEmail = serviceAccountEmail;
    this.privateKey = privateKey;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Google OAuth2アクセストークンを取得
   */
  async getAccessToken() {
    // キャッシュされたトークンが有効な場合は再利用
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // JWTを作成
    const jwt = await this.createJWT();

    // トークンエンドポイントにリクエスト
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // 60秒前に期限切れとみなす

    return this.accessToken;
  }

  /**
   * JWT(JSON Web Token)を作成
   */
  async createJWT() {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1時間後

    // JWTヘッダー
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    // JWTクレーム
    const claim = {
      iss: this.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    };

    // Base64URLエンコード
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedClaim = this.base64UrlEncode(JSON.stringify(claim));

    // 署名対象
    const signatureInput = `${encodedHeader}.${encodedClaim}`;

    // RS256で署名
    const signature = await this.sign(signatureInput);

    return `${signatureInput}.${signature}`;
  }

  /**
   * RS256署名を作成
   */
  async sign(data) {
    // 秘密鍵をインポート
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      this.pemToArrayBuffer(this.privateKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    // 署名
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(data)
    );

    return this.base64UrlEncode(signature);
  }

  /**
   * PEM形式の秘密鍵をArrayBufferに変換
   */
  pemToArrayBuffer(pem) {
    const b64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const binaryString = atob(b64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  /**
   * Base64URLエンコード
   */
  base64UrlEncode(data) {
    let base64;
    
    if (typeof data === 'string') {
      base64 = btoa(data);
    } else if (data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binary);
    } else {
      base64 = btoa(data);
    }
    
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * スプレッドシートにデータを書き込む
   */
  async writeData(spreadsheetId, range, values) {
    const accessToken = await this.getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to write data: ${error}`);
    }

    return await response.json();
  }

  /**
   * スプレッドシートをクリア
   */
  async clearSheet(spreadsheetId, range) {
    const accessToken = await this.getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to clear sheet: ${error}`);
    }

    return await response.json();
  }

  /**
   * スプレッドシートのフォーマットを設定
   */
  async formatSheet(spreadsheetId, requests) {
    const accessToken = await this.getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: requests
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to format sheet: ${error}`);
    }

    return await response.json();
  }

  /**
   * 予実管理データをスプレッドシートに書き込む
   */
  async writeBudgetData(spreadsheetId, groupedData, summary, year, term) {
    // シートをクリア
    await this.clearSheet(spreadsheetId, 'A1:Z1000');

    // データを準備
    const values = [];

    // ヘッダー行
    values.push([
      `神戸営業所 ${year}年度${term} 予算`,
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    values.push([]); // 空行

    // 列ヘッダー
    values.push([
      'カテゴリ',
      '型式',
      '顧客名',
      '売価(千円)',
      '原価(千円)',
      '利益(千円)',
      '利益率(%)'
    ]);

    // カテゴリ順序
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
    let totalProfit = 0;

    // カテゴリごとにデータを書き込む
    for (const category of categoryOrder) {
      const records = groupedData[category] || [];
      
      if (records.length === 0) continue;

      let categorySalesPrice = 0;
      let categoryCost = 0;
      let categoryProfit = 0;

      // レコードを書き込む
      for (const record of records) {
        const salesPrice = Math.round((record.salesPrice || 0) / 1000);
        const cost = Math.round((record.cost || 0) / 1000);
        const profit = salesPrice - cost;
        const profitRate = salesPrice > 0 ? (profit / salesPrice * 100).toFixed(1) : '0.0';

        values.push([
          category.replace(/^\d+_/, ''), // カテゴリ名(番号を除去)
          record.productModel || '',
          record.customerName || '',
          salesPrice,
          cost,
          profit,
          profitRate
        ]);

        categorySalesPrice += salesPrice;
        categoryCost += cost;
        categoryProfit += profit;
      }

      // カテゴリ小計
      const categoryProfitRate = categorySalesPrice > 0 
        ? (categoryProfit / categorySalesPrice * 100).toFixed(1) 
        : '0.0';

      values.push([
        `${category.replace(/^\d+_/, '')} 小計`,
        '',
        '',
        categorySalesPrice,
        categoryCost,
        categoryProfit,
        categoryProfitRate
      ]);

      values.push([]); // 空行

      totalSalesPrice += categorySalesPrice;
      totalCost += categoryCost;
      totalProfit += categoryProfit;
    }

    // 合計
    const totalProfitRate = totalSalesPrice > 0 
      ? (totalProfit / totalSalesPrice * 100).toFixed(1) 
      : '0.0';

    values.push([
      '合計',
      '',
      '',
      totalSalesPrice,
      totalCost,
      totalProfit,
      totalProfitRate
    ]);

    // データを書き込む
    await this.writeData(spreadsheetId, 'A1', values);

    // フォーマットを設定
    const requests = [
      // ヘッダー行を太字に
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 7
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 14
              }
            }
          },
          fields: 'userEnteredFormat.textFormat'
        }
      },
      // 列ヘッダーを太字に
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 2,
            endRowIndex: 3,
            startColumnIndex: 0,
            endColumnIndex: 7
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true
              },
              backgroundColor: {
                red: 0.9,
                green: 0.9,
                blue: 0.9
              }
            }
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      },
      // 数値列を右揃えに
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 3,
            startColumnIndex: 3,
            endColumnIndex: 7
          },
          cell: {
            userEnteredFormat: {
              horizontalAlignment: 'RIGHT'
            }
          },
          fields: 'userEnteredFormat.horizontalAlignment'
        }
      }
    ];

    await this.formatSheet(spreadsheetId, requests);

    return {
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      rowsWritten: values.length,
      summary: {
        totalSalesPrice,
        totalCost,
        totalProfit,
        totalProfitRate
      }
    };
  }
}
