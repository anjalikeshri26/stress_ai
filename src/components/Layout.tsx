import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Shield, LayoutDashboard, Brain, History, Settings, LogOut, Phone } from 'lucide-react';

export type Page = 'dashboard' | 'assess' | 'history' | 'settings';

export default function Layout({
  page,
  setPage,
  children,
}: {
  page: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const { t } = useI18n();

  const navItems: { key: Page; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: t('nav.dashboard') },
    { key: 'assess', icon: <Brain className="w-5 h-5" />, label: t('nav.assess') },
    { key: 'history', icon: <History className="w-5 h-5" />, label: t('nav.history') },
    { key: 'settings', icon: <Settings className="w-5 h-5" />, label: t('nav.settings') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">{t('app.title')}</h1>
              <p className="text-xs text-slate-400">{t('app.subtitle')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                page === item.key
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <Phone className="w-3.5 h-3.5" />
            <span>NHAA: 14566 · Emergency: 112</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-sm font-semibold text-teal-300">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile?.location}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.signout')}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-300" />
          <span className="text-sm font-bold">{t('app.title')}</span>
        </div>
        <button onClick={signOut} className="text-slate-300 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition ${
              page === item.key ? 'text-teal-600' : 'text-slate-400'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 px-4 py-6 lg:px-8 lg:py-8 pb-20 lg:pb-8 mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
