"use client";

import { use, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDuration, formatPrice } from "@/lib/format";
import type { PublicProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Evita atualizar estado de um componente já desmontado
    // caso o usuário navegue antes da resposta chegar.
    let active = true;

    setLoading(true);

    apiFetch<PublicProfile>(`/public/${slug}`)
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível carregar esta página.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const initials = profile?.name
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
        {loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
              Página não encontrada
            </p>
            <p className="mt-2 text-sm text-neutral-500">{error}</p>
          </div>
        )}

        {!loading && profile && (
          <>
            <header className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {profile.name}
                </h1>
                <p className="text-sm text-neutral-500">
                  Escolha um serviço para ver os horários
                </p>
              </div>
            </header>

            <section className="mt-10">
              {profile.services.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
                  <p className="text-sm text-neutral-500">
                    Este profissional ainda não cadastrou serviços.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {profile.services.map((service) => (
                    <li key={service.id}>
                      <button
                        type="button"
                        className="group flex w-full items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-900 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-50 dark:focus-visible:ring-neutral-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900 dark:text-neutral-50">
                            {service.name}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {formatDuration(service.durationMinutes)}
                          </p>
                        </div>
                        <span className="shrink-0 text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {formatPrice(service.priceCents)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
