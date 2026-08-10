import { DateTime } from "luxon";
import {
  calculateAvailableSlots,
  type AvailableSlot,
} from "../../core/availability.js";
import { AppError } from "../../shared/errors/AppError.js";
import * as repository from "./public.repository.js";
import type { CreateAppointmentInput } from "./public.schemas.js";

/** Código de erro do PostgreSQL para violação de constraint EXCLUDE. */
const EXCLUSION_VIOLATION = "23P01";

function isExclusionViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === EXCLUSION_VIOLATION
  );
}

function toServiceResponse(row: repository.PublicService) {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
  };
}

async function requireProfessional(slug: string) {
  const professional = await repository.findProfessionalBySlug(slug);

  if (!professional) {
    throw new AppError(
      "Profissional não encontrado.",
      404,
      "PROFESSIONAL_NOT_FOUND",
    );
  }

  return professional;
}

async function requireActiveService(professionalId: string, serviceId: string) {
  const service = await repository.findActiveServiceById(
    professionalId,
    serviceId,
  );

  if (!service) {
    throw new AppError("Serviço não encontrado.", 404, "SERVICE_NOT_FOUND");
  }

  return service;
}

/** Busca os dados do dia e roda o motor. Usado pela consulta E pelo agendamento. */
async function computeSlots(
  professional: repository.PublicProfessional,
  service: repository.PublicService,
  date: string,
): Promise<AvailableSlot[]> {
  const dayStart = DateTime.fromISO(date, {
    zone: professional.timezone,
  }).startOf("day");

  if (!dayStart.isValid) {
    throw new AppError("Data inválida.", 422, "INVALID_DATE");
  }

  const dayEnd = dayStart.plus({ days: 1 });
  // Luxon: 1=segunda ... 7=domingo. Banco: 0=domingo ... 6=sábado.
  const weekday = dayStart.weekday % 7;

  const [workingBlocks, busy] = await Promise.all([
    repository.listWorkingBlocks(professional.id, weekday),
    repository.listBusyIntervals(
      professional.id,
      dayStart.toJSDate(),
      dayEnd.toJSDate(),
    ),
  ]);

  return calculateAvailableSlots({
    date,
    timezone: professional.timezone,
    durationMinutes: service.duration_minutes,
    workingBlocks: workingBlocks.map((block) => ({
      startTime: block.start_time.slice(0, 5),
      endTime: block.end_time.slice(0, 5),
    })),
    busyIntervals: busy.map((row) => ({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    })),
    now: new Date(),
  });
}

export async function getProfile(slug: string) {
  const professional = await requireProfessional(slug);
  const services = await repository.listActiveServices(professional.id);

  return {
    name: professional.name,
    slug: professional.slug,
    timezone: professional.timezone,
    services: services.map(toServiceResponse),
  };
}

export async function getAvailability(
  slug: string,
  serviceId: string,
  date: string,
) {
  const professional = await requireProfessional(slug);
  const service = await requireActiveService(professional.id, serviceId);
  const slots = await computeSlots(professional, service, date);

  return {
    date,
    timezone: professional.timezone,
    service: toServiceResponse(service),
    slots: slots.map((slot) => ({
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
      label: DateTime.fromJSDate(slot.startsAt)
        .setZone(professional.timezone)
        .toFormat("HH:mm"),
    })),
  };
}

export async function createAppointment(
  slug: string,
  input: CreateAppointmentInput,
) {
  const professional = await requireProfessional(slug);
  const service = await requireActiveService(professional.id, input.serviceId);

  const requestedStart = DateTime.fromISO(input.startsAt, { setZone: true });

  if (!requestedStart.isValid) {
    throw new AppError("Horário inválido.", 422, "INVALID_START");
  }

  // Em que dia esse instante cai, no calendário do profissional?
  const localDate = requestedStart
    .setZone(professional.timezone)
    .toFormat("yyyy-MM-dd");

  // CAMADA 1 — o horário pedido tem que ser exatamente um dos slots
  // que o motor considera livre. Isso cobre expediente, duração,
  // passado e conflito, tudo de uma vez.
  const slots = await computeSlots(professional, service, localDate);
  const requestedMs = requestedStart.toUTC().toMillis();
  const chosen = slots.find((slot) => slot.startsAt.getTime() === requestedMs);

  if (!chosen) {
    throw new AppError(
      "Este horário não está disponível.",
      409,
      "SLOT_UNAVAILABLE",
    );
  }

  try {
    // CAMADA 2 — a constraint EXCLUDE do banco. Se outra pessoa
    // fechou este mesmo horário entre a checagem acima e este INSERT,
    // o PostgreSQL recusa. É a única defesa que sobrevive à concorrência.
    const appointment = await repository.createAppointment({
      professionalId: professional.id,
      serviceId: service.id,
      clientName: input.clientName,
      clientEmail: input.clientEmail ?? null,
      clientPhone: input.clientPhone ?? null,
      startsAt: chosen.startsAt,
      endsAt: chosen.endsAt,
    });

    return {
      id: appointment.id,
      status: appointment.status,
      startsAt: appointment.starts_at.toISOString(),
      endsAt: appointment.ends_at.toISOString(),
      label: DateTime.fromJSDate(appointment.starts_at)
        .setZone(professional.timezone)
        .toFormat("dd/MM/yyyy 'às' HH:mm"),
      professional: { name: professional.name, slug: professional.slug },
      service: toServiceResponse(service),
      client: {
        name: input.clientName,
        email: input.clientEmail ?? null,
        phone: input.clientPhone ?? null,
      },
    };
  } catch (error) {
    if (isExclusionViolation(error)) {
      throw new AppError(
        "Este horário acabou de ser preenchido por outra pessoa.",
        409,
        "SLOT_TAKEN",
      );
    }
    throw error;
  }
}
