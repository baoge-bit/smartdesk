import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { setApiBaseUrl } from '@/api/client';
import { analysisApi } from '@/api/analysis';

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function useEngine() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl, setUrl] = useState('');

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function bootstrap() {
      try {
        if (isTauri()) {
          const base = await invoke<string>('get_api_base_url');
          setApiBaseUrl(base);
          setUrl(base);

          unlisten = await listen<{ ready: boolean; apiBaseUrl: string }>(
            'engine-ready',
            (event) => {
              if (event.payload.apiBaseUrl) {
                setApiBaseUrl(event.payload.apiBaseUrl);
                setUrl(event.payload.apiBaseUrl);
              }
              setReady(event.payload.ready);
              setLoading(false);
            },
          );
        } else {
          // Web dev: Vite proxy
          setUrl('');
          await analysisApi.health();
          setReady(true);
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Engine unavailable');
        setLoading(false);
      }
    }

    void bootstrap();
    return () => unlisten?.();
  }, []);

  return { ready, loading, error, apiBaseUrl };
}