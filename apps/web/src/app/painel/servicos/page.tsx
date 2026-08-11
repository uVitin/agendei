"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ServiceForm,
  type ServiceFormValues,
} from "@/components/painel/service-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

interface ServiceWithStatus extends Service {
  isActive: boolean;
}

export default function ServicosPage() {
  const { token } = useAuth();

  const [services, setServices] = useState<ServiceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadServices = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiFetch<ServiceWithStatus[]>("/services", { token });
      setServices(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar os serviços.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  /** Traduz o erro da API em mensagens por campo. Devolve true se tratou. */
  function handleApiError(error: unknown): void {
    if (error instanceof ApiError && error.issues?.length) {
      setFieldErrors(
        Object.fromEntries(
          error.issues.map((issue) => [issue.field, issue.message]),
        ),
      );
      toast.error("Confira os dados informados.");
      return;
    }

    toast.error(
      error instanceof ApiError
        ? error.message
        : "Não foi possível salvar o serviço.",
    );
  }

  async function handleCreate(values: ServiceFormValues) {
    setSubmitting(true);
    setFieldErrors({});

    try {
      await apiFetch<Service>("/services", {
        method: "POST",
        token,
        body: JSON.stringify(values),
      });

      toast.success("Serviço cadastrado.");
      setCreating(false);
      await loadServices();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: string, values: ServiceFormValues) {
    setSubmitting(true);
    setFieldErrors({});

    try {
      await apiFetch<Service>(`/services/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(values),
      });

      toast.success("Serviço atualizado.");
      setEditingId(null);
      await loadServices();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(service: ServiceWithStatus) {
    try {
      if (service.isActive) {
        await apiFetch(`/services/${service.id}`, { method: "DELETE", token });
        toast.success("Serviço desativado. Ele some da sua página pública.");
      } else {
        await apiFetch(`/services/${service.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ isActive: true }),
        });
        toast.success("Serviço reativado.");
      }

      await loadServices();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível alterar o serviço.",
      );
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
            Serviços
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Duração e preço definem os horários oferecidos ao cliente.
          </p>
        </div>

        {!creating && (
          <Button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
              setFieldErrors({});
            }}
            className="h-10 shrink-0"
          >
            <Plus className="size-4" />
            Novo
          </Button>
        )}
      </div>

      {creating && (
        <div className="mt-6">
          <ServiceForm
            submitting={submitting}
            fieldErrors={fieldErrors}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreating(false);
              setFieldErrors({});
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading && (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        )}

        {!loading && services.length === 0 && !creating && (
          <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
            <p className="font-medium text-neutral-900 dark:text-neutral-50">
              Nenhum serviço cadastrado
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Cadastre o primeiro para sua página pública funcionar.
            </p>
          </div>
        )}

        {!loading &&
          services.map((service) =>
            editingId === service.id ? (
              <ServiceForm
                key={service.id}
                initial={service}
                submitting={submitting}
                fieldErrors={fieldErrors}
                onSubmit={(values) => handleUpdate(service.id, values)}
                onCancel={() => {
                  setEditingId(null);
                  setFieldErrors({});
                }}
              />
            ) : (
              <div
                key={service.id}
                className={`flex items-center justify-between gap-4 rounded-xl border p-5 ${
                  service.isActive
                    ? "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                    : "border-neutral-200 bg-neutral-100 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/50"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-neutral-900 dark:text-neutral-50">
                      {service.name}
                    </p>
                    {!service.isActive && (
                      <span className="shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {formatDuration(service.durationMinutes)} ·{" "}
                    {formatPrice(service.priceCents)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(service.id);
                      setCreating(false);
                      setFieldErrors({});
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleToggleActive(service)}
                  >
                    {service.isActive ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              </div>
            ),
          )}
      </div>
    </>
  );
}
