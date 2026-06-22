import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n';

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();

  if (compact) {
    return (
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        <AlertTriangle className="mr-1 inline h-3 w-3 text-warning" />
        {t('disclaimer.body')}
      </p>
    );
  }

  return (
    <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
      <div className="mb-1 flex items-center gap-1.5 font-medium text-warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        {t('disclaimer.title')}
      </div>
      {t('disclaimer.body')}
    </div>
  );
}