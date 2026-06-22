export type DecisionSignalAction =
  | 'buy'
  | 'add'
  | 'hold'
  | 'reduce'
  | 'sell'
  | 'watch'
  | 'avoid'
  | 'alert';

export type DecisionSignalStatus = 'active' | 'expired' | 'invalidated' | 'closed' | 'archived';
export type DecisionSignalMarket = 'cn' | 'hk' | 'us' | 'jp' | 'kr';
export type DecisionSignalHorizon = 'intraday' | '1d' | '3d' | '5d' | '10d' | 'swing' | 'long';
export type DecisionSignalSourceType = 'analysis' | 'agent' | 'alert' | 'market_review' | 'manual';

export interface DecisionSignalItem {
  id: number;
  stockCode: string;
  stockName?: string | null;
  market: DecisionSignalMarket;
  sourceType: DecisionSignalSourceType;
  sourceAgent?: string | null;
  sourceReportId?: number | null;
  action: DecisionSignalAction;
  actionLabel?: string | null;
  confidence?: number | null;
  score?: number | null;
  horizon?: DecisionSignalHorizon | null;
  entryLow?: number | null;
  entryHigh?: number | null;
  stopLoss?: number | null;
  targetPrice?: number | null;
  reason?: string | null;
  riskSummary?: string | null;
  catalystSummary?: string | null;
  watchConditions?: string | null;
  invalidation?: string | null;
  status: DecisionSignalStatus;
  expiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DecisionSignalListParams {
  market?: DecisionSignalMarket;
  stockCode?: string;
  action?: DecisionSignalAction;
  sourceType?: DecisionSignalSourceType;
  status?: DecisionSignalStatus;
  holdingOnly?: boolean;
  accountId?: number;
  page?: number;
  pageSize?: number;
}

export interface DecisionSignalListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: DecisionSignalItem[];
}