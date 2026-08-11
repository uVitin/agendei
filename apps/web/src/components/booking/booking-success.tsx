"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice } from "@/lib/format";
import type { AppointmentConfirmation } from "@/lib/types";

interface BookingSuccessProps {
  confirmation: AppointmentConfirmation;
  onRestart: () => void;
}

export function BookingSuccess({
  confirmation,
  onRestart,
}: BookingSuccessProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
        <Check className="size-7 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        Agendamento confirmado
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        Guarde os dados abaixo. Em caso de imprevisto, entre em contato com{" "}
        {confirmation.professional.name}.
      </p>

      <dl className="mt-8 space-y-3 border-t border-neutral-200 pt-6 text-left dark:border-neutral-800">
        <div className="flex justify-between gap-4">
          <dt className="text-sm text-neutral-500">Quando</dt>
          <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            {confirmation.label}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sm text-neutral-500">Serviço</dt>
          <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            {confirmation.service.name} ·{" "}
            {formatDuration(confirmation.service.durationMinutes)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sm text-neutral-500">Valor</dt>
          <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            {formatPrice(confirmation.service.priceCents)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sm text-neutral-500">Em nome de</dt>
          <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            {confirmation.client.name}
          </dd>
        </div>
      </dl>

      <Button
        variant="outline"
        onClick={onRestart}
        className="mt-8 h-11 w-full"
      >
        Fazer outro agendamento
      </Button>
    </div>
  );
}
