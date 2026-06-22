import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { formatMoney } from '@/lib/portfolioFormat';
import type { PortfolioSnapshotResponse } from '@/types/portfolio';

const SLICE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

interface AllocationSlice {
  key: string;
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface PortfolioAllocationChartProps {
  snapshot: PortfolioSnapshotResponse | null;
}

function buildSlices(snapshot: PortfolioSnapshotResponse): AllocationSlice[] {
  const positions = snapshot.accounts.flatMap((account) =>
    account.positions.map((pos) => ({
      key: `${account.accountId}-${pos.symbol}`,
      label: pos.symbol,
      value: Math.max(0, pos.marketValueBase),
    })),
  );

  const cash = Math.max(0, snapshot.totalCash);
  const entries = [...positions];
  if (cash > 0) {
    entries.push({ key: 'cash', label: 'Cash', value: cash });
  }

  const total = entries.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  return entries
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      pct: (item.value / total) * 100,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }));
}

function DonutChart({ slices }: { slices: AllocationSlice[] }) {
  const size = 160;
  const radius = 56;
  const stroke = 22;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/30"
      />
      {slices.map((slice) => {
        const dash = (slice.pct / 100) * circumference;
        const circle = (
          <circle
            key={slice.key}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${center} ${center})`}
          />
        );
        offset += dash;
        return circle;
      })}
    </svg>
  );
}

export function PortfolioAllocationChart({ snapshot }: PortfolioAllocationChartProps) {
  const { t } = useI18n();
  const currency = snapshot?.currency ?? 'CNY';

  const slices = useMemo(
    () => (snapshot ? buildSlices(snapshot) : []),
    [snapshot],
  );

  const displaySlices = slices.map((slice) =>
    slice.key === 'cash' ? { ...slice, label: t('portfolio.cash') } : slice,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('portfolio.allocation')}</CardTitle>
      </CardHeader>
      <CardContent>
        {displaySlices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('portfolio.noAllocation')}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <DonutChart slices={displaySlices} />
            <div className="w-full space-y-2">
              {displaySlices.slice(0, 10).map((slice) => (
                <div key={slice.key} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate font-mono">{slice.label}</span>
                  </div>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatMoney(slice.value, currency)} · {slice.pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}