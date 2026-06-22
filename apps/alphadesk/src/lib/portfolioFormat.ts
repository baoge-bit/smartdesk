export function formatMoney(
  value: number | null | undefined,
  currency = 'CNY',
  digits = 2,
): string {
  if (value == null || Number.isNaN(value)) return '—';
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${formatted} ${currency}`;
}

export function formatSignedPct(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}