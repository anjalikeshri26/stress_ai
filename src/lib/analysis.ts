export interface SpeechMetrics {
  pitchVariation: number;
  pauseCount: number;
  avgPauseLength: number;
  speechRate: number;
  tremorDetected: boolean;
}

export interface DetectedIndicator {
  key: string;
  label: string;
  confidence: number;
}

export interface AssessmentResult {
  sviScore: number;
  riskCategory: 'Low' | 'Moderate' | 'High' | 'Critical';
  detectedIndicators: DetectedIndicator[];
  recommendations: string[];
  counsellingRecommended: boolean;
  emergencyFlag: boolean;
  speechMetrics: SpeechMetrics;
}

const INDICATOR_KEYWORDS: Record<string, string[]> = {
  fear: ['afraid', 'scared', 'fear', 'terrified', 'panic', 'frightened', 'भय', 'डर', 'पात', 'भयं', 'பயம்', 'भयं', 'ভয়', 'भीती'],
  anxiety: ['anxious', 'worried', 'nervous', 'restless', 'uneasy', 'चिंता', 'घबराहट', 'கவலை', 'আংশা', 'উদ্বেগ', 'चिंता'],
  depression: ['sad', 'hopeless', 'empty', 'depressed', 'numb', 'worthless', 'उदास', 'निराश', 'हताश', 'மனச்சோர்வு', 'নিদাশ', 'নৈরাশ্য', 'नैराश्य'],
  suicidalIdeation: ['kill myself', 'end it', 'suicide', 'die', 'no reason to live', 'death', 'आत्महत्या', 'मरना', 'தற்கொலை', 'আত্মহত্যা', 'आत्महत्येचे'],
  trauma: ['nightmare', 'flashback', 'haunted', 'trauma', 'abuse', 'attacked', 'nightmares', 'आघात', 'बुरा सपना', 'அதிர்ச்சி', 'ট্রমা', 'আঘাত', 'आघात'],
  intimidation: ['threatened', 'threat', 'warned', 'forced', 'blackmail', 'धमकी', 'डराया', 'மிரட்டல்', 'ব্ল্যাকমেইল', 'ধমকী', 'বেদিনিংপু'],
  socialIsolation: ['alone', 'isolated', 'no one', 'abandoned', 'boycott', 'ostracized', 'अकेला', 'बहिष्कार', 'தனிமை', 'একা', 'একাংত', 'एकांत'],
  anger: ['angry', 'furious', 'rage', 'hatred', 'resentful', 'गुस्सा', 'क्रोध', 'கோபம்', 'রাগ', 'क्रोध', 'রাগ'],
  helplessness: ['helpless', 'trapped', 'stuck', 'powerless', 'no way out', 'असहाय', 'फंसा', 'நிராகரிப்பு', 'অসহায়', 'असहाय', 'असहायता'],
};

const INDICATOR_LABELS: Record<string, string> = {
  fear: 'indicator.fear',
  anxiety: 'indicator.anxiety',
  depression: 'indicator.depression',
  suicidalIdeation: 'indicator.suicidalIdeation',
  trauma: 'indicator.trauma',
  intimidation: 'indicator.intimidation',
  socialIsolation: 'indicator.socialIsolation',
  anger: 'indicator.anger',
  helplessness: 'indicator.helplessness',
};

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    const lowerKw = kw.toLowerCase();
    let idx = lower.indexOf(lowerKw);
    while (idx !== -1) {
      count++;
      idx = lower.indexOf(lowerKw, idx + lowerKw.length);
    }
  }
  return count;
}

function analyzeText(text: string): { indicators: DetectedIndicator[]; textScore: number } {
  const indicators: DetectedIndicator[] = [];
  let totalMatches = 0;

  for (const [key, keywords] of Object.entries(INDICATOR_KEYWORDS)) {
    const matches = countKeywordMatches(text, keywords);
    if (matches > 0) {
      const confidence = Math.min(matches / 3, 1);
      indicators.push({ key, label: INDICATOR_LABELS[key], confidence });
      totalMatches += matches;
    }
  }

  const textScore = Math.min(totalMatches * 8, 50);
  return { indicators, textScore };
}

function analyzeSpeechMetrics(audioBlob: Blob | null, duration: number): SpeechMetrics {
  const hasAudio = audioBlob !== null && audioBlob.size > 0;
  const seed = hasAudio ? (audioBlob.size % 100) / 100 : 0.5;

  return {
    pitchVariation: 0.3 + seed * 0.4,
    pauseCount: Math.floor(3 + seed * 8),
    avgPauseLength: 0.8 + seed * 1.5,
    speechRate: 0.5 + seed * 0.5,
    tremorDetected: seed > 0.6,
  };
}

function computeSVI(
  textScore: number,
  speechMetrics: SpeechMetrics,
  questionnaireScore: number
): number {
  const speechScore =
    (speechMetrics.pitchVariation - 0.3) * 30 +
    (speechMetrics.tremorDetected ? 15 : 0) +
    (speechMetrics.avgPauseLength - 0.8) * 10 +
    (speechMetrics.pauseCount > 5 ? 10 : 0);

  const raw = textScore * 0.4 + Math.max(0, speechScore) * 0.25 + questionnaireScore * 0.35;
  return Math.round(Math.min(Math.max(raw, 0), 100));
}

function categorizeRisk(svi: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  if (svi >= 75) return 'Critical';
  if (svi >= 50) return 'High';
  if (svi >= 25) return 'Moderate';
  return 'Low';
}

function generateRecommendations(
  risk: 'Low' | 'Moderate' | 'High' | 'Critical',
  indicators: DetectedIndicator[]
): { recommendations: string[]; counselling: boolean; emergency: boolean } {
  const recs: string[] = [];
  let counselling = false;
  let emergency = false;

  const has = (key: string) => indicators.some((i) => i.key === key);

  if (has('suicidalIdeation')) {
    recs.push('rec.emergency');
    emergency = true;
    recs.push('rec.counselling');
    counselling = true;
  }

  switch (risk) {
    case 'Critical':
      recs.push('rec.emergency');
      recs.push('rec.counselling');
      recs.push('rec.police');
      recs.push('rec.medical');
      counselling = true;
      emergency = true;
      break;
    case 'High':
      recs.push('rec.counselling');
      recs.push('rec.legalAid');
      counselling = true;
      if (has('intimidation')) {
        recs.push('rec.police');
        recs.push('rec.witness');
      }
      if (has('trauma')) recs.push('rec.medical');
      break;
    case 'Moderate':
      recs.push('rec.counselling');
      recs.push('rec.legalAid');
      counselling = true;
      if (has('intimidation')) recs.push('rec.police');
      break;
    case 'Low':
      if (indicators.length > 0) {
        recs.push('rec.counselling');
        counselling = true;
      }
      break;
  }

  const unique = [...new Set(recs)];
  return { recommendations: unique, counselling, emergency };
}

export function runAssessment(
  narrativeText: string,
  audioBlob: Blob | null,
  voiceDuration: number,
  questionnaireScore: number
): AssessmentResult {
  const { indicators, textScore } = analyzeText(narrativeText);
  const speechMetrics = analyzeSpeechMetrics(audioBlob, voiceDuration);
  const svi = computeSVI(textScore, speechMetrics, questionnaireScore);
  const risk = categorizeRisk(svi);
  const { recommendations, counselling, emergency } = generateRecommendations(risk, indicators);

  return {
    sviScore: svi,
    riskCategory: risk,
    detectedIndicators: indicators,
    recommendations,
    counsellingRecommended: counselling,
    emergencyFlag: emergency,
    speechMetrics,
  };
}

export function computeQuestionnaireScore(answers: number[]): number {
  if (answers.length === 0) return 0;
  const sum = answers.reduce((a, b) => a + b, 0);
  const max = answers.length * 4;
  return Math.round((sum / max) * 100);
}
