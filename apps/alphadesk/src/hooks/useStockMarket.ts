import { useCallback, useEffect, useState } from 'react';
import { stocksApi, type KLineBar, type StockQuote } from '@/api/stocks';

export type ChartPeriod = 'daily' | 'weekly' | 'monthly';

const PERIOD_DAYS: Record<ChartPeriod, number> = {
  daily: 60,
  weekly: 120,
  monthly: 180,
};

export function useStockMarket(stockCode: string | null, period: ChartPeriod = 'daily') {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [bars, setBars] = useState<KLineBar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stockCode) {
      setQuote(null);
      setBars([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [quoteRes, historyRes] = await Promise.all([
        stocksApi.getQuote(stockCode),
        stocksApi.getHistory(stockCode, { period, days: PERIOD_DAYS[period] }),
      ]);
      setQuote(quoteRes);
      setBars(historyRes.data ?? []);
    } catch (err) {
      setQuote(null);
      setBars([]);
      setError(err instanceof Error ? err.message : 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, [stockCode, period]);

  useEffect(() => {
    void load();
  }, [load]);

  return { quote, bars, loading, error, refresh: load };
}