import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { downloadBlob } from '@/lib/reportExport';

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Capture a DOM subtree as PNG using SVG foreignObject (no extra deps). */
export async function captureElementAsPng(element: HTMLElement, scale = 2): Promise<Blob> {
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.background = getComputedStyle(element).backgroundColor || '#ffffff';

  const xmlns = 'http://www.w3.org/1999/xhtml';
  const wrapper = document.createElement('div');
  wrapper.setAttribute('xmlns', xmlns);
  wrapper.appendChild(clone);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}">
      <foreignObject width="100%" height="100%" transform="scale(${scale})">
        ${new XMLSerializer().serializeToString(wrapper)}
      </foreignObject>
    </svg>`;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to render capture'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('PNG encode failed'))),
        'image/png',
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function savePngBlob(blob: Blob, filename: string): Promise<'saved' | 'downloaded'> {
  if (isTauri()) {
    const path = await save({
      defaultPath: filename,
      filters: [{ name: 'PNG', extensions: ['png'] }],
    });
    if (path) {
      const buffer = await blob.arrayBuffer();
      await writeFile(path, new Uint8Array(buffer));
      return 'saved';
    }
  }
  await downloadBlob(blob, filename);
  return 'downloaded';
}

export function findExportTarget(targetId?: string): HTMLElement | null {
  if (targetId) {
    return document.getElementById(targetId);
  }
  return (
    document.getElementById('dashboard-export-root') ??
    document.querySelector('[data-export-root]')
  );
}