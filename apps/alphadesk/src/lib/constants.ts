export const DISCLAIMER_ZH =
  '本工具仅提供辅助分析，不构成投资建议。市场有风险，投资需谨慎，请独立判断并自担风险。';

export const DISCLAIMER_EN =
  'This tool provides auxiliary analysis only and does not constitute investment advice. Markets involve risk — use at your own risk.';

export const APP_NAME_ZH = '阿尔法工作台';
export const APP_NAME_EN = 'AlphaDesk';

export const DEFAULT_API_PORT = 18765;

/** Resolved at runtime from Tauri or Vite proxy */
export function resolveApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Browser dev: Vite proxies /api to engine
  if (import.meta.env.DEV) {
    return '';
  }
  return `http://127.0.0.1:${DEFAULT_API_PORT}`;
}