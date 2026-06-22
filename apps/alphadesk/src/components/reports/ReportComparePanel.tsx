import { useEffect, useState } from 'react';
import { ArrowLeftRight, Loader2, X } from 'lucide-react';
import { ReportMarkdown } from '@/components/reports/ReportMarkdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { historyApi, type HistoryItem } from '@/api/history';
import { useI18n } from '@/i18n';
import { formatScore } from '@/lib/utils';

interface ReportComparePanelProps {
  left: HistoryItem;
  right: HistoryItem;
  onClose: () => void;
  onSwap: () => void;
}

function scoreDelta(left?: number, right?: number): string | null {
  if (left == null || right == null) return null;
  const diff = right - left;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}`;
}

export function ReportComparePanel({ left, right, onClose, onSwap }: ReportComparePanelProps) {
  const { t } = useI18n();
  const [leftMd, setLeftMd] = useState('');
  const [rightMd, setRightMd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([historyApi.getMarkdown(left.id), historyApi.getMarkdown(right.id)])
      .then(([a, b]) => {
        setLeftMd(a);
        setRightMd(b);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('reports.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [left.id, right.id, t]);

  const delta = scoreDelta(left.score, right.score);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="font-semibold">{t('reports.compareTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('reports.compareHint')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSwap}>
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {t('reports.swap')}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 border-b border-border text-xs">
        <CompareHeader item={left} label={t('reports.compareOlder')} />
        <CompareHeader item={right} label={t('reports.compareNewer')} />
      </div>

      {left.score != null && right.score != null && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs">
          {t('reports.scoreDelta')}: {formatScore(left.score)} → {formatScore(right.score)}
          {delta && (
            <Badge variant={Number(delta) >= 0 ? 'success' : 'danger'} className="ml-2">
              {delta}
            </Badge>
          )}
          {left.trend && right.trend && left.trend !== right.trend && (
            <span className="ml-3 text-muted-foreground">
              {t('reports.trendChange')}: {left.trend} → {right.trend}
            </span>
          )}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <CompareBody loading={loading} error={error} markdown={leftMd} emptyLabel={t('reports.noContent')} />
        <CompareBody loading={loading} error={error} markdown={rightMd} emptyLabel={t('reports.noContent')} />
      </div>
    </div>
  );
}

function CompareHeader({ item, label }: { item: HistoryItem; label: string }) {
  return (
    <div className="border-border px-4 py-2 lg:border-r">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">
        {item.stockCode}
        {item.stockName ? ` · ${item.stockName}` : ''}
      </p>
      <p className="text-muted-foreground">{item.createdAt ?? '—'}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {item.score != null && <Badge>{formatScore(item.score)}</Badge>}
        {item.trend && <Badge variant="outline">{item.trend}</Badge>}
      </div>
    </div>
  );
}

function CompareBody({
  loading,
  error,
  markdown,
  emptyLabel,
}: {
  loading: boolean;
  error: string | null;
  markdown: string;
  emptyLabel: string;
}) {
  return (
    <div className="min-h-0 overflow-y-auto scrollbar-thin p-4">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-bear">{error}</p>
      ) : markdown ? (
        <ReportMarkdown content={markdown} />
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}