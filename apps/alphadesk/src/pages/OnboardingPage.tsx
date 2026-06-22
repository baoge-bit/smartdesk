import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Loader2, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { agentApi, type StrategyInfo } from '@/api/agent';
import { analysisApi } from '@/api/analysis';
import { systemApi } from '@/api/system';
import { useI18n } from '@/i18n';
import { useWorkspaceStore } from '@/stores/workspace';
import { cn } from '@/lib/utils';

const STEPS = [
  'onboarding.step0',
  'onboarding.step1',
  'onboarding.step2',
  'onboarding.step3',
] as const;

type LlmMode = 'ollama' | 'cloud';

export default function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { importWatchlist, setSelectedStrategyId, completeOnboarding } = useWorkspaceStore();
  const [step, setStep] = useState(0);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [llmMode, setLlmMode] = useState<LlmMode>('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState('qwen2.5:14b');
  const [llmTesting, setLlmTesting] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<string | null>(null);
  const [watchlistText, setWatchlistText] = useState('600519,hk00700,AAPL');
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [strategy, setStrategy] = useState('ma');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await analysisApi.health();
        setEngineOnline(true);
      } catch {
        setEngineOnline(false);
      }
    })();
    agentApi.listStrategies().then(setStrategies).catch(() => {});
  }, []);

  const testLlm = async () => {
    setLlmTesting(true);
    setLlmTestResult(null);
    try {
      const result = await systemApi.testLlmChannel({
        name: 'ollama',
        protocol: 'ollama',
        baseUrl: ollamaUrl.trim(),
        apiKey: '',
        models: [ollamaModel.trim() || 'qwen2.5:14b'],
      });
      setLlmTestResult(result.success ? t('onboarding.llmOk') : result.message);
    } catch (err) {
      setLlmTestResult(err instanceof Error ? err.message : t('onboarding.llmFail'));
    } finally {
      setLlmTesting(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    importWatchlist(watchlistText.split(/[,;\s]+/));
    setSelectedStrategyId(strategy);

    const patch: Record<string, string> = {
      STOCK_LIST: watchlistText,
    };
    if (llmMode === 'ollama') {
      patch.OLLAMA_BASE_URL = ollamaUrl.trim();
      patch.OLLAMA_MODEL = ollamaModel.trim();
    }

    try {
      await systemApi.updateConfig(patch);
    } catch {
      /* engine may be offline */
    }

    completeOnboarding();
    navigate('/');
    setFinishing(false);
  };

  const strategyOptions =
    strategies.length > 0
      ? strategies.slice(0, 12)
      : ['ma', 'chan', 'wave', 'trend', 'hotspot', 'event', 'growth', 'expectation'].map((id) => ({
          id,
          name: id,
          description: '',
        }));

  return (
    <div className="flex min-h-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary">
            α
          </div>
          <CardTitle className="text-xl">{t('onboarding.welcome')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <DisclaimerBanner />

          <div className="flex justify-center gap-2">
            {STEPS.map((key, i) => (
              <div
                key={key}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                  i < step
                    ? 'bg-bull text-white'
                    : i === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('onboarding.step0')}</h3>
              <p className="text-sm text-muted-foreground">{t('onboarding.step0Desc')}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('onboarding.feature1')}
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('onboarding.feature2')}
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('onboarding.feature3')}
                </li>
              </ul>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                {engineOnline === null ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : engineOnline ? (
                  <Wifi className="h-4 w-4 text-bull" />
                ) : (
                  <WifiOff className="h-4 w-4 text-warning" />
                )}
                <span>
                  {engineOnline === null
                    ? t('onboarding.engineChecking')
                    : engineOnline
                      ? t('onboarding.engineOnline')
                      : t('onboarding.engineOffline')}
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('onboarding.step1')}</h3>
              <div className="flex gap-2">
                <Button
                  variant={llmMode === 'ollama' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLlmMode('ollama')}
                >
                  Ollama
                </Button>
                <Button
                  variant={llmMode === 'cloud' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLlmMode('cloud')}
                >
                  {t('onboarding.cloudLlm')}
                </Button>
              </div>

              {llmMode === 'ollama' ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Ollama URL</label>
                    <Input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('onboarding.model')}
                    </label>
                    <Input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={llmTesting || engineOnline === false}
                      onClick={() => void testLlm()}
                    >
                      {llmTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t('onboarding.testLlm')}
                    </Button>
                    {llmTestResult && (
                      <span className="text-xs text-muted-foreground">{llmTestResult}</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('onboarding.cloudHint')}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-medium">{t('onboarding.step2')}</h3>
              <p className="text-xs text-muted-foreground">{t('onboarding.watchlistHint')}</p>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-card p-3 text-sm"
                value={watchlistText}
                onChange={(e) => setWatchlistText(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {['600519', 'hk00700', 'AAPL', '300750'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="rounded border border-border px-2 py-0.5 text-xs hover:border-primary"
                    onClick={() =>
                      setWatchlistText((prev) =>
                        prev.split(/[,;\s]+/).includes(code) ? prev : `${prev},${code}`,
                      )
                    }
                  >
                    +{code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-medium">{t('onboarding.step3')}</h3>
              <p className="text-xs text-muted-foreground">{t('onboarding.strategyHint')}</p>
              <div className="grid grid-cols-2 gap-2">
                {strategyOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStrategy(s.id)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-sm',
                      strategy === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border',
                    )}
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <Badge variant="outline">{t('onboarding.readyNote')}</Badge>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              {t('common.cancel')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void finish()}>
                {t('onboarding.skip')}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  {t('common.confirm')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button disabled={finishing} onClick={() => void finish()}>
                  {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('onboarding.finish')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}