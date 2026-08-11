"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookingForm,
  type BookingFormValues,
} from "@/components/booking/booking-form";
import { BookingSuccess } from "@/components/booking/booking-success";
import { DayPicker } from "@/components/booking/day-picker";
import { ServiceList } from "@/components/booking/service-list";
import { SlotGrid } from "@/components/booking/slot-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import { buildNextDays } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/format";
import type {
  AppointmentConfirmation,
  AvailabilityResponse,
  PublicProfile,
  Service,
  Slot,
} from "@/lib/types";

type Step = "select" | "form" | "done";

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const days = useMemo(() => buildNextDays(14), []);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [step, setStep] = useState<Step>("select");
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(days[0]!.value);
  const [slot, setSlot] = useState<Slot | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Incrementar isto força uma nova busca de horários.
  const [reloadKey, setReloadKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] =
    useState<AppointmentConfirmation | null>(null);

  // --- Perfil público ---
  useEffect(() => {
    let active = true;
    setLoadingProfile(true);

    apiFetch<PublicProfile>(`/public/${slug}`)
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setProfileError(null);
      })
      .catch((error) => {
        if (!active) return;
        setProfileError(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar esta página.",
        );
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // --- Horários disponíveis ---
  useEffect(() => {
    if (!service) {
      setSlots([]);
      return;
    }

    let active = true;
    setLoadingSlots(true);

    const query = new URLSearchParams({ serviceId: service.id, date });

    apiFetch<AvailabilityResponse>(`/public/${slug}/availability?${query}`)
      .then((data) => {
        if (!active) return;
        setSlots(data.slots);
        setSlotsError(null);
      })
      .catch((error) => {
        if (!active) return;
        setSlots([]);
        setSlotsError(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os horários.",
        );
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [slug, service, date, reloadKey]);

  const goToStep = useCallback((next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleSelectService(next: Service) {
    setService(next);
    setSlot(null);
  }

  function handleSelectDate(next: string) {
    setDate(next);
    setSlot(null);
  }

  async function handleSubmit(values: BookingFormValues) {
    if (!service || !slot) return;

    setSubmitting(true);
    setFieldErrors({});

    try {
      const result = await apiFetch<AppointmentConfirmation>(
        `/public/${slug}/appointments`,
        {
          method: "POST",
          body: JSON.stringify({
            serviceId: service.id,
            startsAt: slot.startsAt,
            clientName: values.clientName,
            ...(values.clientPhone ? { clientPhone: values.clientPhone } : {}),
            ...(values.clientEmail ? { clientEmail: values.clientEmail } : {}),
          }),
        },
      );

      setConfirmation(result);
      goToStep("done");
    } catch (error) {
      if (!(error instanceof ApiError)) {
        toast.error("Não foi possível concluir o agendamento.");
        return;
      }

      // 422 — problema nos dados: mostra o erro embaixo do campo.
      if (error.issues?.length) {
        setFieldErrors(
          Object.fromEntries(
            error.issues.map((issue) => [issue.field, issue.message]),
          ),
        );
        toast.error("Confira os dados informados.");
        return;
      }

      // 409 — o horário sumiu enquanto o cliente preenchia o formulário.
      // Volta para a grade e recarrega, em vez de deixar a tela travada.
      if (error.code === "SLOT_TAKEN" || error.code === "SLOT_UNAVAILABLE") {
        toast.error(error.message, {
          description: "Escolha outro horário disponível.",
        });
        setSlot(null);
        setReloadKey((key) => key + 1);
        goToStep("select");
        return;
      }

      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRestart() {
    setConfirmation(null);
    setService(null);
    setSlot(null);
    setDate(days[0]!.value);
    setFieldErrors({});
    setReloadKey((key) => key + 1);
    goToStep("select");
  }

  const initials = profile?.name
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-5 py-12 sm:py-16">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 dark:bg-neutral-950">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
            Página não encontrada
          </p>
          <p className="mt-2 text-sm text-neutral-500">{profileError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-28 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
        <header className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {profile.name}
            </h1>
            <p className="text-sm text-neutral-500">
              Agende seu horário em poucos cliques
            </p>
          </div>
        </header>

        {step === "done" && confirmation && (
          <div className="mt-10">
            <BookingSuccess
              confirmation={confirmation}
              onRestart={handleRestart}
            />
          </div>
        )}

        {step === "form" && service && slot && (
          <div className="mt-10">
            <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {service.name}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {slot.label} · {formatDuration(service.durationMinutes)} ·{" "}
                {formatPrice(service.priceCents)}
              </p>
            </div>

            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
              4. Seus dados
            </h2>

            <BookingForm
              submitting={submitting}
              fieldErrors={fieldErrors}
              onSubmit={handleSubmit}
              onBack={() => goToStep("select")}
            />
          </div>
        )}

        {step === "select" && (
          <>
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                1. Escolha o serviço
              </h2>
              <ServiceList
                services={profile.services}
                selectedId={service?.id ?? null}
                onSelect={handleSelectService}
              />
            </section>

            {service && (
              <>
                <section className="mt-10">
                  <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                    2. Escolha o dia
                  </h2>
                  <DayPicker
                    days={days}
                    selected={date}
                    onSelect={handleSelectDate}
                  />
                </section>

                <section className="mt-8">
                  <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                    3. Escolha o horário
                  </h2>
                  <SlotGrid
                    slots={slots}
                    loading={loadingSlots}
                    error={slotsError}
                    selected={slot?.startsAt ?? null}
                    onSelect={setSlot}
                  />
                </section>
              </>
            )}
          </>
        )}
      </div>

      {step === "select" && slot && service && (
        <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {service.name} · {slot.label}
              </p>
              <p className="text-xs text-neutral-500">
                {formatDuration(service.durationMinutes)} ·{" "}
                {formatPrice(service.priceCents)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => goToStep("form")}
              className="h-11 shrink-0 rounded-lg bg-neutral-900 px-6 text-sm font-medium text-neutral-50 transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
