import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  Clock,
  Cpu,
  Database,
  LineChart,
  Search,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { validateAndApplyLicense } from '@/hooks/useLicense';
import { ConfigField } from '@/components/settings/ConfigField';
import { SettingsConnectivityPanel } from '@/components/settings/SettingsConnectivityPanel';
import { SettingsUpdatePanel } from '@/components/settings/SettingsUpdatePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DisclaimerBanner } from '@/components/workspace/DisclaimerBanner';
import { systemApi } from '@/api/system';
import { useI18n } from '@/i18n';
import { APP_NAME_EN, APP_NAME_ZH } from '@/lib/constants';
import type {
  SystemConfigCategory,
  SystemConfigCategorySchema,
  SystemConfigItem,
} from '@/types/systemConfig';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  base: Settings2,
  ai_model: Cpu,
  data_source: Database,
  notification: Bell,
  system: Clock,
  agent: Bot,
  backtest: LineChart,
};

const CATEGORY_I18N: Record<SystemConfigCategory, string> = {
  base: 'settings.cat.base',
  ai_model: 'settings.cat.aiModel',
  data_source: 'settings.cat.dataSource',
  notification: 'settings.cat.notification',
  system: 'settings.cat.system',
  agent: 'settings.cat.agent',
  backtest: 'settings.cat.backtest',
  uncategorized: 'settings.cat.other',
};

const HIDDEN_KEYS = new Set([
  'DATABASE_PATH',
  'SQLITE_WAL_ENABLED',
  'SQLITE_BUSY_TIMEOUT_MS',
  'SQLITE_WRITE_RETRY_MAX',
  'SQLITE_WRITE_RETRY_BASE_DELAY',
  'USE_PROXY',
  'PROXY_HOST',
  'PROXY_PORT',
]);

function categoryTitle(
  category: SystemConfigCategorySchema | undefined,
  categoryKey: SystemConfigCategory,
  t: (key: string) => string,
): string {
  if (categoryKey in CATEGORY_I18N) return t(CATEGORY_I18N[categoryKey]);
  return category?.title ?? categoryKey;
}

export default function SettingsPage() {
  const { t } = useI18n();
  const [configItems, setConfigItems] = useState<SystemConfigItem[]>([]);
  const [schemaCategories, setSchemaCategories] = useState<SystemConfigCategorySchema[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseMessage, setLicenseMessage] = useState<string | null>(null);
  const [licenseValid, setLicenseValid] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [config, schema] = await Promise.all([
        systemApi.getConfigRaw(true),
        systemApi.getConfigSchema(),
      ]);
      setConfigItems(config.items);
      setSchemaCategories(schema.categories);
      const nextValues: Record<string, string> = {};
      for (const item of config.items) {
        nextValues[item.key] = item.isMasked ? '' : item.value;
      }
      setValues(nextValues);
    } catch {
      setConfigItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const groupedItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const categoryOrder = new Map(
      schemaCategories.map((cat) => [cat.category, cat.displayOrder]),
    );
    const categoryMeta = new Map(schemaCategories.map((cat) => [cat.category, cat]));

    const buckets = new Map<SystemConfigCategory, SystemConfigItem[]>();

    for (const item of configItems) {
      if (HIDDEN_KEYS.has(item.key)) continue;
      const schema = item.schema;
      if (!schema || schema.uiControl === undefined) continue;

      const haystack = [
        item.key,
        schema.title,
        schema.description,
        values[item.key],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !haystack.includes(query)) continue;

      const category = (schema.category ?? 'uncategorized') as SystemConfigCategory;
      const list = buckets.get(category) ?? [];
      list.push(item);
      buckets.set(category, list);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99))
      .map(([category, items]) => ({
        category,
        meta: categoryMeta.get(category),
        items: items.sort(
          (a, b) =>
            (a.schema?.displayOrder ?? 9999) - (b.schema?.displayOrder ?? 9999) ||
            a.key.localeCompare(b.key),
        ),
      }));
  }, [configItems, schemaCategories, search, values]);

  const save = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await systemApi.updateConfig(values, configItems);
      setSaveMessage(t('settings.saved'));
      await load();
    } catch {
      setSaveMessage(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">{t('settings.title')}</h2>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('settings.search')}
          />
        </div>
      </div>
      <DisclaimerBanner />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : groupedItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {search ? t('settings.noResults') : t('settings.engineOffline')}
          </CardContent>
        </Card>
      ) : (
        groupedItems.map(({ category, meta, items }) => {
          const Icon = CATEGORY_ICONS[category] ?? Settings2;
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {categoryTitle(meta, category, t)}
                </CardTitle>
                {meta?.description && <CardDescription>{meta.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const schema = item.schema!;
                  return (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs font-medium text-foreground">
                          {schema.title || item.key}
                        </label>
                        {schema.isRequired && (
                          <span className="text-[10px] text-bear">{t('settings.required')}</span>
                        )}
                        {item.isMasked && item.rawValueExists && (
                          <span className="text-[10px] text-muted-foreground">
                            {t('settings.masked')}
                          </span>
                        )}
                      </div>
                      {schema.description && (
                        <p className="text-xs text-muted-foreground">{schema.description}</p>
                      )}
                      <ConfigField
                        schema={schema}
                        value={values[item.key] ?? ''}
                        onChange={(next) =>
                          setValues((prev) => ({
                            ...prev,
                            [item.key]: next,
                          }))
                        }
                      />
                      {schema.examples.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {t('settings.example')}: {schema.examples[0]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}

      <SettingsUpdatePanel />

      <SettingsConnectivityPanel values={values} configItems={configItems} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t('settings.license')}
          </CardTitle>
          <CardDescription>{t('settings.licenseDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder={t('settings.licenseKey')}
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              disabled={licenseLoading || !licenseKey.trim()}
              onClick={async () => {
                setLicenseLoading(true);
                setLicenseMessage(null);
                try {
                  const status = await validateAndApplyLicense(licenseKey);
                  setLicenseValid(status.valid);
                  setLicenseMessage(
                    status.valid ? t('settings.licenseValid') : t('settings.licenseInvalid'),
                  );
                } finally {
                  setLicenseLoading(false);
                }
              }}
            >
              {licenseLoading ? t('common.loading') : t('settings.licenseActivate')}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setLicenseKey('');
                setLicenseValid(false);
                setLicenseMessage(t('settings.licenseCleared'));
                await validateAndApplyLicense('');
              }}
            >
              {t('common.delete')}
            </Button>
          </div>
          {licenseMessage && (
            <p className={`text-xs ${licenseValid ? 'text-bull' : 'text-muted-foreground'}`}>
              {licenseMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saveMessage && <span className="text-xs text-muted-foreground">{saveMessage}</span>}
        <Button onClick={() => void save()} disabled={saving || loading}>
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.about')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            {APP_NAME_ZH} / {APP_NAME_EN} v1.0.0
          </p>
          <p>Built on daily_stock_analysis engine · Tauri v2 + React</p>
          <p>
            <a
              href="https://github.com/baoge-bit/smartdesk"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              github.com/baoge-bit/smartdesk
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}