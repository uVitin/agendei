"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BookingFormValues {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

interface BookingFormProps {
  submitting: boolean;
  /** Erros vindos da API, por campo (issues do 422). */
  fieldErrors: Record<string, string>;
  onSubmit: (values: BookingFormValues) => void;
  onBack: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookingForm({
  submitting,
  fieldErrors,
  onSubmit,
  onBack,
}: BookingFormProps) {
  const [values, setValues] = useState<BookingFormValues>({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Erro da API tem prioridade: ele é a verdade final.
  const errors = { ...localErrors, ...fieldErrors };

  function update(field: keyof BookingFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setLocalErrors((current) => {
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (values.clientName.trim().length < 2) {
      nextErrors.clientName = "Informe seu nome";
    }

    if (!values.clientPhone.trim() && !values.clientEmail.trim()) {
      nextErrors.clientPhone = "Informe telefone ou e-mail para contato";
    }

    if (values.clientPhone.trim() && values.clientPhone.trim().length < 8) {
      nextErrors.clientPhone = "Telefone incompleto";
    }

    if (
      values.clientEmail.trim() &&
      !EMAIL_PATTERN.test(values.clientEmail.trim())
    ) {
      nextErrors.clientEmail = "E-mail inválido";
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors);
      return;
    }

    onSubmit({
      clientName: values.clientName.trim(),
      clientPhone: values.clientPhone.trim(),
      clientEmail: values.clientEmail.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="clientName">Seu nome</Label>
        <Input
          id="clientName"
          value={values.clientName}
          onChange={(event) => update("clientName", event.target.value)}
          placeholder="Maria Silva"
          autoComplete="name"
          aria-invalid={Boolean(errors.clientName)}
          aria-describedby={errors.clientName ? "clientName-error" : undefined}
        />
        {errors.clientName && (
          <p
            id="clientName-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.clientName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientPhone">Telefone</Label>
        <Input
          id="clientPhone"
          value={values.clientPhone}
          onChange={(event) => update("clientPhone", event.target.value)}
          placeholder="(11) 98888-7777"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.clientPhone)}
          aria-describedby={
            errors.clientPhone ? "clientPhone-error" : undefined
          }
        />
        {errors.clientPhone && (
          <p
            id="clientPhone-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.clientPhone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientEmail">
          E-mail <span className="text-neutral-400">(opcional)</span>
        </Label>
        <Input
          id="clientEmail"
          type="email"
          value={values.clientEmail}
          onChange={(event) => update("clientEmail", event.target.value)}
          placeholder="maria@exemplo.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.clientEmail)}
          aria-describedby={
            errors.clientEmail ? "clientEmail-error" : undefined
          }
        />
        {errors.clientEmail && (
          <p
            id="clientEmail-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.clientEmail}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="h-11"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Button type="submit" disabled={submitting} className="h-11 flex-1">
          {submitting ? "Confirmando..." : "Confirmar agendamento"}
        </Button>
      </div>
    </form>
  );
}
