import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Calendar, ArrowRight, Activity } from 'lucide-react';

interface AssessmentRow {
  id: string;
  svi_score: number;
  risk_category: string;
  created_at: string;
}

export default function Dashboard({ onNewAssessment }: { onNewAssessment: () => void }) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('assessments')
        .select('id, svi_score, risk_category, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setAssessments((data as AssessmentRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const last = assessments[0];
  const total = assessments.length;

  const riskColors: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">
            {t('dash.welcome')}, {profile?.full_name?.split(' ')[0] ?? ''}
          </h1>
          <p className="text-slate-300">{t('dash.subtitle')}</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label={t('dash.totalAssessments')}
          value={loading ? '—' : String(total)}
          color="teal"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('dash.lastAssessment')}
          value={last ? `${last.svi_score} SVI` : '—'}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label={t('dash.currentRisk')}
          value={last ? t(`risk.${last.risk_category}`) : '—'}
          color={last?.risk_category === 'Critical' ? 'red' : last?.risk_category === 'High' ? 'orange' : 'emerald'}
        />
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t('assess.title')}</h3>
              <p className="text-sm text-slate-500">{t('dash.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onNewAssessment}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition shadow-md whitespace-nowrap"
          >
            {t('dash.newAssessment')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent assessments */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{t('history.title')}</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>
        ) : assessments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">{t('dash.noAssessments')}</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {assessments.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {new Date(a.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700">{a.svi_score} SVI</span>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${riskColors[a.risk_category] ?? riskColors.Low}`}
                  >
                    {t(`risk.${a.risk_category}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
