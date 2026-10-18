"use client";

import { cn } from "cn";
import { Check, Copy } from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TruncatedTextProps {
  text?: string | null;
  fullText?: string | null;
  maxChars?: number;
  className?: string;
  tooltipClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "center" | "start" | "end";
  showCopy?: boolean;
  showArrow?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function TruncatedText({
  text,
  fullText,
  maxChars = 45,
  className,
  tooltipClassName,
  side = "top",
  align = "center",
  showCopy = false,
  showArrow = false,
  onClick,
}: TruncatedTextProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const elementId = useId();

  if (!text) {
    return <span className="text-slate-400 italic">--</span>;
  }

  const completeText = fullText || text;
  const isLong =
    text.length > maxChars ||
    Boolean(fullText && fullText.length > text.length);

  if (!isLong) {
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={cn("text-left truncate", className)}
        >
          {text}
        </button>
      );
    }
    return <span className={className}>{text}</span>;
  }

  const displayText =
    text.length > maxChars ? `${text.slice(0, maxChars).trim()}...` : text;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(completeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        id={`truncate-${elementId}`}
        tabIndex={0}
        closeOnClick={false}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
          onClick?.(e);
        }}
        className={cn(
          "inline-flex items-center gap-1 text-left max-w-full truncate focus-visible:outline-none cursor-pointer rounded-xs",
          className,
        )}
      >
        <span className="truncate block" title={completeText}>
          {displayText}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        align={align}
        showArrow={showArrow}
        className={cn(
          "max-w-xs sm:max-w-sm md:max-w-md p-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words bg-slate-900 text-slate-100 shadow-xl rounded-lg border border-slate-800 z-50",
          tooltipClassName,
        )}
      >
        <div className="space-y-1.5">
          <p className="text-slate-100 select-text font-medium">
            {completeText}
          </p>
          {showCopy && (
            <div className="pt-1 border-t border-slate-700/60 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white transition cursor-pointer px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Full Text</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
