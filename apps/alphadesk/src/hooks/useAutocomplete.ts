import { useCallback, useEffect, useRef, useState } from 'react';
import type { StockIndexItem, StockSuggestion } from '@/types/stockIndex';
import { searchStocks } from '@/utils/searchStocks';
import { SEARCH_CONFIG } from '@/utils/stockIndexFields';

export interface UseAutocompleteOptions {
  minLength?: number;
  debounceMs?: number;
  limit?: number;
}

export function useAutocomplete(
  index: StockIndexItem[],
  options: UseAutocompleteOptions = {},
) {
  const {
    minLength = SEARCH_CONFIG.MIN_QUERY_LENGTH,
    debounceMs = SEARCH_CONFIG.DEBOUNCE_MS,
    limit = SEARCH_CONFIG.DEFAULT_LIMIT,
  } = options;

  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  const [runtimeFallback, setRuntimeFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      if (runtimeFallback) return;

      if (q.length < minLength) {
        setSuggestions([]);
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      try {
        const results = searchStocks(q, index, { limit });
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (caught) {
        const err = caught instanceof Error ? caught : new Error('Autocomplete search failed');
        setError(err);
        setRuntimeFallback(true);
        setSuggestions([]);
        setIsOpen(false);
      }
    },
    [index, limit, minLength, runtimeFallback],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (runtimeFallback) return;
      debounceRef.current = setTimeout(() => search(value), debounceMs);
    },
    [search, debounceMs, runtimeFallback],
  );

  const highlightPrevious = useCallback(() => {
    setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
  }, [suggestions.length]);

  const highlightNext = useCallback(() => {
    setHighlightedIndex((prev) => (prev >= suggestions.length - 1 ? 0 : prev + 1));
  }, [suggestions.length]);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const reset = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isOpen,
    highlightedIndex,
    setHighlightedIndex,
    highlightPrevious,
    highlightNext,
    close,
    reset,
    isComposing,
    setIsComposing,
    runtimeFallback,
    error,
  };
}