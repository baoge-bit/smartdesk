import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRerunAnalysis } from '@/hooks/useRerunAnalysis';
import { useI18n } from '@/i18n';

interface DashboardAnalyzeButtonProps {
  stockCode: string | null | undefined;
  hasReport?: boolean;
  onComplete?: () => void;
}

export function DashboardAnalyzeButton({
  stockCode,
  hasReport,
  onComplete,
}: DashboardAnalyzeButtonProps) {
  const { t } = useI18n();
  const { rerun, running, message } = useRerunAnalysis({ onComplete });

  const label = hasReport ? t('dashboard.reanalyze') : t('dashboard.analyzeStock');

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={!stockCode || running}
        onClick={() => stockCode && void rerun(stockCode)}
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5" />
        )}
        {running ? t('dashboard.analyzing') : label}
      </Button>
      {message && <span className="text-[10px] text-muted-foreground">{message}</span>}
    </div>
  );
}