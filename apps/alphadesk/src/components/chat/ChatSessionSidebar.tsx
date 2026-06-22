import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import type { ChatSessionItem } from '@/api/agent';
import { cn } from '@/lib/utils';

interface ChatSessionSidebarProps {
  sessions: ChatSessionItem[];
  activeSessionId?: string;
  loading?: boolean;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onDelete: (sessionId: string) => void;
}

function formatWhen(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: ChatSessionSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card/40">
      <div className="border-b border-border p-3">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onNew}>
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t('chat.newSession')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {loading && sessions.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">{t('common.loading')}</p>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">{t('chat.noSessions')}</p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => {
              const active = session.sessionId === activeSessionId;
              return (
                <li key={session.sessionId}>
                  <div
                    className={cn(
                      'group flex items-start gap-1 rounded-md border px-2 py-2 text-left transition-colors',
                      active
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-transparent hover:border-border hover:bg-muted/50',
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelect(session.sessionId)}
                    >
                      <p className="truncate text-xs font-medium">{session.title || t('chat.untitled')}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {session.messageCount} {t('chat.messages')} · {formatWhen(session.lastActive)}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-bear group-hover:opacity-100"
                      title={t('common.delete')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.sessionId);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}