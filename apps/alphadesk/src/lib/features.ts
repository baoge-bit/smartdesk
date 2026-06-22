/**
 * Feature gates for monetization readiness.
 * Free tier is fully functional with local Ollama; premium flags are stubs.
 */

export type FeatureFlag =
  | 'concurrent_tasks_3'
  | 'concurrent_tasks_unlimited'
  | 'advanced_strategies'
  | 'cloud_sync'
  | 'priority_models'
  | 'pdf_export_premium';

const FREE_FEATURES: FeatureFlag[] = ['concurrent_tasks_3'];

const PREMIUM_FEATURES: FeatureFlag[] = [
  'concurrent_tasks_unlimited',
  'advanced_strategies',
  'cloud_sync',
  'priority_models',
  'pdf_export_premium',
];

let licenseValid = false;

export function setLicenseValid(valid: boolean) {
  licenseValid = valid;
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (FREE_FEATURES.includes(flag)) return true;
  if (PREMIUM_FEATURES.includes(flag)) return licenseValid;
  return false;
}

export function maxConcurrentTasks(): number {
  return isFeatureEnabled('concurrent_tasks_unlimited') ? 16 : 3;
}