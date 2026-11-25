import React, { useMemo, useState } from 'react';
import { Download, Flag, Play, Search } from 'lucide-react';
import { TEST_CORPUS, TRAIN_CORPUS } from '../nlp/corpus';
import {
  analyzeComment,
  getLexiconEntries,
  toxiGuardEngine,
} from '../nlp/engine';
import { AnalysisResult, ClassifierChoice } from '../types';

interface ModelsBenchmarkViewProps {
  onOpenReportModal: (analysis: AnalysisResult, source: 'Batch Inspector') => void;
}

const DEFAULT_BATCH_INPUT = [
  'Poda loosu naai, unaku arivu illaya da muttal.',
  'Semma explanation bro, romba useful ah iruku!',
  'You are a pathetic moron and a complete loser.',
  'Poda dei awesome shot adhu, sema match today!',
  'Kevalama comment podadha da panni, seruppu adippen.',
  'Could you share the TF-IDF vocabulary count for the Tanglish dataset?',
].join('\n');

export function ModelsBenchmarkView({
  onOpenReportModal,
}: ModelsBenchmarkViewProps) {
  const lr = toxiGuardEngine.lrMetrics;
  const svm = toxiGuardEngine.svmMetrics;
  const lexicon = useMemo(() => getLexiconEntries(), []);

  const [batchText, setBatchText] = useState(DEFAULT_BATCH_INPUT);
  const [batchModel, setBatchModel] = useState<ClassifierChoice>('Ensemble');
  const [batchResults, setBatchResults] = useState<AnalysisResult[]>(() =>
    DEFAULT_BATCH_INPUT.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => analyzeComment(line, 'Ensemble'))
  );

  const [lexQuery, setLexQuery] = useState('');
  const [lexLang, setLexLang] = useState<'All' | 'Tanglish' | 'English'>('All');

  function runBatchEvaluation() {
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 40);
    setBatchResults(lines.map((line) => analyzeComment(line, batchModel)));
  }

  function exportBatchCsv() {
    const header = [
      'comment',
      'language_profile',
      'predicted_label',
      'severity_score',
      'severity_tier',
      'lr_probability',
      'svm_probability',
      'flagged_words',
    ];
    const rows = batchResults.map((r) =>
      [
        `"${r.rawText.replace(/"/g, '""')}"`,
        r.languageProfile,
        r.predictedLabel,
        r.severityScore,
        r.severityTier,
        r.lrProbability.toFixed(4),
        r.svmProbability.toFixed(4),
        `"${r.flaggedWords.join('; ')}"`,
      ].join(',')
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'toxiguard_batch_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const filteredLexicon = useMemo(() => {
    return lexicon.filter((entry) => {
      if (lexLang !== 'All' && entry.language !== lexLang) return false;
      if (lexQuery.trim()) {
        const q = lexQuery.toLowerCase();
        return (
          entry.canonical.includes(q) ||
          entry.gloss.toLowerCase().includes(q) ||
          entry.variants.some((v) => v.includes(q))
        );
      }
      return true;
    });
  }, [lexicon, lexLang, lexQuery]);

  const englishTrainCount = TRAIN_CORPUS.filter(
    (s) => s.source === 'Jigsaw English'
  ).length;
  const tanglishTrainCount = TRAIN_CORPUS.filter(
    (s) => s.source === 'Custom Tanglish'
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Dataset, TF-IDF &amp; Classifier Benchmarks
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Real-time evaluation of Logistic Regression and Linear SVM trained
            on Jigsaw English and Custom Tanglish corpora, plus batch comment
            scanning and normalization dictionary lookup.
          </p>
        </div>

        <div className="text-xs text-slate-600 font-mono tabular-nums shrink-0">
          Train {TRAIN_CORPUS.length} ({englishTrainCount} EN +{' '}
          {tanglishTrainCount} TA) · Test {TEST_CORPUS.length} · Vocab{' '}
          {lr.vocabularySize} features
        </div>
      </div>

      {/* Classifier Comparison Table + Confusion Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Held-Out Benchmark Metrics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 text-left font-medium">Metric</th>
                  <th className="py-2 text-right font-medium">
                    Logistic Regression
                  </th>
                  <th className="py-2 text-right font-medium">Linear SVM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Overall Accuracy', lr.accuracy, svm.accuracy],
                  ['Precision', lr.precision, svm.precision],
                  ['Recall', lr.recall, svm.recall],
                  ['Macro F1 Score', lr.f1, svm.f1],
                  ['Jigsaw English F1', lr.englishF1, svm.englishF1],
                  ['Custom Tanglish F1', lr.tanglishF1, svm.tanglishF1],
                ].map(([label, lrVal, svmVal]) => (
                  <tr key={String(label)}>
                    <td className="py-2.5 text-slate-700">{label}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-medium text-slate-900">
                      {(Number(lrVal) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-medium text-slate-900">
                      {(Number(svmVal) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Confusion Matrices */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Confusion Matrices (n = {lr.testSampleCount})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[lr, svm].map((m) => (
              <div
                key={m.modelName}
                className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50"
              >
                <div className="text-xs font-semibold text-slate-900">
                  {m.modelName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white border border-slate-200 rounded p-2.5">
                    <div className="text-[11px] text-slate-500">
                      True Toxic (TP)
                    </div>
                    <div className="text-lg font-mono tabular-nums font-semibold text-emerald-700">
                      {m.confusionMatrix.tp}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-2.5">
                    <div className="text-[11px] text-slate-500">
                      False Alarm (FP)
                    </div>
                    <div className="text-lg font-mono tabular-nums font-semibold text-amber-700">
                      {m.confusionMatrix.fp}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-2.5">
                    <div className="text-[11px] text-slate-500">
                      Missed Toxic (FN)
                    </div>
                    <div className="text-lg font-mono tabular-nums font-semibold text-red-700">
                      {m.confusionMatrix.fn}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-2.5">
                    <div className="text-[11px] text-slate-500">
                      True Safe (TN)
                    </div>
                    <div className="text-lg font-mono tabular-nums font-semibold text-slate-900">
                      {m.confusionMatrix.tn}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Batch Comment Inspector */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Batch Comment Evaluator
            </h2>
            <p className="text-xs text-slate-500">
              Enter one comment per line to classify multiple English and
              Tanglish comments simultaneously.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Batch classifier model"
              value={batchModel}
              onChange={(e) =>
                setBatchModel(e.target.value as ClassifierChoice)
              }
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Ensemble">Ensemble</option>
              <option value="Logistic Regression">Logistic Regression</option>
              <option value="Linear SVM">Linear SVM</option>
            </select>
            <button
              type="button"
              onClick={runBatchEvaluation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Run Batch
            </button>
            <button
              type="button"
              onClick={exportBatchCsv}
              disabled={batchResults.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        <textarea
          rows={5}
          value={batchText}
          onChange={(e) => setBatchText(e.target.value)}
          aria-label="Batch comments input"
          className="w-full px-4 py-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 text-left font-medium">Comment</th>
                <th className="py-2 text-left font-medium">Language</th>
                <th className="py-2 text-left font-medium">Prediction</th>
                <th className="py-2 text-right font-medium">Severity</th>
                <th className="py-2 text-left font-medium pl-4">
                  Flagged Tokens
                </th>
                <th className="py-2 text-right font-medium">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batchResults.map((res, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 text-slate-800 max-w-md">
                    {res.rawText}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">
                    {res.languageProfile}
                  </td>
                  <td
                    className={`py-2.5 pr-4 font-medium whitespace-nowrap ${
                      res.predictedLabel === 'Toxic'
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {res.predictedLabel} · {res.severityTier}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                    {res.severityScore}/100
                  </td>
                  <td className="py-2.5 pl-4 font-mono text-red-700">
                    {res.flaggedWords.length > 0
                      ? res.flaggedWords.join(', ')
                      : '—'}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenReportModal(res, 'Batch Inspector')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    >
                      <Flag className="w-3 h-3" />
                      Flag
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tanglish Normalization Lexicon */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Tanglish &amp; English Normalization Lexicon
            </h2>
            <p className="text-xs text-slate-500">
              Phonetic variants, elongated spellings, and leetspeak forms
              canonicalized prior to TF-IDF extraction.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              role="group"
              aria-label="Lexicon language filter"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
            >
              {(['All', 'Tanglish', 'English'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLexLang(lang)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    lexLang === lang
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={lexQuery}
                onChange={(e) => setLexQuery(e.target.value)}
                placeholder="Search stem or gloss..."
                aria-label="Search lexicon"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 text-left font-medium">Canonical Stem</th>
                <th className="py-2 text-left font-medium">Language</th>
                <th className="py-2 text-left font-medium">Category</th>
                <th className="py-2 text-left font-medium">Normalized Variants</th>
                <th className="py-2 text-left font-medium">Meaning / Gloss</th>
                <th className="py-2 text-right font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLexicon.map((entry) => (
                <tr key={entry.canonical} className="hover:bg-slate-50">
                  <td className="py-2 pr-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {entry.canonical}
                  </td>
                  <td className="py-2 pr-3 text-slate-600 whitespace-nowrap">
                    {entry.language}
                  </td>
                  <td className="py-2 pr-3 text-slate-700 whitespace-nowrap">
                    {entry.category}
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-600">
                    {entry.variants.join(', ')}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">{entry.gloss}</td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-900">
                    {(entry.severity * 100).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
