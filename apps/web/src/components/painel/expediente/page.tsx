"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { WeekdayRow, type DraftBlock } from "@/components/painel/weekday-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import type { WorkingHour } from "@/lib/types";

const WEEKDAYS = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

type Week = Record<number, DraftBlock[]>;

function newBlock(startTime = "09:00", endTime = "18:00"): DraftBlock {
  return { id: crypto.randomUUID(), startTime, endTime };
}

/** Valida cada dia isoladamente: fim depois do início e sem sobreposição. */
function validateWeek(week: Week): Record<number, string> {
  const errors: Record<number, string> = {};

  for (const [weekday, blocks] of Object.entries(week)) {
    if (blocks.length === 0) continue;

    if (blocks.some((block) => block.endTime <= block.startTime)) {
      errors[Number(weekday)] = "O fim precisa ser depois do início";
      continue;
    }

    const sorted = [...blocks].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    for (let index = 1; index < sorted.length; index += 1) {
      // Mesma fórmula de sobreposição usada na API e no banco.
      if (sorted[index]!.startTime < sorted[index - 1]!.endTime) {
        errors[Number(weekday)] = "Os turnos deste dia se sobrepõem";
        break;
      }
    }
  }

  return errors;
}

export default function ExpedientePage() {
  const { token } = useAuth();

  const [week, setWeek] = useState<Week>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadWeek = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiFetch<WorkingHour[]>("/working-hours", { token });

      const grouped: Week = {};
      for (const item of data) {
        grouped[item.weekday] ??= [];
        grouped[item.weekday]!.push(newBlock(item.startTime, item.endTime));
      }

      setWeek(grouped);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar o expediente.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  function toggleDay(weekday: number, enabled: boolean) {
    setWeek((current) => ({
      ...current,
      [weekday]: enabled ? [newBlock()] : [],
    }));
    setErrors((current) => ({ ...current, [weekday]: "" }));
  }

  function changeBlock(
    weekday: number,
    id: string,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setWeek((current) => ({
      ...current,
      [weekday]: (current[weekday] ?? []).map((block) =>
        block.id === id ? { ...block, [field]: value } : block,
      ),
    }));
  }

  function addBlock(weekday: number) {
    setWeek((current) => ({
      ...current,
      [weekday]: [...(current[weekday] ?? []), newBlock("14:00", "18:00")],
    }));
  }

  function removeBlock(weekday: number, id: string) {
    setWeek((current) => ({
      ...current,
      [weekday]: (current[weekday] ?? []).filter((block) => block.id !== id),
    }));
  }

  function applyBusinessWeek() {
    const next: Week = {};
    for (const day of [1, 2, 3, 4, 5]) {
      next[day] = [newBlock("09:00", "18:00")];
    }
    setWeek(next);
    setErrors({});
    toast.info("Semana comercial preenchida. Não esqueça de salvar.");
  }

  async function handleSave() {
    const nextErrors = validateWeek(week);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Corrija os horários destacados.");
      return;
    }

    setErrors({});
    setSaving(true);

    const blocks = Object.entries(week).flatMap(([weekday, list]) =>
      list.map((block) => ({
        weekday: Number(weekday),
        startTime: block.startTime,
        endTime: block.endTime,
      })),
    );

    try {
      await apiFetch<WorkingHour[]>("/working-hours", {
        method: "PUT",
        token,
        body: JSON.stringify({ blocks }),
      });

      toast.success("Expediente salvo.");
      await loadWeek();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar o expediente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link
        href="/painel"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50"
      >
        <ArrowLeft className="size-4" />
        Painel
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Expediente
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Só aparecem horários para o cliente dentro destes intervalos.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={applyBusinessWeek}
          disabled={loading || saving}
          className="h-10 shrink-0"
        >
          Semana comercial
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </>
        ) : (
          WEEKDAYS.map((day) => (
            <WeekdayRow
              key={day.value}
              label={day.label}
              blocks={week[day.value] ?? []}
              error={errors[day.value] || undefined}
              onToggle={(enabled) => toggleDay(day.value, enabled)}
              onChangeBlock={(id, field, value) =>
                changeBlock(day.value, id, field, value)
              }
              onAddBlock={() => addBlock(day.value)}
              onRemoveBlock={(id) => removeBlock(day.value, id)}
            />
          ))
        )}
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-neutral-200 bg-neutral-50/90 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <Button
          onClick={() => void handleSave()}
          disabled={loading || saving}
          className="h-11 w-full sm:w-auto"
        >
          {saving ? "Salvando..." : "Salvar expediente"}
        </Button>
      </div>
    </>
  );
}
