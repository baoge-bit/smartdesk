import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, GitCompare, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/components/export/ExportMenu';
import { ReportRerunButton } from '@/components/reports/ReportRerunButton';
import { ReportComparePanel } from '@/components/reports/ReportComparePanel';
import { ReportDetailPanel } from '@/components/reports/ReportDetailPanel';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { historyApi, type HistoryItem } from '@/api/history';
import { useI18n } from '@/i18n';
import { cn, formatScore } from '@/lib/utils';

export default function ReportsPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [compareMode, setCompareMode] = useState(searchParams.get('mode') === 'compare');
  const [compareSelection, setCompareSelection] = useState<HistoryItem[]>([]);

  const load = () => {
    setLoading(true);
    historyApi
      .list({ limit: 50 })
      .then((res) => {
        let filtered = res.items;
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          filtered = filtered.filter(
            (i) =>
              i.stockCode.toLowerCase().includes(q) ||
              i.stockName?.toLowerCase().includes(q) ||
              i.summary?.toLowerCase().includes(q),
          );
        }
        setItems(filtered);
        if (!compareMode) {
          setSelected((prev) => {
            if (!prev) return filtered[0] ?? null;
            const sameStock = filtered.filter(
              (i) => i.stockCode.toUpperCase() === prev.stockCode.toUpperCase(),
            );
            if (sameStock.length > 0) return sameStock[0];
            return filtered.find((i) => i.id === prev.id) ?? filtered[0] ?? null;
          });
        }
      })
      .catch(() => {
        setItems([]);
        setSelected(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get('mode') === 'compare') {
      setCompareMode(true);
    }
  }, [searchParams]);

  const comparePair = useMemo(() => {
    if (compareSelection.length < 2) return null;
    const [a, b] = compareSelection;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime <= bTime ? [a, b] : [b, a];
  }, [compareSelection]);

  const toggleCompareItem = (item: HistoryItem) => {
    setCompareSelection((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      if (prev.length >= 2) return [prev[1], item];
      return [...prev, item];
    });
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareSelection([]);
    setSearchParams({});
    setSelected(items[0] ?? null);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex w-full flex-col border-b border-border lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">{t('reports.title')}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (compareMode) exitCompareMode();
                else {
                  setCompareMode(true);
                  setCompareSelection([]);
                  setSelected(null);
                  setSearchParams({ mode: 'compare' });
                }
              }}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('reports.compare')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {compareMode && (
          <div className="border-b border-primary/30 bg-primary/5 px-4 py-2 text-xs text-muted-foreground">
            {t('reports.compareSelect', { count: compareSelection.length })}
            {compareSelection.length > 0 && (
              <Button variant="ghost" size="sm" className="ml-2 h-6 px-2" onClick={() => setCompareSelection([])}>
                <X className="h-3 w-3" />
                {t('common.clear')}
              </Button>
            )}
          </div>
        )}

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('common.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <div className="mt-3">
            <DisclaimerBanner compact />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <div className="grid gap-2">
              {items.map((item) => {
                const inCompare = compareSelection.some((p) => p.id === item.id);
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:border-primary/30',
                      !compareMode && selected?.id === item.id && 'border-primary',
                      compareMode && inCompare && 'border-primary bg-primary/5',
                    )}
                    onClick={() => {
                      if (compareMode) toggleCompareItem(item);
                      else setSelected(item);
                    }}
                  >
                    <CardContent className="flex items-start justify-between gap-3 p-3">
                      <div className="flex min-w-0 gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-sm">
                            {item.stockCode}
                            {item.stockName ? ` · ${item.stockName}` : ''}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.summary || '—'}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{item.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {compareMode && inCompare && (
                          <Badge variant="default">{t('reports.selected')}</Badge>
                        )}
                        {item.score != null && (
                          <Badge variant="default">{formatScore(item.score)}</Badge>
                        )}
                        {!compareMode && (
                          <div className="flex flex-col items-end gap-1">
                            <ReportRerunButton
                              stockCode={item.stockCode}
                              variant="ghost"
                              showLabel={false}
                              onComplete={load}
                            />
                            <ExportMenu
                              recordId={item.id}
                              stockCode={item.stockCode}
                              stockName={item.stockName}
                              size="sm"
                              variant="ghost"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {compareMode && comparePair ? (
          <ReportComparePanel
            left={comparePair[0]}
            right={comparePair[1]}
            onClose={exitCompareMode}
            onSwap={() => setCompareSelection((prev) => (prev.length === 2 ? [prev[1], prev[0]] : prev))}
          />
        ) : compareMode ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
            {t('reports.compareNeedTwo')}
          </div>
        ) : selected ? (
          <ReportDetailPanel
            item={selected}
            onClose={() => setSelected(null)}
            onRerunComplete={load}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
            {t('reports.selectHint')}
          </div>
        )}
      </div>
    </div>
  );
}