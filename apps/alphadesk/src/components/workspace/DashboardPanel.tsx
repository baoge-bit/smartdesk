import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { PriceChart } from '@/components/charts/PriceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/components/export/ExportMenu';
import { DashboardAnalyzeButton } from '@/components/workspace/DashboardAnalyzeButton';
import { DisclaimerBanner } from './DisclaimerBanner';
import { QuoteBar } from './QuoteBar';
import { useI18n } from '@/i18n';
import { analysisApi, type DecisionReport } from '@/api/analysis';
import { useStockMarket, type ChartPeriod } from '@/hooks/useStockMarket';
import { formatScore } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DashboardPanelProps {
  stockCode: string | null;
  stockName?: string;
}

export function DashboardPanel({ stockCode, stockName }: DashboardPanelProps) {
  const { t } = useI18n();
  const [report, setReport] = useState<DecisionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('daily');
  const { quote, bars, loading: marketLoading, error: marketError, refresh: refreshMarket } =
    useStockMarket(stockCode, chartPeriod);

  const chartData = useMemo(
    () =>
      bars.map((bar) => ({
        time: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    [bars],
  );

  const loadReport = (code: string) => {
    setLoading(true);
    setError(null);
    analysisApi
      .getLatestReport(code)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!stockCode) {
      setReport(null);
      return;
    }
    loadReport(stockCode);
  }, [stockCode]);

  const score = report?.score;
  const scoreColor =
    score == null ? 'text-muted-foreground' : score >= 70 ? 'text-bull' : score <= 40 ? 'text-bear' : 'text-warning';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">{t('dashboard.title')}</h2>
          {stockCode && (
            <p className="text-xs text-muted-foreground">
              {stockCode}
              {stockName || report?.stockName ? ` · ${stockName || report?.stockName}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <DashboardAnalyzeButton
            stockCode={stockCode}
            hasReport={!!report}
            onComplete={() => stockCode && loadReport(stockCode)}
          />
          <ExportMenu
            recordId={report?.recordId}
            stockCode={stockCode ?? undefined}
            stockName={stockName || report?.stockName}
            exportTargetId="dashboard-export-root"
            disabled={!report || loading}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <DisclaimerBanner />

        {!stockCode ? (
          <EmptyState message={t('watchlist.empty')} />
        ) : loading ? (
          <EmptyState message={t('common.loading')} />
        ) : error ? (
          <EmptyState message={error} />
        ) : !report ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border py-16">
            <p className="text-sm text-muted-foreground">{t('dashboard.noReport')}</p>
            <DashboardAnalyzeButton
              stockCode={stockCode}
              hasReport={false}
              onComplete={() => stockCode && loadReport(stockCode)}
            />
          </div>
        ) : (
          <div id="dashboard-export-root" className="space-y-4 rounded-lg bg-card p-1">
            <QuoteBar quote={quote} loading={marketLoading} onRefresh={() => void refreshMarket()} />

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t('chart.title')}</CardTitle>
                <div className="flex gap-1">
                  {(['daily', 'weekly', 'monthly'] as ChartPeriod[]).map((p) => (
                    <Button
                      key={p}
                      variant={chartPeriod === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setChartPeriod(p)}
                    >
                      {t(`chart.period.${p}`)}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {marketError ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{marketError}</p>
                ) : marketLoading && chartData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
                ) : chartData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t('chart.noData')}</p>
                ) : (
                  <PriceChart data={chartData} height={300} />
                )}
              </CardContent>
            </Card>

            {/* Hero score + conclusion */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t('dashboard.score')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn('text-4xl font-bold tabular-nums', scoreColor)}>
                    {formatScore(score)}
                  </div>
                  {report.trend && (
                    <Badge className="mt-2" variant={trendVariant(report.trend)}>
                      {report.trend}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('dashboard.conclusion')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {report.conclusion || report.summary || '—'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Entry / Exit */}
            <div className="grid gap-4 md:grid-cols-2">
              <ListCard
                title={t('dashboard.entry')}
                icon={<ArrowUpRight className="h-4 w-4 text-bull" />}
                items={report.entryPoints}
              />
              <ListCard
                title={t('dashboard.exit')}
                icon={<ArrowDownRight className="h-4 w-4 text-bear" />}
                items={report.exitPoints}
              />
            </div>

            {/* Risk / Catalyst / Checklist */}
            <div className="grid gap-4 md:grid-cols-3">
              <ListCard
                title={t('dashboard.risk')}
                icon={<AlertTriangle className="h-4 w-4 text-warning" />}
                items={report.risks}
                variant="warning"
              />
              <ListCard
                title={t('dashboard.catalyst')}
                icon={<Target className="h-4 w-4 text-primary" />}
                items={report.catalysts}
              />
              <ListCard
                title={t('dashboard.checklist')}
                icon={<CheckCircle2 className="h-4 w-4 text-bull" />}
                items={report.checklist}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  items?: string[];
  variant?: 'warning';
}) {
  const { t } = useI18n();
  return (
    <Card className={cn(variant === 'warning' && 'border-warning/40')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 text-foreground/85">
                <span className="text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function trendVariant(trend: string): 'success' | 'danger' | 'warning' | 'default' {
  const lower = trend.toLowerCase();
  if (lower.includes('多') || lower.includes('bull') || lower.includes('up')) return 'success';
  if (lower.includes('空') || lower.includes('bear') || lower.includes('down')) return 'danger';
  return 'default';
}
