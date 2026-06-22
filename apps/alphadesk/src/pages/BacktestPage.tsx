import { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { backtestApi } from '@/api/backtest';
import { BacktestResultsTable } from '@/components/backtest/BacktestResultsTable';
import { PerformanceCard } from '@/components/backtest/PerformanceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { useI18n } from '@/i18n';
import type {
  BacktestPhaseFilter,
  BacktestResultItem,
  BacktestRunResponse,
  PerformanceMetrics,
} from '@/types/backtest';

const PAGE_SIZE = 20;

export default function BacktestPage() {
  const { t } = useI18n();

  const [codeFilter, setCodeFilter] = useState('');
  const [analysisDateFrom, setAnalysisDateFrom] = useState('');
  const [analysisDateTo, setAnalysisDateTo] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<BacktestPhaseFilter>('all');
  const [evalDays, setEvalDays] = useState('');
  const [forceRerun, setForceRerun] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<BacktestRunResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [results, setResults] = useState<BacktestResultItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const [overallPerf, setOverallPerf] = useState<PerformanceMetrics | null>(null);
  const [stockPerf, setStockPerf] = useState<PerformanceMetrics | null>(null);
  const [isLoadingPerf, setIsLoadingPerf] = useState(false);

  const effectiveWindowDays = evalDays ? parseInt(evalDays, 10) : overallPerf?.evalWindowDays;
  const isNextDayValidation = effectiveWindowDays === 1;

  const fetchResults = useCallback(
    async (
      page = 1,
      code?: string,
      windowDays?: number,
      startDate?: string,
      endDate?: string,
      phase?: BacktestPhaseFilter,
    ) => {
      setIsLoadingResults(true);
      try {
        const response = await backtestApi.getResults({
          code: code || undefined,
          evalWindowDays: windowDays,
          analysisDateFrom: startDate || undefined,
          analysisDateTo: endDate || undefined,
          analysisPhase: phase && phase !== 'all' ? phase : undefined,
          page,
          limit: PAGE_SIZE,
        });
        setResults(response.items);
        setTotalResults(response.total);
        setCurrentPage(response.page);
        setPageError(null);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setIsLoadingResults(false);
      }
    },
    [],
  );

  const fetchPerformance = useCallback(
    async (
      code?: string,
      windowDays?: number,
      startDate?: string,
      endDate?: string,
      phase?: BacktestPhaseFilter,
    ) => {
      setIsLoadingPerf(true);
      try {
        const overall = await backtestApi.getOverallPerformance({
          evalWindowDays: windowDays,
          analysisDateFrom: startDate || undefined,
          analysisDateTo: endDate || undefined,
          analysisPhase: phase && phase !== 'all' ? phase : undefined,
        });
        setOverallPerf(overall);

        if (code) {
          const stock = await backtestApi.getStockPerformance(code, {
            evalWindowDays: windowDays,
            analysisDateFrom: startDate || undefined,
            analysisDateTo: endDate || undefined,
            analysisPhase: phase && phase !== 'all' ? phase : undefined,
          });
          setStockPerf(stock);
        } else {
          setStockPerf(null);
        }
        setPageError(null);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setIsLoadingPerf(false);
      }
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      const overall = await backtestApi.getOverallPerformance();
      setOverallPerf(overall);
      const windowDays = overall?.evalWindowDays;
      if (windowDays && !evalDays) {
        setEvalDays(String(windowDays));
      }
      fetchResults(1, undefined, windowDays, undefined, undefined, 'all');
    };
    void init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = async () => {
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
      const code = codeFilter.trim() || undefined;
      const evalWindowDays = evalDays ? parseInt(evalDays, 10) : undefined;
      const response = await backtestApi.run({
        code,
        force: forceRerun || undefined,
        minAgeDays: forceRerun ? 0 : undefined,
        evalWindowDays,
      });
      setRunResult(response);
      fetchResults(1, codeFilter.trim() || undefined, evalWindowDays, analysisDateFrom, analysisDateTo, phaseFilter);
      fetchPerformance(codeFilter.trim() || undefined, evalWindowDays, analysisDateFrom, analysisDateTo, phaseFilter);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleFilter = () => {
    const code = codeFilter.trim() || undefined;
    const windowDays = evalDays ? parseInt(evalDays, 10) : undefined;
    setCurrentPage(1);
    fetchResults(1, code, windowDays, analysisDateFrom, analysisDateTo, phaseFilter);
    fetchPerformance(code, windowDays, analysisDateFrom, analysisDateTo, phaseFilter);
  };

  const handleShowNextDay = () => {
    const code = codeFilter.trim() || undefined;
    setEvalDays('1');
    setCurrentPage(1);
    fetchResults(1, code, 1, analysisDateFrom, analysisDateTo, phaseFilter);
    fetchPerformance(code, 1, analysisDateFrom, analysisDateTo, phaseFilter);
  };

  const handlePageChange = (page: number) => {
    const windowDays = evalDays ? parseInt(evalDays, 10) : undefined;
    fetchResults(page, codeFilter.trim() || undefined, windowDays, analysisDateFrom, analysisDateTo, phaseFilter);
  };

  const selectClass =
    'flex h-9 rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">{t('backtest.title')}</h2>
        </div>
      </div>

      <div className="border-b border-border p-4 space-y-3">
        <DisclaimerBanner compact />

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] flex-1">
            <Input
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              placeholder={t('backtest.codePlaceholder')}
              disabled={isRunning}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleFilter} disabled={isLoadingResults}>
            {t('backtest.filter')}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('backtest.evalWindow')}</span>
            <Input
              type="number"
              min={1}
              max={120}
              className="w-20 text-center tabular-nums"
              value={evalDays}
              onChange={(e) => setEvalDays(e.target.value)}
              placeholder="10"
              disabled={isRunning}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('backtest.phase')}</span>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value as BacktestPhaseFilter)}
              disabled={isRunning}
              className={selectClass}
            >
              <option value="all">{t('backtest.phaseAll')}</option>
              <option value="premarket">{t('backtest.phasePremarket')}</option>
              <option value="intraday">{t('backtest.phaseIntraday')}</option>
              <option value="postmarket">{t('backtest.phasePostmarket')}</option>
              <option value="unknown">{t('backtest.phaseUnknown')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('backtest.startDate')}</span>
            <Input
              type="date"
              className="w-36"
              value={analysisDateFrom}
              onChange={(e) => setAnalysisDateFrom(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('backtest.endDate')}</span>
            <Input
              type="date"
              className="w-36"
              value={analysisDateTo}
              onChange={(e) => setAnalysisDateTo(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <Button
            variant={isNextDayValidation ? 'default' : 'outline'}
            size="sm"
            onClick={handleShowNextDay}
            disabled={isLoadingResults || isLoadingPerf}
          >
            {t('backtest.oneDayValidation')}
          </Button>

          <Button
            variant={forceRerun ? 'default' : 'outline'}
            size="sm"
            onClick={() => setForceRerun(!forceRerun)}
            disabled={isRunning}
          >
            {t('backtest.forceRerun')}
          </Button>

          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('backtest.running')}
              </>
            ) : (
              t('backtest.runBacktest')
            )}
          </Button>
        </div>

        {runResult && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{t('backtest.processed')} <strong className="text-foreground">{runResult.processed}</strong></span>
            <span>{t('backtest.saved')} <strong className="text-primary">{runResult.saved}</strong></span>
            <span>{t('backtest.completed')} <strong className="text-bull">{runResult.completed}</strong></span>
            <span>{t('backtest.insufficient')} <strong className="text-warning">{runResult.insufficient}</strong></span>
            {runResult.errors > 0 && (
              <span>{t('backtest.errors')} <strong className="text-bear">{runResult.errors}</strong></span>
            )}
          </div>
        )}

        {runError && <p className="text-xs text-bear">{runError}</p>}
        {pageError && <p className="text-xs text-bear">{pageError}</p>}

        <p className="text-xs text-muted-foreground">
          {isNextDayValidation ? t('backtest.oneDayModeDescription') : t('backtest.windowModeDescription')}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto scrollbar-thin p-4 lg:flex-row">
        <div className="flex flex-col gap-3 lg:w-60 lg:flex-shrink-0">
          {isLoadingPerf ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : overallPerf ? (
            <PerformanceCard metrics={overallPerf} title={t('backtest.overallPerformance')} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <p className="font-medium">{t('backtest.noMetricsTitle')}</p>
                <p className="mt-1 text-xs">{t('backtest.noMetricsDescription')}</p>
              </CardContent>
            </Card>
          )}
          {stockPerf && (
            <PerformanceCard metrics={stockPerf} title={stockPerf.code || codeFilter} />
          )}
        </div>

        <section className="min-h-0 flex-1">
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">{t('backtest.loadingResults')}</p>
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                <p className="font-medium">{t('backtest.noResultsTitle')}</p>
                <p className="mt-1 text-xs">{t('backtest.noResultsDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <BacktestResultsTable
              results={results}
              total={totalResults}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              codeFilter={codeFilter}
              evalDays={evalDays}
              phaseFilter={phaseFilter}
              analysisDateFrom={analysisDateFrom}
              analysisDateTo={analysisDateTo}
              showNextDayColumns={isNextDayValidation}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </div>
    </div>
  );
}