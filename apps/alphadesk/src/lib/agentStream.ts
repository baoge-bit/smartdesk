export interface AgentStreamEvent {
  type: string;
  content?: string;
  message?: string;
  error?: string;
  success?: boolean;
  session_id?: string;
  tool?: string;
  display_name?: string;
  step?: number;
}

export interface AgentStreamResult {
  content: string;
  sessionId?: string;
  steps: AgentStreamEvent[];
}

export async function consumeAgentStream(
  response: Response,
  onEvent?: (event: AgentStreamEvent) => void,
): Promise<AgentStreamResult> {
  if (!response.ok || !response.body) {
    throw new Error(`Stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const steps: AgentStreamEvent[] = [];
  let content = '';
  let sessionId: string | undefined;

  const processLine = (line: string) => {
    if (!line.startsWith('data: ')) return;
    const event = JSON.parse(line.slice(6)) as AgentStreamEvent;

    if (event.type === 'done') {
      if (event.success === false) {
        throw new Error(event.error || event.content || 'Agent request failed');
      }
      content = event.content ?? '';
      sessionId = event.session_id;
      return;
    }

    if (event.type === 'error') {
      throw new Error(event.message || event.error || 'Agent stream error');
    }

    steps.push(event);
    onEvent?.(event);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) processLine(line.trim());
    }
  }

  if (buffer.trim().startsWith('data: ')) {
    processLine(buffer.trim());
  }

  return { content, sessionId, steps };
}