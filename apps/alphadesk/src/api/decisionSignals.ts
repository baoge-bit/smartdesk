import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';
import type {
  DecisionSignalItem,
  DecisionSignalListParams,
  DecisionSignalListResponse,
} from '@/types/decisionSignals';

function toListParams(params: DecisionSignalListParams = {}): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    page_size: params.pageSize ?? 20,
  };
  if (params.market) query.market = params.market;
  if (params.stockCode) query.stock_code = params.stockCode;
  if (params.action) query.action = params.action;
  if (params.sourceType) query.source_type = params.sourceType;
  if (params.status) query.status = params.status;
  if (params.holdingOnly) query.holding_only = true;
  if (params.accountId != null) query.account_id = params.accountId;
  return query;
}

function toItem(data: Record<string, unknown>): DecisionSignalItem {
  return toCamelCase<DecisionSignalItem>(data);
}

export const decisionSignalsApi = {
  async list(params: DecisionSignalListParams = {}): Promise<DecisionSignalListResponse> {
    const { data } = await apiClient.get('/api/v1/decision-signals', {
      params: toListParams(params),
    });
    const parsed = toCamelCase<DecisionSignalListResponse>(data);
    return {
      ...parsed,
      items: (parsed.items ?? []).map((item) => toItem(item as unknown as Record<string, unknown>)),
    };
  },

  async getLatest(
    stockCode: string,
    params: { market?: string; limit?: number } = {},
  ): Promise<DecisionSignalItem[]> {
    if (stockCode.includes('/')) {
      throw new Error('Invalid stock code for signal lookup');
    }
    const query: Record<string, string | number> = {};
    if (params.market) query.market = params.market;
    if (params.limit) query.limit = params.limit;
    const { data } = await apiClient.get(
      `/api/v1/decision-signals/latest/${encodeURIComponent(stockCode)}`,
      { params: query },
    );
    const parsed = toCamelCase<{ items: DecisionSignalItem[] }>(data);
    return (parsed.items ?? []).map((item) => toItem(item as unknown as Record<string, unknown>));
  },

  async get(signalId: number): Promise<DecisionSignalItem> {
    const { data } = await apiClient.get(`/api/v1/decision-signals/${signalId}`);
    return toItem(data as Record<string, unknown>);
  },
};