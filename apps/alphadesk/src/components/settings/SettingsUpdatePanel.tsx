import { Download, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { useUpdaterStore } from '@/stores/updater';

export function SettingsUpdatePanel() {
  const { t } = useI18n();
  const {
    status,
    currentVersion,
    newVersion,
    releaseNotes,
    releaseDate,
    progress,
    error,
    check,
    install,
  } = useUpdaterStore();

  const statusLabel = (() => {
    switch (status) {
      case 'checking':
        return t('updater.checking');
      case 'up-to-date':
        return t('updater.upToDate');
      case 'available':
        return t('updater.availableShort', { version: newVersion ?? '' });
      case 'downloading':
        return t('updater.downloading');
      case 'installing':
        return t('updater.installing');
      case 'error':
        return t('updater.checkFailed');
      case 'unavailable':
        return t('updater.webOnly');
      default:
        return t('updater.idle');
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('updater.title')}</CardTitle>
        <CardDescription>{t('updater.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('updater.current')}:</span>
          <span className="font-mono font-medium">v{currentVersion}</span>
          <span className="text-muted-foreground">· {statusLabel}</span>
        </div>

        {(status === 'downloading' || status === 'installing') && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{status === 'installing' ? t('updater.installing') : t('updater.downloading')}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'available' && newVersion && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <p className="font-medium">{t('updater.availableShort', { version: newVersion })}</p>
            {releaseDate && (
              <p className="mt-1 text-muted-foreground">
                {new Date(releaseDate).toLocaleDateString()}
              </p>
            )}
            {releaseNotes && (
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{releaseNotes}</p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={status === 'checking' || status === 'downloading' || status === 'installing' || status === 'unavailable'}
            onClick={() => void check()}
          >
            {status === 'checking' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t('updater.check')}
          </Button>

          {status === 'available' && (
            <Button size="sm" onClick={() => void install()}>
              <Download className="h-3.5 w-3.5" />
              {t('updater.install')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}