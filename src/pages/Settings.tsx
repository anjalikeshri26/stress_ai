import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n, LANGUAGES, type LangCode } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import { Globe, User, MapPin, Mail, Check } from 'lucide-react';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const { t, lang, setLang } = useI18n();

  const [name, setName] = useState(profile?.full_name ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    await supabase
      .from('profiles')
      .update({ full_name: name, location, preferred_language: lang })
      .eq('id', profile?.id);
    await refreshProfile();
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-900">{t('settings.title')}</h2>

      {/* Language */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="font-bold text-slate-900">{t('settings.language')}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code as LangCode)}
              className={`p-4 rounded-xl border-2 transition text-left ${
                lang === l.code
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              <p className="font-semibold text-slate-800">{l.nativeLabel}</p>
              <p className="text-xs text-slate-400">{l.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-900">{t('settings.profile')}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.name')}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.location')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={profile?.id ? '' : ''}
                disabled
                placeholder={profile?.id ? '—' : ''}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-lg transition shadow-md disabled:opacity-60"
          >
            {busy ? '...' : t('settings.save')}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="w-4 h-4" />
              {t('settings.saved')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
