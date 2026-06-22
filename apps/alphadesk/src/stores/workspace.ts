import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  code: string;
  name?: string;
  market?: string;
}

export type DashboardMode = 'single' | 'compare';

const MAX_COMPARE_CODES = 4;

interface WorkspaceState {
  watchlist: WatchlistItem[];
  selectedCode: string | null;
  selectedStrategyId: string;
  dashboardMode: DashboardMode;
  compareCodes: string[];
  theme: 'light' | 'dark' | 'system';
  layout: { watchlist: number; main: number; side: number };
  onboardingComplete: boolean;
  smartImportOpen: boolean;
  setSmartImportOpen: (open: boolean) => void;
  pendingImportFile: File | null;
  setPendingImportFile: (file: File | null) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (code: string) => void;
  setSelectedCode: (code: string | null) => void;
  setSelectedStrategyId: (id: string) => void;
  setDashboardMode: (mode: DashboardMode) => void;
  toggleCompareCode: (code: string) => void;
  initCompareFromWatchlist: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLayout: (layout: Partial<WorkspaceState['layout']>) => void;
  completeOnboarding: () => void;
  importWatchlist: (codes: string[]) => void;
  mergeWatchlistItems: (items: WatchlistItem[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      watchlist: [
        { code: '600519', name: '贵州茅台', market: 'A' },
        { code: 'hk00700', name: '腾讯控股', market: 'HK' },
        { code: 'AAPL', name: 'Apple', market: 'US' },
      ],
      selectedCode: '600519',
      selectedStrategyId: '',
      dashboardMode: 'single',
      compareCodes: ['600519', 'hk00700'],
      theme: 'system',
      layout: { watchlist: 22, main: 48, side: 30 },
      onboardingComplete: false,
      smartImportOpen: false,
      setSmartImportOpen: (open) => set({ smartImportOpen: open }),
      pendingImportFile: null,
      setPendingImportFile: (file) => set({ pendingImportFile: file }),
      addToWatchlist: (item) => {
        const exists = get().watchlist.some((w) => w.code === item.code);
        if (!exists) set({ watchlist: [...get().watchlist, item] });
      },
      removeFromWatchlist: (code) =>
        set({ watchlist: get().watchlist.filter((w) => w.code !== code) }),
      setSelectedCode: (code) => set({ selectedCode: code }),
      setSelectedStrategyId: (id) => set({ selectedStrategyId: id }),
      setDashboardMode: (mode) => {
        if (mode === 'compare') {
          const { compareCodes, watchlist } = get();
          if (compareCodes.length < 2 && watchlist.length >= 2) {
            set({
              dashboardMode: mode,
              compareCodes: watchlist.slice(0, Math.min(MAX_COMPARE_CODES, watchlist.length)).map((w) => w.code),
            });
            return;
          }
        }
        set({ dashboardMode: mode });
      },
      toggleCompareCode: (code) => {
        const normalized = code.trim();
        if (!normalized) return;
        const upper = normalized.toUpperCase();
        const current = get().compareCodes;
        const exists = current.some((c) => c.toUpperCase() === upper);
        if (exists) {
          set({ compareCodes: current.filter((c) => c.toUpperCase() !== upper) });
          return;
        }
        if (current.length >= MAX_COMPARE_CODES) return;
        set({ compareCodes: [...current, normalized] });
      },
      initCompareFromWatchlist: () => {
        const { watchlist, compareCodes } = get();
        if (compareCodes.length >= 2) return;
        set({
          compareCodes: watchlist.slice(0, Math.min(MAX_COMPARE_CODES, watchlist.length)).map((w) => w.code),
        });
      },
      setTheme: (theme) => set({ theme }),
      setLayout: (layout) => set({ layout: { ...get().layout, ...layout } }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      importWatchlist: (codes) => {
        get().mergeWatchlistItems(codes.map((code) => ({ code: code.trim() })));
      },
      mergeWatchlistItems: (items) => {
        const existing = new Map(get().watchlist.map((w) => [w.code.toUpperCase(), w]));
        let changed = false;
        for (const item of items) {
          const code = item.code.trim();
          if (!code) continue;
          const key = code.toUpperCase();
          const prev = existing.get(key);
          if (!prev) {
            existing.set(key, { ...item, code });
            changed = true;
          } else if (item.name && !prev.name) {
            existing.set(key, { ...prev, name: item.name, market: item.market ?? prev.market });
            changed = true;
          }
        }
        if (changed) set({ watchlist: [...existing.values()] });
      },
    }),
    { name: 'alphadesk-workspace' },
  ),
);