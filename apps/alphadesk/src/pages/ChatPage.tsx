import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { ReportMarkdown } from '@/components/reports/ReportMarkdown';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { agentApi, type ChatSessionItem, type StrategyInfo } from '@/api/agent';
import { consumeAgentStream, type AgentStreamEvent } from '@/lib/agentStream';
import { useI18n, type Translate } from '@/i18n';
import { useWorkspaceStore } from '@/stores/workspace';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function progressLabel(event: AgentStreamEvent, t: Translate): string {
  if (event.display_name) return event.display_name;
  if (event.tool) return event.tool;
  switch (event.type) {
    case 'thinking':
      return t('chat.progress.thinking');
    case 'tool_start':
      return t('chat.progress.toolStart');
    case 'tool_done':
      return t('chat.progress.toolDone');
    case 'generating':
      return t('chat.progress.generating');
    default:
      return event.type;
  }
}

function toUiMessages(
  raw: Array<{ role: string; content: string }>,
): Message[] {
  return raw
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}

export default function ChatPage() {
  const { t } = useI18n();
  const { selectedCode, selectedStrategyId, setSelectedStrategyId } = useWorkspaceStore();
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressSteps, setProgressSteps] = useState<AgentStreamEvent[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const list = await agentApi.listSessions(50);
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    agentApi.listStrategies().then(setStrategies).catch(() => {});
    void refreshSessions();
    return () => abortRef.current?.abort();
  }, [refreshSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, progressSteps]);

  const startNewSession = () => {
    abortRef.current?.abort();
    setSessionId(undefined);
    setMessages([]);
    setInput('');
    setProgressSteps([]);
    setLoading(false);
  };

  const loadSession = async (id: string) => {
    if (loading) return;
    abortRef.current?.abort();
    setSessionId(id);
    setMessages([]);
    try {
      const data = await agentApi.getSessionMessages(id);
      setMessages(toUiMessages(data.messages));
    } catch {
      setMessages([]);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await agentApi.deleteSession(id);
      if (sessionId === id) startNewSession();
      await refreshSessions();
    } catch {
      /* ignore */
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    setProgressSteps([]);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const response = await agentApi.chatStream(
        {
          message: text,
          sessionId,
          strategies: selectedStrategyId ? [selectedStrategyId] : undefined,
          stockCode: selectedCode ?? undefined,
        },
        { signal: ac.signal },
      );

      const result = await consumeAgentStream(response, (event) => {
        setProgressSteps((steps) => [...steps, event]);
      });

      if (result.sessionId) setSessionId(result.sessionId);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: result.content || '—' },
      ]);
      await refreshSessions();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Error',
        },
      ]);
    } finally {
      setLoading(false);
      setProgressSteps([]);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex h-full">
      <ChatSessionSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        loading={sessionsLoading}
        onSelect={(id) => void loadSession(id)}
        onNew={startNewSession}
        onDelete={(id) => void deleteSession(id)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">{t('chat.title')}</h2>
          {selectedCode && (
            <p className="text-xs text-muted-foreground">
              {selectedCode} · {t('chat.strategies')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2">
          {strategies.slice(0, 12).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStrategyId(s.id === selectedStrategyId ? '' : s.id)}
            >
              <Badge variant={selectedStrategyId === s.id ? 'default' : 'outline'}>{s.name}</Badge>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          <DisclaimerBanner compact />
          {messages.length === 0 && !loading ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              {t('chat.placeholder')}
            </Card>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    msg.role === 'user' ? 'bg-primary/15 text-primary' : 'bg-muted',
                  )}
                >
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border',
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <ReportMarkdown content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('chat.progress.running')}
              </div>
              {progressSteps.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {progressSteps.slice(-6).map((step, idx) => (
                    <li key={`${step.type}-${idx}`}>· {progressLabel(step, t)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
              disabled={loading}
            />
            <Button onClick={() => void send()} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
