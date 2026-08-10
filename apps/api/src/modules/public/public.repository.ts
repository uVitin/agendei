import { pool } from "../../database/pool.js";

export interface PublicProfessional {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

export interface PublicService {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

export interface BusyRow {
  starts_at: Date;
  ends_at: Date;
}

export interface WorkingBlockRow {
  start_time: string;
  end_time: string;
}

export async function findProfessionalBySlug(
  slug: string,
): Promise<PublicProfessional | null> {
  const { rows } = await pool.query<PublicProfessional>(
    "SELECT id, name, slug, timezone FROM professionals WHERE slug = $1",
    [slug],
  );
  return rows[0] ?? null;
}

export async function listActiveServices(
  professionalId: string,
): Promise<PublicService[]> {
  const { rows } = await pool.query<PublicService>(
    `SELECT id, name, duration_minutes, price_cents
     FROM services
     WHERE professional_id = $1 AND is_active = TRUE
     ORDER BY name ASC`,
    [professionalId],
  );
  return rows;
}

export async function findActiveServiceById(
  professionalId: string,
  serviceId: string,
): Promise<PublicService | null> {
  const { rows } = await pool.query<PublicService>(
    `SELECT id, name, duration_minutes, price_cents
     FROM services
     WHERE id = $1 AND professional_id = $2 AND is_active = TRUE`,
    [serviceId, professionalId],
  );
  return rows[0] ?? null;
}

export async function listWorkingBlocks(
  professionalId: string,
  weekday: number,
): Promise<WorkingBlockRow[]> {
  const { rows } = await pool.query<WorkingBlockRow>(
    `SELECT start_time, end_time
     FROM working_hours
     WHERE professional_id = $1 AND weekday = $2
     ORDER BY start_time ASC`,
    [professionalId, weekday],
  );
  return rows;
}

export async function listBusyIntervals(
  professionalId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<BusyRow[]> {
  const { rows } = await pool.query<BusyRow>(
    `SELECT starts_at, ends_at
     FROM appointments
     WHERE professional_id = $1
       AND status = 'confirmed'
       AND starts_at < $3
       AND ends_at   > $2`,
    [professionalId, rangeStart, rangeEnd],
  );
  return rows;
}

export interface AppointmentRow {
  id: string;
  starts_at: Date;
  ends_at: Date;
  status: string;
}

export async function createAppointment(data: {
  professionalId: string;
  serviceId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  startsAt: Date;
  endsAt: Date;
}): Promise<AppointmentRow> {
  const { rows } = await pool.query<AppointmentRow>(
    `INSERT INTO appointments
       (professional_id, service_id, client_name, client_email, client_phone, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, starts_at, ends_at, status`,
    [
      data.professionalId,
      data.serviceId,
      data.clientName,
      data.clientEmail,
      data.clientPhone,
      data.startsAt,
      data.endsAt,
    ],
  );
  return rows[0]!;
}
