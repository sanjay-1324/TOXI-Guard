import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { CheckCircle2, X } from 'lucide-react';
import { AnalyzerView } from './components/AnalyzerView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModelsBenchmarkView } from './components/ModelsBenchmarkView';
import { ModerationQueueView } from './components/ModerationQueueView';
import { ReportModal } from './components/ReportModal';
import { SocialFeedView } from './components/SocialFeedView';
import { NavTab, TopBar } from './components/TopBar';
import { auth, googleProvider } from './lib/firebase';
import { SAMPLE_COMMENTS } from './nlp/corpus';
import {
  checkIsAdminUser,
  subscribeAllReports,
  subscribeMyReports,
  subscribeSavedAnalyses,
} from './services/reports';
import {
  AnalysisResult,
  ReportDoc,
  SavedAnalysisDoc,
  SourceContext,
} from './types';

function ToxiGuardWorkspace() {
  const [activeTab, setActiveTab] = useState<NavTab>('analyzer');
  const [analyzerText, setAnalyzerText] = useState(SAMPLE_COMMENTS[0].text);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysisDoc[]>([]);

  const [reportTarget, setReportTarget] = useState<{
    analysis: AnalysisResult;
    sourceContext: SourceContext;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const adminStatus = await checkIsAdminUser(nextUser);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
        setReports([]);
        setSavedAnalyses([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setReports([]);
      setSavedAnalyses([]);
      return;
    }

    setReportsLoading(true);
    setReportsError(null);

    const handleErr = (err: Error) => {
      setReportsError(err.message);
      setReportsLoading(false);
    };

    const unsubReports = isAdmin
      ? subscribeAllReports((items) => {
          setReports(items);
          setReportsLoading(false);
        }, handleErr)
      : subscribeMyReports(
          user.uid,
          (items) => {
            setReports(items);
            setReportsLoading(false);
          },
          handleErr
        );

    const unsubSaved = subscribeSavedAnalyses(
      user.uid,
      (items) => setSavedAnalyses(items),
      () => {
        // Non-fatal if user hasn't saved analyses yet
      }
    );

    return () => {
      unsubReports();
      unsubSaved();
    };
  }, [user, isAdmin]);

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  function handleInspectInAnalyzer(text: string) {
    setAnalyzerText(text);
    setActiveTab('analyzer');
  }

  function handleOpenReport(
    analysis: AnalysisResult,
    sourceContext: SourceContext
  ) {
    setReportTarget({ analysis, sourceContext });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {toastMessage && (
        <div className="max-w-[1320px] w-full mx-auto px-6 pt-4">
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setToastMessage(null);
                  setActiveTab('moderation');
                }}
                className="font-medium underline cursor-pointer"
              >
                View in Moderation Queue
              </button>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                aria-label="Dismiss notification"
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-6 py-8">
        {activeTab === 'analyzer' && (
          <AnalyzerView
            user={user}
            inputText={analyzerText}
            onChangeInputText={setAnalyzerText}
            savedAnalyses={savedAnalyses}
            onSignIn={handleSignIn}
            onOpenReportModal={(analysis) =>
              handleOpenReport(analysis, 'Comment Analyzer')
            }
          />
        )}

        {activeTab === 'feed' && (
          <SocialFeedView
            onOpenReportModal={(analysis, source) =>
              handleOpenReport(analysis, source)
            }
            onInspectInAnalyzer={handleInspectInAnalyzer}
          />
        )}

        {activeTab === 'models' && (
          <ModelsBenchmarkView
            onOpenReportModal={(analysis, source) =>
              handleOpenReport(analysis, source)
            }
          />
        )}

        {activeTab === 'moderation' && (
          <ModerationQueueView
            user={user}
            isAdmin={isAdmin}
            reports={reports}
            loading={reportsLoading}
            error={reportsError}
            onSignIn={handleSignIn}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1320px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            ToxiGuard · English &amp; Tanglish Cyberbullying Moderation System
          </span>
          <span>
            TF-IDF · Logistic Regression &amp; Linear SVM · Firestore Moderation
            Queue
          </span>
        </div>
      </footer>

      {reportTarget && (
        <ReportModal
          analysis={reportTarget.analysis}
          sourceContext={reportTarget.sourceContext}
          user={user}
          onSignIn={handleSignIn}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => {
            setReportTarget(null);
            setToastMessage(
              'Comment report recorded in Firestore and queued for administrator review.'
            );
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToxiGuardWorkspace />
    </ErrorBoundary>
  );
}
