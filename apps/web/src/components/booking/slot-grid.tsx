"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { Slot } from "@/lib/types";

interface SlotGridProps {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (slot: Slot) => void;
}

export function SlotGrid({
  slots,
  loading,
  error,
  selected,
  onSelect,
}: SlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
        <p className="font-medium text-neutral-900 dark:text-neutral-50">
          Nenhum horário livre neste dia
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Experimente outra data acima.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = slot.startsAt === selected;

        return (
          <button
            key={slot.startsAt}
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={isSelected}
            className={`h-11 rounded-lg border text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-50 ${
              isSelected
                ? "border-neutral-900 bg-neutral-900 text-neutral-50 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-50"
            }`}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
