import {
  AnalysisResult,
  ClassifierChoice,
  FeatureContribution,
  HighlightedToken,
  LanguageProfile,
  ModelMetrics,
  ReasonCategory,
  SeverityTier,
} from '../types';
import {
  LabeledSample,
  OFFENSIVE_LEXICON,
  STOP_WORDS,
  TANGLISH_NORMALIZATION_MAP,
  TANGLISH_STOP_WORDS,
  TEST_CORPUS,
  TRAIN_CORPUS,
  VARIANT_TO_LEXICON,
} from './corpus';

interface RawTokenSpan {
  raw: string;
  cleaned: string;
  startIndex: number;
  endIndex: number;
}

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

const INTENSIFIERS = new Set([
  'very', 'total', 'totally', 'utter', 'utterly', 'complete', 'completely',
  'absolute', 'absolutely', 'fucking', 'romba', 'maha', 'periya', 'full',
]);

const TANGLISH_INDICATORS = new Set([
  ...TANGLISH_STOP_WORDS,
  ...Object.keys(TANGLISH_NORMALIZATION_MAP),
  'unaku', 'unna', 'enaku', 'nee', 'naan', 'ivan', 'aval', 'ellam', 'inga',
  'anga', 'ippo', 'eppo', 'vaaya', 'moonja', 'moonji', 'arivu', 'buddhi',
  'paaru', 'pesadha', 'podadha', 'panra', 'iruku', 'iruka', 'irundhuchu',
  'theriyala', 'panna', 'koodathu', 'kandippa', 'nandri', 'vaazhthukkal',
]);

function collapseElongation(word: string): string {
  // Collapse 3+ repeated characters to 2 (e.g., loooosuuu -> loosuu -> check map -> loosu)
  // Also strip masked asterisks in profanity (f*ck -> fck, st*pid -> stpid)
  const deMasked = word.replace(/\*/g, '');
  const unLeet = deMasked
    .split('')
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join('');
  return unLeet.replace(/(.)\1{2,}/g, '$1$1');
}

function normalizeTokenText(rawWord: string): string {
  const lower = rawWord.toLowerCase();
  const collapsed = collapseElongation(lower);

  if (TANGLISH_NORMALIZATION_MAP[lower]) {
    return TANGLISH_NORMALIZATION_MAP[lower];
  }
  if (TANGLISH_NORMALIZATION_MAP[collapsed]) {
    return TANGLISH_NORMALIZATION_MAP[collapsed];
  }

  // Try collapsing double letters to single as fallback for Tanglish elongation (loosu vs loosuu, podaa vs poda)
  const singleCollapsed = collapsed.replace(/(.)\1+/g, '$1');
  if (TANGLISH_NORMALIZATION_MAP[singleCollapsed]) {
    return TANGLISH_NORMALIZATION_MAP[singleCollapsed];
  }
  // Check if stripping trailing 'a' / 'aa' / 'da' / 'di' matches a Tanglish root
  if (collapsed.endsWith('aa') && TANGLISH_NORMALIZATION_MAP[collapsed.slice(0, -1)]) {
    return TANGLISH_NORMALIZATION_MAP[collapsed.slice(0, -1)];
  }
  return collapsed;
}

export function cleanText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/@[a-zA-Z0-9_]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s*!?.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeWithSpans(rawText: string): RawTokenSpan[] {
  const spans: RawTokenSpan[] = [];
  // Match word-like tokens including internal * or digits used for leetspeak obfuscation
  const regex = /[\p{L}\p{N}*@!$]+/gu;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    const raw = match[0];
    // Skip URLs or mentions if they start right after @ or http
    const beforeChar = match.index > 0 ? rawText[match.index - 1] : '';
    if (beforeChar === '@') continue;
    const cleaned = raw.toLowerCase().replace(/^[^a-z0-9\u0B80-\u0BFF]+|[^a-z0-9\u0B80-\u0BFF]+$/gi, '');
    if (!cleaned) continue;
    spans.push({
      raw,
      cleaned,
      startIndex: match.index,
      endIndex: match.index + raw.length,
    });
  }
  return spans;
}

function extractFeaturesFromTokens(normalizedTokens: string[]): string[] {
  const features: string[] = [];

  // Word unigrams
  for (const tok of normalizedTokens) {
    features.push(`w:${tok}`);
  }

  // Word bigrams
  for (let i = 0; i < normalizedTokens.length - 1; i++) {
    features.push(`b:${normalizedTokens[i]}_${normalizedTokens[i + 1]}`);
  }

  // Character 4-grams (resilient to Tanglish spelling variations & obfuscations)
  for (const tok of normalizedTokens) {
    if (tok.length >= 4) {
      const padded = `^${tok}$`;
      for (let i = 0; i <= padded.length - 4; i++) {
        features.push(`c:${padded.slice(i, i + 4)}`);
      }
    }
  }

  return features;
}

function preprocessForModel(text: string): {
  cleanedText: string;
  spans: RawTokenSpan[];
  tokens: string[];
  keptTokens: string[];
  removedStopWords: string[];
  normalizedPairs: Array<{ original: string; normalized: string; changed: boolean }>;
  normalizedText: string;
  features: string[];
} {
  const cleanedText = cleanText(text);
  const spans = tokenizeWithSpans(text);
  const tokens = spans.map((s) => s.cleaned);

  const keptTokens: string[] = [];
  const removedStopWords: string[] = [];
  const normalizedPairs: Array<{ original: string; normalized: string; changed: boolean }> = [];

  for (const tok of tokens) {
    const norm = normalizeTokenText(tok);
    const isToxicLexicon = Boolean(VARIANT_TO_LEXICON[norm] || VARIANT_TO_LEXICON[tok]);
    if (!isToxicLexicon && STOP_WORDS.has(tok)) {
      removedStopWords.push(tok);
    } else {
      keptTokens.push(norm);
      normalizedPairs.push({
        original: tok,
        normalized: norm,
        changed: tok !== norm,
      });
    }
  }

  const normalizedText = keptTokens.join(' ');
  const features = extractFeaturesFromTokens(keptTokens);

  return {
    cleanedText,
    spans,
    tokens,
    keptTokens,
    removedStopWords,
    normalizedPairs,
    normalizedText,
    features,
  };
}

function sigmoid(z: number): number {
  if (z > 20) return 1;
  if (z < -20) return 0;
  return 1 / (1 + Math.exp(-z));
}

class TfidfLinearEngine {
  private vocab = new Map<string, number>();
  private indexToTerm: string[] = [];
  private idf: Float64Array = new Float64Array(0);
  private lrWeights: Float64Array = new Float64Array(0);
  private lrBias = 0;
  private svmWeights: Float64Array = new Float64Array(0);
  private svmBias = 0;

  public readonly lrMetrics: ModelMetrics;
  public readonly svmMetrics: ModelMetrics;

  constructor(trainSamples: LabeledSample[], testSamples: LabeledSample[]) {
    this.fitVectorizer(trainSamples);
    const XTrain = trainSamples.map((s) => this.transform(preprocessForModel(s.text).features));
    const yTrain = trainSamples.map((s) => s.label);

    this.trainLogisticRegression(XTrain, yTrain);
    this.trainLinearSVM(XTrain, yTrain);

    this.lrMetrics = this.evaluate('Logistic Regression', testSamples, trainSamples.length);
    this.svmMetrics = this.evaluate('Linear SVM', testSamples, trainSamples.length);
  }

  private fitVectorizer(samples: LabeledSample[]) {
    const df = new Map<string, number>();
    for (const sample of samples) {
      const { features } = preprocessForModel(sample.text);
      const unique = new Set(features);
      for (const f of unique) {
        df.set(f, (df.get(f) ?? 0) + 1);
      }
    }

    const N = samples.length;
    const terms: string[] = [];
    for (const [term, count] of df.entries()) {
      // Keep unigrams/bigrams seen >= 1 time, char n-grams seen >= 2 times
      if (!term.startsWith('c:') || count >= 2) {
        terms.push(term);
      }
    }

    this.indexToTerm = terms;
    this.idf = new Float64Array(terms.length);
    terms.forEach((term, idx) => {
      this.vocab.set(term, idx);
      const docFreq = df.get(term) ?? 1;
      this.idf[idx] = Math.log((N + 1) / (docFreq + 1)) + 1;
    });
  }

  private transform(features: string[]): Map<number, number> {
    const counts = new Map<number, number>();
    for (const f of features) {
      const idx = this.vocab.get(f);
      if (idx !== undefined) {
        counts.set(idx, (counts.get(idx) ?? 0) + 1);
      }
    }
    const vec = new Map<number, number>();
    let normSq = 0;
    for (const [idx, tf] of counts.entries()) {
      const val = (1 + Math.log(tf)) * this.idf[idx];
      vec.set(idx, val);
      normSq += val * val;
    }
    const norm = Math.sqrt(normSq) || 1;
    for (const [idx, val] of vec.entries()) {
      vec.set(idx, val / norm);
    }
    return vec;
  }

  private trainLogisticRegression(X: Map<number, number>[], y: number[]) {
    const dim = this.indexToTerm.length;
    const w = new Float64Array(dim);
    let b = 0;
    const epochs = 220;
    const lr = 0.85;
    const reg = 0.0008;
    const n = X.length;

    for (let ep = 0; ep < epochs; ep++) {
      const gradW = new Float64Array(dim);
      let gradB = 0;

      for (let i = 0; i < n; i++) {
        let z = b;
        for (const [idx, val] of X[i].entries()) {
          z += w[idx] * val;
        }
        const pred = sigmoid(z);
        const err = pred - y[i];
        gradB += err;
        for (const [idx, val] of X[i].entries()) {
          gradW[idx] += err * val;
        }
      }

      const step = lr / (1 + 0.01 * ep);
      b -= step * (gradB / n);
      for (let j = 0; j < dim; j++) {
        w[j] -= step * (gradW[j] / n + reg * w[j]);
      }
    }

    this.lrWeights = w;
    this.lrBias = b;
  }

  private trainLinearSVM(X: Map<number, number>[], y: number[]) {
    const dim = this.indexToTerm.length;
    const w = new Float64Array(dim);
    let b = 0;
    const epochs = 220;
    const lr = 0.65;
    const lambda = 0.0012;
    const n = X.length;

    for (let ep = 0; ep < epochs; ep++) {
      const gradW = new Float64Array(dim);
      let gradB = 0;

      for (let i = 0; i < n; i++) {
        const yi = y[i] === 1 ? 1 : -1;
        let margin = b;
        for (const [idx, val] of X[i].entries()) {
          margin += w[idx] * val;
        }
        if (yi * margin < 1) {
          gradB -= yi;
          for (const [idx, val] of X[i].entries()) {
            gradW[idx] -= yi * val;
          }
        }
      }

      const step = lr / (1 + 0.012 * ep);
      b -= step * (gradB / n);
      for (let j = 0; j < dim; j++) {
        w[j] -= step * (gradW[j] / n + lambda * w[j]);
      }
    }

    this.svmWeights = w;
    this.svmBias = b;
  }

  private evaluate(
    modelName: 'Logistic Regression' | 'Linear SVM',
    testSamples: LabeledSample[],
    trainCount: number
  ): ModelMetrics {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    let enTp = 0;
    let enFp = 0;
    let enFn = 0;
    let taTp = 0;
    let taFp = 0;
    let taFn = 0;

    for (const sample of testSamples) {
      const res = this.predict(sample.text, modelName);
      const pred = res.predictedLabel === 'Toxic' ? 1 : 0;
      const actual = sample.label;

      if (pred === 1 && actual === 1) tp++;
      else if (pred === 1 && actual === 0) fp++;
      else if (pred === 0 && actual === 0) tn++;
      else if (pred === 0 && actual === 1) fn++;

      if (sample.source === 'Jigsaw English') {
        if (pred === 1 && actual === 1) enTp++;
        else if (pred === 1 && actual === 0) enFp++;
        else if (pred === 0 && actual === 1) enFn++;
      } else {
        if (pred === 1 && actual === 1) taTp++;
        else if (pred === 1 && actual === 0) taFp++;
        else if (pred === 0 && actual === 1) taFn++;
      }
    }

    const total = tp + fp + tn + fn || 1;
    const accuracy = (tp + tn) / total;
    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1 = (2 * precision * recall) / (precision + recall || 1);

    const enPrec = enTp / (enTp + enFp || 1);
    const enRec = enTp / (enTp + enFn || 1);
    const englishF1 = (2 * enPrec * enRec) / (enPrec + enRec || 1);

    const taPrec = taTp / (taTp + taFp || 1);
    const taRec = taTp / (taTp + taFn || 1);
    const tanglishF1 = (2 * taPrec * taRec) / (taPrec + taRec || 1);

    return {
      modelName,
      accuracy,
      precision,
      recall,
      f1,
      englishF1,
      tanglishF1,
      confusionMatrix: { tp, fp, tn, fn },
      testSampleCount: testSamples.length,
      trainSampleCount: trainCount,
      vocabularySize: this.indexToTerm.length,
    };
  }

  public predict(rawText: string, modelUsed: ClassifierChoice = 'Ensemble'): AnalysisResult {
    const prep = preprocessForModel(rawText);
    const vec = this.transform(prep.features);

    let lrZ = this.lrBias;
    let svmMargin = this.svmBias;
    const featureContribs: FeatureContribution[] = [];

    for (const [idx, tfidf] of vec.entries()) {
      const lrW = this.lrWeights[idx];
      const svmW = this.svmWeights[idx];
      lrZ += lrW * tfidf;
      svmMargin += svmW * tfidf;

      const term = this.indexToTerm[idx];
      if (!term.startsWith('c:')) {
        const cleanTerm = term.replace(/^[wb]:/, '').replace(/_/g, ' ');
        const contribution =
          modelUsed === 'Logistic Regression'
            ? lrW * tfidf
            : modelUsed === 'Linear SVM'
              ? svmW * tfidf
              : ((lrW + svmW) / 2) * tfidf;
        featureContribs.push({
          feature: cleanTerm,
          tfidf,
          lrWeight: lrW,
          svmWeight: svmW,
          contribution,
        });
      }
    }

    const lrProbability = sigmoid(lrZ);
    const svmProbability = sigmoid(svmMargin * 1.65);
    const ensembleProbability = (lrProbability + svmProbability) / 2;
    const activeProbability =
      modelUsed === 'Logistic Regression'
        ? lrProbability
        : modelUsed === 'Linear SVM'
          ? svmProbability
          : ensembleProbability;

    // Identify offensive spans in original text
    const highlightedTokens: HighlightedToken[] = [];
    const flaggedSet = new Set<string>();
    let maxLexiconSeverity = 0;
    let hasIntensifier = false;

    for (const span of prep.spans) {
      const norm = normalizeTokenText(span.cleaned);
      if (INTENSIFIERS.has(norm) || INTENSIFIERS.has(span.cleaned)) {
        hasIntensifier = true;
      }
      const lex = VARIANT_TO_LEXICON[norm] ?? VARIANT_TO_LEXICON[span.cleaned];
      if (lex) {
        // Context-aware dampening for playful Tanglish "poda dei" when surrounded by strong positive markers
        const lowerFull = rawText.toLowerCase();
        const isPlayfulBanter =
          lex.canonical === 'poda' &&
          /(semma|sema|mass|super|awesome|nanba|machan|vaazhthukkal|kalakkal)/.test(lowerFull) &&
          !/(naai|loosu|panni|muttal|seruppu|saavu|kevalam|idiot|loser|trash)/.test(lowerFull);

        if (!isPlayfulBanter) {
          const termIdx = this.vocab.get(`w:${lex.canonical}`);
          const modelWeight = termIdx !== undefined ? Math.max(0, this.lrWeights[termIdx]) : 0;
          highlightedTokens.push({
            raw: span.raw,
            normalized: lex.canonical,
            startIndex: span.startIndex,
            endIndex: span.endIndex,
            language: lex.language,
            category: lex.category,
            gloss: lex.gloss,
            weight: Number((lex.severity + modelWeight * 0.1).toFixed(2)),
          });
          flaggedSet.add(span.raw);
          if (lex.severity > maxLexiconSeverity) {
            maxLexiconSeverity = lex.severity;
          }
        }
      }
    }

    // Detect language profile
    const hasTamilUnicode = /[\u0B80-\u0BFF]/.test(rawText);
    let tanglishTokenHits = 0;
    let englishAlphaHits = 0;
    for (const tok of prep.tokens) {
      const norm = normalizeTokenText(tok);
      if (TANGLISH_INDICATORS.has(tok) || TANGLISH_INDICATORS.has(norm)) {
        tanglishTokenHits++;
      } else if (/^[a-z]+$/.test(tok)) {
        englishAlphaHits++;
      }
    }

    let languageProfile: LanguageProfile = 'English';
    if (hasTamilUnicode && englishAlphaHits === 0 && tanglishTokenHits === 0) {
      languageProfile = 'Tamil';
    } else if (hasTamilUnicode || (tanglishTokenHits > 0 && englishAlphaHits > 1)) {
      languageProfile = 'Code-Mixed';
    } else if (tanglishTokenHits > 0) {
      languageProfile = 'Tanglish';
    }

    // Compute Severity Score (0 - 100) combining ML probability + offensive lexicon severity + emphasis
    const exclamations = (rawText.match(/!/g) || []).length;
    const upperChars = (rawText.match(/[A-Z]/g) || []).length;
    const alphaChars = (rawText.match(/[a-zA-Z]/g) || []).length || 1;
    const shoutBoost = upperChars / alphaChars > 0.45 && alphaChars > 8 ? 5 : 0;
    const emphasisBoost = Math.min(6, exclamations * 1.5) + (hasIntensifier && maxLexiconSeverity > 0 ? 5 : 0) + shoutBoost;

    let rawSeverity = activeProbability * 78 + maxLexiconSeverity * 22 + (highlightedTokens.length > 0 ? emphasisBoost : 0);
    if (highlightedTokens.length === 0 && activeProbability < 0.45) {
      rawSeverity = activeProbability * 42;
    } else if (highlightedTokens.length >= 2 && maxLexiconSeverity >= 0.72) {
      rawSeverity = Math.max(rawSeverity, 68 + Math.min(28, highlightedTokens.length * 6));
    }

    const severityScore = Math.max(0, Math.min(100, Math.round(rawSeverity)));
    const predictedLabel = severityScore >= 45 || activeProbability >= 0.5 ? 'Toxic' : 'Non-Toxic';

    let severityTier: SeverityTier = 'Safe';
    if (severityScore >= 75) severityTier = 'Severe';
    else if (severityScore >= 50) severityTier = 'Moderate';
    else if (severityScore >= 25) severityTier = 'Mild';

    // Determine suggested reporting category
    let suggestedCategory: ReasonCategory = 'Other';
    if (highlightedTokens.length > 0) {
      const topToken = [...highlightedTokens].sort((a, b) => b.weight - a.weight)[0];
      suggestedCategory = topToken.category;
    } else if (predictedLabel === 'Toxic') {
      suggestedCategory = languageProfile === 'English' ? 'Cyberbullying' : 'Tanglish Abuse';
    }

    featureContribs.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    return {
      rawText,
      cleanedText: prep.cleanedText,
      tokens: prep.tokens,
      keptTokens: prep.keptTokens,
      removedStopWords: prep.removedStopWords,
      normalizedTokens: prep.normalizedPairs,
      normalizedText: prep.normalizedText,
      languageProfile,
      predictedLabel,
      severityScore,
      severityTier,
      lrProbability,
      svmProbability,
      svmMargin,
      ensembleProbability,
      activeProbability,
      modelUsed,
      highlightedTokens,
      flaggedWords: Array.from(flaggedSet).slice(0, 25),
      topFeatures: featureContribs.slice(0, 8),
      suggestedCategory,
    };
  }
}

export const toxiGuardEngine = new TfidfLinearEngine(TRAIN_CORPUS, TEST_CORPUS);

export function analyzeComment(text: string, modelUsed: ClassifierChoice = 'Ensemble'): AnalysisResult {
  return toxiGuardEngine.predict(text, modelUsed);
}

export function getLexiconEntries() {
  return OFFENSIVE_LEXICON;
}
