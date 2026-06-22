import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';
import type {
  SystemConfigItem,
  SystemConfigResponse,
  SystemConfigSchemaResponse,
} from '@/types/systemConfig';

export interface SchedulerStatusResponse {
  enabled: boolean;
  running?: boolean;
}

function flattenConfig(response: SystemConfigResponse): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of response.items ?? []) {
    out[item.key] = item.isMasked ? '' : item.value;
  }
  return out;
}

function buildUpdateItems(
  patch: Record<string, unknown>,
  original: SystemConfigItem[],
): Array<{ key: string; value: string }> {
  const byKey = new Map(original.map((item) => [item.key, item]));
  const items: Array<{ key: string; value: string }> = [];

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const prev = byKey.get(key);
    const next = String(value);

    if (prev?.isMasked && next.trim() === '') continue;
    if (prev && !prev.isMasked && next === prev.value) continue;

    items.push({ key, value: next });
  }

  return items;
}

export const systemApi = {
  async getConfigRaw(includeSchema = true): Promise<SystemConfigResponse> {
    const { data } = await apiClient.get('/api/v1/system/config', {
      params: { include_schema: includeSchema },
    });
    return toCamelCase<SystemConfigResponse>(data);
  },

  async getConfigSchema(): Promise<SystemConfigSchemaResponse> {
    const { data } = await apiClient.get('/api/v1/system/config/schema');
    return toCamelCase<SystemConfigSchemaResponse>(data);
  },

  /** Flat key-value map for simple forms */
  async getConfig(): Promise<Record<string, string>> {
    const raw = await systemApi.getConfigRaw(false);
    return flattenConfig(raw);
  },

  async updateConfig(
    patch: Record<string, unknown>,
    originalItems?: SystemConfigItem[],
  ) {
    const current = await systemApi.getConfigRaw(false);
    const source = originalItems ?? current.items;
    const items = buildUpdateItems(patch, source);

    if (items.length === 0) return null;

    const { data } = await apiClient.put('/api/v1/system/config', {
      config_version: current.configVersion,
      mask_token: current.maskToken ?? '******',
      reload_now: true,
      items,
    });
    return toCamelCase(data);
  },

  async getSetupStatus() {
    const { data } = await apiClient.get('/api/v1/system/config/setup/status');
    return toCamelCase(data);
  },

  async getSchedulerStatus(): Promise<SchedulerStatusResponse> {
    const { data } = await apiClient.get('/api/v1/system/scheduler/status');
    return toCamelCase<SchedulerStatusResponse>(data);
  },

  async toggleSchedule(enabled: boolean) {
    return systemApi.updateConfig({ SCHEDULE_ENABLED: enabled ? 'true' : 'false' });
  },

  async testLlmChannel(payload: {
    name?: string;
    protocol: string;
    baseUrl: string;
    apiKey?: string;
    models: string[];
    enabled?: boolean;
    timeoutSeconds?: number;
  }) {
    const { data } = await apiClient.post('/api/v1/system/config/llm/test-channel', {
      name: payload.name ?? 'channel',
      protocol: payload.protocol,
      base_url: payload.baseUrl,
      api_key: payload.apiKey ?? '',
      models: payload.models,
      enabled: payload.enabled ?? true,
      timeout_seconds: payload.timeoutSeconds ?? 20,
    });
    return toCamelCase<{
      success: boolean;
      message: string;
      error?: string;
      latencyMs?: number;
    }>(data);
  },

  async testNotificationChannel(payload: {
    channel: string;
    items?: Array<{ key: string; value: string }>;
    title?: string;
    content?: string;
    timeoutSeconds?: number;
  }) {
    const { data } = await apiClient.post('/api/v1/system/config/notification/test-channel', {
      channel: payload.channel,
      items: payload.items ?? [],
      mask_token: '******',
      title: payload.title ?? 'AlphaDesk',
      content: payload.content ?? 'Test notification',
      timeout_seconds: payload.timeoutSeconds ?? 20,
    });
    return toCamelCase<{
      success: boolean;
      message: string;
      errorCode?: string;
      latencyMs?: number;
    }>(data);
  },
};