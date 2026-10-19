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
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { KnowledgeArticleCard } from "@/components/knowledge/KnowledgeArticleCard";
import {
  type KnowledgeArticleData,
  KnowledgeArticleViewerModal,
} from "@/components/knowledge/KnowledgeArticleViewerModal";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";

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

  const filterFields: SearchFieldDef[] = [
    { id: "search", label: "Search Knowledge", type: "text" },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    let newSearch = "";
    conditions.forEach((condition) => {
      const valArray = Array.isArray(condition.value)
        ? condition.value
        : [condition.value as string];
      if (condition.field === "search") {
        newSearch = valArray[0] || newSearch;
      }
    });
    setSearchQuery(newSearch);
  };

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
      toast.success("Knowledge Article Published", {
        description: `"${article.title}" has been published to the Knowledge Base.`,
      });
      fetchArticles();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to publish article";
      toast.error("Failed to publish article", { description: msg });
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
      toast.success("Article Rejected", {
        description: `Feedback sent for "${rejectingArticle.title}".`,
      });
      setRejectingArticle(null);
      setRejectionReason("");
      fetchArticles();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to reject article";
      toast.error("Failed to reject article", { description: msg });
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
          <div className="flex-1 min-w-0">
            <AdvancedTableSearch
              fields={filterFields}
              onSearch={handleSearchChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Articles Container with Internal Scrolling */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
        {/* Container Header / Article Counter */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>
            Showing{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {filtered.length}
            </strong>{" "}
            {filtered.length === 1 ? "article" : "articles"}
          </span>
          <span className="text-[11px] text-slate-400">
            Scroll within container to review articles
          </span>
        </div>

        {/* Scrollable Container */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading knowledge articles...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              No Knowledge Articles Found
            </h4>
            <p className="text-xs text-slate-400">
              {statusFilter === "PENDING_REVIEW"
                ? "There are no knowledge articles currently awaiting your review."
                : "No articles match the selected filters."}
            </p>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-hidden custom-scrollbar p-4 space-y-3">
            {filtered.map((art) => (
              <KnowledgeArticleCard
                key={art.id}
                article={art}
                onInspect={(article) => setViewingArticle(article)}
                onReject={(article) => setRejectingArticle(article)}
                onApprove={(article) => handlePublish(article)}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>

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
        isApprover={Boolean(viewingArticle?.canApprove)}
        onApprove={async (art) => {
          setViewingArticle(null);
          await handlePublish(art);
        }}
        onReject={(art) => {
          setViewingArticle(null);
          setRejectingArticle(art);
        }}
      />
    </div>
  );
}
