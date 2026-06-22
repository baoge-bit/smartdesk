import { Badge } from '@/components/ui/badge';
import { PortfolioSignalSummary } from '@/components/decision-signals/PortfolioSignalSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { formatMoney, formatSignedPct } from '@/lib/portfolioFormat';
import type { DecisionSignalItem } from '@/types/decisionSignals';
import type { PortfolioAccountSnapshot, PortfolioSnapshotResponse } from '@/types/portfolio';

type FlatPosition = {
  accountId: number;
  accountName: string;
  symbol: string;
  market: string;
  quantity: number;
  avgCost: number;
  lastPrice: number;
  marketValueBase: number;
  unrealizedPnlBase: number;
  unrealizedPnlPct?: number | null;
  priceAvailable?: boolean;
};

function flattenPositions(snapshot: PortfolioSnapshotResponse): FlatPosition[] {
  return snapshot.accounts.flatMap((account: PortfolioAccountSnapshot) =>
    account.positions.map((pos) => ({
      accountId: account.accountId,
      accountName: account.accountName,
      ...pos,
    })),
  );
}

interface PortfolioSnapshotViewProps {
  snapshot: PortfolioSnapshotResponse | null;
  signalByPositionKey?: Map<string, DecisionSignalItem>;
  signalsLoading?: boolean;
  onAnalyze?: (symbol: string, accountId: number) => void;
  analyzingKey?: string | null;
}

function positionKey(accountId: number, symbol: string, market: string): string {
  return `${accountId}:${symbol.toUpperCase()}:${market.toLowerCase()}`;
}

export function PortfolioSnapshotView({
  snapshot,
  signalByPositionKey,
  signalsLoading,
  onAnalyze,
  analyzingKey,
}: PortfolioSnapshotViewProps) {
  const { t } = useI18n();
  const positions = snapshot ? flattenPositions(snapshot) : [];
  const currency = snapshot?.currency || 'CNY';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalEquity')}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(snapshot?.totalEquity, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalMarketValue')}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(snapshot?.totalMarketValue, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalCash')}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(snapshot?.totalCash, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('portfolio.fxStatus')}</p>
            <div className="mt-2">
              {snapshot?.fxStale ? (
                <Badge variant="warning">{t('portfolio.fxStale')}</Badge>
              ) : (
                <Badge variant="success">{t('portfolio.fxLatest')}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('portfolio.positionsTitle')}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {t('portfolio.positionCount', { count: positions.length })}
          </span>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p className="font-medium">{t('portfolio.noPositionsTitle')}</p>
              <p className="mt-1 text-xs">{t('portfolio.noPositionsDescription')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2 pr-2">{t('portfolio.account')}</th>
                    <th className="py-2 pr-2">{t('portfolio.symbol')}</th>
                    <th className="py-2 pr-2 text-right">{t('portfolio.quantity')}</th>
                    <th className="py-2 pr-2 text-right">{t('portfolio.avgCost')}</th>
                    <th className="py-2 pr-2 text-right">{t('portfolio.lastPrice')}</th>
                    <th className="py-2 pr-2 text-right">{t('portfolio.marketValue')}</th>
                    <th className="py-2 pr-2 text-right">{t('portfolio.unrealizedPnl')}</th>
                    <th className="py-2 pr-2 text-right">{t('portfolio.returnPct')}</th>
                    <th className="py-2 pr-2 text-right">{t('decisionSignals.portfolioColumn')}</th>
                    {onAnalyze && <th className="py-2 text-right">{t('portfolio.analyze')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((row) => {
                    const rowKey = `${row.accountId}-${row.symbol}-${row.market}`;
                    const pnlPositive = row.unrealizedPnlBase >= 0;
                    return (
                      <tr key={rowKey} className="border-b border-border/60">
                        <td className="py-2 pr-2 text-muted-foreground">{row.accountName}</td>
                        <td className="py-2 pr-2 font-mono">{row.symbol}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">{row.quantity.toFixed(2)}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">{row.avgCost.toFixed(4)}</td>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {row.priceAvailable === false ? '—' : row.lastPrice.toFixed(4)}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {formatMoney(row.marketValueBase, currency)}
                        </td>
                        <td
                          className={`py-2 pr-2 text-right tabular-nums ${
                            pnlPositive ? 'text-bull' : 'text-bear'
                          }`}
                        >
                          {formatMoney(row.unrealizedPnlBase, currency)}
                        </td>
                        <td
                          className={`py-2 pr-2 text-right tabular-nums ${
                            (row.unrealizedPnlPct ?? 0) >= 0 ? 'text-bull' : 'text-bear'
                          }`}
                        >
                          {formatSignedPct(row.unrealizedPnlPct)}
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <PortfolioSignalSummary
                            item={signalByPositionKey?.get(positionKey(row.accountId, row.symbol, row.market))}
                            loading={signalsLoading}
                          />
                        </td>
                        {onAnalyze && (
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline disabled:opacity-50"
                              disabled={analyzingKey === rowKey}
                              onClick={() => onAnalyze(row.symbol, row.accountId)}
                            >
                              {analyzingKey === rowKey ? t('portfolio.analyzing') : t('portfolio.analyze')}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}