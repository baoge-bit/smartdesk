import { apiClient } from './client';
import { toCamelCase } from '@/lib/caseConvert';
import type {
  PortfolioAccountItem,
  PortfolioCostMethod,
  PortfolioImportBrokerItem,
  PortfolioImportCommitResponse,
  PortfolioImportParseResponse,
  PortfolioRiskResponse,
  PortfolioSide,
  PortfolioSnapshotResponse,
  PortfolioTradeListItem,
} from '@/types/portfolio';

export const portfolioApi = {
  async getAccounts(): Promise<PortfolioAccountItem[]> {
    const { data } = await apiClient.get('/api/v1/portfolio/accounts');
    const parsed = toCamelCase<{ accounts: PortfolioAccountItem[] }>(data);
    return parsed.accounts ?? [];
  },

  async createAccount(payload: {
    name: string;
    broker?: string;
    market: string;
    baseCurrency: string;
  }): Promise<PortfolioAccountItem> {
    const { data } = await apiClient.post('/api/v1/portfolio/accounts', {
      name: payload.name,
      broker: payload.broker,
      market: payload.market,
      base_currency: payload.baseCurrency,
    });
    return toCamelCase<PortfolioAccountItem>(data);
  },

  async getSnapshot(query: {
    accountId?: number;
    costMethod?: PortfolioCostMethod;
  } = {}): Promise<PortfolioSnapshotResponse> {
    const params: Record<string, string | number> = {};
    if (query.accountId != null) params.account_id = query.accountId;
    if (query.costMethod) params.cost_method = query.costMethod;
    const { data } = await apiClient.get('/api/v1/portfolio/snapshot', { params });
    return toCamelCase<PortfolioSnapshotResponse>(data);
  },

  async getRisk(query: {
    accountId?: number;
    costMethod?: PortfolioCostMethod;
  } = {}): Promise<PortfolioRiskResponse> {
    const params: Record<string, string | number> = {};
    if (query.accountId != null) params.account_id = query.accountId;
    if (query.costMethod) params.cost_method = query.costMethod;
    const { data } = await apiClient.get('/api/v1/portfolio/risk', { params });
    return toCamelCase<PortfolioRiskResponse>(data);
  },

  async refreshFx(accountId?: number) {
    const params: Record<string, number> = {};
    if (accountId != null) params.account_id = accountId;
    const { data } = await apiClient.post('/api/v1/portfolio/fx/refresh', undefined, { params });
    return toCamelCase(data);
  },

  async createTrade(payload: {
    accountId: number;
    symbol: string;
    tradeDate: string;
    side: PortfolioSide;
    quantity: number;
    price: number;
    fee?: number;
    market?: string;
    currency?: string;
  }) {
    const { data } = await apiClient.post('/api/v1/portfolio/trades', {
      account_id: payload.accountId,
      symbol: payload.symbol,
      trade_date: payload.tradeDate,
      side: payload.side,
      quantity: payload.quantity,
      price: payload.price,
      fee: payload.fee ?? 0,
      market: payload.market,
      currency: payload.currency,
    });
    return toCamelCase(data);
  },

  async listTrades(query: {
    accountId?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: PortfolioTradeListItem[]; total: number }> {
    const params: Record<string, number> = {
      page: query.page ?? 1,
      page_size: query.pageSize ?? 20,
    };
    if (query.accountId != null) params.account_id = query.accountId;
    const { data } = await apiClient.get('/api/v1/portfolio/trades', { params });
    const parsed = toCamelCase<{ items: PortfolioTradeListItem[]; total: number }>(data);
    return { items: parsed.items ?? [], total: parsed.total ?? 0 };
  },

  async analyzePosition(symbol: string, accountId?: number) {
    const { data } = await apiClient.post(
      `/api/v1/portfolio/positions/${encodeURIComponent(symbol)}/analysis`,
      { account_id: accountId, analysis_phase: 'auto' },
    );
    return toCamelCase(data);
  },

  async listImportBrokers(): Promise<PortfolioImportBrokerItem[]> {
    const { data } = await apiClient.get('/api/v1/portfolio/imports/csv/brokers');
    const parsed = toCamelCase<{ brokers: PortfolioImportBrokerItem[] }>(data);
    return parsed.brokers ?? [];
  },

  async parseCsvImport(broker: string, file: File): Promise<PortfolioImportParseResponse> {
    const form = new FormData();
    form.append('broker', broker);
    form.append('file', file);
    const { data } = await apiClient.post('/api/v1/portfolio/imports/csv/parse', form, {
      headers: { 'Content-Type': undefined as unknown as string },
    });
    return toCamelCase<PortfolioImportParseResponse>(data);
  },

  async commitCsvImport(
    accountId: number,
    broker: string,
    file: File,
    dryRun = false,
  ): Promise<PortfolioImportCommitResponse> {
    const form = new FormData();
    form.append('account_id', String(accountId));
    form.append('broker', broker);
    form.append('dry_run', dryRun ? 'true' : 'false');
    form.append('file', file);
    const { data } = await apiClient.post('/api/v1/portfolio/imports/csv/commit', form, {
      headers: { 'Content-Type': undefined as unknown as string },
    });
    return toCamelCase<PortfolioImportCommitResponse>(data);
  },
};