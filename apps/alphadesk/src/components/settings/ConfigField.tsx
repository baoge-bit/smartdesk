import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import type { SystemConfigFieldSchema } from '@/types/systemConfig';

interface ConfigFieldProps {
  schema: SystemConfigFieldSchema;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const selectClass =
  'flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50';

function normalizeOptions(schema: SystemConfigFieldSchema): Array<{ label: string; value: string }> {
  return schema.options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );
}

export function ConfigField({ schema, value, disabled, onChange }: ConfigFieldProps) {
  const { t } = useI18n();
  const control = schema.uiControl;
  const isDisabled = disabled || !schema.isEditable;

  if (control === 'switch' || schema.dataType === 'boolean') {
    const checked = value === 'true' || value === '1' || value === 'yes';
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary"
          checked={checked}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        <span className={cn('text-muted-foreground', checked && 'text-foreground')}>
          {checked ? t('settings.switchOn') : t('settings.switchOff')}
        </span>
      </label>
    );
  }

  if (control === 'textarea') {
    return (
      <textarea
        className={cn(
          selectClass,
          'min-h-20 resize-y py-2',
        )}
        value={value}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (control === 'select') {
    const options = normalizeOptions(schema);
    return (
      <select
        className={selectClass}
        value={value}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  const inputType =
    control === 'password' || schema.isSensitive
      ? 'password'
      : control === 'number'
        ? 'number'
        : control === 'time'
          ? 'time'
          : 'text';

  return (
    <Input
      type={inputType}
      value={value}
      disabled={isDisabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}