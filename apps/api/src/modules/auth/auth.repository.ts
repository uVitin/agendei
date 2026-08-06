import { pool } from "../../database/pool.js";

export interface ProfessionalRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  slug: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export async function findByEmail(
  email: string,
): Promise<ProfessionalRow | null> {
  const { rows } = await pool.query<ProfessionalRow>(
    "SELECT * FROM professionals WHERE email = $1",
    [email],
  );
  return rows[0] ?? null;
}

export async function slugExists(slug: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM professionals WHERE slug = $1",
    [slug],
  );
  return (rowCount ?? 0) > 0;
}

export async function create(data: {
  name: string;
  email: string;
  passwordHash: string;
  slug: string;
}): Promise<ProfessionalRow> {
  const { rows } = await pool.query<ProfessionalRow>(
    `INSERT INTO professionals (name, email, password_hash, slug)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.email, data.passwordHash, data.slug],
  );
  return rows[0]!;
}

export async function findById(id: string): Promise<ProfessionalRow | null> {
  const { rows } = await pool.query<ProfessionalRow>(
    "SELECT * FROM professionals WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}
