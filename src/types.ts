export type LanguageProfile = 'English' | 'Tanglish' | 'Tamil' | 'Code-Mixed';

export type PredictedLabel = 'Toxic' | 'Non-Toxic';

export type SeverityTier = 'Safe' | 'Mild' | 'Moderate' | 'Severe';

export type ClassifierChoice = 'Logistic Regression' | 'Linear SVM' | 'Ensemble';

export type ReasonCategory =
  | 'Cyberbullying'
  | 'Hate Speech'
  | 'Profanity / Slur'
  | 'Harassment / Threat'
  | 'Tanglish Abuse'
  | 'Other';

export type SourceContext = 'Comment Analyzer' | 'Social Feed' | 'Batch Inspector';

export type ReportStatus = 'pending' | 'confirmed_toxic' | 'dismissed' | 'escalated';

export interface HighlightedToken {
  raw: string;
  normalized: string;
  startIndex: number;
  endIndex: number;
  language: 'English' | 'Tanglish';
  category: ReasonCategory;
  gloss: string;
  weight: number;
}

export interface FeatureContribution {
  feature: string;
  tfidf: number;
  lrWeight: number;
  svmWeight: number;
  contribution: number;
}

export interface AnalysisResult {
  rawText: string;
  cleanedText: string;
  tokens: string[];
  keptTokens: string[];
  removedStopWords: string[];
  normalizedTokens: Array<{ original: string; normalized: string; changed: boolean }>;
  normalizedText: string;
  languageProfile: LanguageProfile;
  predictedLabel: PredictedLabel;
  severityScore: number;
  severityTier: SeverityTier;
  lrProbability: number;
  svmProbability: number;
  svmMargin: number;
  ensembleProbability: number;
  activeProbability: number;
  modelUsed: ClassifierChoice;
  highlightedTokens: HighlightedToken[];
  flaggedWords: string[];
  topFeatures: FeatureContribution[];
  suggestedCategory: ReasonCategory;
}

export interface ReportDoc {
  id: string;
  reporterId: string;
  reporterEmail: string;
  reporterName: string;
  commentText: string;
  normalizedText: string;
  languageProfile: LanguageProfile;
  predictedLabel: PredictedLabel;
  severityScore: number;
  severityTier: SeverityTier;
  modelUsed: ClassifierChoice;
  flaggedWords: string[];
  reasonCategory: ReasonCategory;
  userNotes: string;
  sourceContext: SourceContext;
  status: ReportStatus;
  adminNote: string;
  reviewedBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SavedAnalysisDoc {
  id: string;
  userId: string;
  commentText: string;
  normalizedText: string;
  languageProfile: LanguageProfile;
  predictedLabel: PredictedLabel;
  severityScore: number;
  severityTier: SeverityTier;
  lrProbability: number;
  svmScore: number;
  flaggedWords: string[];
  createdAt: Date | null;
}

export interface SocialFeedPost {
  id: string;
  authorHandle: string;
  authorName: string;
  timestampLabel: string;
  topic: string;
  text: string;
  likes: number;
}

export interface ModelMetrics {
  modelName: 'Logistic Regression' | 'Linear SVM';
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  englishF1: number;
  tanglishF1: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  testSampleCount: number;
  trainSampleCount: number;
  vocabularySize: number;
}
