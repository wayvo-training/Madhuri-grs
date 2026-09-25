"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "warning" | "danger";
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Optional width override, defaults to w-32 (128px) */
  widthClass?: string;
}

export function ActionMenu({ items, widthClass = "w-32" }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative inline-block text-right" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex p-1.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-1 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 ${widthClass}`}
        >
          <div className="p-1">
            {items.map((item) => {
              const baseClass =
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition";

              let variantClass =
                "text-slate-700 hover:bg-slate-50 hover:text-emerald-700";
              if (item.variant === "warning")
                variantClass = "text-amber-700 hover:bg-amber-50";
              if (item.variant === "danger")
                variantClass = "text-red-700 hover:bg-red-50";

              // If no icon is provided, center the text for a cleaner look
              const alignmentClass = item.icon
                ? "text-left"
                : "justify-center text-center";

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`${baseClass} ${variantClass} ${alignmentClass}`}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
