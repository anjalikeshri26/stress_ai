import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n, LANGUAGES, type LangCode } from '@/context/I18nContext';
import { Shield, Mail, MapPin, User, Globe, ArrowRight, Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t, lang, setLang } = useI18n();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordStrength = (() => {
    const p = password;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 5);
  })();

  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-lime-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError(t('common.error'));
      return;
    }

    if (mode === 'forgot') {
      setBusy(true);
      const { error: resetError } = await resetPassword(email.trim());
      setBusy(false);
      if (resetError) {
        setError(resetError);
      } else {
        setInfo('Password reset instructions have been sent to your email.');
      }
      return;
    }

    if (!password.trim()) {
      setError(t('common.error'));
      return;
    }

    if (mode === 'signup') {
      if (!name.trim() || !location.trim()) {
        setError(t('common.error'));
        return;
      }
      if (passwordStrength < 3) {
        setError('Password is too weak. Use 8+ characters with upper/lowercase, numbers, and symbols.');
        return;
      }
    }

    setBusy(true);
    const { error: authError } =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim(), location.trim(), lang);
    setBusy(false);

    if (authError) {
      setError(authError);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="lg:w-2/5 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white flex flex-col justify-center px-8 py-12 lg:px-16 lg:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{t('app.title')}</h1>
              <p className="text-sm text-slate-400">{t('app.subtitle')}</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            {t('dash.welcome')}, {t('app.org')}
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-md">
            {t('consent.description')}
          </p>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-400" />
              <span>NHAA: 14566</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-400" />
              <span>Emergency: 112</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-3/5 flex items-center justify-center px-6 py-12 lg:px-16 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Language selector */}
          <div className="flex justify-end mb-6">
            <div className="relative inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <Globe className="w-4 h-4 text-slate-500" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangCode)}
                className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            {/* Mode tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${
                  mode === 'signin' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('login.title')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${
                  mode === 'signup' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('login.signup')}
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === 'signin' ? t('login.title') : mode === 'signup' ? t('login.signup') : t('login.forgot')}
            </h2>
            <p className="text-slate-500 text-sm mb-6">{t('login.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('login.name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('login.namePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition ${
                            i < passwordStrength ? strengthColors[passwordStrength] : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{strengthLabels[passwordStrength]}</p>
                  </div>
                )}
              </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('login.location')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('login.locationPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
              )}

              {info && (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2">{info}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? t('login.title') : mode === 'signup' ? t('login.signup') : t('login.reset')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-sm text-slate-500 mt-6 space-y-2">
              {mode === 'signin' && (
                <>
                  <p>
                    {t('login.noAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
                      className="text-teal-600 font-semibold hover:text-teal-700"
                    >
                      {t('login.signup')}
                    </button>
                  </p>
                  <p>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}
                      className="text-teal-600 font-semibold hover:text-teal-700"
                    >
                      {t('login.forgot')}
                    </button>
                  </p>
                </>
              )}
              {mode === 'signup' && (
                <p>
                  {t('login.haveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
                    className="text-teal-600 font-semibold hover:text-teal-700"
                  >
                    {t('login.title')}
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <p>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
                    className="text-teal-600 font-semibold hover:text-teal-700"
                  >
                    {t('login.back')}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
