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
  MAX_REOPEN_REASON_LENGTH,
  MIN_REOPEN_REASON_LENGTH,
  validateReopenReason,
} from "@/lib/constants/reopen";

interface ReopenButtonProps {
  grievanceId: string;
  variant?: "rework" | "reopen";
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ReopenButton({
  grievanceId,
  variant = "reopen",
  label,
  className,
  disabled = false,
}: ReopenButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isRework = variant === "rework";
  const defaultLabel = isRework
    ? "Request Rework (Not Satisfied)"
    : "Reopen Grievance";
  const buttonText = label || defaultLabel;

  const trimmed = reason.trim();
  const charCount = trimmed.length;
  const validation = validateReopenReason(reason);
  const isTooShort = charCount > 0 && charCount < MIN_REOPEN_REASON_LENGTH;
  const isTooLong = charCount > MAX_REOPEN_REASON_LENGTH;
  const digitsAndPunctuationOnly = trimmed.replace(
    /[\s\-_.,/#!$%^&*;:{}=`~()?[\]]/g,
    "",
  );
  const isNumericOnly =
    charCount >= MIN_REOPEN_REASON_LENGTH &&
    (/^\d+$/.test(digitsAndPunctuationOnly) || !/[a-zA-Z]/.test(trimmed));
  const lacksWords =
    charCount >= MIN_REOPEN_REASON_LENGTH &&
    !isNumericOnly &&
    (trimmed.match(/[a-zA-Z]/g) || []).length < 4;

  const handleReopen = async () => {
    if (!validation.valid) {
      toast.error(
        validation.error ||
          (isRework
            ? "Please provide a valid rework reason."
            : "Please provide a valid reason for reopening."),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await reopenGrievanceAction({
        grievanceId,
        reason: trimmed,
      });

      toast.success(
        isRework
          ? "Rework requested successfully. Case placed in Department Head review queue."
          : "Reopening requested successfully. Case submitted for Department Head review.",
      );
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

  const defaultButtonClass = isRework
    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
    : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            disabled={disabled}
            className={className || defaultButtonClass}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <RefreshCcw
              className={`h-5 w-5 ${isRework ? "text-rose-600" : "text-amber-600"}`}
            />
            {isRework ? "Request Resolution Rework" : "Reopen Closed Grievance"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {isRework
              ? "Please explain what is missing or unsatisfactory in the proposed resolution. The grievance will be placed in the Department Head review queue for review and assignment."
              : "Please explain why this closed grievance needs to be reopened. Grievances can be reopened within 14 days of closure (maximum 3 combined rework and reopen attempts)."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-3">
          <Textarea
            id="reopen-reason"
            maxLength={MAX_REOPEN_REASON_LENGTH}
            placeholder={
              isRework
                ? `Describe specifically what is unsatisfactory or requires revision (minimum ${MIN_REOPEN_REASON_LENGTH} characters, combination of words required)...`
                : `Describe in detail why this closed grievance needs to be reopened (minimum ${MIN_REOPEN_REASON_LENGTH} characters, combination of words required)...`
            }
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
                      : isTooLong || isNumericOnly || lacksWords
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {charCount} / {MAX_REOPEN_REASON_LENGTH} characters (min{" "}
                {MIN_REOPEN_REASON_LENGTH})
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
                Minimum {MIN_REOPEN_REASON_LENGTH} and maximum{" "}
                {MAX_REOPEN_REASON_LENGTH} characters required. Numbers alone
                are not accepted; please provide a combination of words.
              </p>
            )}
            {isTooShort && (
              <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Please enter at least {MIN_REOPEN_REASON_LENGTH - charCount}{" "}
                more character(s).
              </p>
            )}
            {isTooLong && (
              <p className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Reason cannot exceed {MAX_REOPEN_REASON_LENGTH} characters.
              </p>
            )}
            {isNumericOnly && (
              <p className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Numbers alone are not accepted. Please use combinations of words
                and text.
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
            className={
              isRework
                ? "bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                : "bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            }
          >
            {isSubmitting
              ? isRework
                ? "Submitting Rework Request..."
                : "Reopening..."
              : isRework
                ? "Submit Rework Request"
                : "Submit Reopen Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
