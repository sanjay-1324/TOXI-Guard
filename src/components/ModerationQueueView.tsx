import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  LogIn,
  Search,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';
import { deleteReport, updateReportModeration } from '../services/reports';
import { ReportDoc, ReportStatus } from '../types';

interface ModerationQueueViewProps {
  user: User | null;
  isAdmin: boolean;
  reports: ReportDoc[];
  loading: boolean;
  error: string | null;
  onSignIn: () => Promise<void>;
}

const STATUS_TABS: Array<{ id: 'all' | ReportStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed_toxic', label: 'Confirmed Toxic' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'dismissed', label: 'Dismissed' },
];

function formatStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'confirmed_toxic':
      return 'Confirmed Toxic';
    case 'escalated':
      return 'Escalated';
    case 'dismissed':
      return 'Dismissed';
    default:
      return 'Pending Review';
  }
}

function statusTextColor(status: ReportStatus): string {
  switch (status) {
    case 'confirmed_toxic':
      return 'text-red-700';
    case 'escalated':
      return 'text-orange-700';
    case 'dismissed':
      return 'text-slate-500';
    default:
      return 'text-amber-700';
  }
}

export function ModerationQueueView({
  user,
  isAdmin,
  reports,
  loading,
  error,
  onSignIn,
}: ModerationQueueViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.commentText.toLowerCase().includes(q) ||
          r.reasonCategory.toLowerCase().includes(q) ||
          r.reporterEmail.toLowerCase().includes(q) ||
          r.flaggedWords.some((w) => w.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [reports, statusFilter, searchQuery]);

  const selectedReport = useMemo(() => {
    if (filteredReports.length === 0) return null;
    return (
      filteredReports.find((r) => r.id === selectedId) || filteredReports[0]
    );
  }, [filteredReports, selectedId]);

  function handleSelectReport(report: ReportDoc) {
    setSelectedId(report.id);
    setAdminNote(report.adminNote || '');
    setActionError(null);
  }

  async function handleModerationAction(status: ReportStatus) {
    if (!user || !selectedReport || !isAdmin) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateReportModeration({
        reportId: selectedReport.id,
        status,
        adminNote,
        reviewerEmail: user.email || user.uid,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to update report.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(reportId: string) {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteReport(reportId);
      if (selectedId === reportId) {
        setSelectedId(null);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete report.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <Shield className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Sign in to Access Moderation &amp; Reports
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Flagged toxic comments are persisted securely in Firestore. Sign in
          with Google to track your submitted reports or review incoming flags
          as an administrator.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {isAdmin ? 'Administrator Moderation Queue' : 'My Flagged Reports'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {isAdmin
              ? 'Review user-flagged English and Tanglish comments stored in Firestore, inspect highlighted toxic terms, and record moderation decisions.'
              : 'Track the moderation status of toxic comments you have flagged. Only verified administrators can adjudicate reports across all users.'}
          </p>
        </div>

        <div className="text-xs text-slate-600 font-mono tabular-nums shrink-0">
          {isAdmin ? 'Administrator Access' : 'Reporter View'} ·{' '}
          {reports.length} total · {pendingCount} pending
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter reports by status"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comment or reporter..."
            aria-label="Search reports"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-3">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-11 bg-slate-100 rounded animate-pulse"
            />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-900">
            No flagged comments in this view
          </p>
          <p className="text-xs text-slate-500">
            Use the Analyzer, Social Feed, or Batch Evaluator to flag a toxic
            comment into the moderation database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Reports Table */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="py-3 px-4 text-left font-medium">Comment</th>
                    <th className="py-3 px-3 text-left font-medium">
                      Category
                    </th>
                    <th className="py-3 px-3 text-right font-medium">
                      Severity
                    </th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => {
                    const isSelected = selectedReport?.id === report.id;
                    return (
                      <tr
                        key={report.id}
                        onClick={() => handleSelectReport(report)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 max-w-[260px]">
                          <div className="text-slate-900 font-medium line-clamp-1">
                            {report.commentText}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {report.languageProfile} · {report.sourceContext}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {report.reasonCategory}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                          {report.severityScore}/100
                        </td>
                        <td
                          className={`py-3 px-4 font-medium whitespace-nowrap ${statusTextColor(
                            report.status
                          )}`}
                        >
                          {formatStatusLabel(report.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Selected Report Inspection & Decision Panel */}
          {selectedReport && (
            <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div
                    className={`text-xs font-semibold ${statusTextColor(
                      selectedReport.status
                    )}`}
                  >
                    {formatStatusLabel(selectedReport.status)}
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {selectedReport.reasonCategory}
                  </h2>
                  <div className="text-xs text-slate-500">
                    Reported by {selectedReport.reporterName} ·{' '}
                    {selectedReport.createdAt
                      ? selectedReport.createdAt.toLocaleString()
                      : 'Just now'}
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-lg font-semibold text-slate-900">
                    {selectedReport.severityScore}/100
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedReport.severityTier}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Flagged Comment
                </div>
                <p className="text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-3.5 leading-relaxed break-words">
                  {selectedReport.commentText}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500">Normalized Form</div>
                  <div className="font-mono text-slate-800 mt-1 break-words">
                    {selectedReport.normalizedText || '—'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500">Offensive Tokens</div>
                  <div className="font-mono text-red-700 mt-1 break-words">
                    {selectedReport.flaggedWords.length > 0
                      ? selectedReport.flaggedWords.join(', ')
                      : 'None'}
                  </div>
                </div>
              </div>

              {selectedReport.userNotes && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Reporter Notes
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    {selectedReport.userNotes}
                  </p>
                </div>
              )}

              {actionError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {actionError}
                </p>
              )}

              {isAdmin ? (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-decision-note"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Administrator Review Note
                    </label>
                    <textarea
                      id="admin-decision-note"
                      rows={3}
                      maxLength={500}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Record moderation rationale or enforcement action..."
                      className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleModerationAction('confirmed_toxic')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Toxic
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleModerationAction('escalated')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-orange-700 hover:bg-orange-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Escalate
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleModerationAction('dismissed')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleDelete(selectedReport.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  {selectedReport.adminNote && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500">
                        Administrator Note ({selectedReport.reviewedBy})
                      </div>
                      <p className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        {selectedReport.adminNote}
                      </p>
                    </div>
                  )}

                  {selectedReport.status === 'pending' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleDelete(selectedReport.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Withdraw Pending Report
                    </button>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
