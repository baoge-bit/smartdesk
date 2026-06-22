import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { formatPercent } from '@/lib/utils';
import type { StockQuote } from '@/api/stocks';

interface QuoteBarProps {
  quote: StockQuote | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export function QuoteBar({ quote, loading, onRefresh }: QuoteBarProps) {
  const { t } = useI18n();

  if (!quote && !loading) {
    return (
      <p className="text-xs text-muted-foreground">{t('chart.noQuote')}</p>
    );
  }

  const change = quote?.changePercent;
  const changeColor =
    change == null ? 'text-muted-foreground' : change > 0 ? 'text-bull' : change < 0 ? 'text-bear' : 'text-muted-foreground';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-semibold tabular-nums">
          {quote ? quote.currentPrice.toFixed(2) : '—'}
        </span>
        {change != null && (
          <span className={`text-sm font-medium tabular-nums ${changeColor}`}>
            {formatPercent(change)}
          </span>
        )}
        {quote?.updateTime && (
          <span className="text-[10px] text-muted-foreground">{quote.updateTime}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {quote?.open != null && (
          <Badge variant="outline">
            {t('chart.open')} {quote.open.toFixed(2)}
          </Badge>
        )}
        {quote?.high != null && (
          <Badge variant="outline">
            {t('chart.high')} {quote.high.toFixed(2)}
          </Badge>
        )}
        {quote?.low != null && (
          <Badge variant="outline">
            {t('chart.low')} {quote.low.toFixed(2)}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}