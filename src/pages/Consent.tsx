import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Shield, Check, X, Lock, Heart, FileText } from 'lucide-react';

export default function Consent({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const { t } = useI18n();
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const points = [1, 2, 3, 4];
  const allChecked = points.every((p) => checked[p]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('consent.title')}</h1>
                <p className="text-sm text-slate-400">{t('app.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-700 leading-relaxed">{t('consent.description')}</p>
            </div>

            <div className="space-y-3 mb-8">
              {points.map((p) => (
                <label
                  key={p}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer transition"
                >
                  <button
                    type="button"
                    onClick={() => setChecked((prev) => ({ ...prev, [p]: !prev[p] }))}
                    className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                      checked[p]
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked[p] && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-sm text-slate-700 leading-relaxed pt-0.5">
                    {t(`consent.point${p}`)}
                  </span>
                </label>
              ))}
            </div>

            {/* Privacy badges */}
            <div className="flex flex-wrap gap-4 mb-8 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Encrypted Storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-teal-600" />
                <span>Confidential</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Ethical AI</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onAccept}
                disabled={!allChecked}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                {t('consent.accept')}
              </button>
              <button
                onClick={onDecline}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition"
              >
                <X className="w-5 h-5" />
                {t('consent.decline')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
