import { pool } from "../../database/pool.js";

export interface AppointmentRow {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  starts_at: Date;
  ends_at: Date;
  status: "confirmed" | "cancelled";
  created_at: Date;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price_cents: number;
}

/** Campos do JOIN, reaproveitados para não repetir SQL. */
const SELECT_FIELDS = `
  a.id, a.client_name, a.client_email, a.client_phone,
  a.starts_at, a.ends_at, a.status, a.created_at,
  s.id AS service_id, s.name AS service_name,
  s.duration_minutes, s.price_cents
`;

export async function findTimezone(
  professionalId: string,
): Promise<string | null> {
  const { rows } = await pool.query<{ timezone: string }>(
    "SELECT timezone FROM professionals WHERE id = $1",
    [professionalId],
  );
  return rows[0]?.timezone ?? null;
}

export async function list(params: {
  professionalId: string;
  rangeStart: Date;
  rangeEnd: Date;
  status: "confirmed" | "cancelled" | null;
}): Promise<AppointmentRow[]> {
  const { rows } = await pool.query<AppointmentRow>(
    `SELECT ${SELECT_FIELDS}
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     WHERE a.professional_id = $1
       AND a.starts_at >= $2
       AND a.starts_at <  $3
       AND ($4::appointment_status IS NULL OR a.status = $4::appointment_status)
     ORDER BY a.starts_at ASC`,
    [params.professionalId, params.rangeStart, params.rangeEnd, params.status],
  );
  return rows;
}

export async function findById(
  id: string,
  professionalId: string,
): Promise<AppointmentRow | null> {
  const { rows } = await pool.query<AppointmentRow>(
    `SELECT ${SELECT_FIELDS}
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     WHERE a.id = $1 AND a.professional_id = $2`,
    [id, professionalId],
  );
  return rows[0] ?? null;
}

export async function cancel(
  id: string,
  professionalId: string,
): Promise<AppointmentRow | null> {
  const { rows } = await pool.query<{ id: string }>(
    `UPDATE appointments
     SET status = 'cancelled'
     WHERE id = $1 AND professional_id = $2 AND status = 'confirmed'
     RETURNING id`,
    [id, professionalId],
  );

  if (!rows[0]) return null;

  return findById(id, professionalId);
}
