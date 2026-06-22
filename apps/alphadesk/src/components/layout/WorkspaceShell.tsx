import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Briefcase,
  FlaskConical,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  Zap,
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WatchlistPanel } from '@/components/workspace/WatchlistPanel';
import { TaskProgress } from '@/components/workspace/TaskProgress';
import { CommandPalette } from '@/components/workspace/CommandPalette';
import { useI18n } from '@/i18n';
import { useWorkspaceStore } from '@/stores/workspace';
import { useEngine } from '@/hooks/useEngine';
import { cn } from '@/lib/utils';
import { analysisApi } from '@/api/analysis';
import { useTrayActions } from '@/hooks/useTrayActions';
import { SmartImport } from '@/components/workspace/SmartImport';
import { UpdateBanner } from '@/components/workspace/UpdateBanner';
import { useUpdaterStore } from '@/stores/updater';

const navItems = [
  { to: '/', icon: LayoutDashboard, key: 'nav.workspace' as const },
  { to: '/chat', icon: MessageSquare, key: 'nav.chat' as const },
  { to: '/reports', icon: BarChart3, key: 'nav.reports' as const },
  { to: '/backtest', icon: FlaskConical, key: 'nav.backtest' as const },
  { to: '/portfolio', icon: Briefcase, key: 'nav.portfolio' as const },
  { to: '/signals', icon: Activity, key: 'nav.signals' as const },
  { to: '/settings', icon: Settings, key: 'nav.settings' as const },
];

export function WorkspaceShell() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useWorkspaceStore();
  const { ready, loading, error } = useEngine();
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [globalDragging, setGlobalDragging] = useState(false);
  const smartImportOpen = useWorkspaceStore((s) => s.smartImportOpen);
  const setSmartImportOpen = useWorkspaceStore((s) => s.setSmartImportOpen);
  const setPendingImportFile = useWorkspaceStore((s) => s.setPendingImportFile);
  const [analyzing, setAnalyzing] = useState(false);
  useTrayActions(() => setAnalyzing(false));

  useEffect(() => {
    useUpdaterStore.getState().bootstrap();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => root.classList.toggle('dark', dark);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    apply(theme === 'dark');
  }, [theme]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await analysisApi.runWatchlist();
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) {
          e.preventDefault();
          setGlobalDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setGlobalDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setGlobalDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          setPendingImportFile(file);
          setSmartImportOpen(true);
        }
      }}
    >
      {globalDragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
          <div className="rounded-xl border-2 border-dashed border-primary bg-card/90 px-6 py-4 text-sm font-medium text-primary shadow-lg">
            {t('import.dropHint')}
          </div>
        </div>
      )}
      {/* Title bar / toolbar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-sm">
            α
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">{t('app.name')}</div>
            <div className="text-[10px] text-muted-foreground">{t('app.tagline')}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={ready ? 'success' : loading ? 'warning' : 'danger'}>
            <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', ready ? 'bg-bull' : 'bg-warning animate-pulse-dot')} />
            {loading ? t('engine.starting') : ready ? t('common.online') : t('common.offline')}
          </Badge>

          <Button
            size="sm"
            onClick={() => void handleAnalyze()}
            disabled={!ready || analyzing}
          >
            <Zap className="h-3.5 w-3.5" />
            {analyzing ? t('common.analyzing') : t('common.analyze')}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            title={t('language.toggle')}
          >
            <Globe className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => setCmdkOpen(true)}
          >
            ⌘K
          </Button>
        </div>
      </header>

      <UpdateBanner />

      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {t('engine.error')}: {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3">
          {navItems.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
              title={t(key)}
            >
              <Icon className="h-4 w-4" />
            </NavLink>
          ))}
        </nav>

        {/* Resizable workspace */}
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={22} minSize={16} maxSize={35}>
            <div className="flex h-full flex-col border-r border-border bg-card/50">
              <WatchlistPanel />
              <TaskProgress />
            </div>
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          <Panel defaultSize={78} minSize={50}>
            <main className="h-full overflow-hidden bg-background">
              <Outlet />
            </main>
          </Panel>
        </PanelGroup>
      </div>

      <CommandPalette
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        onAnalyze={() => void handleAnalyze()}
      />

      <SmartImport
        open={smartImportOpen}
        onClose={() => setSmartImportOpen(false)}
      />
    </div>
  );
}