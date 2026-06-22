import type { DecisionSignalAction } from '@/types/decisionSignals';
import type { Translate, TranslationKey } from '@/i18n';

export type ActionTone = 'success' | 'warning' | 'danger' | 'default';

const ACTION_TONES: Record<DecisionSignalAction, ActionTone> = {
  buy: 'success',
  add: 'success',
  hold: 'default',
  reduce: 'warning',
  sell: 'danger',
  watch: 'warning',
  avoid: 'danger',
  alert: 'danger',
};

export function getActionTone(action?: DecisionSignalAction | null): ActionTone {
  if (!action) return 'default';
  return ACTION_TONES[action] ?? 'default';
}

const ACTION_KEYS: Record<DecisionSignalAction, TranslationKey> = {
  buy: 'decisionSignals.action.buy',
  add: 'decisionSignals.action.add',
  hold: 'decisionSignals.action.hold',
  reduce: 'decisionSignals.action.reduce',
  sell: 'decisionSignals.action.sell',
  watch: 'decisionSignals.action.watch',
  avoid: 'decisionSignals.action.avoid',
  alert: 'decisionSignals.action.alert',
};

export function getActionLabel(
  action?: DecisionSignalAction | null,
  actionLabel?: string | null,
  t?: Translate,
): string {
  if (actionLabel?.trim()) return actionLabel.trim();
  if (!action) return '—';
  if (!t) return action;
  const key = ACTION_KEYS[action];
  return key ? t(key) : action;
}
