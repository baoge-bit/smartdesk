import { useEffect, useState } from 'react';
import type { StockIndexItem } from '@/types/stockIndex';
import { loadStockIndex } from '@/utils/stockIndexLoader';

export function useStockIndex() {
  const [index, setIndex] = useState<StockIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setLoading(true);
      const result = await loadStockIndex();
      if (!mounted) return;
      setIndex(result.data);
      setFallback(result.fallback);
      setError(result.error ?? null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { index, loading, error, fallback, loaded: !loading };
}