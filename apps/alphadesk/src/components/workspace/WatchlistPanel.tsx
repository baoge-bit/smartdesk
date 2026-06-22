import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockAutocomplete } from '@/components/stock/StockAutocomplete';
import { SmartImport } from '@/components/workspace/SmartImport';
import { useI18n } from '@/i18n';
import { useWorkspaceStore } from '@/stores/workspace';
import { stocksApi } from '@/api/stocks';
import { cn } from '@/lib/utils';

const MARKET_SHORT: Record<string, string> = {
  CN: 'A',
  HK: 'HK',
  US: 'US',
  JP: 'JP',
  KR: 'KR',
  ETF: 'ETF',
  INDEX: 'IDX',
  BSE: 'BSE',
};

export function WatchlistPanel() {
  const { t } = useI18n();
  const {
    watchlist,
    selectedCode,
    setSelectedCode,
    addToWatchlist,
    removeFromWatchlist,
  } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const importOpen = useWorkspaceStore((s) => s.smartImportOpen);
  const setImportOpen = useWorkspaceStore((s) => s.setSmartImportOpen);
  const [panelDragging, setPanelDragging] = useState(false);

  const handleAdd = useCallback(
    async (code: string, name?: string, market?: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      addToWatchlist({
        code: trimmed,
        name,
        market: market ? (MARKET_SHORT[market] ?? market) : undefined,
      });
      setSelectedCode(trimmed);
      setInput('');
      void stocksApi.addToWatchlist(trimmed).catch(() => {});
    },
    [addToWatchlist, setSelectedCode],
  );

  // Global paste: when user pastes CSV/text while focus is not in an input
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (!text || text.length > 500) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable]')) return;

      const looksLikeCodes = /[\d]{4,6}|[A-Z]{1,5}|\.HK|hk\d/i.test(text);
      if (!looksLikeCodes) return;

      e.preventDefault();
      setImportOpen(true);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const setPendingImportFile = useWorkspaceStore((s) => s.setPendingImportFile);

  const onPanelDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPanelDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setPendingImportFile(file);
      setImportOpen(true);
    }
  }, [setImportOpen, setPendingImportFile]);

  return (
    <div
      className={cn(
        'flex h-full flex-col transition-colors',
        panelDragging && 'bg-primary/5',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setPanelDragging(true);
      }}
      onDragLeave={() => setPanelDragging(false)}
      onDrop={onPanelDrop}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold">{t('watchlist.title')}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setImportOpen(true)}
          title={t('watchlist.import')}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-border p-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <StockAutocomplete
              value={input}
              onChange={setInput}
              onSubmit={(code, name, market) => void handleAdd(code, name, market)}
              placeholder={t('watchlist.placeholder')}
            />
          </div>
          <Button size="icon" onClick={() => input.trim() && void handleAdd(input)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {t('watchlist.hint')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {watchlist.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-xs text-muted-foreground">{t('watchlist.empty')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              {t('watchlist.import')}
            </Button>
          </div>
        ) : (
          <ul className="space-y-1">
            {watchlist.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => setSelectedCode(item.code)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    selectedCode === item.code
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium">{item.code}</div>
                    {item.name && (
                      <div className="truncate text-xs text-muted-foreground">{item.name}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.market && <Badge variant="outline">{item.market}</Badge>}
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(item.code);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}