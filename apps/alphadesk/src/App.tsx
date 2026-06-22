import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { useLicenseBootstrap } from '@/hooks/useLicense';
import { useWorkspaceStore } from '@/stores/workspace';
import { useI18n } from '@/i18n';

const WorkspacePage = lazy(() => import('@/pages/WorkspacePage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const BacktestPage = lazy(() => import('@/pages/BacktestPage'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'));
const DecisionSignalsPage = lazy(() => import('@/pages/DecisionSignalsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));

function Loading() {
  const { t } = useI18n();
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {t('common.loading')}
    </div>
  );
}

function AppRoutes() {
  const onboardingComplete = useWorkspaceStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<WorkspaceShell />}>
        <Route index element={<WorkspacePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="backtest" element={<BacktestPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="signals" element={<DecisionSignalsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  useLicenseBootstrap();
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}