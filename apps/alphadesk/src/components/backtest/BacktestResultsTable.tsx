import { Check, Minus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { useI18n, type Translate } from '@/i18n';
import { formatPercent } from '@/lib/utils';
import type { BacktestPhaseFilter, BacktestResultItem } from '@/types/backtest';

function pct(value?: number | null): string {
  if (value == null) return '—';
  return formatPercent(value, 1).replace('+', '');
}

function outcomeBadge(outcome: string | undefined, t: Translate) {
  if (!outcome) return <Badge variant="outline">—</Badge>;
  switch (outcome) {
    case 'win':
      return <Badge variant="success">{t('backtest.outcomeWin')}</Badge>;
    case 'loss':
      return <Badge variant="danger">{t('backtest.outcomeLoss')}</Badge>;
    case 'neutral':
      return <Badge variant="warning">{t('backtest.outcomeNeutral')}</Badge>;
    default:
      return <Badge variant="outline">{outcome}</Badge>;
  }
}

function statusBadge(status: string, t: Translate) {
  switch (status) {
    case 'completed':
      return <Badge variant="success">{t('backtest.statusCompleted')}</Badge>;
    case 'insufficient':
    case 'insufficient_data':
      return <Badge variant="warning">{t('backtest.statusInsufficient')}</Badge>;
    case 'error':
      return <Badge variant="danger">{t('backtest.statusError')}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function movementBadge(movement: string | null | undefined, t: Translate) {
  switch (movement) {
    case 'up':
      return <Badge variant="success">{t('backtest.movementUp')}</Badge>;
    case 'down':
      return <Badge variant="danger">{t('backtest.movementDown')}</Badge>;
    case 'flat':
      return <Badge variant="warning">{t('backtest.movementFlat')}</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
}

function boolIcon(value: boolean | null | undefined) {
  if (value === true) return <Check className="h-3.5 w-3.5 text-bull" />;
  if (value === false) return <X className="h-3.5 w-3.5 text-bear" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function phaseLabel(phase: string | null | undefined, t: Translate): string {
  switch (phase) {
    case 'premarket':
      return t('backtest.phasePremarket');
    case 'intraday':
      return t('backtest.phaseIntraday');
    case 'postmarket':
      return t('backtest.phasePostmarket');
    case 'unknown':
      return t('backtest.phaseUnknown');
    default:
      return phase || '—';
  }
}

interface BacktestResultsTableProps {
  results: BacktestResultItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  codeFilter: string;
  evalDays: string;
  phaseFilter: BacktestPhaseFilter;
  analysisDateFrom: string;
  analysisDateTo: string;
  showNextDayColumns: boolean;
  onPageChange: (page: number) => void;
}

export function BacktestResultsTable({
  results,
  total,
  currentPage,
  pageSize,
  codeFilter,
  evalDays,
  phaseFilter,
  analysisDateFrom,
  analysisDateTo,
  showNextDayColumns,
  onPageChange,
}: BacktestResultsTableProps) {
  const { t } = useI18n();
  const totalPages = Math.ceil(total / pageSize);

  const phaseLabelForFilter = () => {
    switch (phaseFilter) {
      case 'premarket':
        return t('backtest.phasePremarket');
      case 'intraday':
        return t('backtest.phaseIntraday');
      case 'postmarket':
        return t('backtest.phasePostmarket');
      case 'unknown':
        return t('backtest.phaseUnknown');
      default:
        return null;
    }
  };

  const metaParts = [
    codeFilter.trim() ? t('backtest.filteredStock', { code: codeFilter.trim() }) : t('backtest.allStocks'),
    evalDays ? t('backtest.dayWindow', { days: evalDays }) : null,
    phaseLabelForFilter(),
    analysisDateFrom ? t('backtest.fromDate', { date: analysisDateFrom }) : null,
    analysisDateTo ? t('backtest.toDate', { date: analysisDateTo }) : null,
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {showNextDayColumns ? t('backtest.nextDayValidation') : t('backtest.resultSet')}
          </p>
          <p className="text-xs text-muted-foreground">{metaParts.join(' · ')}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr className="text-left">
              <th className="px-3 py-2">{t('backtest.stock')}</th>
              <th className="px-3 py-2">{t('backtest.analysisDate')}</th>
              <th className="px-3 py-2">{t('backtest.phase')}</th>
              <th className="px-3 py-2">{t('backtest.aiPrediction')}</th>
              <th className="px-3 py-2">
                {showNextDayColumns ? t('backtest.actualPerformance') : t('backtest.windowReturn')}
              </th>
              <th className="px-3 py-2">
                {showNextDayColumns ? t('backtest.accuracy') : t('backtest.directionMatch')}
              </th>
              <th className="px-3 py-2">{t('backtest.result')}</th>
              <th className="px-3 py-2">{t('backtest.status')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => {
              const prediction = [row.actionLabel, row.trendPrediction, row.operationAdvice]
                .filter(Boolean)
                .join(' / ');

              return (
                <tr key={row.analysisHistoryId} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.code}</div>
                    <div className="text-xs text-muted-foreground">{row.stockName || '—'}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.analysisDate || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{phaseLabel(row.marketPhase, t)}</td>
                  <td className="max-w-[220px] px-3 py-2">
                    <span className="line-clamp-2">{prediction || '—'}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {movementBadge(row.actualMovement, t)}
                      <span
                        className={
                          row.actualReturnPct != null
                            ? row.actualReturnPct > 0
                              ? 'text-bull'
                              : row.actualReturnPct < 0
                                ? 'text-bear'
                                : 'text-muted-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {pct(row.actualReturnPct)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">{boolIcon(row.directionCorrect)}</span>
                  </td>
                  <td className="px-3 py-2">{outcomeBadge(row.outcome, t)}</td>
                  <td className="px-3 py-2">{statusBadge(row.evalStatus, t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-2">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        <p className="text-center text-xs text-muted-foreground">
          {t('backtest.totalPage', {
            total,
            page: currentPage,
            pages: Math.max(totalPages, 1),
          })}
        </p>
      </div>
    </div>
  );
}
