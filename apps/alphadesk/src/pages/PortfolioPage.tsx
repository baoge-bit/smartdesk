import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Briefcase, Loader2, RefreshCw } from 'lucide-react';
import { decisionSignalsApi } from '@/api/decisionSignals';
import { portfolioApi } from '@/api/portfolio';
import { Pagination } from '@/components/common/Pagination';
import { PortfolioAllocationChart } from '@/components/portfolio/PortfolioAllocationChart';
import { PortfolioImportPanel } from '@/components/portfolio/PortfolioImportPanel';
import { PortfolioRiskPanel } from '@/components/portfolio/PortfolioRiskPanel';
import { PortfolioSnapshotView } from '@/components/portfolio/PortfolioSnapshotView';
import { PortfolioTradeForm, type TradeFormState } from '@/components/portfolio/PortfolioTradeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { useI18n } from '@/i18n';
import type { DecisionSignalItem, DecisionSignalMarket } from '@/types/decisionSignals';
import type {
  PortfolioAccountItem,
  PortfolioCostMethod,
  PortfolioImportBrokerItem,
  PortfolioImportCommitResponse,
  PortfolioImportParseResponse,
  PortfolioMarket,
  PortfolioRiskResponse,
  PortfolioSnapshotResponse,
  PortfolioTradeListItem,
} from '@/types/portfolio';

const SIGNAL_CONCURRENCY = 6;
const SIGNAL_MARKETS = new Set<DecisionSignalMarket>(['cn', 'hk', 'us', 'jp', 'kr']);

function toSignalMarket(value: string): DecisionSignalMarket | undefined {
  const normalized = value.toLowerCase();
  return SIGNAL_MARKETS.has(normalized as DecisionSignalMarket)
    ? (normalized as DecisionSignalMarket)
    : undefined;
}

function signalLookupKey(accountId: number, symbol: string, market: string): string {
  return `${accountId}:${symbol.toUpperCase()}:${market.toLowerCase()}`;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Math.min(Math.max(1, concurrency), items.length || 1);
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (nextIndex < items.length) {
        const idx = nextIndex++;
        results[idx] = await mapper(items[idx]);
      }
    }),
  );
  return results;
}

type AccountOption = 'all' | number;

const FALLBACK_BROKERS: PortfolioImportBrokerItem[] = [
  { broker: 'huatai', displayName: '华泰' },
  { broker: 'citic', displayName: '中信' },
  { broker: 'cmb', displayName: '招商' },
];

const TRADE_PAGE_SIZE = 10;

export default function PortfolioPage() {
  const { t } = useI18n();

  const [accounts, setAccounts] = useState<PortfolioAccountItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountOption>('all');
  const [costMethod, setCostMethod] = useState<PortfolioCostMethod>('fifo');
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const [snapshot, setSnapshot] = useState<PortfolioSnapshotResponse | null>(null);
  const [risk, setRisk] = useState<PortfolioRiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fxRefreshing, setFxRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);

  const [accountForm, setAccountForm] = useState({
    name: '',
    broker: 'Demo',
    market: 'cn' as PortfolioMarket,
    baseCurrency: 'CNY',
  });
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const [brokers, setBrokers] = useState<PortfolioImportBrokerItem[]>(FALLBACK_BROKERS);
  const [selectedBroker, setSelectedBroker] = useState('huatai');
  const [csvDryRun, setCsvDryRun] = useState(true);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvCommitting, setCsvCommitting] = useState(false);
  const [csvParseResult, setCsvParseResult] = useState<PortfolioImportParseResponse | null>(null);
  const [csvCommitResult, setCsvCommitResult] = useState<PortfolioImportCommitResponse | null>(null);

  const [trades, setTrades] = useState<PortfolioTradeListItem[]>([]);
  const [tradeTotal, setTradeTotal] = useState(0);
  const [tradePage, setTradePage] = useState(1);
  const [tradesLoading, setTradesLoading] = useState(false);

  const [positionAnalysisKey, setPositionAnalysisKey] = useState<string | null>(null);
  const [signalByPositionKey, setSignalByPositionKey] = useState<Map<string, DecisionSignalItem>>(
    () => new Map(),
  );
  const [signalsLoading, setSignalsLoading] = useState(false);
  const signalsRequestRef = useRef(0);

  const queryAccountId = selectedAccount === 'all' ? undefined : selectedAccount;
  const writableAccountId = selectedAccount === 'all' ? undefined : selectedAccount;
  const hasAccounts = accounts.length > 0;

  const selectClass =
    'flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50';

  const loadAccounts = useCallback(async () => {
    try {
      const items = await portfolioApi.getAccounts();
      setAccounts(items);
      setSelectedAccount((prev) => {
        if (items.length === 0) return 'all';
        if (prev !== 'all' && !items.some((a) => a.id === prev)) return items[0].id;
        return prev;
      });
      if (items.length === 0) setShowCreateAccount(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }, []);

  const loadSnapshotAndRisk = useCallback(async () => {
    if (!hasAccounts) return;
    setIsLoading(true);
    setRiskWarning(null);
    try {
      const snapshotData = await portfolioApi.getSnapshot({
        accountId: queryAccountId,
        costMethod,
      });
      setSnapshot(snapshotData);
      setError(null);

      try {
        const riskData = await portfolioApi.getRisk({
          accountId: queryAccountId,
          costMethod,
        });
        setRisk(riskData);
      } catch (riskErr) {
        setRisk(null);
        setRiskWarning(
          riskErr instanceof Error ? riskErr.message : t('portfolio.riskDegraded'),
        );
      }
    } catch (err) {
      setSnapshot(null);
      setRisk(null);
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [hasAccounts, queryAccountId, costMethod, t]);

  const loadTrades = useCallback(async (page = 1) => {
    setTradesLoading(true);
    try {
      const res = await portfolioApi.listTrades({
        accountId: queryAccountId,
        page,
        pageSize: TRADE_PAGE_SIZE,
      });
      setTrades(res.items);
      setTradeTotal(res.total);
      setTradePage(page);
    } catch {
      setTrades([]);
      setTradeTotal(0);
    } finally {
      setTradesLoading(false);
    }
  }, [queryAccountId]);

  const loadBrokers = useCallback(async () => {
    try {
      const items = await portfolioApi.listImportBrokers();
      if (items.length > 0) {
        setBrokers(items);
        if (!items.some((b) => b.broker === selectedBroker)) {
          setSelectedBroker(items[0].broker);
        }
      }
    } catch {
      setBrokers(FALLBACK_BROKERS);
    }
  }, [selectedBroker]);

  useEffect(() => {
    void loadAccounts();
    void loadBrokers();
  }, [loadAccounts, loadBrokers]);

  useEffect(() => {
    if (hasAccounts) {
      void loadSnapshotAndRisk();
      void loadTrades(1);
    }
  }, [hasAccounts, queryAccountId, costMethod, loadSnapshotAndRisk, loadTrades]);

  const handleRefresh = async () => {
    await loadAccounts();
    await loadSnapshotAndRisk();
    await loadTrades(tradePage);
  };

  const handleRefreshFx = async () => {
    setFxRefreshing(true);
    try {
      await portfolioApi.refreshFx(queryAccountId);
      await loadSnapshotAndRisk();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setFxRefreshing(false);
    }
  };

  const handleCreateAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;
    setAccountCreating(true);
    setAccountError(null);
    setAccountMessage(null);
    try {
      const created = await portfolioApi.createAccount({
        name: accountForm.name.trim(),
        broker: accountForm.broker || undefined,
        market: accountForm.market,
        baseCurrency: accountForm.baseCurrency,
      });
      setAccountMessage(t('portfolio.createSuccess'));
      setAccountForm((p) => ({ ...p, name: '' }));
      await loadAccounts();
      setSelectedAccount(created.id);
      setShowCreateAccount(false);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : t('portfolio.createFailed'));
    } finally {
      setAccountCreating(false);
    }
  };

  const handleSubmitTrade = async (form: TradeFormState) => {
    if (!writableAccountId) return;
    setTradeSubmitting(true);
    setTradeError(null);
    setTradeMessage(null);
    try {
      await portfolioApi.createTrade({
        accountId: writableAccountId,
        symbol: form.symbol.trim(),
        tradeDate: form.tradeDate,
        side: form.side,
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        fee: form.fee ? parseFloat(form.fee) : 0,
      });
      setTradeMessage(t('portfolio.tradeSuccess'));
      await loadSnapshotAndRisk();
      await loadTrades(1);
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : t('portfolio.tradeFailed'));
    } finally {
      setTradeSubmitting(false);
    }
  };

  const handleParseCsv = async (file: File) => {
    if (!writableAccountId) return;
    setCsvParsing(true);
    setCsvParseResult(null);
    try {
      const result = await portfolioApi.parseCsvImport(selectedBroker, file);
      setCsvParseResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setCsvParsing(false);
    }
  };

  const handleCommitCsv = async (file: File) => {
    if (!writableAccountId) return;
    setCsvCommitting(true);
    setCsvCommitResult(null);
    try {
      const result = await portfolioApi.commitCsvImport(
        writableAccountId,
        selectedBroker,
        file,
        csvDryRun,
      );
      setCsvCommitResult(result);
      if (!csvDryRun) {
        await loadSnapshotAndRisk();
        await loadTrades(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setCsvCommitting(false);
    }
  };

  const handleAnalyzePosition = async (symbol: string, accountId: number) => {
    const key = `${accountId}-${symbol}`;
    setPositionAnalysisKey(key);
    try {
      await portfolioApi.analyzePosition(symbol, accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setPositionAnalysisKey(null);
    }
  };

  const tradeTotalPages = Math.max(1, Math.ceil(tradeTotal / TRADE_PAGE_SIZE));

  const positionRows = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.accounts.flatMap((account) =>
      account.positions.map((pos) => ({
        ...pos,
        accountId: account.accountId,
        accountName: account.accountName,
      })),
    );
  }, [snapshot]);

  const positionSignalLookups = useMemo(() => {
    const seen = new Map<
      string,
      { accountId: number; symbol: string; market: string; signalMarket?: DecisionSignalMarket }
    >();
    for (const row of positionRows) {
      const symbol = row.symbol.trim();
      if (!symbol) continue;
      const market = row.market.toLowerCase();
      const key = signalLookupKey(row.accountId, symbol, market);
      if (!seen.has(key)) {
        seen.set(key, {
          accountId: row.accountId,
          symbol,
          market,
          signalMarket: toSignalMarket(row.market),
        });
      }
    }
    return Array.from(seen.values());
  }, [positionRows]);

  useEffect(() => {
    const requestId = signalsRequestRef.current + 1;
    signalsRequestRef.current = requestId;

    if (positionSignalLookups.length === 0) {
      setSignalByPositionKey(new Map());
      setSignalsLoading(false);
      return;
    }

    const loadSignals = async () => {
      setSignalsLoading(true);
      try {
        const results = await mapWithConcurrency(
          positionSignalLookups,
          SIGNAL_CONCURRENCY,
          async (lookup) => {
            try {
              const items = await decisionSignalsApi.getLatest(lookup.symbol, {
                market: lookup.signalMarket,
                limit: 1,
              });
              return { lookup, item: items[0] ?? null };
            } catch {
              return { lookup, item: null };
            }
          },
        );

        if (signalsRequestRef.current !== requestId) return;

        const map = new Map<string, DecisionSignalItem>();
        for (const { lookup, item } of results) {
          if (!item) continue;
          map.set(signalLookupKey(lookup.accountId, lookup.symbol, lookup.market), item);
        }
        setSignalByPositionKey(map);
      } finally {
        if (signalsRequestRef.current === requestId) {
          setSignalsLoading(false);
        }
      }
    };

    void loadSignals();
  }, [positionSignalLookups]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">{t('portfolio.title')}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isLoading || fxRefreshing}>
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isLoading ? t('portfolio.refreshing') : t('portfolio.refreshData')}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <p className="text-sm text-muted-foreground">{t('portfolio.description')}</p>
        <DisclaimerBanner compact />

        {error && <p className="text-xs text-bear">{error}</p>}
        {riskWarning && <p className="text-xs text-warning">{riskWarning}</p>}

        {!hasAccounts && (
          <p className="text-xs text-warning">{t('portfolio.noAccounts')}</p>
        )}

        {hasAccounts && (
          <Card>
            <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">{t('portfolio.accountView')}</p>
                <select
                  className={selectClass}
                  value={String(selectedAccount)}
                  onChange={(e) =>
                    setSelectedAccount(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                >
                  <option value="all">{t('portfolio.allAccounts')}</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (#{a.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">{t('portfolio.costMethod')}</p>
                <select
                  className={selectClass}
                  value={costMethod}
                  onChange={(e) => setCostMethod(e.target.value as PortfolioCostMethod)}
                >
                  <option value="fifo">{t('portfolio.fifo')}</option>
                  <option value="avg">{t('portfolio.avg')}</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateAccount((p) => !p)}
                >
                  {showCreateAccount ? t('portfolio.collapseCreate') : t('portfolio.createAccount')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => void handleRefreshFx()}
                  disabled={fxRefreshing || isLoading}
                >
                  {fxRefreshing ? t('portfolio.refreshing') : t('portfolio.refreshFx')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(showCreateAccount || !hasAccounts) && (
          <Card>
            <CardHeader>
              <CardTitle>{t('portfolio.createAccount')}</CardTitle>
            </CardHeader>
            <CardContent>
              {accountError && <p className="mb-2 text-xs text-bear">{accountError}</p>}
              {accountMessage && <p className="mb-2 text-xs text-bull">{accountMessage}</p>}
              <form className="grid grid-cols-1 gap-2 md:grid-cols-2" onSubmit={handleCreateAccount}>
                <Input
                  className="md:col-span-2"
                  placeholder={t('portfolio.accountName')}
                  value={accountForm.name}
                  onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <Input
                  placeholder={t('portfolio.broker')}
                  value={accountForm.broker}
                  onChange={(e) => setAccountForm((p) => ({ ...p, broker: e.target.value }))}
                />
                <Input
                  placeholder={t('portfolio.baseCurrency')}
                  value={accountForm.baseCurrency}
                  onChange={(e) =>
                    setAccountForm((p) => ({ ...p, baseCurrency: e.target.value.toUpperCase() }))
                  }
                />
                <select
                  className={selectClass}
                  value={accountForm.market}
                  onChange={(e) =>
                    setAccountForm((p) => ({ ...p, market: e.target.value as PortfolioMarket }))
                  }
                >
                  <option value="cn">A股 (cn)</option>
                  <option value="hk">港股 (hk)</option>
                  <option value="us">美股 (us)</option>
                  <option value="jp">日股 (jp)</option>
                  <option value="kr">韩股 (kr)</option>
                </select>
                <Button type="submit" disabled={accountCreating}>
                  {accountCreating ? t('portfolio.creating') : t('portfolio.createAccount')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading && !snapshot ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <PortfolioSnapshotView
              snapshot={snapshot}
              signalByPositionKey={signalByPositionKey}
              signalsLoading={signalsLoading}
              onAnalyze={handleAnalyzePosition}
              analyzingKey={positionAnalysisKey}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <PortfolioAllocationChart snapshot={snapshot} />
              <PortfolioRiskPanel risk={risk} currency={snapshot?.currency} />
              <PortfolioTradeForm
                disabled={!writableAccountId}
                submitting={tradeSubmitting}
                message={tradeMessage}
                error={tradeError}
                onSubmit={handleSubmitTrade}
              />
            </div>

            <PortfolioImportPanel
              brokers={brokers}
              selectedBroker={selectedBroker}
              onBrokerChange={setSelectedBroker}
              disabled={!writableAccountId}
              dryRun={csvDryRun}
              onDryRunChange={setCsvDryRun}
              parsing={csvParsing}
              committing={csvCommitting}
              parseResult={csvParseResult}
              commitResult={csvCommitResult}
              onParse={handleParseCsv}
              onCommit={handleCommitCsv}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t('portfolio.tradesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                ) : trades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('portfolio.noTrades')}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border text-xs text-muted-foreground">
                          <tr className="text-left">
                            <th className="py-2 pr-2">{t('portfolio.tradeDate')}</th>
                            <th className="py-2 pr-2">{t('portfolio.symbol')}</th>
                            <th className="py-2 pr-2">{t('portfolio.side')}</th>
                            <th className="py-2 pr-2 text-right">{t('portfolio.quantity')}</th>
                            <th className="py-2 text-right">{t('portfolio.price')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.map((trade) => (
                            <tr key={trade.id} className="border-b border-border/60">
                              <td className="py-2 pr-2 text-muted-foreground">{trade.tradeDate}</td>
                              <td className="py-2 pr-2 font-mono">{trade.symbol}</td>
                              <td className="py-2 pr-2">
                                {trade.side === 'buy' ? t('portfolio.buy') : t('portfolio.sell')}
                              </td>
                              <td className="py-2 pr-2 text-right tabular-nums">{trade.quantity}</td>
                              <td className="py-2 text-right tabular-nums">{trade.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={tradePage}
                      totalPages={tradeTotalPages}
                      onPageChange={(page) => void loadTrades(page)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}