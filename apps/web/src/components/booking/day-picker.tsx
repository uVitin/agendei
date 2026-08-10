"use client";

import type { DayOption } from "@/lib/dates";

interface DayPickerProps {
  days: DayOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function DayPicker({ days, selected, onSelect }: DayPickerProps) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2">
        {days.map((day) => {
          const isSelected = day.value === selected;

          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onSelect(day.value)}
              aria-pressed={isSelected}
              className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-50 ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-neutral-50 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-600"
              }`}
            >
              <span className="text-[11px] uppercase tracking-wide opacity-60">
                {day.isToday ? "Hoje" : day.weekday}
              </span>
              <span className="text-lg font-semibold leading-none tabular-nums">
                {day.day}
              </span>
              <span className="text-[11px] opacity-60">{day.month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
