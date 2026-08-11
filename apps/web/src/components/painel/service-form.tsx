"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Service } from "@/lib/types";

export interface ServiceFormValues {
  name: string;
  durationMinutes: number;
  priceCents: number;
}

interface ServiceFormProps {
  /** Preenchido quando é edição; nulo quando é criação. */
  initial?: Service | null;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  onSubmit: (values: ServiceFormValues) => void;
  onCancel: () => void;
}

export function ServiceForm({
  initial = null,
  submitting,
  fieldErrors,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [duration, setDuration] = useState(
    initial ? String(initial.durationMinutes) : "30",
  );
  const [price, setPrice] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : "",
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errors = { ...localErrors, ...fieldErrors };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const durationNumber = Number(duration);
    const priceNumber = Number(price.replace(",", "."));

    if (name.trim().length < 2) {
      nextErrors.name = "Informe o nome do serviço";
    }

    if (
      !Number.isInteger(durationNumber) ||
      durationNumber < 5 ||
      durationNumber > 480
    ) {
      nextErrors.durationMinutes = "Duração entre 5 e 480 minutos";
    }

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      nextErrors.priceCents = "Informe um valor válido";
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      durationMinutes: durationNumber,
      // Reais viram centavos aqui — o arredondamento evita
      // que 50.1 * 100 vire 5009.999999999999.
      priceCents: Math.round(priceNumber * 100),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service-name">Nome do serviço</Label>
          <Input
            id="service-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Corte de Cabelo"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service-duration">Duração (minutos)</Label>
            <Input
              id="service-duration"
              type="number"
              inputMode="numeric"
              min={5}
              max={480}
              step={5}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              aria-invalid={Boolean(errors.durationMinutes)}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.durationMinutes}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-price">Preço (R$)</Label>
            <Input
              id="service-price"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="50,00"
              aria-invalid={Boolean(errors.priceCents)}
            />
            {errors.priceCents && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.priceCents}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={submitting} className="h-10">
          {submitting ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
          className="h-10"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
