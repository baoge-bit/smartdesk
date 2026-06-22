import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { formatMoney, formatSignedPct } from '@/lib/portfolioFormat';
import type { PortfolioRiskResponse } from '@/types/portfolio';

interface PortfolioRiskPanelProps {
  risk: PortfolioRiskResponse | null;
  currency?: string;
}

export function PortfolioRiskPanel({ risk, currency = 'CNY' }: PortfolioRiskPanelProps) {
  const { t } = useI18n();

  if (!risk) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {t('portfolio.riskDegraded')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('portfolio.riskTitle')}
          {risk.drawdown?.alert && (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t('portfolio.riskAlert')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {risk.drawdown && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('portfolio.maxDrawdown')}</p>
              <p className="mt-1 font-medium tabular-nums text-bear">
                {formatSignedPct(-Math.abs(risk.drawdown.maxDrawdownPct))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('portfolio.currentDrawdown')}</p>
              <p className="mt-1 font-medium tabular-nums">
                {formatSignedPct(-Math.abs(risk.drawdown.currentDrawdownPct))}
              </p>
            </div>
          </div>
        )}

        {risk.concentration.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('portfolio.concentration')}</p>
            <div className="space-y-1.5">
              {risk.concentration.slice(0, 8).map((item) => (
                <div key={item.symbol} className="flex items-center justify-between text-xs">
                  <span className="font-mono">
                    {item.symbol}
                    {item.isAlert && (
                      <Badge variant="warning" className="ml-2">
                        !
                      </Badge>
                    )}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(item.marketValueBase, currency)} · {item.weightPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}