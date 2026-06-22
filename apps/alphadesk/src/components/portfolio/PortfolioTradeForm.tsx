import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { getTodayIso } from '@/lib/portfolioFormat';
import type { PortfolioSide } from '@/types/portfolio';

export interface TradeFormState {
  symbol: string;
  tradeDate: string;
  side: PortfolioSide;
  quantity: string;
  price: string;
  fee: string;
}

interface PortfolioTradeFormProps {
  disabled?: boolean;
  submitting?: boolean;
  message?: string | null;
  error?: string | null;
  onSubmit: (form: TradeFormState) => void;
}

const defaultForm: TradeFormState = {
  symbol: '',
  tradeDate: getTodayIso(),
  side: 'buy',
  quantity: '',
  price: '',
  fee: '',
};

export function PortfolioTradeForm({
  disabled,
  submitting,
  message,
  error,
  onSubmit,
}: PortfolioTradeFormProps) {
  const { t } = useI18n();
  const [form, setForm] = React.useState<TradeFormState>(defaultForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const selectClass =
    'flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('portfolio.tradeTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {disabled && (
          <p className="mb-3 text-xs text-warning">{t('portfolio.selectAccountHint')}</p>
        )}
        {error && <p className="mb-3 text-xs text-bear">{error}</p>}
        {message && <p className="mb-3 text-xs text-bull">{message}</p>}

        <form className="grid grid-cols-1 gap-2 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            placeholder={t('portfolio.symbol')}
            value={form.symbol}
            onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))}
            disabled={disabled || submitting}
            required
          />
          <Input
            type="date"
            value={form.tradeDate}
            onChange={(e) => setForm((p) => ({ ...p, tradeDate: e.target.value }))}
            disabled={disabled || submitting}
            required
          />
          <select
            className={selectClass}
            value={form.side}
            onChange={(e) => setForm((p) => ({ ...p, side: e.target.value as PortfolioSide }))}
            disabled={disabled || submitting}
          >
            <option value="buy">{t('portfolio.buy')}</option>
            <option value="sell">{t('portfolio.sell')}</option>
          </select>
          <Input
            type="number"
            step="any"
            min="0"
            placeholder={t('portfolio.quantity')}
            value={form.quantity}
            onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
            disabled={disabled || submitting}
            required
          />
          <Input
            type="number"
            step="any"
            min="0"
            placeholder={t('portfolio.price')}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            disabled={disabled || submitting}
            required
          />
          <Input
            type="number"
            step="any"
            min="0"
            placeholder={t('portfolio.fee')}
            value={form.fee}
            onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))}
            disabled={disabled || submitting}
          />
          <Button type="submit" className="sm:col-span-2" disabled={disabled || submitting}>
            {submitting ? t('portfolio.submitting') : t('portfolio.submitTrade')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}