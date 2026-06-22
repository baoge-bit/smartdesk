import { useCallback, useState } from 'react';
import { exportApi } from '@/api/export';
import { historyApi } from '@/api/history';
import { captureElementAsPng, findExportTarget, savePngBlob } from '@/lib/imageExport';
import { saveExportResult, downloadText } from '@/lib/reportExport';
import { useI18n } from '@/i18n';

export function useReportExport() {
  const { language, t } = useI18n();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const exportPdf = useCallback(
    async (options: { recordId?: number; stockCode?: string; filename?: string }) => {
      setExporting(true);
      setError(null);
      setLastAction(null);
      try {
        const result = await exportApi.exportPdf({
          recordId: options.recordId,
          stockCode: options.stockCode,
          language,
        });
        const action = await saveExportResult(result, options.filename);
        setLastAction(
          action === 'printed' ? t('export.printed') : t('export.downloaded'),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : t('export.failed'));
      } finally {
        setExporting(false);
      }
    },
    [language, t],
  );

  const exportMarkdown = useCallback(
    async (recordId: number, filename?: string) => {
      setExporting(true);
      setError(null);
      setLastAction(null);
      try {
        const content = await historyApi.getMarkdown(recordId);
        const name = filename ?? `AlphaDesk_report_${recordId}.md`;
        await downloadText(content, name, 'text/markdown');
        setLastAction(t('export.downloaded'));
      } catch (e) {
        setError(e instanceof Error ? e.message : t('export.failed'));
      } finally {
        setExporting(false);
      }
    },
    [t],
  );

  const exportImage = useCallback(
    async (options: { targetId?: string; filename?: string } = {}) => {
      setExporting(true);
      setError(null);
      setLastAction(null);
      try {
        const target = findExportTarget(options.targetId);
        if (!target) {
          throw new Error(t('export.noCaptureTarget'));
        }
        const blob = await captureElementAsPng(target);
        const name = options.filename ?? 'AlphaDesk_report.png';
        await savePngBlob(blob, name);
        setLastAction(t('export.imageSaved'));
      } catch (e) {
        setError(e instanceof Error ? e.message : t('export.imageFailed'));
      } finally {
        setExporting(false);
      }
    },
    [t],
  );

  return {
    exporting,
    error,
    lastAction,
    exportPdf,
    exportMarkdown,
    exportImage,
    clearStatus: () => setLastAction(null),
  };
}