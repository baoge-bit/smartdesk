import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { formatPercent } from '@/lib/utils';
import type { PerformanceMetrics } from '@/types/backtest';

function pct(value?: number | null): string {
  if (value == null) return '—';
  return formatPercent(value, 1).replace('+', '');
}

interface MetricRowProps {
  label: string;
  value: string;
  accent?: boolean;
}

function MetricRow({ label, value, accent }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'font-medium text-primary tabular-nums' : 'tabular-nums'}>{value}</span>
    </div>
  );
}

interface PerformanceCardProps {
  metrics: PerformanceMetrics;
  title: string;
}

export function PerformanceCard({ metrics, title }: PerformanceCardProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <MetricRow label={t('backtest.directionAccuracy')} value={pct(metrics.directionAccuracyPct)} accent />
        <MetricRow label={t('backtest.winRate')} value={pct(metrics.winRatePct)} accent />
        <MetricRow label={t('backtest.avgSimulatedReturn')} value={pct(metrics.avgSimulatedReturnPct)} />
        <MetricRow label={t('backtest.avgStockReturn')} value={pct(metrics.avgStockReturnPct)} />
        <MetricRow label={t('backtest.stopLossTriggerRate')} value={pct(metrics.stopLossTriggerRate)} />
        <MetricRow label={t('backtest.takeProfitTriggerRate')} value={pct(metrics.takeProfitTriggerRate)} />
        <MetricRow
          label={t('backtest.avgDaysToFirstHit')}
          value={metrics.avgDaysToFirstHit != null ? metrics.avgDaysToFirstHit.toFixed(1) : '—'}
        />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          <span className="text-muted-foreground">{t('backtest.evaluationCount')}</span>
          <span className="font-mono tabular-nums">
            {metrics.completedCount} / {metrics.totalEvaluations}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('backtest.outcomeSummary')}</span>
          <span className="font-mono tabular-nums">
            <span className="text-bull">{metrics.winCount}</span>
            {' / '}
            <span className="text-bear">{metrics.lossCount}</span>
            {' / '}
            <span className="text-warning">{metrics.neutralCount}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}