import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { analysisApi, type TaskInfo } from '@/api/analysis';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export function TaskProgress() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<TaskInfo[]>([]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const data = await analysisApi.getTasks();
        if (active) {
          setTasks(
            data.filter(
              (t) =>
                t.status === 'running' ||
                t.status === 'processing' ||
                t.status === 'pending',
            ),
          );
        }
      } catch {
        /* engine may not be ready */
      }
    };
    void poll();
    const id = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (tasks.length === 0) return null;

  return (
    <div className="border-t border-border bg-muted/30 p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">{t('task.progress')}</div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.taskId} className="rounded-md border border-border bg-card p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="font-medium">{task.stockCode || task.stockName || '—'}</span>
                {task.stage && <Badge variant="outline">{task.stage}</Badge>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => void analysisApi.cancelTask(task.taskId)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            {task.progress != null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full bg-primary transition-all')}
                  style={{ width: `${Math.min(100, task.progress)}%` }}
                />
              </div>
            )}
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{task.message}</span>
              {task.etaSeconds != null && (
                <span>
                  {t('task.eta')}: {Math.ceil(task.etaSeconds / 60)}m
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}