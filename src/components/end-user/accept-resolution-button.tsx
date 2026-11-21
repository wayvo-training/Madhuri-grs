"use client";

import {
  CheckCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { acceptResolutionAction } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AcceptResolutionButtonProps {
  grievanceId: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "1 - Very Unsatisfied",
  2: "2 - Unsatisfied",
  3: "3 - Neutral",
  4: "4 - Satisfied",
  5: "5 - Very Satisfied",
};

export function AcceptResolutionButton({
  grievanceId,
}: AcceptResolutionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comments, setComments] = useState<string>("");
  const router = useRouter();

  const handleConfirmAccept = async (skipFeedback = false) => {
    setIsSubmitting(true);
    try {
      const feedbackPayload =
        !skipFeedback && rating !== null
          ? {
              rating,
              comments: comments.trim() || undefined,
            }
          : undefined;

      await acceptResolutionAction(grievanceId, feedbackPayload);
      toast.success(
        feedbackPayload
          ? "Resolution accepted and feedback submitted successfully. Grievance closed."
          : "Resolution accepted successfully. Grievance closed.",
      );
      setIsOpen(false);
      setRating(null);
      setComments("");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoveredRating ?? rating;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Resolution
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Accept Resolution &amp; Conclude Case
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Are you satisfied with the provided resolution? Once accepted, your
            grievance will be officially marked as resolved and permanently
            closed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Final Resolution Confirmation</span>
            </div>
            <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              By confirming, you agree that your grievance has been addressed
              satisfactorily. You may also provide optional feedback below to
              help us evaluate resolution quality.
            </p>
          </div>

          {/* Optional Feedback Section */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback-rating"
                className="text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Resolution Rating (Optional)
              </label>
              {activeRating ? (
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {RATING_LABELS[activeRating]}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Select 1–5 stars
                </span>
              )}
            </div>

            <div id="feedback-rating" className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = (activeRating ?? 0) >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    aria-label={`Rate ${starValue} of 5 stars`}
                    onClick={() => {
                      setRating(rating === starValue ? null : starValue);
                    }}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className="p-1 rounded-md transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        isFilled
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300 dark:text-slate-600 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
              {rating !== null && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="ml-2 text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="feedback-comments"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Comments (Optional)
                </label>
                <span
                  className={`text-[10px] ${
                    comments.length > 1000
                      ? "text-rose-600 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {comments.length} / 1000
                </span>
              </div>
              <textarea
                id="feedback-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Share any comments regarding your resolution experience (optional)..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          {rating !== null && (
            <Button
              variant="ghost"
              onClick={() => handleConfirmAccept(true)}
              disabled={isSubmitting}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs w-full sm:w-auto"
            >
              Skip Feedback &amp; Close
            </Button>
          )}

          <Button
            onClick={() => handleConfirmAccept(false)}
            disabled={isSubmitting || comments.length > 1000}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Closing Case...
              </>
            ) : rating !== null ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Feedback &amp; Close
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm &amp; Close Case
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
