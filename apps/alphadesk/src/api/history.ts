import { apiClient } from './client';
import type { DecisionReport } from './analysis';
import { mapAnalysisReportToDecision } from '@/lib/reportMapper';

export interface HistoryItem {
  id: number;
  queryId?: string;
  stockCode: string;
  stockName?: string;
  createdAt?: string;
  score?: number;
  trend?: string;
  summary?: string;
  reportType?: string;
}

function mapHistoryItem(raw: Record<string, unknown>): HistoryItem {
  return {
    id: Number(raw.id),
    queryId: raw.query_id as string | undefined,
    stockCode: (raw.stock_code as string) ?? '',
    stockName: raw.stock_name as string | undefined,
    createdAt: raw.created_at as string | undefined,
    score: raw.sentiment_score as number | undefined,
    trend: raw.trend_prediction as string | undefined,
    summary: raw.analysis_summary as string | undefined,
    reportType: raw.report_type as string | undefined,
  };
}

export const historyApi = {
  async list(params?: {
    stockCode?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: HistoryItem[]; total: number }> {
    const { data } = await apiClient.get('/api/v1/history', {
      params: {
        stock_code: params?.stockCode,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        start_date: params?.startDate,
        end_date: params?.endDate,
      },
    });
    const items = (data?.items ?? []).map((item: Record<string, unknown>) => mapHistoryItem(item));
    return { items, total: data?.total ?? items.length };
  },

  async getDetail(recordId: number): Promise<DecisionReport> {
    const { data } = await apiClient.get(`/api/v1/history/${recordId}`);
    return mapAnalysisReportToDecision(data);
  },

  async getMarkdown(recordId: number): Promise<string> {
    const { data } = await apiClient.get(`/api/v1/history/${recordId}/markdown`);
    return data?.content ?? '';
  },

  async getLatestByStock(stockCode: string): Promise<DecisionReport | null> {
    const { items } = await this.list({ stockCode, limit: 1 });
    if (!items.length || !items[0].id) return null;
    return this.getDetail(items[0].id);
  },

  async deleteRecords(recordIds: number[]) {
    const { data } = await apiClient.delete('/api/v1/history', {
      data: { record_ids: recordIds },
    });
    return data;
  },
};