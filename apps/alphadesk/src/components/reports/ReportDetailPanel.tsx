import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ExportMenu } from '@/components/export/ExportMenu';
import { ReportRerunButton } from '@/components/reports/ReportRerunButton';
import { ReportMarkdown } from '@/components/reports/ReportMarkdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { historyApi, type HistoryItem } from '@/api/history';
import { useI18n } from '@/i18n';
import { formatScore } from '@/lib/utils';

interface ReportDetailPanelProps {
  item: HistoryItem;
  onClose?: () => void;
  onRerunComplete?: () => void;
}

export function ReportDetailPanel({ item, onClose, onRerunComplete }: ReportDetailPanelProps) {
  const { t } = useI18n();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    historyApi
      .getMarkdown(item.id)
      .then(setMarkdown)
      .catch((err) => {
        setMarkdown('');
        setError(err instanceof Error ? err.message : t('reports.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [item.id, t]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="font-semibold">
            {item.stockCode}
            {item.stockName ? ` · ${item.stockName}` : ''}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.createdAt ?? '—'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.score != null && <Badge>{formatScore(item.score)}</Badge>}
            {item.trend && <Badge variant="outline">{item.trend}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReportRerunButton
            stockCode={item.stockCode}
            onComplete={() => {
              void (async () => {
                onRerunComplete?.();
                try {
                  const { items } = await historyApi.list({
                    stockCode: item.stockCode,
                    limit: 1,
                  });
                  if (items[0]) {
                    const md = await historyApi.getMarkdown(items[0].id);
                    setMarkdown(md);
                  }
                } catch {
                  /* ignore */
                }
              })();
            }}
          />
          <ExportMenu
            recordId={item.id}
            stockCode={item.stockCode}
            stockName={item.stockName}
            exportTargetId="report-detail-export-root"
          />
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-bear">{error}</p>
        ) : markdown ? (
          <div id="report-detail-export-root" className="rounded-lg bg-card p-4">
            <ReportMarkdown content={markdown} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('reports.noContent')}</p>
        )}
      </div>
    </div>
  );
}