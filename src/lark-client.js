/**
 * Lark API クライアント
 * Lark Baseから予実管理データを取得
 */

export class LarkClient {
  constructor(appId, appSecret, appToken, tableId) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.appToken = appToken;
    this.tableId = tableId;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * アクセストークンを取得
   */
  async getAccessToken() {
    // キャッシュされたトークンが有効な場合は再利用
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Lark API error: ${data.msg}`);
    }

    this.accessToken = data.tenant_access_token;
    // トークンの有効期限は2時間(7200秒)だが、安全のため1時間でキャッシュを破棄
    this.tokenExpiry = Date.now() + 3600 * 1000;

    return this.accessToken;
  }

  /**
   * 予実管理テーブルからレコードを取得
   * @param {Object} filter - フィルター条件
   * @returns {Array} レコードの配列
   */
  async getForecastRecords(filter = {}) {
    const token = await this.getAccessToken();
    const records = [];
    let pageToken = null;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(`https://open.larksuite.com/open-apis/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records`);
      
      // ページネーション
      if (pageToken) {
        url.searchParams.set('page_token', pageToken);
      }
      url.searchParams.set('page_size', '500');

      // フィルター条件を追加
      if (filter.year) {
        url.searchParams.set('filter', `CurrentValue.[年度] = ${filter.year}`);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch records: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`Lark API error: ${data.msg}`);
      }

      records.push(...data.data.items);

      hasMore = data.data.has_more;
      pageToken = data.data.page_token;
    }

    return records;
  }

  /**
   * レコードをフィルタリング・グループ化
   * @param {Array} records - レコードの配列
   * @param {Object} options - オプション
   * @returns {Object} グループ化されたデータ
   */
  processRecords(records, options = {}) {
    const { year, term, excludeStatus = ['キャンセル'] } = options;

    // フィルタリング
    let filtered = records;

    if (year) {
      filtered = filtered.filter(r => r.fields['年度'] === year);
    }

    if (term) {
      filtered = filtered.filter(r => r.fields['期'] === term);
    }

    if (excludeStatus.length > 0) {
      filtered = filtered.filter(r => !excludeStatus.includes(r.fields['ステータス']));
    }

    // 製品区分でグループ化
    const grouped = {};

    for (const record of filtered) {
      const category = record.fields['製品区分'] || 'その他';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        productCode: record.fields['製品型番'] || '',
        quantity: record.fields['予定数量'] || 0,
        salesPrice: record.fields['予定売価'] || 0,
        cost: record.fields['予定原価'] || 0,
        constructionCost: record.fields['予定工事費'] || 0,
        profit: record.fields['予定利益'] || 0,
        profitRate: record.fields['予定利益率'] || 0
      });
    }

    // 各カテゴリ内で製品型番でソート
    for (const category in grouped) {
      grouped[category].sort((a, b) => {
        if (a.productCode < b.productCode) return -1;
        if (a.productCode > b.productCode) return 1;
        return 0;
      });
    }

    return grouped;
  }

  /**
   * 集計データを計算
   * @param {Object} groupedData - グループ化されたデータ
   * @returns {Object} 集計データ
   */
  calculateSummary(groupedData) {
    const summary = {
      byCategory: {},
      total: {
        salesPrice: 0,
        cost: 0,
        constructionCost: 0,
        profit: 0
      }
    };

    for (const [category, items] of Object.entries(groupedData)) {
      const categoryTotal = {
        salesPrice: 0,
        cost: 0,
        constructionCost: 0,
        profit: 0,
        count: items.length
      };

      for (const item of items) {
        categoryTotal.salesPrice += item.salesPrice;
        categoryTotal.cost += item.cost;
        categoryTotal.constructionCost += item.constructionCost;
        categoryTotal.profit += item.profit;
      }

      categoryTotal.profitRate = categoryTotal.salesPrice > 0 
        ? categoryTotal.profit / categoryTotal.salesPrice 
        : 0;

      summary.byCategory[category] = categoryTotal;

      summary.total.salesPrice += categoryTotal.salesPrice;
      summary.total.cost += categoryTotal.cost;
      summary.total.constructionCost += categoryTotal.constructionCost;
      summary.total.profit += categoryTotal.profit;
    }

    summary.total.profitRate = summary.total.salesPrice > 0 
      ? summary.total.profit / summary.total.salesPrice 
      : 0;

    return summary;
  }
}
