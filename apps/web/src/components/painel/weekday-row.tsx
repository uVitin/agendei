"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export interface DraftBlock {
  /** Identificador só do front, para o React saber quem é quem na lista. */
  id: string;
  startTime: string;
  endTime: string;
}

interface WeekdayRowProps {
  label: string;
  blocks: DraftBlock[];
  error?: string;
  onToggle: (enabled: boolean) => void;
  onChangeBlock: (
    id: string,
    field: "startTime" | "endTime",
    value: string,
  ) => void;
  onAddBlock: () => void;
  onRemoveBlock: (id: string) => void;
}

export function WeekdayRow({
  label,
  blocks,
  error,
  onToggle,
  onChangeBlock,
  onAddBlock,
  onRemoveBlock,
}: WeekdayRowProps) {
  const enabled = blocks.length > 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch
            id={`toggle-${label}`}
            checked={enabled}
            onCheckedChange={onToggle}
          />
          <label
            htmlFor={`toggle-${label}`}
            className="cursor-pointer font-medium text-neutral-900 dark:text-neutral-50"
          >
            {label}
          </label>
        </div>

        {!enabled && (
          <span className="text-sm text-neutral-400">Não atende</span>
        )}
      </div>

      {enabled && (
        <div className="mt-4 space-y-2">
          {blocks.map((block) => (
            <div key={block.id} className="flex items-center gap-2">
              <Input
                type="time"
                value={block.startTime}
                onChange={(event) =>
                  onChangeBlock(block.id, "startTime", event.target.value)
                }
                className="w-32"
                aria-label={`${label} — início`}
              />
              <span className="text-neutral-400">até</span>
              <Input
                type="time"
                value={block.endTime}
                onChange={(event) =>
                  onChangeBlock(block.id, "endTime", event.target.value)
                }
                className="w-32"
                aria-label={`${label} — fim`}
              />

              {blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveBlock(block.id)}
                  aria-label={`Remover turno de ${label}`}
                  className="ml-1 rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={onAddBlock}
            className="inline-flex items-center gap-1 pt-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-50"
          >
            <Plus className="size-4" />
            Adicionar turno
          </button>

          {error && (
            <p className="pt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
