import { pool } from "../../database/pool.js";

export interface ServiceRow {
  id: string;
  professional_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function listByProfessional(
  professionalId: string,
): Promise<ServiceRow[]> {
  const { rows } = await pool.query<ServiceRow>(
    `SELECT * FROM services
     WHERE professional_id = $1
     ORDER BY is_active DESC, name ASC`,
    [professionalId],
  );
  return rows;
}

export async function findById(
  id: string,
  professionalId: string,
): Promise<ServiceRow | null> {
  const { rows } = await pool.query<ServiceRow>(
    "SELECT * FROM services WHERE id = $1 AND professional_id = $2",
    [id, professionalId],
  );
  return rows[0] ?? null;
}

export async function create(data: {
  professionalId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}): Promise<ServiceRow> {
  const { rows } = await pool.query<ServiceRow>(
    `INSERT INTO services (professional_id, name, duration_minutes, price_cents)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.professionalId, data.name, data.durationMinutes, data.priceCents],
  );
  return rows[0]!;
}

export async function update(
  id: string,
  professionalId: string,
  data: {
    name?: string;
    durationMinutes?: number;
    priceCents?: number;
    isActive?: boolean;
  },
): Promise<ServiceRow | null> {
  const { rows } = await pool.query<ServiceRow>(
    `UPDATE services SET
       name             = COALESCE($3::text, name),
       duration_minutes = COALESCE($4::integer, duration_minutes),
       price_cents      = COALESCE($5::integer, price_cents),
       is_active        = COALESCE($6::boolean, is_active)
     WHERE id = $1 AND professional_id = $2
     RETURNING *`,
    [
      id,
      professionalId,
      data.name ?? null,
      data.durationMinutes ?? null,
      data.priceCents ?? null,
      data.isActive ?? null,
    ],
  );
  return rows[0] ?? null;
}

export async function deactivate(
  id: string,
  professionalId: string,
): Promise<ServiceRow | null> {
  const { rows } = await pool.query<ServiceRow>(
    `UPDATE services SET is_active = FALSE
     WHERE id = $1 AND professional_id = $2
     RETURNING *`,
    [id, professionalId],
  );
  return rows[0] ?? null;
}
