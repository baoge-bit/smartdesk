import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { ExportPdfResult } from '@/api/export';

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadText(content: string, filename: string, mime = 'text/plain') {
  await downloadBlob(new Blob([content], { type: mime }), filename);
}

/** Client-side HTML → PDF via browser print (works in Tauri WebView). */
export function printHtmlToPdf(html: string, title = 'AlphaDesk Report') {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Print frame unavailable');
  }

  doc.open();
  doc.write(html);
  doc.close();
  doc.title = title;
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  setTimeout(() => document.body.removeChild(iframe), 1000);
}

export async function saveExportResult(
  result: ExportPdfResult,
  preferredName?: string,
): Promise<'saved' | 'printed' | 'downloaded'> {
  const filename = preferredName ?? (result.format === 'pdf' ? result.filename : result.filename);

  if (result.format === 'pdf') {
    if (isTauri()) {
      const path = await save({
        defaultPath: filename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (path) {
        const buffer = await result.blob.arrayBuffer();
        await writeFile(path, new Uint8Array(buffer));
        return 'saved';
      }
    }
    await downloadBlob(result.blob, filename);
    return 'downloaded';
  }

  // HTML fallback
  if (isTauri()) {
    const path = await save({
      defaultPath: filename.replace(/\.html$/, '.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }, { name: 'HTML', extensions: ['html'] }],
    });
    if (path?.endsWith('.html')) {
      await writeFile(path, new TextEncoder().encode(result.html));
      return 'saved';
    }
  }

  printHtmlToPdf(result.html, filename);
  return 'printed';
}
