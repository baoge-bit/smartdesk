import { useCallback, useEffect, useState } from 'react';
import { Activity, Loader2, RefreshCw } from 'lucide-react';
import { decisionSignalsApi } from '@/api/decisionSignals';
import { DecisionSignalCard } from '@/components/decision-signals/DecisionSignalCard';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { useI18n } from '@/i18n';
import { getActionLabel, getActionTone } from '@/lib/decisionAction';
import { Badge } from '@/components/ui/badge';
import type { DecisionSignalItem, DecisionSignalStatus } from '@/types/decisionSignals';

const PAGE_SIZE = 20;

export default function DecisionSignalsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<DecisionSignalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockCode, setStockCode] = useState('');
  const [status, setStatus] = useState<DecisionSignalStatus | ''>('active');
  const [selected, setSelected] = useState<DecisionSignalItem | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await decisionSignalsApi.list({
        stockCode: stockCode.trim() || undefined,
        status: status || undefined,
        page: p,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
      setError(null);
      setSelected((prev) => {
        if (!prev) return null;
        return res.items.find((i) => i.id === prev.id) ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [stockCode, status]);

  useEffect(() => {
    void load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectClass =
    'flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">{t('decisionSignals.title')}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load(page)} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="border-b border-border p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{t('decisionSignals.description')}</p>
        <DisclaimerBanner compact />
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-[180px]"
            placeholder={t('decisionSignals.stockCode')}
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && void load(1)}
          />
          <select
            className={`${selectClass} max-w-[160px]`}
            value={status}
            onChange={(e) => setStatus(e.target.value as DecisionSignalStatus | '')}
          >
            <option value="">{t('decisionSignals.statusAll')}</option>
            <option value="active">{t('decisionSignals.status.active')}</option>
            <option value="expired">{t('decisionSignals.status.expired')}</option>
            <option value="closed">{t('decisionSignals.status.closed')}</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => void load(1)}>
            {t('common.search')}
          </Button>
        </div>
        {error && <p className="text-xs text-bear">{error}</p>}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('decisionSignals.empty')}</p>
          ) : (
            <>
              {items.map((item) => (
                <DecisionSignalCard
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onClick={() => setSelected(item)}
                />
              ))}
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => void load(p)} />
            </>
          )}
        </div>

        {selected && (
          <aside className="hidden w-80 flex-shrink-0 overflow-y-auto border-l border-border p-4 lg:block">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{selected.stockName || selected.stockCode}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      getActionTone(selected.action) === 'success'
                        ? 'success'
                        : getActionTone(selected.action) === 'danger'
                          ? 'danger'
                          : 'outline'
                    }
                  >
                    {getActionLabel(selected.action, selected.actionLabel, t)}
                  </Badge>
                  <Badge variant="outline">{t(`decisionSignals.status.${selected.status}`)}</Badge>
                </div>
                {selected.reason && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('decisionSignals.reason')}</p>
                    <p className="mt-1">{selected.reason}</p>
                  </div>
                )}
                {selected.riskSummary && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('decisionSignals.riskSummary')}</p>
                    <p className="mt-1 text-warning">{selected.riskSummary}</p>
                  </div>
                )}
                {selected.catalystSummary && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('decisionSignals.catalystSummary')}</p>
                    <p className="mt-1">{selected.catalystSummary}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t('decisionSignals.entryRange')}</p>
                    <p>
                      {selected.entryLow != null && selected.entryHigh != null
                        ? `${selected.entryLow} – ${selected.entryHigh}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('decisionSignals.stopLoss')}</p>
                    <p>{selected.stopLoss ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('decisionSignals.targetPrice')}</p>
                    <p>{selected.targetPrice ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('decisionSignals.sourceReport')}</p>
                    <p>{selected.sourceReportId ? `#${selected.sourceReportId}` : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}