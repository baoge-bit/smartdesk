import { useState } from 'react';
import { Loader2, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { systemApi } from '@/api/system';
import { useI18n } from '@/i18n';

type NotificationChannel =
  | 'wechat'
  | 'feishu'
  | 'telegram'
  | 'email'
  | 'discord'
  | 'slack';

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  'wechat',
  'feishu',
  'telegram',
  'email',
  'discord',
  'slack',
];

interface SettingsConnectivityPanelProps {
  values: Record<string, string>;
  configItems: Array<{ key: string; isMasked?: boolean }>;
}

function configItemsForTest(
  keys: string[],
  values: Record<string, string>,
  configItems: SettingsConnectivityPanelProps['configItems'],
) {
  return keys
    .filter((key) => {
      const item = configItems.find((i) => i.key === key);
      const value = values[key];
      if (item?.isMasked && !value.trim()) return false;
      return true;
    })
    .map((key) => ({ key, value: values[key] ?? '' }));
}

export function SettingsConnectivityPanel({ values, configItems }: SettingsConnectivityPanelProps) {
  const { t } = useI18n();
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmMessage, setLlmMessage] = useState<string | null>(null);
  const [notifyChannel, setNotifyChannel] = useState<NotificationChannel>('wechat');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);

  const testOllama = async () => {
    setLlmLoading(true);
    setLlmMessage(null);
    try {
      const baseUrl = values.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
      const model = values.OLLAMA_MODEL?.trim() || 'qwen2.5:14b';
      const result = await systemApi.testLlmChannel({
        name: 'ollama',
        protocol: 'ollama',
        baseUrl,
        apiKey: '',
        models: [model],
      });
      setLlmMessage(result.success ? t('settings.testOk', { msg: result.message }) : result.message);
    } catch (err) {
      setLlmMessage(err instanceof Error ? err.message : t('settings.testFailed'));
    } finally {
      setLlmLoading(false);
    }
  };

  const testOpenAiCompat = async () => {
    setLlmLoading(true);
    setLlmMessage(null);
    try {
      const baseUrl = values.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1';
      const apiKey = values.OPENAI_API_KEY?.trim() || values.OPENAI_API_KEYS?.split(',')[0]?.trim() || '';
      const model = values.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
      const result = await systemApi.testLlmChannel({
        name: 'openai',
        protocol: 'openai',
        baseUrl,
        apiKey,
        models: [model],
      });
      setLlmMessage(result.success ? t('settings.testOk', { msg: result.message }) : result.message);
    } catch (err) {
      setLlmMessage(err instanceof Error ? err.message : t('settings.testFailed'));
    } finally {
      setLlmLoading(false);
    }
  };

  const testNotification = async () => {
    setNotifyLoading(true);
    setNotifyMessage(null);
    try {
      const keysByChannel: Record<NotificationChannel, string[]> = {
        wechat: ['WECHAT_WEBHOOK_URL'],
        feishu: ['FEISHU_WEBHOOK_URL'],
        telegram: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
        email: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_TO'],
        discord: ['DISCORD_WEBHOOK_URL'],
        slack: ['SLACK_WEBHOOK_URL'],
      };
      const items = configItemsForTest(keysByChannel[notifyChannel], values, configItems);
      const result = await systemApi.testNotificationChannel({
        channel: notifyChannel,
        items,
        title: 'AlphaDesk',
        content: t('settings.testNotificationBody'),
      });
      setNotifyMessage(result.success ? t('settings.testOk', { msg: result.message }) : result.message);
    } catch (err) {
      setNotifyMessage(err instanceof Error ? err.message : t('settings.testFailed'));
    } finally {
      setNotifyLoading(false);
    }
  };

  const selectClass =
    'flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="h-4 w-4" />
          {t('settings.connectivity')}
        </CardTitle>
        <CardDescription>{t('settings.connectivityDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t('settings.testLlm')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={llmLoading} onClick={() => void testOllama()}>
              {llmLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('settings.testOllama')}
            </Button>
            <Button variant="outline" size="sm" disabled={llmLoading} onClick={() => void testOpenAiCompat()}>
              {t('settings.testOpenAi')}
            </Button>
          </div>
          {llmMessage && <p className="text-xs text-muted-foreground">{llmMessage}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t('settings.testNotify')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className={selectClass}
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value as NotificationChannel)}
            >
              {NOTIFICATION_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={notifyLoading}
              onClick={() => void testNotification()}
            >
              {notifyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('settings.testSend')}
            </Button>
          </div>
          {notifyMessage && <p className="text-xs text-muted-foreground">{notifyMessage}</p>}
        </div>
      </CardContent>
    </Card>
  );
}