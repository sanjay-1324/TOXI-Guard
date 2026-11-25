import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Flag, LogIn, X } from 'lucide-react';
import { submitReport } from '../services/reports';
import { AnalysisResult, ReasonCategory, SourceContext } from '../types';

const REASON_OPTIONS: ReasonCategory[] = [
  'Cyberbullying',
  'Tanglish Abuse',
  'Profanity / Slur',
  'Harassment / Threat',
  'Hate Speech',
  'Other',
];

interface ReportModalProps {
  analysis: AnalysisResult;
  sourceContext: SourceContext;
  user: User | null;
  onSignIn: () => Promise<void>;
  onClose: () => void;
  onSubmitted: (reportId: string) => void;
}

export function ReportModal({
  analysis,
  sourceContext,
  user,
  onSignIn,
  onClose,
  onSubmitted,
}: ReportModalProps) {
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>(
    analysis.suggestedCategory
  );
  const [userNotes, setUserNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await submitReport({
        user,
        analysis,
        reasonCategory,
        userNotes,
        sourceContext,
      });
      onSubmitted(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Flag className="w-4 h-4 text-red-700" />
            <h2
              id="report-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              Report Comment for Moderation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-500">
              Flagged Comment · {analysis.languageProfile} · Severity{' '}
              <span className="font-mono tabular-nums text-slate-900">
                {analysis.severityScore}/100
              </span>
            </div>
            <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed break-words">
              {analysis.rawText}
            </p>
          </div>

          {analysis.flaggedWords.length > 0 && (
            <div className="text-xs text-slate-600">
              <span className="font-medium text-slate-700">
                Detected offensive terms:{' '}
              </span>
              <span className="font-mono text-red-700">
                {analysis.flaggedWords.join(', ')}
              </span>
            </div>
          )}

          {!user ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-slate-700">
                Sign in with your verified Google account to record this report
                in the database for administrator review.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="reason-category"
                  className="block text-xs font-medium text-slate-700"
                >
                  Abuse Category
                </label>
                <select
                  id="reason-category"
                  value={reasonCategory}
                  onChange={(e) =>
                    setReasonCategory(e.target.value as ReasonCategory)
                  }
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reporter-notes"
                  className="block text-xs font-medium text-slate-700"
                >
                  Moderator Context (Optional)
                </label>
                <textarea
                  id="reporter-notes"
                  rows={3}
                  maxLength={500}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Add context about targeted harassment, Tanglish slang nuance, or repeat abuse..."
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
