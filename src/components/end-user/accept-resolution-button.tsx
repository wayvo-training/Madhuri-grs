"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AcceptResolutionButtonProps {
  grievanceId: string;
}

export function AcceptResolutionButton({ grievanceId }: AcceptResolutionButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const executeAccept = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/end-user/grievances/${grievanceId}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to accept resolution");
      }
      
      toast.success("Resolution accepted successfully. Grievance closed.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    toast("Confirm Acceptance", {
      description: "Are you sure you want to accept this resolution? The grievance will be permanently closed.",
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
