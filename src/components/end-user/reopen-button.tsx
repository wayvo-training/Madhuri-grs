"use client";

import { AlertCircle, CheckCircle2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { reopenGrievanceAction } from "@/actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  MIN_REOPEN_REASON_LENGTH,
  validateReopenReason,
} from "@/lib/constants/reopen";

interface ReopenButtonProps {
  grievanceId: string;
}

export function ReopenButton({ grievanceId }: ReopenButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const trimmed = reason.trim();
  const charCount = trimmed.length;
  const validation = validateReopenReason(reason);
  const isTooShort = charCount > 0 && charCount < MIN_REOPEN_REASON_LENGTH;
  const isNumericOnly =
    charCount >= MIN_REOPEN_REASON_LENGTH && !/[a-zA-Z]/.test(trimmed);
  const lacksWords =
    charCount >= MIN_REOPEN_REASON_LENGTH &&
    /[a-zA-Z]/.test(trimmed) &&
    (trimmed.match(/[a-zA-Z]/g) || []).length < 4;

  const handleReopen = async () => {
    if (!validation.valid) {
      toast.error(
        validation.error || "Please provide a valid reason for reopening.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await reopenGrievanceAction({
        grievanceId,
        reason: trimmed,
      });

      toast.success("Grievance reopened successfully");
      setIsOpen(false);
      setReason("");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reopen Grievance
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <RefreshCcw className="h-5 w-5 text-amber-600" />
            Reopen Grievance
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Please explain why the provided resolution does not resolve your
            issue. A clear explanation helps the department re-investigate
            effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-3">
          <Textarea
            id="reopen-reason"
            placeholder="Describe in detail why the resolution was not satisfactory (minimum 15 characters, words required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[120px] resize-none text-sm text-slate-800 dark:text-slate-200"
          />

          {/* Validation Feedback & Character Counter */}
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between font-medium">
              <span
                className={
                  charCount === 0
                    ? "text-slate-500 dark:text-slate-400"
                    : isTooShort
                      ? "text-amber-600 dark:text-amber-400"
                      : isNumericOnly || lacksWords
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {charCount} / {MIN_REOPEN_REASON_LENGTH} characters minimum
              </span>
              {validation.valid && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid reason
                </span>
              )}
            </div>

            {/* Error Guidance */}
            {charCount === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Minimum {MIN_REOPEN_REASON_LENGTH} characters required. Numbers
                alone are not accepted.
              </p>
            )}
            {isTooShort && (
              <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Please enter at least {MIN_REOPEN_REASON_LENGTH - charCount}{" "}
                more character(s).
              </p>
            )}
            {isNumericOnly && (
              <p className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Numbers alone are not accepted. Please explain in words.
              </p>
            )}
            {lacksWords && (
              <p className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Please provide descriptive words explaining the issue.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReopen}
            disabled={isSubmitting || !validation.valid}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Reopening..." : "Submit Reopen Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
