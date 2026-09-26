import { cn } from "cn";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface AdminToolbarActionProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
}

export function AdminToolbarAction({
  children,
  onClick,
  variant = "default",
}: AdminToolbarActionProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={
        variant === "default"
          ? "default"
          : variant === "outline"
            ? "outline"
            : "ghost"
      }
      size="sm"
      className={cn(
        "rounded-xl",
        variant === "default" && "bg-[#064E3B] text-white hover:bg-emerald-900",
      )}
    >
      {children}
    </Button>
  );
}
