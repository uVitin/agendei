"use client";

import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DayPicker } from "@/components/booking/day-picker";
import { ServiceList } from "@/components/booking/service-list";
import { SlotGrid } from "@/components/booking/slot-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import { buildNextDays } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/format";
import type {
  AvailabilityResponse,
  PublicProfile,
  Service,
  Slot,
} from "@/lib/types";

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  // Os próximos 14 dias são calculados uma vez só, na montagem.
  const days = useMemo(() => buildNextDays(14), []);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(days[0]!.value);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);

  // --- Carrega o perfil público ---
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

  // --- Carrega os horários sempre que serviço ou data mudarem ---
  useEffect(() => {
    if (!service) {
      setSlots([]);
      return;
    }

    let active = true;
    setLoadingSlots(true);
    setSlot(null);

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
  }, [slug, service, date]);

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

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
            1. Escolha o serviço
          </h2>
          <ServiceList
            services={profile.services}
            selectedId={service?.id ?? null}
            onSelect={setService}
          />
        </section>

        {service && (
          <>
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                2. Escolha o dia
              </h2>
              <DayPicker days={days} selected={date} onSelect={setDate} />
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
      </div>

      {slot && service && (
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
              onClick={() => toast.info("O formulário chega no próximo passo.")}
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
