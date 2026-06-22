export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function isDesktopProduction(): boolean {
  return isTauri() && !import.meta.env.DEV;
}