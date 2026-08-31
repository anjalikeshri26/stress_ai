import { useEffect, useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import { Calendar, ChevronRight } from 'lucide-react';

interface AssessmentRow {
  id: string;
  svi_score: number;
  risk_category: string;
  created_at: string;
  language: string;
  detected_indicators: { key: string; label: string; confidence: number }[];
}

export default function History({ onView }: { onView: (id: string) => void }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('assessments')
        .select('id, svi_score, risk_category, created_at, language, detected_indicators')
        .order('created_at', { ascending: false });
      setRows((data as AssessmentRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const riskColors: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-400">{t('history.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{t('history.title')}</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => onView(row.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(row.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {row.detected_indicators?.length ?? 0} indicators · {row.language.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">{row.svi_score}</p>
                  <p className="text-xs text-slate-400">SVI</p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full border ${riskColors[row.risk_category] ?? riskColors.Low}`}
                >
                  {t(`risk.${row.risk_category}`)}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
