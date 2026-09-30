"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "warning" | "danger";
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Optional width override, defaults to w-36 (144px) */
  widthClass?: string;
}

export function ActionMenu({ items, widthClass = "w-36" }: ActionMenuProps) {
  if (!items || items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex p-1.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#F0FDFA] hover:text-[#0F766E] hover:border-teal-200 transition shadow-2xs cursor-pointer focus:outline-none"
        title="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`rounded-xl p-1 bg-white border border-slate-200 shadow-sm ${widthClass}`}
      >
        {items.map((item) => {
          let variantClass =
            "text-slate-700 focus:bg-slate-50 focus:text-slate-900";
          if (item.variant === "primary")
            variantClass = "text-[#0F766E] font-semibold focus:bg-slate-50 focus:text-[#0F766E]";
          if (item.variant === "warning")
            variantClass = "text-amber-700 focus:bg-slate-50 focus:text-amber-900";
          if (item.variant === "danger")
            variantClass = "text-rose-700 focus:bg-slate-50 focus:text-rose-900";

          const alignmentClass = item.icon
            ? "text-left"
            : "justify-center text-center";

          if (item.disabled) {
            variantClass = "text-slate-400 opacity-50 cursor-not-allowed";
          }

          return (
            <DropdownMenuItem
              key={item.label}
              disabled={item.disabled}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                item.onClick();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer ${variantClass} ${alignmentClass}`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
