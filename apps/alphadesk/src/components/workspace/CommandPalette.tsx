import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Activity,
  BarChart3,
  Briefcase,
  Download,
  FlaskConical,
  GitCompare,
  Import,
  LayoutDashboard,
  Columns2,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  Zap,
} from 'lucide-react';
import { agentApi, type StrategyInfo } from '@/api/agent';
import { historyApi, type HistoryItem } from '@/api/history';
import { useI18n } from '@/i18n';
import { useUpdaterStore } from '@/stores/updater';
import { useWorkspaceStore } from '@/stores/workspace';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze?: () => void;
}

export function CommandPalette({ open, onOpenChange, onAnalyze }: CommandPaletteProps) {
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    watchlist,
    setSelectedCode,
    setSelectedStrategyId,
    setSmartImportOpen,
    setDashboardMode,
    initCompareFromWatchlist,
    selectedCode,
  } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [recentReports, setRecentReports] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    void agentApi.listStrategies().then(setStrategies).catch(() => {});
    void historyApi.list({ limit: 8 }).then((res) => setRecentReports(res.items)).catch(() => {});
  }, [open]);

  const q = query.trim().toLowerCase();

  const filteredWatchlist = useMemo(() => {
    if (!q) return watchlist.slice(0, 8);
    return watchlist
      .filter(
        (w) =>
          w.code.toLowerCase().includes(q) ||
          w.name?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [q, watchlist]);

  const filteredStrategies = useMemo(() => {
    if (!strategies.length) return [];
    if (!q) return strategies.slice(0, 8);
    return strategies
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [q, strategies]);

  const filteredReports = useMemo(() => {
    if (!q) return recentReports.slice(0, 5);
    return recentReports
      .filter(
        (r) =>
          r.stockCode.toLowerCase().includes(q) ||
          r.stockName?.toLowerCase().includes(q) ||
          r.summary?.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [q, recentReports]);

  const showNavigation = !q || 'navigation'.includes(q) || t('cmdk.groupNav').toLowerCase().includes(q);

  if (!open) return null;

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh] backdrop-blur-sm">
      <Command
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        shouldFilter={false}
      >
        <div className="flex items-center border-b border-border px-3">
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={t('cmdk.placeholder')}
            className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {t('common.noData')}
          </Command.Empty>

          {filteredWatchlist.length > 0 && (
            <Command.Group heading={t('nav.watchlist')} className="px-1 text-xs text-muted-foreground">
              {filteredWatchlist.map((item) => (
                <CommandItem
                  key={item.code}
                  icon={<span className="font-mono text-[10px]">{item.code.slice(0, 4)}</span>}
                  onSelect={() =>
                    run(() => {
                      setSelectedCode(item.code);
                      navigate('/');
                    })
                  }
                >
                  {item.code}
                  {item.name ? ` · ${item.name}` : ''}
                </CommandItem>
              ))}
            </Command.Group>
          )}

          {filteredStrategies.length > 0 && (
            <Command.Group heading={t('cmdk.strategies')} className="mt-2 px-1 text-xs text-muted-foreground">
              {filteredStrategies.map((s) => (
                <CommandItem
                  key={s.id}
                  icon={<Zap className="h-4 w-4" />}
                  onSelect={() =>
                    run(() => {
                      setSelectedStrategyId(s.id);
                      navigate('/chat');
                    })
                  }
                >
                  {s.name}
                  <span className="ml-2 text-xs text-muted-foreground">{s.id}</span>
                </CommandItem>
              ))}
            </Command.Group>
          )}

          {filteredReports.length > 0 && (
            <Command.Group heading={t('cmdk.recentReports')} className="mt-2 px-1 text-xs text-muted-foreground">
              {filteredReports.map((r) => (
                <CommandItem
                  key={r.id}
                  icon={<BarChart3 className="h-4 w-4" />}
                  onSelect={() =>
                    run(() => {
                      setSelectedCode(r.stockCode);
                      navigate('/reports');
                    })
                  }
                >
                  {r.stockCode}
                  {r.stockName ? ` · ${r.stockName}` : ''}
                  {r.createdAt && (
                    <span className="ml-2 text-xs text-muted-foreground">{r.createdAt.slice(0, 10)}</span>
                  )}
                </CommandItem>
              ))}
            </Command.Group>
          )}

          {showNavigation && (
            <Command.Group heading={t('cmdk.groupNav')} className="mt-2 px-1 text-xs text-muted-foreground">
              <CommandItem icon={<LayoutDashboard className="h-4 w-4" />} onSelect={() => run(() => navigate('/'))}>
                {t('nav.workspace')}
              </CommandItem>
              <CommandItem icon={<MessageSquare className="h-4 w-4" />} onSelect={() => run(() => navigate('/chat'))}>
                {t('cmdk.openChat')}
              </CommandItem>
              <CommandItem icon={<BarChart3 className="h-4 w-4" />} onSelect={() => run(() => navigate('/reports'))}>
                {t('nav.reports')}
              </CommandItem>
              <CommandItem icon={<FlaskConical className="h-4 w-4" />} onSelect={() => run(() => navigate('/backtest'))}>
                {t('cmdk.openBacktest')}
              </CommandItem>
              <CommandItem icon={<Briefcase className="h-4 w-4" />} onSelect={() => run(() => navigate('/portfolio'))}>
                {t('cmdk.openPortfolio')}
              </CommandItem>
              <CommandItem icon={<Activity className="h-4 w-4" />} onSelect={() => run(() => navigate('/signals'))}>
                {t('cmdk.openSignals')}
              </CommandItem>
              <CommandItem icon={<Settings className="h-4 w-4" />} onSelect={() => run(() => navigate('/settings'))}>
                {t('cmdk.openSettings')}
              </CommandItem>
            </Command.Group>
          )}

          <Command.Group heading={t('cmdk.groupActions')} className="mt-2 px-1 text-xs text-muted-foreground">
            <CommandItem icon={<Zap className="h-4 w-4" />} onSelect={() => run(() => onAnalyze?.())}>
              {t('cmdk.analyze')}
            </CommandItem>
            {selectedCode && (
              <CommandItem
                icon={<Zap className="h-4 w-4" />}
                onSelect={() =>
                  run(async () => {
                    const { analysisApi } = await import('@/api/analysis');
                    await analysisApi.runSingle(selectedCode, { forceRefresh: true, notify: false });
                    navigate('/');
                  })
                }
              >
                {t('cmdk.analyzeSelected', { code: selectedCode })}
              </CommandItem>
            )}
            <CommandItem
              icon={<Columns2 className="h-4 w-4" />}
              onSelect={() =>
                run(() => {
                  initCompareFromWatchlist();
                  setDashboardMode('compare');
                  navigate('/');
                })
              }
            >
              {t('cmdk.compareDashboard')}
            </CommandItem>
            <CommandItem icon={<Import className="h-4 w-4" />} onSelect={() => run(() => setSmartImportOpen(true))}>
              {t('cmdk.importWatchlist')}
            </CommandItem>
            <CommandItem
              icon={<GitCompare className="h-4 w-4" />}
              onSelect={() => run(() => navigate('/reports?mode=compare'))}
            >
              {t('cmdk.compareReports')}
            </CommandItem>
            <CommandItem
              icon={<Download className="h-4 w-4" />}
              onSelect={() =>
                run(() => {
                  void useUpdaterStore.getState().check();
                  navigate('/settings');
                })
              }
            >
              {t('cmdk.checkUpdate')}
            </CommandItem>
          </Command.Group>

          <Command.Group heading={t('cmdk.groupPrefs')} className="mt-2 px-1 text-xs text-muted-foreground">
            <CommandItem
              icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            >
              {t('cmdk.toggleTheme')}
            </CommandItem>
            <CommandItem
              icon={<span className="text-xs font-bold">中/EN</span>}
              onSelect={() => run(() => setLanguage(language === 'zh' ? 'en' : 'zh'))}
            >
              {t('language.toggle')}
            </CommandItem>
          </Command.Group>
        </Command.List>
      </Command>
      <button
        type="button"
        className="fixed inset-0 -z-10"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
    </div>
  );
}

function CommandItem({
  children,
  onSelect,
  icon,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm',
        'aria-selected:bg-accent aria-selected:text-accent-foreground',
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Command.Item>
  );
}