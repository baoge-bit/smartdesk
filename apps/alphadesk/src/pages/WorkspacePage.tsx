import { GitCompare, LayoutDashboard } from 'lucide-react';
import { DashboardComparePanel } from '@/components/workspace/DashboardComparePanel';
import { DashboardPanel } from '@/components/workspace/DashboardPanel';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useWorkspaceStore } from '@/stores/workspace';
import { cn } from '@/lib/utils';

export default function WorkspacePage() {
  const { t } = useI18n();
  const {
    selectedCode,
    watchlist,
    dashboardMode,
    compareCodes,
    setDashboardMode,
    initCompareFromWatchlist,
  } = useWorkspaceStore();
  const selected = watchlist.find((w) => w.code === selectedCode);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card/40 px-4 py-2">
        <Button
          variant={dashboardMode === 'single' ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setDashboardMode('single')}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          {t('dashboard.singleView')}
        </Button>
        <Button
          variant={dashboardMode === 'compare' ? 'default' : 'outline'}
          size="sm"
          className={cn('h-8 gap-1.5', dashboardMode === 'compare' && 'shadow-sm')}
          onClick={() => {
            initCompareFromWatchlist();
            setDashboardMode('compare');
          }}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {t('dashboard.compareView')}
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        {dashboardMode === 'compare' ? (
          <DashboardComparePanel codes={compareCodes} />
        ) : (
          <DashboardPanel stockCode={selectedCode} stockName={selected?.name} />
        )}
      </div>
    </div>
  );
}