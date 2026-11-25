"use client";

import { cn } from "cn";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ChevronDownIcon } from "lucide-react";
import * as React from "react";
import {
  type DayButton,
  DayPicker,
  getDefaultClassNames,
  type Locale,
} from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  onCaptionClick,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  onCaptionClick?: () => void;
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-1 [--cell-radius:0.125rem] [--cell-size:1.85rem] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatCaption: (date) => `${format(date, "MMMM, yyyy")} ▾`,
        formatWeekdayName: (date) => format(date, "EEEEEE"),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("relative flex flex-col gap-2", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-2", defaultClassNames.month),
        nav: cn(
          "absolute right-0 top-0 flex items-center gap-0.5 z-10",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-6 w-6 p-0 select-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-6 w-6 p-0 select-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-between pr-14 pl-1",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "font-bold text-sm text-slate-900 dark:text-slate-100 select-none cursor-pointer flex items-center gap-1",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn(
          "flex w-full justify-between mb-1",
          defaultClassNames.weekdays,
        ),
        weekday: cn(
          "flex-1 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full justify-between my-0.5", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none",
          defaultClassNames.day,
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end,
        ),
        today: cn(
          "rounded-(--cell-radius) font-medium text-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-slate-400 dark:text-slate-500 aria-selected:text-white font-normal",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        CaptionLabel: ({ children, className: capClassName, ...capProps }) => {
          return (
            <button
              type="button"
              onClick={onCaptionClick}
              className={cn(
                "font-bold text-sm text-slate-900 dark:text-slate-100 select-none cursor-pointer flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
                capClassName,
              )}
              {...capProps}
            >
              {children}
            </button>
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left" || orientation === "up") {
            return (
              <ArrowUp
                className={cn(
                  "size-3.5 text-slate-700 dark:text-slate-300 cursor-pointer",
                  className,
                )}
                {...props}
              />
            );
          }

          if (orientation === "right" || orientation === "down") {
            return (
              <ArrowDown
                className={cn(
                  "size-3.5 text-slate-700 dark:text-slate-300 cursor-pointer",
                  className,
                )}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon
              className={cn(
                "size-3.5 text-slate-700 dark:text-slate-300 cursor-pointer",
                className,
              )}
              {...props}
            />
          );
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-7 min-w-0 flex-col items-center justify-center border-0 leading-none text-xs font-normal text-slate-800 dark:text-slate-200 cursor-pointer rounded-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
        "data-[selected-single=true]:bg-blue-600 data-[selected-single=true]:text-white data-[selected-single=true]:font-bold data-[selected-single=true]:border-2 data-[selected-single=true]:border-slate-900 dark:data-[selected-single=true]:border-white data-[selected-single=true]:rounded-xs data-[selected-single=true]:hover:bg-blue-600",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
