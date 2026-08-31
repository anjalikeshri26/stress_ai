import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { runAssessment, computeQuestionnaireScore, type AssessmentResult } from '@/lib/analysis';
import { Mic, Type, ArrowRight, ArrowLeft, Loader2, Square, Radio, FileText } from 'lucide-react';

type Step = 'method' | 'input' | 'questionnaire' | 'analyzing';

const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5'];

export default function Assessment({ onComplete }: { onComplete: (result: AssessmentResult & { id: string }) => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<'text' | 'voice' | null>(null);
  const [narrative, setNarrative] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [liveWordCount, setLiveWordCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Real-time word count for text input
  useEffect(() => {
    setLiveWordCount(narrative.trim().split(/\s+/).filter(Boolean).length);
  }, [narrative]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setTranscribing(true);

        // Use Web Speech API for transcription if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          // Already captured via recognitionRef
        }

        // Simulate transcription processing time
        setTimeout(() => setTranscribing(false), 1500);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setVoiceDuration(0);
      timerRef.current = setInterval(() => setVoiceDuration((d) => d + 1), 1000);

      // Start live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        let finalText = '';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          setNarrative(finalText + interim);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const handleMethodNext = () => {
    if (method) setStep('input');
  };

  const handleInputNext = () => {
    if (narrative.trim().length > 10) setStep('questionnaire');
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);
  };

  const handleQuestionNext = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('analyzing');
      runAnalysis();
    }
  };

  const handleQuestionPrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const runAnalysis = async () => {
    const qScore = computeQuestionnaireScore(answers);
    const result = runAssessment(narrative, audioBlob, voiceDuration, qScore);

    // Save to database
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: user?.id,
        language: lang,
        narrative_text: narrative,
        voice_duration_sec: method === 'voice' ? voiceDuration : null,
        speech_metrics: result.speechMetrics,
        detected_indicators: result.detectedIndicators,
        svi_score: result.sviScore,
        risk_category: result.riskCategory,
        recommendations: result.recommendations,
        counselling_recommended: result.counsellingRecommended,
        emergency_flag: result.emergencyFlag,
        consent_given: true,
      })
      .select('id')
      .single();

    // Log consent
    if (data) {
      await supabase.from('consent_log').insert({
        user_id: user?.id,
        assessment_id: data.id,
        consent_type: 'assessment',
        consent_given: true,
        language: lang,
      });
    }

    setTimeout(() => {
      onComplete({ ...result, id: data?.id ?? '' });
    }, 2500);
  };

  const opts = (key: string): string[] => t(`${key}opts`).split(',');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {(['method', 'input', 'questionnaire', 'analyzing'] as Step[]).map((s, i) => {
          const order = ['method', 'input', 'questionnaire', 'analyzing'];
          const currentIdx = order.indexOf(step);
          const isActive = i <= currentIdx;
          return (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition ${isActive ? 'bg-teal-600' : 'bg-slate-200'}`}
            />
          );
        })}
      </div>

      {/* Step: Method selection */}
      {step === 'method' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t('assess.inputMethod')}</h2>
          <p className="text-sm text-slate-500 mb-6">{t('assess.title')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMethod('text')}
              className={`p-6 rounded-xl border-2 transition text-left ${
                method === 'text'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              <Type className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">{t('assess.textInput')}</h3>
              <p className="text-sm text-slate-500">Type your experience</p>
            </button>
            <button
              onClick={() => setMethod('voice')}
              className={`p-6 rounded-xl border-2 transition text-left ${
                method === 'voice'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              <Mic className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">{t('assess.voiceInput')}</h3>
              <p className="text-sm text-slate-500">Speak your experience</p>
            </button>
          </div>
          <button
            onClick={handleMethodNext}
            disabled={!method}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-40"
          >
            {t('assess.next')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step: Input */}
      {step === 'input' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {method === 'text' ? t('assess.textInput') : t('assess.voiceInput')}
          </h2>
          <p className="text-sm text-slate-500 mb-6">{t('assess.title')}</p>

          {method === 'text' && (
            <div>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder={t('assess.textPlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition text-slate-900 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {liveWordCount} words
                </span>
                <span className={`text-xs font-medium ${liveWordCount > 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {liveWordCount > 10 ? 'Ready' : 'Write at least 10 words'}
                </span>
              </div>
            </div>
          )}

          {method === 'voice' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                {!recording && !transcribing && (
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg transition hover:scale-105"
                  >
                    <Mic className="w-10 h-10" />
                  </button>
                )}
                {recording && (
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition animate-pulse"
                  >
                    <Square className="w-8 h-8" />
                  </button>
                )}
                {transcribing && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                    <span className="text-sm text-slate-500">{t('assess.transcribing')}</span>
                  </div>
                )}
                <p className="mt-4 text-sm text-slate-500">
                  {recording
                    ? `${t('assess.recording')} ${voiceDuration}s`
                    : transcribing
                    ? t('assess.transcribing')
                    : t('assess.startRecording')}
                </p>
              </div>

              {recording && (
                <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>{t('assess.analyzingRealTime')}</span>
                </div>
              )}

              {narrative && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Transcription:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{narrative}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep('method')}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('assess.prev')}
            </button>
            <button
              onClick={handleInputNext}
              disabled={narrative.trim().length <= 10}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-40"
            >
              {t('assess.next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Questionnaire */}
      {step === 'questionnaire' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t('assess.questionnaire')}</h2>
            <span className="text-sm text-slate-400">
              {t('assess.step')} {currentQ + 1} {t('assess.of')} {QUESTIONS.length}
            </span>
          </div>

          <p className="text-lg text-slate-800 mb-6">{t(QUESTIONS[currentQ])}</p>

          <div className="space-y-2">
            {opts(QUESTIONS[currentQ]).map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                  answers[currentQ] === i
                    ? 'border-teal-500 bg-teal-50 text-teal-900 font-semibold'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            {currentQ > 0 && (
              <button
                onClick={handleQuestionPrev}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('assess.prev')}
              </button>
            )}
            <button
              onClick={handleQuestionNext}
              disabled={answers[currentQ] === undefined}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-40"
            >
              {currentQ < QUESTIONS.length - 1 ? t('assess.next') : t('assess.submit')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Loader2 className="w-16 h-16 text-teal-600 animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('assess.analyzing')}</h2>
          <p className="text-sm text-slate-500">{t('assess.analyzingRealTime')}</p>

          <div className="mt-8 space-y-2 max-w-sm mx-auto">
            {['NLP Analysis', 'Speech Analytics', 'Emotion AI', 'SVI Computation'].map((label, i) => (
              <div key={label} className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
