"use client";

import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

interface ServiceListProps {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
}

export function ServiceList({
  services,
  selectedId,
  onSelect,
}: ServiceListProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">
          Este profissional ainda não cadastrou serviços.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {services.map((service) => {
        const isSelected = service.id === selectedId;

        return (
          <li key={service.id}>
            <button
              type="button"
              onClick={() => onSelect(service)}
              aria-pressed={isSelected}
              className={`flex w-full items-center justify-between gap-4 rounded-xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-50 ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-neutral-50 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                  : "border-neutral-200 bg-white hover:border-neutral-900 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{service.name}</p>
                <p
                  className={`mt-1 text-sm ${
                    isSelected
                      ? "text-neutral-300 dark:text-neutral-600"
                      : "text-neutral-500"
                  }`}
                >
                  {formatDuration(service.durationMinutes)}
                </p>
              </div>
              <span className="shrink-0 text-base font-semibold tabular-nums">
                {formatPrice(service.priceCents)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
