import type { DecisionReport } from '@/api/analysis';

/** Upstream AnalysisReport shape (snake_case from API). */
export interface AnalysisReportRaw {
  meta?: {
    id?: number;
    stock_code?: string;
    stock_name?: string;
    created_at?: string;
  };
  summary?: {
    analysis_summary?: string;
    trend_prediction?: string;
    sentiment_score?: number;
    operation_advice?: string;
  };
  strategy?: {
    ideal_buy?: string;
    secondary_buy?: string;
    stop_loss?: string;
    take_profit?: string;
  };
  details?: {
    raw_result?: Record<string, unknown>;
  };
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

function extractIntelLists(raw: Record<string, unknown> | undefined) {
  const intel = (raw?.intelligence as Record<string, unknown>) || {};
  const battle = (raw?.battle_plan as Record<string, unknown>) || {};
  return {
    risks: asStringList(intel.risk_alerts),
    catalysts: asStringList(intel.positive_catalysts),
    checklist: asStringList(battle.action_checklist),
  };
}

export function mapAnalysisReportToDecision(raw: AnalysisReportRaw): DecisionReport {
  const meta = raw.meta ?? {};
  const summary = raw.summary ?? {};
  const strategy = raw.strategy ?? {};
  const intel = extractIntelLists(raw.details?.raw_result);

  const entryPoints = [strategy.ideal_buy, strategy.secondary_buy].filter(Boolean) as string[];
  const exitPoints = [strategy.take_profit, strategy.stop_loss].filter(Boolean) as string[];

  return {
    recordId: meta.id,
    stockCode: meta.stock_code ?? '',
    stockName: meta.stock_name,
    score: summary.sentiment_score,
    trend: summary.trend_prediction,
    conclusion: summary.analysis_summary,
    summary: summary.analysis_summary,
    entryPoints,
    exitPoints,
    risks: intel.risks,
    catalysts: intel.catalysts,
    checklist: intel.checklist,
    createdAt: meta.created_at,
  };
}