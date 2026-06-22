import { apiClient, getApiBaseUrl } from './client';

export interface ExportHtmlFallback {
  format: 'html';
  content: string;
  filename: string;
  message?: string;
}

export type ExportPdfResult =
  | { format: 'pdf'; blob: Blob; filename: string }
  | { format: 'html'; html: string; filename: string; message?: string };

export const exportApi = {
  async exportPdf(options: {
    recordId?: number;
    stockCode?: string;
    language?: 'zh' | 'en';
  }): Promise<ExportPdfResult> {
    // Use fetch for reliable binary / JSON detection
    const base = getApiBaseUrl();
    const url = `${base}/api/v1/export/pdf`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record_id: options.recordId,
        stock_code: options.stockCode,
        language: options.language ?? 'zh',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Export failed (${res.status})`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    const disposition = res.headers.get('content-disposition') ?? '';
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? 'AlphaDesk_report.pdf';

    if (contentType.includes('application/pdf')) {
      const blob = await res.blob();
      return { format: 'pdf', blob, filename };
    }

    const json = (await res.json()) as ExportHtmlFallback;
    return {
      format: 'html',
      html: json.content,
      filename: json.filename,
      message: json.message,
    };
  },

  async exportMarkdown(recordId: number): Promise<string> {
    const { data } = await apiClient.get(`/api/v1/export/markdown/${recordId}`);
    return data?.content ?? '';
  },

  getMarkdownDownloadUrl(recordId: number): string {
    const base = getApiBaseUrl();
    return `${base}/api/v1/export/markdown/${recordId}`;
  },
};