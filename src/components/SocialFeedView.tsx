import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Flag, MessageSquarePlus, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { INITIAL_SOCIAL_POSTS } from '../nlp/corpus';
import { analyzeComment } from '../nlp/engine';
import { AnalysisResult, SocialFeedPost } from '../types';
import { HighlightedText } from './HighlightedText';

interface SocialFeedViewProps {
  onOpenReportModal: (analysis: AnalysisResult, source: 'Social Feed') => void;
  onInspectInAnalyzer: (text: string) => void;
}

type FeedFilter = 'all' | 'toxic' | 'clean' | 'tanglish';

export function SocialFeedView({
  onOpenReportModal,
  onInspectInAnalyzer,
}: SocialFeedViewProps) {
  const [posts, setPosts] = useState<SocialFeedPost[]>(INITIAL_SOCIAL_POSTS);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maskSevere, setMaskSevere] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const [newAuthor, setNewAuthor] = useState('@student_user');
  const [newTopic, setNewTopic] = useState('Campus Tech Forum');
  const [newComment, setNewComment] = useState('');

  const analyzedPosts = useMemo(() => {
    return posts.map((post) => ({
      post,
      analysis: analyzeComment(post.text, 'Ensemble'),
    }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return analyzedPosts.filter(({ post, analysis }) => {
      if (filter === 'toxic' && analysis.predictedLabel !== 'Toxic') {
        return false;
      }
      if (filter === 'clean' && analysis.predictedLabel !== 'Non-Toxic') {
        return false;
      }
      if (
        filter === 'tanglish' &&
        analysis.languageProfile !== 'Tanglish' &&
        analysis.languageProfile !== 'Code-Mixed'
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          post.text.toLowerCase().includes(q) ||
          post.authorHandle.toLowerCase().includes(q) ||
          post.topic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analyzedPosts, filter, searchQuery]);

  const toxicCount = analyzedPosts.filter(
    (item) => item.analysis.predictedLabel === 'Toxic'
  ).length;

  function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    const entry: SocialFeedPost = {
      id: `post-${Date.now()}`,
      authorHandle: newAuthor.trim() || '@community_member',
      authorName: newAuthor.replace(/^@/, '').trim() || 'Community Member',
      timestampLabel: 'Just now',
      topic: newTopic,
      text: trimmed,
      likes: 0,
    };
    setPosts((prev) => [entry, ...prev]);
    setNewComment('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Live Comment Stream &amp; Reporting
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Simulated social comment thread scanned automatically by ToxiGuard.
            Post English or Tanglish comments, preview severity filtering, and
            flag toxic posts into the moderation database.
          </p>
        </div>

        <div className="text-xs text-slate-600 font-mono tabular-nums shrink-0">
          {posts.length} comments · {toxicCount} auto-flagged toxic
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer Column */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Post Test Comment to Thread
            </h2>
          </div>

          <form onSubmit={handlePostComment} className="space-y-3.5">
            <div className="space-y-1">
              <label
                htmlFor="feed-handle"
                className="block text-xs font-medium text-slate-700"
              >
                Handle
              </label>
              <input
                id="feed-handle"
                type="text"
                maxLength={40}
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="feed-topic"
                className="block text-xs font-medium text-slate-700"
              >
                Thread Topic
              </label>
              <select
                id="feed-topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Campus Tech Forum">Campus Tech Forum</option>
                <option value="Chennai Cinema Thread">Chennai Cinema Thread</option>
                <option value="Open Source Discussions">
                  Open Source Discussions
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="feed-comment"
                className="block text-xs font-medium text-slate-700"
              >
                Comment Body
              </label>
              <textarea
                id="feed-comment"
                rows={4}
                maxLength={1000}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write an English or Tanglish comment to test live thread moderation..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!newComment.trim()}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              Publish to Stream
            </button>
          </form>
        </section>

        {/* Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter stream"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start"
            >
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'toxic', label: 'Toxic' },
                  { id: 'clean', label: 'Non-Toxic' },
                  { id: 'tanglish', label: 'Tanglish' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search thread..."
                  aria-label="Search comments"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setMaskSevere((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  maskSevere
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {maskSevere ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {maskSevere ? 'Severe Masked' : 'Mask Severe'}
              </button>
            </div>
          </div>

          {/* Comment List */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              No comments match the active filter.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {filteredPosts.map(({ post, analysis }) => {
                const isToxic = analysis.predictedLabel === 'Toxic';
                const shouldHide =
                  maskSevere &&
                  analysis.severityScore >= 60 &&
                  !revealedIds[post.id];

                return (
                  <article key={post.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">
                          {post.authorName}
                        </span>
                        <span className="font-mono">{post.authorHandle}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.timestampLabel}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {isToxic ? (
                          <span className="inline-flex items-center gap-1 font-medium text-red-700">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {analysis.severityTier} ({analysis.severityScore}/100)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Safe ({analysis.severityScore}/100)
                          </span>
                        )}
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-600">
                          {analysis.languageProfile}
                        </span>
                      </div>
                    </div>

                    {shouldHide ? (
                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                        <span>
                          Hidden due to high detected toxicity (
                          {analysis.severityScore}/100).
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedIds((prev) => ({
                              ...prev,
                              [post.id]: true,
                            }))
                          }
                          className="font-medium text-slate-900 underline cursor-pointer shrink-0"
                        >
                          Reveal Comment
                        </button>
                      </div>
                    ) : (
                      <HighlightedText
                        text={post.text}
                        highlights={analysis.highlightedTokens}
                      />
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => onInspectInAnalyzer(post.text)}
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
                      >
                        Inspect Pipeline →
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenReportModal(analysis, 'Social Feed')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Flag Comment
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
