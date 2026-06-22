import { create } from 'zustand';
import { getVersion } from '@tauri-apps/api/app';
import { check, type DownloadEvent } from '@tauri-apps/plugin-updater';
import { isDesktopProduction, isTauri } from '@/lib/tauriEnv';

const DISMISS_KEY = 'alphadesk-dismissed-update';

export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error'
  | 'unavailable';

interface UpdaterState {
  status: UpdaterStatus;
  currentVersion: string;
  newVersion?: string;
  releaseNotes?: string;
  releaseDate?: string;
  progress: number;
  error?: string;
  dismissed: boolean;
  check: () => Promise<void>;
  install: () => Promise<void>;
  dismiss: () => void;
  bootstrap: () => void;
}

let pendingUpdate: Awaited<ReturnType<typeof check>> = null;

function trackProgress(
  onProgress: (pct: number) => void,
): (event: DownloadEvent) => void {
  let total = 0;
  let downloaded = 0;
  let fallback = 10;

  return (event) => {
    if (event.event === 'Started') {
      total = event.data.contentLength ?? 0;
      downloaded = 0;
      fallback = 10;
      onProgress(total > 0 ? 0 : 10);
      return;
    }
    if (event.event === 'Progress') {
      downloaded += event.data.chunkLength;
      if (total > 0) {
        onProgress(Math.min(99, Math.round((downloaded / total) * 100)));
      } else {
        fallback = Math.min(95, fallback + 2);
        onProgress(fallback);
      }
      return;
    }
    if (event.event === 'Finished') {
      onProgress(100);
    }
  };
}

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  status: isTauri() ? 'idle' : 'unavailable',
  currentVersion: '1.0.0',
  progress: 0,
  dismissed: false,

  bootstrap: () => {
    if (!isDesktopProduction()) return;

    void (async () => {
      try {
        const version = await getVersion();
        set({ currentVersion: version });
      } catch {
        /* ignore */
      }
    })();

    window.setTimeout(() => {
      void get().check();
    }, 6000);
  },

  check: async () => {
    if (!isTauri()) {
      set({ status: 'unavailable' });
      return;
    }

    set({ status: 'checking', error: undefined, progress: 0 });

    try {
      const version = await getVersion();
      set({ currentVersion: version });

      pendingUpdate = await check({ timeout: 30_000 });

      if (!pendingUpdate) {
        set({ status: 'up-to-date', newVersion: undefined, releaseNotes: undefined });
        return;
      }

      const dismissedFor = localStorage.getItem(DISMISS_KEY);
      const dismissed = dismissedFor === pendingUpdate.version;

      set({
        status: 'available',
        newVersion: pendingUpdate.version,
        releaseNotes: pendingUpdate.body,
        releaseDate: pendingUpdate.date,
        dismissed,
        progress: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        status: import.meta.env.DEV ? 'unavailable' : 'error',
        error: message,
      });
    }
  },

  install: async () => {
    if (!pendingUpdate) return;

    set({ status: 'downloading', progress: 0, error: undefined });

    try {
      let lastPct = 0;
      await pendingUpdate.downloadAndInstall(
        trackProgress((pct) => {
          lastPct = pct;
          set({ progress: pct, status: pct >= 100 ? 'installing' : 'downloading' });
        }),
      );
      set({ progress: lastPct || 100, status: 'installing' });
      await pendingUpdate.close();
      pendingUpdate = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ status: 'error', error: message });
    }
  },

  dismiss: () => {
    const version = get().newVersion;
    if (version) localStorage.setItem(DISMISS_KEY, version);
    set({ dismissed: true });
  },
}));