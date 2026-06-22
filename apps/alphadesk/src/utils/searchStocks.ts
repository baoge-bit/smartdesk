import type { StockIndexItem, StockSuggestion } from '@/types/stockIndex';
import { normalizeQuery } from '@/utils/normalizeQuery';
import { MATCH_SCORE, SEARCH_CONFIG } from '@/utils/stockIndexFields';

export interface SearchOptions {
  limit?: number;
  activeOnly?: boolean;
}

export function searchStocks(
  query: string,
  index: StockIndexItem[],
  options: SearchOptions = {},
): StockSuggestion[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [];

  const limit = options.limit ?? SEARCH_CONFIG.DEFAULT_LIMIT;
  const activeOnly = options.activeOnly !== false;

  const filteredIndex = index.filter((item) => !activeOnly || item.active);

  const matched = filteredIndex
    .map((item) => ({ item, score: calculateMatchScore(normalizedQuery, item) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return (b.item.popularity || 0) - (a.item.popularity || 0);
    })
    .slice(0, limit)
    .map((s) => ({
      canonicalCode: s.item.canonicalCode,
      displayCode: s.item.displayCode,
      nameZh: s.item.nameZh,
      market: s.item.market,
      matchType: determineMatchType(s.score),
      matchField: determineMatchField(normalizedQuery, s.item),
      score: s.score,
    }));

  return matched;
}

function calculateMatchScore(query: string, item: StockIndexItem): number {
  let score = 0;
  const q = query.toLowerCase();
  const canonical = normalizeQuery(item.canonicalCode);
  const display = normalizeQuery(item.displayCode);
  const name = normalizeQuery(item.nameZh);
  const pinyinFull = normalizeQuery(item.pinyinFull || '');
  const pinyinAbbr = normalizeQuery(item.pinyinAbbr || '');
  const aliases = item.aliases?.map((a) => normalizeQuery(a)) || [];

  if (q === canonical) return 100;
  if (q === display) return 99;
  if (q === name) return 98;
  if (aliases.some((a) => a === q)) return 97;
  if (q === pinyinAbbr) return 96;

  if (display.startsWith(q)) score = Math.max(score, 80);
  if (name.startsWith(q)) score = Math.max(score, 79);
  if (pinyinAbbr.startsWith(q)) score = Math.max(score, 78);
  if (aliases.some((a) => a.startsWith(q))) score = Math.max(score, 77);

  if (display.includes(q)) score = Math.max(score, 60);
  if (name.includes(q)) score = Math.max(score, 59);
  if (pinyinFull.includes(q)) score = Math.max(score, 58);
  if (aliases.some((a) => a.includes(q))) score = Math.max(score, 57);

  return score;
}

function determineMatchType(score: number): StockSuggestion['matchType'] {
  if (score >= MATCH_SCORE.EXACT_MIN) return 'exact';
  if (score >= MATCH_SCORE.PREFIX_MIN) return 'prefix';
  if (score >= MATCH_SCORE.CONTAINS_MIN) return 'contains';
  return 'fuzzy';
}

function determineMatchField(
  query: string,
  item: StockIndexItem,
): StockSuggestion['matchField'] {
  const q = query.toLowerCase();
  const canonical = normalizeQuery(item.canonicalCode);
  const display = normalizeQuery(item.displayCode);
  const name = normalizeQuery(item.nameZh);
  const pinyinFull = normalizeQuery(item.pinyinFull || '');
  const pinyinAbbr = normalizeQuery(item.pinyinAbbr || '');
  const aliases = item.aliases?.map((a) => normalizeQuery(a)) || [];

  if (canonical.includes(q) || display.includes(q)) return 'code';
  if (name.includes(q)) return 'name';
  if (pinyinFull.includes(q) || pinyinAbbr.includes(q)) return 'pinyin';
  if (aliases.some((a) => a.includes(q))) return 'alias';
  return 'name';
}