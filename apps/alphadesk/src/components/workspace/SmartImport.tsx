import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardPaste, FileImage, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { stocksApi, type ExtractItem } from '@/api/stocks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { useWorkspaceStore, type WatchlistItem } from '@/stores/workspace';
import { cn } from '@/lib/utils';

const IMG_EXT_SET = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const IMG_MAX = 5 * 1024 * 1024;
const FILE_MAX = 2 * 1024 * 1024;
const TEXT_MAX = 100 * 1024;

type ItemWithChecked = ExtractItem & { id: string; checked: boolean };

interface SmartImportProps {
  open: boolean;
  onClose: () => void;
}

function normalizeConfidence(c?: string | null): 'high' | 'medium' | 'low' {
  if (c === 'high' || c === 'medium' || c === 'low') return c;
  return 'medium';
}

function mergeItems(prev: ItemWithChecked[], incoming: ExtractItem[]): ItemWithChecked[] {
  const byCode = new Map<string, ItemWithChecked>();
  const failed: ItemWithChecked[] = [];
  const order: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };

  for (const p of prev) {
    if (p.code) byCode.set(p.code, p);
    else failed.push(p);
  }

  for (const it of incoming) {
    const conf = normalizeConfidence(it.confidence);
    if (it.code) {
      const existing = byCode.get(it.code);
      if (!existing) {
        byCode.set(it.code, {
          ...it,
          confidence: conf,
          id: `${it.code}-${Date.now()}`,
          checked: conf === 'high',
        });
      } else {
        const existingConf = normalizeConfidence(existing.confidence);
        if (order[conf] > order[existingConf] || (!existing.name && it.name)) {
          byCode.set(it.code, {
            ...existing,
            name: it.name || existing.name,
            confidence: order[conf] > order[existingConf] ? conf : existingConf,
            checked: order[conf] > order[existingConf] ? conf === 'high' : existing.checked,
          });
        }
      }
    } else {
      failed.push({
        ...it,
        confidence: conf,
        id: `fail-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        checked: false,
      });
    }
  }

  return [...byCode.values(), ...failed];
}

export function SmartImport({ open, onClose }: SmartImportProps) {
  const { t, language } = useI18n();
  const mergeWatchlistItems = useWorkspaceStore((s) => s.mergeWatchlistItems);
  const pendingImportFile = useWorkspaceStore((s) => s.pendingImportFile);
  const setPendingImportFile = useWorkspaceStore((s) => s.setPendingImportFile);
  const [items, setItems] = useState<ItemWithChecked[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addItems = useCallback((incoming: ExtractItem[]) => {
    setItems((prev) => mergeItems(prev, incoming));
  }, []);

  const handleImage = useCallback(
    async (file: File) => {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      if (!IMG_EXT.includes(ext)) {
        setError(t('import.imageTypeError'));
        return;
      }
      if (file.size > IMG_MAX) {
        setError(t('import.imageSizeError'));
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await stocksApi.extractFromImage(file);
        addItems(
          res.items ?? res.codes.map((c) => ({ code: c, name: null, confidence: 'medium' })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : t('import.recognitionFailed'));
      } finally {
        setLoading(false);
      }
    },
    [addItems, t],
  );

  const handleDataFile = useCallback(
    async (file: File) => {
      if (file.size > FILE_MAX) {
        setError(t('import.fileSizeError'));
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await stocksApi.parseImport(file);
        addItems(
          res.items ?? res.codes.map((c) => ({ code: c, name: null, confidence: 'medium' })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : t('import.parseFailed'));
      } finally {
        setLoading(false);
      }
    },
    [addItems, t],
  );

  const handlePaste = useCallback(() => {
    const text = pasteText.trim();
    if (!text) return;
    if (new Blob([text]).size > TEXT_MAX) {
      setError(t('import.textSizeError'));
      return;
    }
    setError(null);
    setLoading(true);
    stocksApi
      .parseImport(undefined, text)
      .then((res) => {
        addItems(
          res.items ?? res.codes.map((c) => ({ code: c, name: null, confidence: 'medium' })),
        );
        setPasteText('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('import.parseFailed')))
      .finally(() => setLoading(false));
  }, [pasteText, addItems, t]);

  // Process file queued by global drag-and-drop
  useEffect(() => {
    if (!open || !pendingImportFile) return;
    const file = pendingImportFile;
    setPendingImportFile(null);
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (IMG_EXT_SET.has(ext)) void handleImage(file);
    else void handleDataFile(file);
  }, [open, pendingImportFile, setPendingImportFile, handleImage, handleDataFile]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (loading) return;
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      if (IMG_EXT.includes(ext)) void handleImage(file);
      else void handleDataFile(file);
    },
    [loading, handleImage, handleDataFile],
  );

  const mergeToWatchlist = async () => {
    const selected = items.filter((i) => i.checked && i.code);
    if (!selected.length) return;

    setMerging(true);
    setError(null);
    try {
      const toAdd: WatchlistItem[] = selected.map((i) => ({
        code: i.code!,
        name: i.name ?? undefined,
      }));

      mergeWatchlistItems(toAdd);

      // Best-effort sync to engine STOCK_LIST
      await Promise.allSettled(
        toAdd.map((item) => stocksApi.addToWatchlist(item.code)),
      );

      setItems([]);
      setPasteText('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('import.mergeFailed'));
    } finally {
      setMerging(false);
    }
  };

  const validCount = items.filter((i) => i.code).length;
  const checkedCount = items.filter((i) => i.checked && i.code).length;

  const confLabel = (c: 'high' | 'medium' | 'low') => {
    if (language === 'en') return c;
    return c === 'high' ? '高' : c === 'low' ? '低' : '中';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">{t('import.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('import.subtitle')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {t('import.hint')}
          </p>

          <div
            className={cn(
              'rounded-xl border border-dashed p-4 transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={loading} onClick={() => imageRef.current?.click()}>
                <FileImage className="h-3.5 w-3.5" />
                {t('import.chooseImage')}
              </Button>
              <input ref={imageRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImage(f);
                e.target.value = '';
              }} />
              <Button variant="outline" size="sm" disabled={loading} onClick={() => fileRef.current?.click()}>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {t('import.chooseFile')}
              </Button>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleDataFile(f);
                e.target.value = '';
              }} />
            </div>

            <div className="mt-3 flex gap-2">
              <textarea
                className="min-h-16 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder={t('import.pastePlaceholder')}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={loading}
              />
              <Button variant="secondary" className="shrink-0" disabled={loading || !pasteText.trim()} onClick={handlePaste}>
                <ClipboardPaste className="h-3.5 w-3.5" />
                {t('import.parse')}
              </Button>
            </div>

            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {t('import.dropHint')}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('import.processing')}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-warning">{t('import.reviewWarning')}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('import.selectionSummary', { valid: validCount, checked: checkedCount })}</span>
                <div className="flex gap-2">
                  <button type="button" className="hover:text-foreground" onClick={() => setItems((p) => p.map((i) => i.code ? { ...i, checked: true } : i))}>
                    {t('import.selectAll')}
                  </button>
                  <button type="button" className="hover:text-foreground" onClick={() => setItems([])}>
                    {t('import.clear')}
                  </button>
                </div>
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2 scrollbar-thin">
                {items.map((it) => {
                  const conf = normalizeConfidence(it.confidence);
                  return (
                    <label
                      key={it.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm',
                        it.code ? 'border-border' : 'border-destructive/30 bg-destructive/5',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={it.checked}
                        disabled={!it.code}
                        onChange={() => setItems((p) => p.map((x) => x.id === it.id && x.code ? { ...x, checked: !x.checked } : x))}
                      />
                      <span className="font-medium">{it.code || '—'}</span>
                      {it.name && <span className="text-muted-foreground">({it.name})</span>}
                      <Badge
                        variant={conf === 'high' ? 'success' : conf === 'low' ? 'warning' : 'outline'}
                        className="ml-auto text-[10px]"
                      >
                        {confLabel(conf)}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={merging || checkedCount === 0}
            onClick={() => void mergeToWatchlist()}
          >
            {merging ? t('import.merging') : t('import.merge')}
          </Button>
        </div>
      </div>
      <button type="button" className="fixed inset-0 -z-10" aria-label="Close" onClick={onClose} />
    </div>
  );
}