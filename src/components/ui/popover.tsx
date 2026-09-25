"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  widthClass?: string;
  className?: string;
}

export function Popover({
  trigger,
  children,
  isOpen,
  onOpenChange,
  widthClass = "w-72",
  className = "relative flex items-center gap-2",
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div className={className} ref={containerRef}>
      {trigger}

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ${widthClass}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
