import { DateTime } from "luxon";
import { AppError } from "../../shared/errors/AppError.js";
import * as repository from "./appointments.repository.js";

function toResponse(row: repository.AppointmentRow, timezone: string) {
  return {
    id: row.id,
    status: row.status,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    label: DateTime.fromJSDate(row.starts_at)
      .setZone(timezone)
      .toFormat("dd/MM/yyyy 'às' HH:mm"),
    client: {
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone,
    },
    service: {
      id: row.service_id,
      name: row.service_name,
      durationMinutes: row.duration_minutes,
      priceCents: row.price_cents,
    },
    createdAt: row.created_at.toISOString(),
  };
}

async function requireTimezone(professionalId: string): Promise<string> {
  const timezone = await repository.findTimezone(professionalId);

  if (!timezone) {
    throw new AppError("Profissional não encontrado.", 404, "NOT_FOUND");
  }

  return timezone;
}

export async function list(
  professionalId: string,
  filters: { from?: string; to?: string; status?: string },
) {
  const timezone = await requireTimezone(professionalId);

  // Sem filtro, a agenda mostra de hoje até 30 dias à frente.
  const rangeStart = filters.from
    ? DateTime.fromISO(filters.from, { zone: timezone }).startOf("day")
    : DateTime.now().setZone(timezone).startOf("day");

  const rangeEnd = filters.to
    ? DateTime.fromISO(filters.to, { zone: timezone }).endOf("day")
    : rangeStart.plus({ days: 30 });

  if (!rangeStart.isValid || !rangeEnd.isValid) {
    throw new AppError("Período inválido.", 422, "INVALID_RANGE");
  }

  if (rangeEnd < rangeStart) {
    throw new AppError(
      "A data final precisa ser depois da inicial.",
      422,
      "INVALID_RANGE",
    );
  }

  const status: "confirmed" | "cancelled" | null =
    filters.status === "all"
      ? null
      : filters.status === "cancelled"
        ? "cancelled"
        : "confirmed";

  const rows = await repository.list({
    professionalId,
    rangeStart: rangeStart.toJSDate(),
    rangeEnd: rangeEnd.toJSDate(),
    status,
  });

  return {
    from: rangeStart.toFormat("yyyy-MM-dd"),
    to: rangeEnd.toFormat("yyyy-MM-dd"),
    timezone,
    total: rows.length,
    appointments: rows.map((row) => toResponse(row, timezone)),
  };
}

export async function cancel(id: string, professionalId: string) {
  const timezone = await requireTimezone(professionalId);
  const existing = await repository.findById(id, professionalId);

  if (!existing) {
    throw new AppError(
      "Agendamento não encontrado.",
      404,
      "APPOINTMENT_NOT_FOUND",
    );
  }

  if (existing.status === "cancelled") {
    throw new AppError(
      "Este agendamento já está cancelado.",
      409,
      "ALREADY_CANCELLED",
    );
  }

  const row = await repository.cancel(id, professionalId);

  if (!row) {
    throw new AppError(
      "Não foi possível cancelar o agendamento.",
      409,
      "CANCEL_FAILED",
    );
  }

  return toResponse(row, timezone);
}
