"use client";

import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { acceptResolutionAction } from "@/actions";
import { Button } from "@/components/ui/button";

interface AcceptResolutionButtonProps {
  grievanceId: string;
}

export function AcceptResolutionButton({
  grievanceId,
}: AcceptResolutionButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const executeAccept = async () => {
    setIsSubmitting(true);
    try {
      await acceptResolutionAction(grievanceId);
      toast.success("Resolution accepted successfully. Grievance closed.");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    toast("Confirm Acceptance", {
      description:
        "Are you sure you want to accept this resolution? The grievance will be permanently closed.",
      action: {
        label: "Confirm",
        onClick: () => executeAccept(),
      },
      cancel: {
        label: "Cancel",
        onClick: () => console.log("Cancelled acceptance"),
      },
    });
  };

  return (
    <Button
      onClick={handleAccept}
      disabled={isSubmitting}
      className="bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      {isSubmitting ? "Accepting..." : "Accept Resolution"}
    </Button>
  );
}
