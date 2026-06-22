import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';
import type {
  BacktestPhaseFilter,
  BacktestResultItem,
  BacktestResultsResponse,
  BacktestRunRequest,
  BacktestRunResponse,
  PerformanceMetrics,
} from '@/types/backtest';

export const backtestApi = {
  async run(params: BacktestRunRequest = {}): Promise<BacktestRunResponse> {
    const { data } = await apiClient.post('/api/v1/backtest/run', {
      code: params.code,
      force: params.force,
      eval_window_days: params.evalWindowDays,
      min_age_days: params.minAgeDays,
      limit: params.limit,
    });
    return toCamelCase<BacktestRunResponse>(data);
  },

  async getResults(params: {
    code?: string;
    evalWindowDays?: number;
    analysisDateFrom?: string;
    analysisDateTo?: string;
    analysisPhase?: BacktestPhaseFilter;
    page?: number;
    limit?: number;
  } = {}): Promise<BacktestResultsResponse> {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.code) query.code = params.code;
    if (params.evalWindowDays) query.eval_window_days = params.evalWindowDays;
    if (params.analysisDateFrom) query.analysis_date_from = params.analysisDateFrom;
    if (params.analysisDateTo) query.analysis_date_to = params.analysisDateTo;
    if (params.analysisPhase && params.analysisPhase !== 'all') {
      query.analysis_phase = params.analysisPhase;
    }

    const { data } = await apiClient.get('/api/v1/backtest/results', { params: query });
    const parsed = toCamelCase<BacktestResultsResponse>(data);
    return {
      ...parsed,
      items: (parsed.items ?? []).map((i) => toCamelCase<BacktestResultItem>(i)),
    };
  },

  async getOverallPerformance(params: {
    evalWindowDays?: number;
    analysisDateFrom?: string;
    analysisDateTo?: string;
    analysisPhase?: BacktestPhaseFilter;
  } = {}): Promise<PerformanceMetrics | null> {
    try {
      const query: Record<string, string | number> = {};
      if (params.evalWindowDays) query.eval_window_days = params.evalWindowDays;
      if (params.analysisDateFrom) query.analysis_date_from = params.analysisDateFrom;
      if (params.analysisDateTo) query.analysis_date_to = params.analysisDateTo;
      if (params.analysisPhase && params.analysisPhase !== 'all') {
        query.analysis_phase = params.analysisPhase;
      }
      const { data } = await apiClient.get('/api/v1/backtest/performance', { params: query });
      return toCamelCase<PerformanceMetrics>(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw err;
    }
  },

  async getStockPerformance(
    code: string,
    params: {
      evalWindowDays?: number;
      analysisDateFrom?: string;
      analysisDateTo?: string;
      analysisPhase?: BacktestPhaseFilter;
    } = {},
  ): Promise<PerformanceMetrics | null> {
    try {
      const query: Record<string, string | number> = {};
      if (params.evalWindowDays) query.eval_window_days = params.evalWindowDays;
      if (params.analysisDateFrom) query.analysis_date_from = params.analysisDateFrom;
      if (params.analysisDateTo) query.analysis_date_to = params.analysisDateTo;
      if (params.analysisPhase && params.analysisPhase !== 'all') {
        query.analysis_phase = params.analysisPhase;
      }
      const { data } = await apiClient.get(
        `/api/v1/backtest/performance/${encodeURIComponent(code)}`,
        { params: query },
      );
      return toCamelCase<PerformanceMetrics>(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw err;
    }
  },
};