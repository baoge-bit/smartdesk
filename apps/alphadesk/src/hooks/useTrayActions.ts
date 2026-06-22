import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { analysisApi } from '@/api/analysis';
import { systemApi } from '@/api/system';
import { useI18n } from '@/i18n';
import { useUpdaterStore } from '@/stores/updater';

export function useTrayActions(onQuickAnalyze?: () => void) {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void (async () => {
      try {
        unlisten = await listen<string>('tray-action', async (event) => {
          switch (event.payload) {
            case 'quick-analyze':
              await analysisApi.runWatchlist();
              onQuickAnalyze?.();
              void invoke('show_notification', {
                title: 'AlphaDesk',
                body: t('tray.quickAnalyze'),
              });
              break;
            case 'open-dashboard':
              navigate('/');
              break;
            case 'toggle-schedule': {
              const status = await systemApi.getSchedulerStatus();
              const next = !(status.enabled ?? false);
              await systemApi.toggleSchedule(next);
              void invoke('show_notification', {
                title: 'AlphaDesk',
                body: next ? t('tray.scheduleOn') : t('tray.scheduleOff'),
              });
              break;
            }
            case 'check-update': {
              await useUpdaterStore.getState().check();
              const { status, newVersion } = useUpdaterStore.getState();
              const body =
                status === 'available' && newVersion
                  ? t('updater.trayAvailable', { version: newVersion })
                  : status === 'up-to-date'
                    ? t('updater.trayUpToDate')
                    : t('updater.trayCheckDone');
              void invoke('show_notification', { title: 'AlphaDesk', body });
              if (status === 'available') {
                navigate('/settings');
              }
              break;
            }
          }
        });
      } catch {
        // Not running in Tauri
      }
    })();

    return () => unlisten?.();
  }, [navigate, onQuickAnalyze, t]);
}