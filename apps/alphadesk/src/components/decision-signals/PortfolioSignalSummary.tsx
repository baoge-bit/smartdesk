import { Badge } from '@/components/ui/badge';
import { useI18n, type Translate, type TranslationKey } from '@/i18n';
import { getActionLabel, getActionTone } from '@/lib/decisionAction';
import type { DecisionSignalHorizon, DecisionSignalItem } from '@/types/decisionSignals';

const HORIZON_KEYS: Record<DecisionSignalHorizon, TranslationKey> = {
  intraday: 'decisionSignals.horizon.intraday',
  '1d': 'decisionSignals.horizon.1d',
  '3d': 'decisionSignals.horizon.3d',
  '5d': 'decisionSignals.horizon.5d',
  '10d': 'decisionSignals.horizon.10d',
  swing: 'decisionSignals.horizon.swing',
  long: 'decisionSignals.horizon.long',
};

function horizonLabel(horizon: DecisionSignalHorizon, t: Translate): string {
  const key = HORIZON_KEYS[horizon];
  return key ? t(key) : horizon;
}

interface PortfolioSignalSummaryProps {
  item?: DecisionSignalItem;
  loading?: boolean;
}

export function PortfolioSignalSummary({ item, loading = false }: PortfolioSignalSummaryProps) {
  const { t } = useI18n();

  if (loading && !item) {
    return <span className="text-xs text-muted-foreground">{t('decisionSignals.portfolioLoading')}</span>;
  }
  if (!item) {
    return <span className="text-xs text-muted-foreground">{t('decisionSignals.portfolioEmpty')}</span>;
  }

  const actionLabel = getActionLabel(item.action, item.actionLabel, t);
  const tone = getActionTone(item.action);
  const variant = tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'outline';

  return (
    <div className="min-w-[9rem] max-w-[16rem] text-left">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Badge variant={variant}>{actionLabel}</Badge>
        {item.horizon && (
          <span className="text-[10px] text-muted-foreground">
            {horizonLabel(item.horizon, t)}
          </span>
        )}
      </div>
      {item.riskSummary && (
        <p className="mt-1 line-clamp-2 text-[10px] text-warning">{item.riskSummary}</p>
      )}
      {item.watchConditions && (
        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{item.watchConditions}</p>
      )}
    </div>
  );
}
