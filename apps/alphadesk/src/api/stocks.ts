import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';

export type ExtractItem = {
  code?: string | null;
  name?: string | null;
  confidence: string;
};

export type ExtractFromImageResponse = {
  codes: string[];
  items?: ExtractItem[];
  rawText?: string;
};

export type StockQuote = {
  stockCode: string;
  stockName?: string;
  currentPrice: number;
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  volume?: number;
  amount?: number;
  updateTime?: string;
};

export type KLineBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  amount?: number;
  changePercent?: number;
};

export type StockHistoryResponse = {
  stockCode: string;
  stockName?: string;
  period: string;
  data: KLineBar[];
};

export const stocksApi = {
  async extractFromImage(file: File): Promise<ExtractFromImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/api/v1/stocks/extract-from-image', formData, {
      headers: { 'Content-Type': undefined as unknown as string },
      timeout: 60_000,
    });
    return {
      codes: data.codes ?? [],
      items: data.items,
      rawText: data.raw_text,
    };
  },

  async parseImport(file?: File, text?: string): Promise<ExtractFromImageResponse> {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/api/v1/stocks/parse-import', formData, {
        headers: { 'Content-Type': undefined as unknown as string },
      });
      return { codes: data.codes ?? [], items: data.items };
    }
    if (text) {
      const { data } = await apiClient.post('/api/v1/stocks/parse-import', { text });
      return { codes: data.codes ?? [], items: data.items };
    }
    throw new Error('Provide a file or pasted text');
  },

  async addToWatchlist(stockCode: string) {
    const { data } = await apiClient.post('/api/v1/stocks/watchlist/add', {
      stock_code: stockCode,
    });
    return data;
  },

  async getWatchlist(): Promise<string[]> {
    const { data } = await apiClient.get('/api/v1/stocks/watchlist');
    return data?.stock_codes ?? data?.stockCodes ?? [];
  },

  async getQuote(stockCode: string): Promise<StockQuote> {
    const { data } = await apiClient.get(`/api/v1/stocks/${encodeURIComponent(stockCode)}/quote`);
    return toCamelCase<StockQuote>(data);
  },

  async getHistory(
    stockCode: string,
    params: { period?: 'daily' | 'weekly' | 'monthly'; days?: number } = {},
  ): Promise<StockHistoryResponse> {
    const { data } = await apiClient.get(
      `/api/v1/stocks/${encodeURIComponent(stockCode)}/history`,
      {
        params: {
          period: params.period ?? 'daily',
          days: params.days ?? 60,
        },
      },
    );
    const parsed = toCamelCase<StockHistoryResponse>(data);
    return {
      ...parsed,
      data: (parsed.data ?? []).map((bar) => toCamelCase<KLineBar>(bar)),
    };
  },
};