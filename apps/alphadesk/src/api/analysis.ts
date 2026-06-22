import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';

export interface TaskInfo {
  taskId: string;
  status: 'pending' | 'running' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  stage?: string;
  message?: string;
  etaSeconds?: number;
  stockCode?: string;
  stockName?: string;
}

export interface AnalysisTaskStatus {
  taskId: string;
  status: string;
  progress?: number;
  error?: string;
  stockName?: string;
}

export interface DecisionReport {
  recordId?: number;
  stockCode: string;
  stockName?: string;
  score?: number;
  trend?: string;
  conclusion?: string;
  summary?: string;
  entryPoints?: string[];
  exitPoints?: string[];
  risks?: string[];
  catalysts?: string[];
  checklist?: string[];
  markdown?: string;
  createdAt?: string;
}

export interface RunAnalysisResponse {
  taskId?: string;
  accepted?: Array<{ taskId: string; stockCode?: string }>;
}

function mapTaskInfo(raw: Record<string, unknown>): TaskInfo {
  const camel = toCamelCase<TaskInfo>(raw);
  const status = String(camel.status ?? raw.status ?? '');
  return {
    ...camel,
    taskId: camel.taskId ?? String(raw.task_id ?? ''),
    status: status === 'processing' ? 'running' : (status as TaskInfo['status']),
  };
}

export const analysisApi = {
  async health(): Promise<{ status: string }> {
    const { data } = await apiClient.get('/api/health');
    return data;
  },

  async runWatchlist(options?: { codes?: string[]; forceRefresh?: boolean }) {
    const { data } = await apiClient.post(
      '/api/v1/analysis/analyze',
      {
        stock_codes: options?.codes,
        async_mode: true,
        force_refresh: options?.forceRefresh ?? false,
        notify: false,
      },
      { validateStatus: (s) => s >= 200 && s < 300 },
    );
    return toCamelCase<RunAnalysisResponse>(data);
  },

  async runSingle(
    stockCode: string,
    options?: { forceRefresh?: boolean; notify?: boolean },
  ): Promise<RunAnalysisResponse> {
    const { data } = await apiClient.post(
      '/api/v1/analysis/analyze',
      {
        stock_code: stockCode,
        async_mode: true,
        force_refresh: options?.forceRefresh ?? true,
        notify: options?.notify ?? false,
      },
      { validateStatus: (s) => s >= 200 && s < 300 },
    );
    const parsed = toCamelCase<RunAnalysisResponse & { accepted?: Array<{ taskId: string }> }>(data);
    if (!parsed.taskId && parsed.accepted?.[0]?.taskId) {
      parsed.taskId = parsed.accepted[0].taskId;
    }
    return parsed;
  },

  async getTaskStatus(taskId: string): Promise<AnalysisTaskStatus> {
    const { data } = await apiClient.get(`/api/v1/analysis/status/${taskId}`);
    return toCamelCase<AnalysisTaskStatus>(data);
  },

  async waitForTask(
    taskId: string,
    options?: { timeoutMs?: number; intervalMs?: number },
  ): Promise<AnalysisTaskStatus> {
    const timeoutMs = options?.timeoutMs ?? 300_000;
    const intervalMs = options?.intervalMs ?? 2000;
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      const status = await analysisApi.getTaskStatus(taskId);
      const normalized = status.status?.toLowerCase();
      if (normalized === 'completed') return status;
      if (normalized === 'failed' || normalized === 'cancelled') {
        throw new Error(status.error || `Task ${normalized}`);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error('Analysis timed out');
  },

  async getTasks(): Promise<TaskInfo[]> {
    const { data } = await apiClient.get('/api/v1/analysis/tasks');
    const tasks = data?.tasks ?? [];
    return Array.isArray(tasks)
      ? tasks.map((t: Record<string, unknown>) => mapTaskInfo(t))
      : [];
  },

  async cancelTask(taskId: string) {
    const { data } = await apiClient.post(`/api/v1/analysis/tasks/${taskId}/cancel`);
    return data;
  },

  async getLatestReport(stockCode: string): Promise<DecisionReport | null> {
    const { historyApi } = await import('./history');
    return historyApi.getLatestByStock(stockCode);
  },
};