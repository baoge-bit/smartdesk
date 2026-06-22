import { useCallback, useState } from 'react';
import { analysisApi } from '@/api/analysis';
import { useI18n } from '@/i18n';

interface UseRerunAnalysisOptions {
  onComplete?: () => void;
}

export function useRerunAnalysis(options?: UseRerunAnalysisOptions) {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const rerun = useCallback(
    async (stockCode: string) => {
      const code = stockCode.trim();
      if (!code || running) return;

      setRunning(true);
      setMessage(t('reports.rerunning'));

      try {
        const accepted = await analysisApi.runSingle(code, { forceRefresh: true, notify: false });
        const taskId = accepted.taskId ?? accepted.accepted?.[0]?.taskId;

        if (taskId) {
          await analysisApi.waitForTask(taskId);
        } else {
          await new Promise((r) => setTimeout(r, 3000));
        }

        setMessage(t('reports.rerunDone'));
        options?.onComplete?.();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t('reports.rerunFailed'));
      } finally {
        setRunning(false);
        window.setTimeout(() => setMessage(null), 4000);
      }
    },
    [running, options, t],
  );

  return { rerun, running, message };
}