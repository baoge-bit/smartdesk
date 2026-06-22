import { useState } from 'react';
import { ChevronDown, FileDown, FileImage, FileText, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportExport } from '@/hooks/useReportExport';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

interface ExportMenuProps {
  recordId?: number;
  stockCode?: string;
  stockName?: string;
  disabled?: boolean;
  exportTargetId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
}

export function ExportMenu({
  recordId,
  stockCode,
  stockName,
  disabled,
  exportTargetId,
  variant = 'outline',
  size = 'sm',
}: ExportMenuProps) {
  const { t } = useI18n();
  const { exporting, error, lastAction, exportPdf, exportMarkdown, exportImage } = useReportExport();
  const [open, setOpen] = useState(false);

  const canExport = Boolean(recordId || stockCode);
  const baseName = stockCode
    ? `AlphaDesk_${stockCode}${stockName ? `_${stockName}` : ''}`
    : 'AlphaDesk_report';

  const run = async (action: 'pdf' | 'markdown' | 'print' | 'image') => {
    setOpen(false);
    if (action === 'markdown' && recordId) {
      await exportMarkdown(recordId, `${baseName}.md`);
      return;
    }
    if (action === 'image') {
      await exportImage({ targetId: exportTargetId, filename: `${baseName}.png` });
      return;
    }
    if (action === 'pdf' || action === 'print') {
      await exportPdf({
        recordId,
        stockCode,
        filename: `${baseName}.pdf`,
      });
    }
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        disabled={disabled || !canExport || exporting}
        onClick={() => setOpen((v) => !v)}
        className="gap-1.5"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileDown className="h-3.5 w-3.5" />
        )}
        {t('common.export')}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => void run('pdf')}
            >
              <FileDown className="h-4 w-4 text-primary" />
              {t('export.pdf')}
            </button>
            {recordId && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                onClick={() => void run('markdown')}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t('export.markdown')}
              </button>
            )}
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => void run('image')}
            >
              <FileImage className="h-4 w-4 text-muted-foreground" />
              {t('export.image')}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => void run('print')}
            >
              <Printer className="h-4 w-4 text-muted-foreground" />
              {t('export.print')}
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="absolute right-0 top-full z-30 mt-1 max-w-xs text-xs text-destructive">
          {error}
        </p>
      )}
      {lastAction && !error && (
        <p className="absolute right-0 top-full z-30 mt-1 text-xs text-bull">{lastAction}</p>
      )}
    </div>
  );
}