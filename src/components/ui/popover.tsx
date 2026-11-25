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
  align?: "left" | "right" | "auto";
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
  const [horizontalPlacement, setHorizontalPlacement] = useState<
    "left" | "right"
  >(align === "left" ? "left" : "right");

  const updatePlacement = useCallback(() => {
    if (!containerRef.current) return;
    if (side === "top") {
      setPlacement("top");
    } else if (side === "bottom") {
      setPlacement("bottom");
    } else {
      // "auto" vertical detection:
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If space below is constrained (< 200px) and there's more room above, flip to top
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setPlacement("top");
      } else {
        setPlacement("bottom");
      }
    }

    // Horizontal alignment:
    if (align === "left") {
      setHorizontalPlacement("left");
    } else if (align === "right") {
      setHorizontalPlacement("right");
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      if (spaceRight < 300) {
        setHorizontalPlacement("right");
      } else {
        setHorizontalPlacement("left");
      }
    }
  }, [side, align]);

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
          className={`absolute ${horizontalPlacement === "right" ? "right-0" : "left-0"} ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          } z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 ${widthClass}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
