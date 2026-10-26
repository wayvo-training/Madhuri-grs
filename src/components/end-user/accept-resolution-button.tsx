"use client";

import { CheckCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
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

export function AcceptResolutionButton({
  grievanceId,
}: AcceptResolutionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleConfirmAccept = async () => {
    setIsSubmitting(true);
    try {
      await acceptResolutionAction(grievanceId);
      toast.success("Resolution accepted successfully. Grievance closed.");
      setIsOpen(false);
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
          <Button
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Resolution
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
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

        <div className="py-2 space-y-3">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Final Resolution Confirmation</span>
            </div>
            <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              By confirming, you agree that your grievance has been addressed
              satisfactorily. If you require further assistance regarding
              another matter in the future, you can submit a new grievance.
            </p>
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
            onClick={handleConfirmAccept}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Closing Case...
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
