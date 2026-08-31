import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import Login from '@/pages/Login';
import Consent from '@/pages/Consent';
import Layout, { type Page } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Assessment from '@/pages/Assessment';
import Results from '@/pages/Results';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import type { AssessmentResult } from '@/lib/analysis';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [consented, setConsented] = useState(() => sessionStorage.getItem('consent-given') === 'true');
  const [result, setResult] = useState<(AssessmentResult & { id: string }) | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (!consented) {
    return (
      <Consent
        onAccept={() => {
          sessionStorage.setItem('consent-given', 'true');
          setConsented(true);
        }}
        onDecline={() => {
          sessionStorage.removeItem('consent-given');
        }}
      />
    );
  }

  if (page === 'assess' && result) {
    return (
      <Layout page={page} setPage={(p) => { setResult(null); setPage(p); }}>
        <Results
          result={result}
          onNewAssessment={() => {
            setResult(null);
            setPage('assess');
          }}
          onViewHistory={() => {
            setResult(null);
            setPage('history');
          }}
        />
      </Layout>
    );
  }

  return (
    <Layout page={page} setPage={setPage}>
      {page === 'dashboard' && <Dashboard onNewAssessment={() => setPage('assess')} />}
      {page === 'assess' && (
        <Assessment
          onComplete={(r) => {
            setResult(r);
          }}
        />
      )}
      {page === 'history' && <History onView={() => setPage('dashboard')} />}
      {page === 'settings' && <Settings />}
    </Layout>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
