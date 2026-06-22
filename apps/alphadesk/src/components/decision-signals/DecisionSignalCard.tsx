import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { getActionLabel, getActionTone } from '@/lib/decisionAction';
import { formatScore } from '@/lib/utils';
import type { DecisionSignalItem } from '@/types/decisionSignals';

interface DecisionSignalCardProps {
  item: DecisionSignalItem;
  selected?: boolean;
  onClick?: () => void;
}

export function DecisionSignalCard({ item, selected, onClick }: DecisionSignalCardProps) {
  const { t } = useI18n();
  const actionLabel = getActionLabel(item.action, item.actionLabel, t);
  const tone = getActionTone(item.action);
  const variant = tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'outline';

  const statusVariant =
    item.status === 'active' ? 'success' : item.status === 'expired' ? 'warning' : 'outline';

  return (
    <Card
      className={`cursor-pointer transition-colors hover:border-primary/40 ${selected ? 'border-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={variant}>{actionLabel}</Badge>
              <Badge variant={statusVariant}>{t(`decisionSignals.status.${item.status}`)}</Badge>
            </div>
            <h3 className="mt-2 font-semibold">
              {item.stockName || item.stockCode}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {item.stockCode} · {item.market.toUpperCase()}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {item.score != null && (
              <p className="text-sm font-medium text-foreground">{formatScore(item.score)}</p>
            )}
            <p>{item.createdAt?.slice(0, 16) ?? '—'}</p>
          </div>
        </div>
        {item.reason && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.reason}</p>
        )}
      </CardContent>
    </Card>
  );
}