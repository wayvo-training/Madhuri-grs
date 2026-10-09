"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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

interface ReopenButtonProps {
  grievanceId: string;
}

export function ReopenButton({ grievanceId }: ReopenButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleReopen = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for reopening");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/end-user/grievances/${grievanceId}/reopen`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reopen grievance");
      }

      toast.success("Grievance reopened successfully");
      setIsOpen(false);
      setReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reopen Grievance
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reopen Grievance</DialogTitle>
          <DialogDescription>
            Are you sure you want to reopen this grievance? Please explain why
            you are not satisfied with the resolution.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="reason"
            placeholder="Reason for reopening..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="col-span-3 min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReopen}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? "Reopening..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
