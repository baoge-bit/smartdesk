import { Download, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useUpdaterStore } from '@/stores/updater';

export function UpdateBanner() {
  const { t } = useI18n();
  const {
    status,
    newVersion,
    currentVersion,
    progress,
    dismissed,
    error,
    check,
    install,
    dismiss,
  } = useUpdaterStore();

  if (status === 'unavailable') return null;

  if (status === 'available' && !dismissed && newVersion) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-primary/30 bg-primary/10 px-4 py-2 text-xs">
        <span>
          {t('updater.available', { current: currentVersion, next: newVersion })}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="h-7 gap-1" onClick={() => void install()}>
            <Download className="h-3 w-3" />
            {t('updater.install')}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'downloading' || status === 'installing') {
    return (
      <div className="border-b border-border bg-card px-4 py-2 text-xs">
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {status === 'installing' ? t('updater.installing') : t('updater.downloading')}
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <div className="flex items-center justify-between gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
        <span>{t('updater.error', { msg: error })}</span>
        <Button variant="ghost" size="sm" className="h-7" onClick={() => void check()}>
          {t('updater.retry')}
        </Button>
      </div>
    );
  }

  return null;
}