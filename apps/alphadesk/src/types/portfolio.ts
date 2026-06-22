export type PortfolioCostMethod = 'fifo' | 'avg';
export type PortfolioSide = 'buy' | 'sell';
export type PortfolioMarket = 'cn' | 'hk' | 'us' | 'jp' | 'kr';

export interface PortfolioAccountItem {
  id: number;
  name: string;
  broker?: string | null;
  market: PortfolioMarket;
  baseCurrency: string;
  isActive: boolean;
}

export interface PortfolioPositionItem {
  symbol: string;
  market: string;
  currency: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  lastPrice: number;
  marketValueBase: number;
  unrealizedPnlBase: number;
  unrealizedPnlPct?: number | null;
  priceAvailable?: boolean;
}

export interface PortfolioAccountSnapshot {
  accountId: number;
  accountName: string;
  broker?: string | null;
  market: string;
  baseCurrency: string;
  asOf: string;
  costMethod: PortfolioCostMethod;
  totalCash: number;
  totalMarketValue: number;
  totalEquity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positions: PortfolioPositionItem[];
}

export interface PortfolioSnapshotResponse {
  asOf: string;
  costMethod: PortfolioCostMethod;
  currency: string;
  totalCash: number;
  totalMarketValue: number;
  totalEquity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  fxStale: boolean;
  accounts: PortfolioAccountSnapshot[];
}

export interface PortfolioConcentrationItem {
  symbol: string;
  marketValueBase: number;
  weightPct: number;
  isAlert: boolean;
}

export interface PortfolioRiskResponse {
  asOf: string;
  currency: string;
  concentration: PortfolioConcentrationItem[];
  drawdown?: {
    maxDrawdownPct: number;
    currentDrawdownPct: number;
    alert: boolean;
  };
}

export interface PortfolioTradeListItem {
  id: number;
  accountId: number;
  symbol: string;
  tradeDate: string;
  side: PortfolioSide;
  quantity: number;
  price: number;
  fee?: number;
  market?: string;
  currency?: string;
}

export interface PortfolioImportBrokerItem {
  broker: string;
  displayName: string;
  aliases?: string[];
}

export interface PortfolioImportParseResponse {
  broker: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview?: Array<Record<string, unknown>>;
}

export interface PortfolioImportCommitResponse {
  dryRun: boolean;
  imported: number;
  skipped: number;
  errors: number;
  message?: string;
}