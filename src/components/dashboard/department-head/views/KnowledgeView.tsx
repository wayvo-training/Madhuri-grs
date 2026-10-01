"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileX,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type KnowledgeArticleData,
  KnowledgeArticleViewerModal,
} from "@/components/knowledge/KnowledgeArticleViewerModal";

export function KnowledgeView() {
  const [articles, setArticles] = useState<KnowledgeArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_REVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Viewer Modal
  const [viewingArticle, setViewingArticle] =
    useState<KnowledgeArticleData | null>(null);

  // Rejection Modal
  const [rejectingArticle, setRejectingArticle] =
    useState<KnowledgeArticleData | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/department-head/knowledge?status=${statusFilter === "ALL" ? "" : statusFilter}`,
      );
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge articles:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handlePublish = async (article: KnowledgeArticleData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/department-head/knowledge/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PUBLISH" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to publish article");
      }
      setActionSuccessMsg(
        `Knowledge article "${article.title}" published successfully!`,
      );
      fetchArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to publish article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingArticle || !rejectionReason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/department-head/knowledge/${rejectingArticle.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REJECT",
            rejectionReason: rejectionReason.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reject article");
      }
      setActionSuccessMsg(
        `Article "${rejectingArticle.title}" rejected with feedback.`,
      );
      setRejectingArticle(null);
      setRejectionReason("");
      fetchArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = articles.filter((art) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchCat = (art.category || "").toLowerCase().includes(q);
      const matchSub = (art.subcategory || "").toLowerCase().includes(q);
      const matchAuthor = (art.createdBy || "").toLowerCase().includes(q);
      return matchTitle || matchCat || matchSub || matchAuthor;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-[#0F766E]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Knowledge Article Governance
              </h3>
              <p className="text-xs text-slate-500">
                Review, approve, or request rework on reusable resolution
                knowledge proposed by Staff.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchArticles()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {[
              { id: "PENDING_REVIEW", label: "Pending Review" },
              { id: "PUBLISHED", label: "Published" },
              { id: "REJECTED", label: "Rejected" },
              { id: "ALL", label: "All Articles" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-teal-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge articles..."
              className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E]"
            />
          </div>
        </div>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Loading knowledge articles...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-2">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700">
            No Knowledge Articles Found
          </h4>
          <p className="text-xs text-slate-400">
            {statusFilter === "PENDING_REVIEW"
              ? "There are no knowledge articles currently awaiting your review."
              : "No articles match the selected filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((art) => (
            <div
              key={art.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {art.title}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        art.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          : art.status === "PENDING_REVIEW"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : art.status === "REJECTED"
                              ? "bg-rose-100 text-rose-900 border border-rose-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {art.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Category: <strong>{art.category}</strong> &bull;
                    Subcategory: <strong>{art.subcategory}</strong> &bull;
                    Author: <strong>{art.createdBy}</strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingArticle(art)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect</span>
                  </button>

                  {art.status === "PENDING_REVIEW" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectingArticle(art)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                      >
                        <FileX className="h-3.5 w-3.5 text-rose-600" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePublish(art)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs font-semibold shadow-xs hover:bg-[#115E59] transition cursor-pointer disabled:opacity-50"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        <span>Publish Article</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Problem Snippet */}
              <div className="text-xs text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900">
                  Problem Pattern:
                </span>
                <p className="line-clamp-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {art.problem}
                </p>
              </div>

              {art.status === "REJECTED" && art.rejectionReason && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">
                  <strong>Rejection Feedback:</strong> {art.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileX className="h-4 w-4 text-rose-600" />
                Reject Knowledge Article
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRejectingArticle(null);
                  setRejectionReason("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                Provide constructive rework feedback for Staff regarding
                article: <strong>{rejectingArticle.title}</strong>
              </p>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what revisions or privacy exclusions are required before this article can be published..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRejectingArticle(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      <KnowledgeArticleViewerModal
        isOpen={Boolean(viewingArticle)}
        onClose={() => setViewingArticle(null)}
        article={viewingArticle}
      />
    </div>
  );
}
