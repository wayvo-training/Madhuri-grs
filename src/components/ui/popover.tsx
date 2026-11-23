"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
  className?: string;
  align?: "left" | "right";
  side?: "top" | "bottom" | "auto";
}

export function Popover({
  trigger,
  children,
  isOpen,
  onOpenChange,
  widthClass = "w-72",
  className = "relative flex items-center gap-2",
  align = "right",
  side = "auto",
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">(
    side === "top" ? "top" : "bottom",
  );

  const updatePlacement = useCallback(() => {
    if (!containerRef.current) return;
    if (side === "top") {
      setPlacement("top");
      return;
    }
    if (side === "bottom") {
      setPlacement("bottom");
      return;
    }
    // "auto" detection:
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    // If space below is constrained (< 320px) and there's more room above, flip to top
    if (spaceBelow < 320 && spaceAbove > spaceBelow) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }
  }, [side]);

  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      updatePlacement();
    }
  }, [isOpen, updatePlacement]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updatePlacement);
      window.addEventListener("scroll", updatePlacement, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [isOpen, onOpenChange, updatePlacement]);

  return (
    <div className={className} ref={containerRef}>
      {trigger}

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          } z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 ${widthClass}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
