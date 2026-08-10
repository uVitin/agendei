import { DateTime } from "luxon";
import { calculateAvailableSlots } from "../../core/availability.js";
import { AppError } from "../../shared/errors/AppError.js";
import * as repository from "./public.repository.js";

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

  const service = await repository.findActiveServiceById(
    professional.id,
    serviceId,
  );

  if (!service) {
    throw new AppError("Serviço não encontrado.", 404, "SERVICE_NOT_FOUND");
  }

  const dayStart = DateTime.fromISO(date, {
    zone: professional.timezone,
  }).startOf("day");

  if (!dayStart.isValid) {
    throw new AppError("Data inválida.", 422, "INVALID_DATE");
  }

  const dayEnd = dayStart.plus({ days: 1 });

  // Luxon usa 1=segunda ... 7=domingo. O banco usa 0=domingo ... 6=sábado.
  const weekday = dayStart.weekday % 7;

  const [workingBlocks, busy] = await Promise.all([
    repository.listWorkingBlocks(professional.id, weekday),
    repository.listBusyIntervals(
      professional.id,
      dayStart.toJSDate(),
      dayEnd.toJSDate(),
    ),
  ]);

  const slots = calculateAvailableSlots({
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
