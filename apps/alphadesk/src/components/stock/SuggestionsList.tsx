import type { CSSProperties } from 'react';
import type { StockSuggestion, Market } from '@/types/stockIndex';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

interface SuggestionsListProps {
  suggestions: StockSuggestion[];
  highlightedIndex: number;
  onSelect: (suggestion: StockSuggestion) => void;
  onMouseEnter: (index: number) => void;
  style?: CSSProperties;
}

const MARKET_LABELS: Record<Market, { zh: string; en: string }> = {
  CN: { zh: 'A股', en: 'CN' },
  HK: { zh: '港股', en: 'HK' },
  US: { zh: '美股', en: 'US' },
  JP: { zh: '日股', en: 'JP' },
  KR: { zh: '韩股', en: 'KR' },
  INDEX: { zh: '指数', en: 'IDX' },
  ETF: { zh: 'ETF', en: 'ETF' },
  BSE: { zh: '北交所', en: 'BSE' },
};

export function SuggestionsList({
  suggestions,
  highlightedIndex,
  onSelect,
  onMouseEnter,
  style,
}: SuggestionsListProps) {
  const { language, t } = useI18n();

  if (suggestions.length === 0) return null;

  return (
    <ul
      id="stock-suggestions-list"
      role="listbox"
      className="z-[200] max-h-60 overflow-auto rounded-b-lg border border-border bg-card shadow-xl"
      style={style}
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.canonicalCode}
          role="option"
          aria-selected={index === highlightedIndex}
          className={cn(
            'flex cursor-pointer items-center justify-between px-3 py-2 transition-colors',
            'hover:bg-muted',
            index === highlightedIndex && 'bg-muted',
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => onMouseEnter(index)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {language === 'zh'
                ? MARKET_LABELS[suggestion.market]?.zh
                : MARKET_LABELS[suggestion.market]?.en}
            </Badge>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{suggestion.nameZh}</div>
              <div className="text-xs text-muted-foreground">{suggestion.displayCode}</div>
            </div>
          </div>
          <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
            {t(`autocomplete.match.${suggestion.matchField}`)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}