import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bookmark,
  CheckCircle2,
  Flag,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { SAMPLE_COMMENTS } from '../nlp/corpus';
import { analyzeComment } from '../nlp/engine';
import { deleteSavedAnalysis, saveAnalysisHistory } from '../services/reports';
import {
  AnalysisResult,
  ClassifierChoice,
  HighlightedToken,
  SavedAnalysisDoc,
} from '../types';
import { HighlightedText } from './HighlightedText';

interface AnalyzerViewProps {
  user: User | null;
  inputText: string;
  onChangeInputText: (next: string) => void;
  savedAnalyses: SavedAnalysisDoc[];
  onSignIn: () => Promise<void>;
  onOpenReportModal: (analysis: AnalysisResult) => void;
}

const CLASSIFIERS: ClassifierChoice[] = [
  'Ensemble',
  'Logistic Regression',
  'Linear SVM',
];

export function AnalyzerView({
  user,
  inputText,
  onChangeInputText,
  savedAnalyses,
  onSignIn,
  onOpenReportModal,
}: AnalyzerViewProps) {
  const [classifier, setClassifier] = useState<ClassifierChoice>('Ensemble');
  const [selectedToken, setSelectedToken] = useState<HighlightedToken | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const analysis = useMemo(
    () => analyzeComment(inputText, classifier),
    [inputText, classifier]
  );

  const activeToken =
    selectedToken &&
    analysis.highlightedTokens.some(
      (t) =>
        t.startIndex === selectedToken.startIndex &&
        t.endIndex === selectedToken.endIndex
    )
      ? selectedToken
      : analysis.highlightedTokens[0] || null;

  const isToxic = analysis.predictedLabel === 'Toxic';

  const severityColorClass =
    analysis.severityTier === 'Severe'
      ? 'bg-red-600'
      : analysis.severityTier === 'Moderate'
        ? 'bg-orange-600'
        : analysis.severityTier === 'Mild'
          ? 'bg-amber-500'
          : 'bg-emerald-600';

  const verdictTextClass =
    analysis.severityTier === 'Severe'
      ? 'text-red-700'
      : analysis.severityTier === 'Moderate'
        ? 'text-orange-700'
        : analysis.severityTier === 'Mild'
          ? 'text-amber-700'
          : 'text-emerald-700';

  async function handleSaveAnalysis() {
    if (!user) {
      await onSignIn();
      return;
    }
    if (!inputText.trim()) return;
    setSaving(true);
    setSaveFeedback(null);
    try {
      await saveAnalysisHistory({ user, analysis });
      setSaveFeedback('Saved to your analysis history.');
    } catch {
      setSaveFeedback('Unable to save analysis right now.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Lead */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Toxic Comment &amp; Tanglish Detector
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Inspect English, Tamil-English (Tanglish), and code-mixed comments
            through text cleaning, stop-word filtering, Tanglish stem
            normalization, TF-IDF vectorization, and linear classification.
          </p>
        </div>

        {/* Classifier segmented control */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <span className="text-xs font-medium text-slate-500">
            Active Classifier
          </span>
          <div
            role="group"
            aria-label="Classifier selection"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
          >
            {CLASSIFIERS.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setClassifier(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  classifier === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 12-column workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 columns: Input + Annotated Output + Verdict */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="comment-input"
                className="text-sm font-semibold text-slate-900"
              >
                Comment Input
              </label>
              <button
                type="button"
                onClick={() => {
                  onChangeInputText('');
                  setSelectedToken(null);
                  setSaveFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <textarea
              id="comment-input"
              rows={4}
              maxLength={2000}
              value={inputText}
              onChange={(e) => {
                onChangeInputText(e.target.value);
                setSaveFeedback(null);
              }}
              placeholder="Paste or type a social media comment in English or Tanglish (e.g., 'Poda loosu naai, unaku arivu illaya')..."
              className="w-full px-4 py-3 text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y leading-relaxed"
            />

            {/* Sample presets */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                Sample Test Cases
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_COMMENTS.map((sample) => {
                  const isActive = inputText === sample.text;
                  return (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        onChangeInputText(sample.text);
                        setSelectedToken(null);
                        setSaveFeedback(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sample.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Annotated Highlight Result */}
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isToxic ? (
                    <ShieldAlert className={`w-5 h-5 ${verdictTextClass}`} />
                  ) : (
                    <ShieldCheck className={`w-5 h-5 ${verdictTextClass}`} />
                  )}
                  <span className={`text-base font-semibold ${verdictTextClass}`}>
                    {analysis.predictedLabel}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs text-slate-600">
                    {analysis.severityTier} Severity
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs text-slate-600">
                    {analysis.languageProfile}
                  </span>
                </div>

                <div className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                  Severity {analysis.severityScore}/100
                </div>
              </div>

              {/* Severity meter */}
              <div
                aria-label={`Toxicity severity score ${analysis.severityScore} out of 100`}
                className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full transition-all duration-200 ${severityColorClass}`}
                  style={{ width: `${analysis.severityScore}%` }}
                />
              </div>

              {/* Highlighted comment text */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Highlighted Offensive Words ({analysis.highlightedTokens.length})
                </div>
                <HighlightedText
                  text={analysis.rawText}
                  highlights={analysis.highlightedTokens}
                  selectedToken={activeToken}
                  onSelectToken={setSelectedToken}
                />
              </div>

              {/* Selected offensive token breakdown */}
              {activeToken && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-900">
                      Token{' '}
                      <span className="font-mono text-red-700">
                        {activeToken.raw}
                      </span>{' '}
                      <span className="text-slate-400">→</span>{' '}
                      <span className="font-mono text-slate-900">
                        {activeToken.normalized}
                      </span>
                    </div>
                    <p className="text-slate-600">{activeToken.gloss}</p>
                  </div>
                  <div className="text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                    {activeToken.language} · {activeToken.category} · Weight{' '}
                    {activeToken.weight.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!inputText.trim()}
                    onClick={() => onOpenReportModal(analysis)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report Comment
                  </button>
                  <button
                    type="button"
                    disabled={!inputText.trim() || saving}
                    onClick={handleSaveAnalysis}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : user ? 'Save Analysis' : 'Sign in to Save'}
                  </button>
                </div>

                {saveFeedback && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {saveFeedback}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Model Output Comparison Strip */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Classifier Probability Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="space-y-1 pt-2 sm:pt-0">
                <div className="text-xs text-slate-500">Logistic Regression</div>
                <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                  {(analysis.lrProbability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">
                  Sigmoid toxic probability
                </div>
              </div>

              <div className="space-y-1 pt-4 sm:pt-0 sm:pl-6">
                <div className="text-xs text-slate-500">Linear SVM</div>
                <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                  {(analysis.svmProbability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  Margin {analysis.svmMargin >= 0 ? '+' : ''}
                  {analysis.svmMargin.toFixed(2)}
                </div>
              </div>

              <div className="space-y-1 pt-4 sm:pt-0 sm:pl-6">
                <div className="text-xs text-slate-500">Combined Ensemble</div>
                <div className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                  {(analysis.ensembleProbability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">
                  Threshold ≥ 50.0% toxic
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right 5 columns: NLP Preprocessing Pipeline & TF-IDF Features */}
        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          <div className="p-5 space-y-1.5">
            <h2 className="text-sm font-semibold text-slate-900">
              01. Text Cleaning &amp; Obfuscation Removal
            </h2>
            <p className="text-xs text-slate-500">
              Strips URLs/mentions, normalizes Unicode, and collapses leetspeak.
            </p>
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-words">
              {analysis.cleanedText || '—'}
            </div>
          </div>

          <div className="p-5 space-y-2.5">
            <h2 className="text-sm font-semibold text-slate-900">
              02. Tokenization &amp; Stop-Word Removal
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-500 mb-1">
                  Kept Tokens ({analysis.keptTokens.length})
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 break-words min-h-[44px]">
                  {analysis.keptTokens.length > 0
                    ? analysis.keptTokens.join(', ')
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">
                  Removed Stop-Words ({analysis.removedStopWords.length})
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-500 break-words min-h-[44px]">
                  {analysis.removedStopWords.length > 0
                    ? analysis.removedStopWords.join(', ')
                    : 'None'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              03. Tanglish Normalization
            </h2>
            <p className="text-xs text-slate-500">
              Maps elongated spellings, phonetic variants, and code-mixed slang
              to canonical stems.
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {analysis.normalizedTokens.filter((t) => t.changed).length === 0 ? (
                <div className="text-xs text-slate-500 italic">
                  All tokens already match canonical stems.
                </div>
              ) : (
                analysis.normalizedTokens
                  .filter((t) => t.changed)
                  .map((t, idx) => (
                    <div
                      key={`${t.original}-${idx}`}
                      className="flex items-center justify-between text-xs font-mono px-2.5 py-1.5 bg-slate-50 rounded border border-slate-200"
                    >
                      <span className="text-slate-600">{t.original}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-900 font-medium">
                        {t.normalized}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="p-5 space-y-2.5">
            <h2 className="text-sm font-semibold text-slate-900">
              04. Top TF-IDF Feature Contributions
            </h2>
            {analysis.topFeatures.length === 0 ? (
              <p className="text-xs text-slate-500">
                No TF-IDF features extracted yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 text-left font-medium">Feature</th>
                      <th className="py-1.5 text-right font-medium">TF-IDF</th>
                      <th className="py-1.5 text-right font-medium">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysis.topFeatures.map((feat) => (
                      <tr key={feat.feature}>
                        <td className="py-1.5 font-mono text-slate-800 truncate max-w-[140px]">
                          {feat.feature}
                        </td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-slate-600">
                          {feat.tfidf.toFixed(3)}
                        </td>
                        <td
                          className={`py-1.5 text-right font-mono tabular-nums font-medium ${
                            feat.contribution > 0
                              ? 'text-red-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {feat.contribution > 0 ? '+' : ''}
                          {feat.contribution.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Saved Analysis History (when authenticated) */}
      {user && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Saved Analysis History
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {savedAnalyses.length} saved
            </span>
          </div>

          {savedAnalyses.length === 0 ? (
            <p className="text-sm text-slate-500">
              No saved scans yet. Click &ldquo;Save Analysis&rdquo; above to
              store comment evaluations to your account.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 text-left font-medium">Comment</th>
                    <th className="py-2.5 text-left font-medium">Language</th>
                    <th className="py-2.5 text-left font-medium">Verdict</th>
                    <th className="py-2.5 text-right font-medium">Severity</th>
                    <th className="py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedAnalyses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-4 max-w-md">
                        <button
                          type="button"
                          onClick={() => onChangeInputText(item.commentText)}
                          className="text-left text-slate-800 hover:text-blue-700 line-clamp-1 cursor-pointer"
                        >
                          {item.commentText}
                        </button>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 whitespace-nowrap">
                        {item.languageProfile}
                      </td>
                      <td
                        className={`py-2.5 pr-4 text-xs font-medium whitespace-nowrap ${
                          item.predictedLabel === 'Toxic'
                            ? 'text-red-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {item.predictedLabel} · {item.severityTier}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-xs text-slate-900">
                        {item.severityScore}/100
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteSavedAnalysis(user.uid, item.id)}
                          aria-label="Delete saved analysis"
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
