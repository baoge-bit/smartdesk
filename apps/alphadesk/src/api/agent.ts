import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';

export interface StrategyInfo {
  id: string;
  name: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatSessionItem {
  sessionId: string;
  title: string;
  messageCount: number;
  createdAt?: string | null;
  lastActive?: string | null;
}

export interface ChatSessionMessagesResponse {
  sessionId: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt?: string | null;
  }>;
}

export const agentApi = {
  async listStrategies(): Promise<StrategyInfo[]> {
    const { data } = await apiClient.get('/api/v1/agent/strategies');
    return data?.strategies ?? data?.skills ?? [];
  },

  async listSessions(limit = 50): Promise<ChatSessionItem[]> {
    const { data } = await apiClient.get('/api/v1/agent/chat/sessions', {
      params: { limit },
    });
    const parsed = toCamelCase<{ sessions: ChatSessionItem[] }>(data);
    return parsed.sessions ?? [];
  },

  async getSessionMessages(sessionId: string, limit = 100): Promise<ChatSessionMessagesResponse> {
    const { data } = await apiClient.get(`/api/v1/agent/chat/sessions/${sessionId}`, {
      params: { limit },
    });
    return toCamelCase<ChatSessionMessagesResponse>(data);
  },

  async deleteSession(sessionId: string): Promise<{ deleted: number }> {
    const { data } = await apiClient.delete(`/api/v1/agent/chat/sessions/${sessionId}`);
    return toCamelCase<{ deleted: number }>(data);
  },

  async chat(payload: {
    message: string;
    sessionId?: string;
    strategies?: string[];
    stockCode?: string;
  }) {
    const { data } = await apiClient.post('/api/v1/agent/chat', {
      message: payload.message,
      session_id: payload.sessionId,
      strategies: payload.strategies,
      context: payload.stockCode ? { stock_code: payload.stockCode } : undefined,
    });
    return data;
  },

  async chatStream(
    payload: {
      message: string;
      sessionId?: string;
      strategies?: string[];
      stockCode?: string;
    },
    options?: { signal?: AbortSignal },
  ): Promise<Response> {
    const base = apiClient.defaults.baseURL || '';
    const url = `${base}/api/v1/agent/chat/stream`;
    const context = payload.stockCode ? { stock_code: payload.stockCode } : undefined;
    const skills = payload.strategies;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: payload.message,
        session_id: payload.sessionId,
        skills,
        context,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Stream failed: ${response.status}`);
    }

    return response;
  },
};