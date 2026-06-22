import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRerunAnalysis } from '@/hooks/useRerunAnalysis';
import { useI18n } from '@/i18n';

interface ReportRerunButtonProps {
  stockCode: string;
  onComplete?: () => void;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'default';
  showLabel?: boolean;
}

export function ReportRerunButton({
  stockCode,
  onComplete,
  size = 'sm',
  variant = 'outline',
  showLabel = true,
}: ReportRerunButtonProps) {
  const { t } = useI18n();
  const { rerun, running, message } = useRerunAnalysis({ onComplete });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={variant}
        size={size}
        disabled={running || !stockCode}
        onClick={() => void rerun(stockCode)}
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {showLabel && (
          <span className={size === 'sm' ? 'hidden sm:inline' : ''}>
            {running ? t('reports.rerunning') : t('reports.rerun')}
          </span>
        )}
      </Button>
      {message && <span className="text-[10px] text-muted-foreground">{message}</span>}
    </div>
  );
}