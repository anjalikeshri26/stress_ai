import { useI18n } from '@/context/I18nContext';
import type { AssessmentResult } from '@/lib/analysis';
import { ArrowRight, AlertTriangle, Phone, Brain, Heart, Scale, Stethoscope, Shield, FileDown } from 'lucide-react';

const REC_ICONS: Record<string, React.ReactNode> = {
  'rec.counselling': <Brain className="w-5 h-5" />,
  'rec.legalAid': <Scale className="w-5 h-5" />,
  'rec.medical': <Stethoscope className="w-5 h-5" />,
  'rec.police': <Shield className="w-5 h-5" />,
  'rec.witness': <Heart className="w-5 h-5" />,
  'rec.emergency': <AlertTriangle className="w-5 h-5" />,
};

const RISK_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  Low: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', ring: 'stroke-emerald-500', label: 'risk.Low' },
  Moderate: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600', ring: 'stroke-amber-500', label: 'risk.Moderate' },
  High: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600', ring: 'stroke-orange-500', label: 'risk.High' },
  Critical: { bg: 'from-red-500 to-red-600', text: 'text-red-600', ring: 'stroke-red-500', label: 'risk.Critical' },
};

export default function Results({
  result,
  onNewAssessment,
  onViewHistory,
}: {
  result: AssessmentResult & { id: string };
  onNewAssessment: () => void;
  onViewHistory: () => void;
}) {
  const { t } = useI18n();
  const style = RISK_STYLES[result.riskCategory] ?? RISK_STYLES.Low;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (result.sviScore / 100) * circumference;

  const downloadReport = () => {
    const report = {
      assessmentId: result.id,
      date: new Date().toISOString(),
      sviScore: result.sviScore,
      riskCategory: result.riskCategory,
      detectedIndicators: result.detectedIndicators,
      recommendations: result.recommendations.map((r) => t(r)),
      counsellingRecommended: result.counsellingRecommended,
      emergencyFlag: result.emergencyFlag,
      speechMetrics: result.speechMetrics,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-report-${result.id || 'latest'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Emergency banner */}
      {result.emergencyFlag && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{t('emergency.banner')}</p>
          </div>
          <a href="tel:14566" className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap">
            <Phone className="w-4 h-4" />
            {t('emergency.call')}
          </a>
        </div>
      )}

      {/* SVI Gauge */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t('results.title')}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('assess.svi')}</p>

        <div className="flex flex-col items-center">
          <div className="relative w-56 h-56">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100" />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                className={style.ring}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${style.text}`}>{result.sviScore}</span>
              <span className="text-sm text-slate-400 mt-1">/ 100</span>
            </div>
          </div>

          <div className={`mt-4 px-6 py-2 rounded-full bg-gradient-to-r ${style.bg} text-white font-semibold text-sm`}>
            {t(style.label)}
          </div>
        </div>
      </div>

      {/* Detected Indicators */}
      {result.detectedIndicators.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">{t('assess.detectedIndicators')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.detectedIndicators.map((ind) => (
              <div key={ind.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{t(ind.label)}</p>
                  <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${ind.confidence * 100}%`, transition: 'width 1s ease' }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">{Math.round(ind.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">{t('assess.recommendations')}</h3>
          <div className="space-y-2">
            {result.recommendations.map((rec) => (
              <div
                key={rec}
                className={`flex items-center gap-3 p-4 rounded-lg border transition ${
                  rec === 'rec.emergency'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-slate-50 border-slate-100 hover:border-teal-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  rec === 'rec.emergency' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'
                }`}>
                  {REC_ICONS[rec] ?? <Brain className="w-5 h-5" />}
                </div>
                <span className="text-sm font-medium text-slate-700">{t(rec)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speech metrics summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Speech Analytics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-lg font-bold text-slate-800">{(result.speechMetrics.pitchVariation * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Pitch Variation</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-lg font-bold text-slate-800">{result.speechMetrics.pauseCount}</p>
            <p className="text-xs text-slate-500">Pauses</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-lg font-bold text-slate-800">{result.speechMetrics.avgPauseLength.toFixed(1)}s</p>
            <p className="text-xs text-slate-500">Avg Pause</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-lg font-bold text-slate-800">{result.speechMetrics.tremorDetected ? 'Yes' : 'No'}</p>
            <p className="text-xs text-slate-500">Tremor</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNewAssessment}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md"
        >
          {t('assess.newAssessment')}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onViewHistory}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition"
        >
          {t('assess.viewHistory')}
        </button>
        <button
          onClick={downloadReport}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-lg transition"
        >
          <FileDown className="w-4 h-4" />
          {t('assess.download')}
        </button>
      </div>
    </div>
  );
}
