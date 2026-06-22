import { useEffect, useMemo, useState } from 'react';
import { GitCompare, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { analysisApi, type DecisionReport } from '@/api/analysis';
import { useI18n } from '@/i18n';
import { useWorkspaceStore, type WatchlistItem } from '@/stores/workspace';
import { cn, formatScore } from '@/lib/utils';

const MAX_COMPARE = 4;

interface CompareRow {
  item: WatchlistItem;
  report: DecisionReport | null;
  loading: boolean;
  error?: string;
}

interface DashboardComparePanelProps {
  codes: string[];
}

function scoreTone(score?: number): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 70) return 'text-bull';
  if (score <= 40) return 'text-bear';
  return 'text-warning';
}

export function DashboardComparePanel({ codes }: DashboardComparePanelProps) {
  const { t } = useI18n();
  const { watchlist, toggleCompareCode, setSelectedCode, setDashboardMode } = useWorkspaceStore();
  const [rows, setRows] = useState<CompareRow[]>([]);

  const selectedItems = useMemo(
    () =>
      codes
        .map((code) => watchlist.find((w) => w.code.toUpperCase() === code.toUpperCase()))
        .filter(Boolean) as WatchlistItem[],
    [codes, watchlist],
  );

  useEffect(() => {
    if (selectedItems.length === 0) {
      setRows([]);
      return;
    }

    setRows(
      selectedItems.map((item) => ({
        item,
        report: null,
        loading: true,
      })),
    );

    let cancelled = false;

    void Promise.all(
      selectedItems.map(async (item) => {
        try {
          const report = await analysisApi.getLatestReport(item.code);
          return { item, report, loading: false } satisfies CompareRow;
        } catch (err) {
          return {
            item,
            report: null,
            loading: false,
            error: err instanceof Error ? err.message : t('common.noData'),
          } satisfies CompareRow;
        }
      }),
    ).then((result) => {
      if (!cancelled) setRows(result);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedItems, t]);

  const maxScore = useMemo(
    () => Math.max(1, ...rows.map((r) => r.report?.score ?? 0)),
    [rows],
  );

  const loadingAny = rows.some((r) => r.loading);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <GitCompare className="h-4 w-4 text-primary" />
              {t('dashboard.compareTitle')}
            </h2>
            <p className="text-xs text-muted-foreground">{t('dashboard.compareHint')}</p>
          </div>
          <Badge variant="outline">
            {codes.length}/{MAX_COMPARE}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {watchlist.map((item) => {
            const active = codes.some((c) => c.toUpperCase() === item.code.toUpperCase());
            const disabled = !active && codes.length >= MAX_COMPARE;
            return (
              <button
                key={item.code}
                type="button"
                disabled={disabled}
                onClick={() => toggleCompareCode(item.code)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 disabled:opacity-40',
                )}
              >
                {item.code}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <DisclaimerBanner compact />

        {codes.length < 2 ? (
          <EmptyHint message={t('dashboard.compareNeedTwo')} />
        ) : loadingAny ? (
          <EmptyHint message={t('common.loading')} icon={<Loader2 className="h-5 w-5 animate-spin" />} />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('dashboard.scoreCompare')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rows.map((row) => (
                  <div key={row.item.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        className="font-mono font-medium hover:text-primary"
                        onClick={() => {
                          setSelectedCode(row.item.code);
                          setDashboardMode('single');
                        }}
                      >
                        {row.item.code}
                        {row.item.name ? ` · ${row.item.name}` : ''}
                      </button>
                      <span className={cn('tabular-nums font-semibold', scoreTone(row.report?.score))}>
                        {formatScore(row.report?.score)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, ((row.report?.score ?? 0) / maxScore) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2">{t('dashboard.symbol')}</th>
                    <th className="px-3 py-2">{t('dashboard.score')}</th>
                    <th className="px-3 py-2">{t('dashboard.trend')}</th>
                    <th className="px-3 py-2">{t('dashboard.conclusion')}</th>
                    <th className="px-3 py-2 text-right">{t('dashboard.risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.item.code} className="border-b border-border/60 align-top">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-left hover:text-primary"
                          onClick={() => {
                            setSelectedCode(row.item.code);
                            setDashboardMode('single');
                          }}
                        >
                          <div className="font-mono font-medium">{row.item.code}</div>
                          {row.item.name && (
                            <div className="text-xs text-muted-foreground">{row.item.name}</div>
                          )}
                        </button>
                      </td>
                      <td className={cn('px-3 py-2 tabular-nums font-semibold', scoreTone(row.report?.score))}>
                        {row.error ? '—' : formatScore(row.report?.score)}
                      </td>
                      <td className="px-3 py-2">
                        {row.report?.trend ? (
                          <Badge variant="outline">{row.report.trend}</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="max-w-xs px-3 py-2 text-xs text-muted-foreground">
                        {row.error ?? row.report?.conclusion ?? row.report?.summary ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {row.report?.risks?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((row) => (
                <Card key={`detail-${row.item.code}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono">{row.item.code}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <p className="line-clamp-4 leading-relaxed text-foreground/90">
                      {row.report?.conclusion || row.report?.summary || t('common.noData')}
                    </p>
                    {row.report?.entryPoints?.[0] && (
                      <p>
                        <span className="text-bull">{t('dashboard.entry')}:</span> {row.report.entryPoints[0]}
                      </p>
                    )}
                    {row.report?.exitPoints?.[0] && (
                      <p>
                        <span className="text-bear">{t('dashboard.exit')}:</span> {row.report.exitPoints[0]}
                      </p>
                    )}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        setSelectedCode(row.item.code);
                        setDashboardMode('single');
                      }}
                    >
                      {t('dashboard.openDetail')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyHint({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {icon}
      {message}
    </div>
  );
}