import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  AnalysisResult,
  ReasonCategory,
  ReportDoc,
  ReportStatus,
  SavedAnalysisDoc,
  SourceContext,
} from '../types';

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return null;
}

function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function sanitizeFlaggedWords(words: string[]): string[] {
  return words
    .map((w) => w.trim().slice(0, 64))
    .filter((w) => w.length > 0)
    .slice(0, 25);
}

export async function checkIsAdminUser(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) {
    return false;
  }
  if (user.email === BOOTSTRAP_ADMIN_EMAIL) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    return adminSnap.exists() && adminSnap.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export async function submitReport(params: {
  user: User;
  analysis: AnalysisResult;
  reasonCategory: ReasonCategory;
  userNotes: string;
  sourceContext: SourceContext;
}): Promise<string> {
  const { user, analysis, reasonCategory, userNotes, sourceContext } = params;
  const path = 'reports';
  const commentText = clampString(analysis.rawText, 2000);
  if (!commentText) {
    throw new Error('Comment text cannot be empty.');
  }

  const payload = {
    reporterId: clampString(user.uid, 128),
    reporterEmail: clampString(user.email || '', 200),
    reporterName: clampString(user.displayName || user.email || 'Verified User', 120),
    commentText,
    normalizedText: clampString(analysis.normalizedText, 2000),
    languageProfile: analysis.languageProfile,
    predictedLabel: analysis.predictedLabel,
    severityScore: Math.max(0, Math.min(100, Math.round(analysis.severityScore))),
    severityTier: analysis.severityTier,
    modelUsed: analysis.modelUsed,
    flaggedWords: sanitizeFlaggedWords(analysis.flaggedWords),
    reasonCategory,
    userNotes: clampString(userNotes, 500),
    sourceContext,
    status: 'pending' as ReportStatus,
    adminNote: '',
    reviewedBy: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, path), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeMyReports(
  userId: string,
  onData: (reports: ReportDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'reports';
  const q = query(
    collection(db, path),
    where('reporterId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReportDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          reporterId: String(data.reporterId || ''),
          reporterEmail: String(data.reporterEmail || ''),
          reporterName: String(data.reporterName || ''),
          commentText: String(data.commentText || ''),
          normalizedText: String(data.normalizedText || ''),
          languageProfile: data.languageProfile || 'English',
          predictedLabel: data.predictedLabel || 'Toxic',
          severityScore: Number(data.severityScore || 0),
          severityTier: data.severityTier || 'Mild',
          modelUsed: data.modelUsed || 'Ensemble',
          flaggedWords: Array.isArray(data.flaggedWords) ? data.flaggedWords.map(String) : [],
          reasonCategory: data.reasonCategory || 'Other',
          userNotes: String(data.userNotes || ''),
          sourceContext: data.sourceContext || 'Comment Analyzer',
          status: data.status || 'pending',
          adminNote: String(data.adminNote || ''),
          reviewedBy: String(data.reviewedBy || ''),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllReports(
  onData: (reports: ReportDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'reports';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReportDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          reporterId: String(data.reporterId || ''),
          reporterEmail: String(data.reporterEmail || ''),
          reporterName: String(data.reporterName || ''),
          commentText: String(data.commentText || ''),
          normalizedText: String(data.normalizedText || ''),
          languageProfile: data.languageProfile || 'English',
          predictedLabel: data.predictedLabel || 'Toxic',
          severityScore: Number(data.severityScore || 0),
          severityTier: data.severityTier || 'Mild',
          modelUsed: data.modelUsed || 'Ensemble',
          flaggedWords: Array.isArray(data.flaggedWords) ? data.flaggedWords.map(String) : [],
          reasonCategory: data.reasonCategory || 'Other',
          userNotes: String(data.userNotes || ''),
          sourceContext: data.sourceContext || 'Comment Analyzer',
          status: data.status || 'pending',
          adminNote: String(data.adminNote || ''),
          reviewedBy: String(data.reviewedBy || ''),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateReportModeration(params: {
  reportId: string;
  status: ReportStatus;
  adminNote: string;
  reviewerEmail: string;
}): Promise<void> {
  const { reportId, status, adminNote, reviewerEmail } = params;
  const path = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      adminNote: clampString(adminNote, 500),
      reviewedBy: clampString(reviewerEmail, 200),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAnalysisHistory(params: {
  user: User;
  analysis: AnalysisResult;
}): Promise<string> {
  const { user, analysis } = params;
  const path = `users/${user.uid}/analyses`;
  const commentText = clampString(analysis.rawText, 2000);
  if (!commentText) {
    throw new Error('Comment text cannot be empty.');
  }

  const payload = {
    userId: clampString(user.uid, 128),
    commentText,
    normalizedText: clampString(analysis.normalizedText, 2000),
    languageProfile: analysis.languageProfile,
    predictedLabel: analysis.predictedLabel,
    severityScore: Math.max(0, Math.min(100, Math.round(analysis.severityScore))),
    severityTier: analysis.severityTier,
    lrProbability: Number(analysis.lrProbability.toFixed(4)),
    svmScore: Number(analysis.svmProbability.toFixed(4)),
    flaggedWords: sanitizeFlaggedWords(analysis.flaggedWords),
    createdAt: serverTimestamp(),
  };

  try {
    const ref = await addDoc(collection(db, path), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeSavedAnalyses(
  userId: string,
  onData: (items: SavedAnalysisDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/analyses`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(25));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedAnalysisDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId || ''),
          commentText: String(data.commentText || ''),
          normalizedText: String(data.normalizedText || ''),
          languageProfile: data.languageProfile || 'English',
          predictedLabel: data.predictedLabel || 'Non-Toxic',
          severityScore: Number(data.severityScore || 0),
          severityTier: data.severityTier || 'Safe',
          lrProbability: Number(data.lrProbability || 0),
          svmScore: Number(data.svmScore || 0),
          flaggedWords: Array.isArray(data.flaggedWords) ? data.flaggedWords.map(String) : [],
          createdAt: toDate(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteSavedAnalysis(userId: string, analysisId: string): Promise<void> {
  const path = `users/${userId}/analyses/${analysisId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'analyses', analysisId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
