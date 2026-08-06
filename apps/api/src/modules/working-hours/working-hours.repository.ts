import { pool } from "../../database/pool.js";

export interface WorkingHourRow {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export async function listByProfessional(
  professionalId: string,
): Promise<WorkingHourRow[]> {
  const { rows } = await pool.query<WorkingHourRow>(
    `SELECT * FROM working_hours
     WHERE professional_id = $1
     ORDER BY weekday ASC, start_time ASC`,
    [professionalId],
  );
  return rows;
}

/**
 * Substitui todo o expediente do profissional numa única transação.
 * Ou a semana inteira é gravada, ou nada muda.
 */
export async function replaceAll(
  professionalId: string,
  blocks: { weekday: number; startTime: string; endTime: string }[],
): Promise<WorkingHourRow[]> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM working_hours WHERE professional_id = $1", [
      professionalId,
    ]);

    for (const block of blocks) {
      await client.query(
        `INSERT INTO working_hours (professional_id, weekday, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [professionalId, block.weekday, block.startTime, block.endTime],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    // Devolver a conexão ao pool é obrigatório. Sem isso o pool
    // esgota em poucas requisições e a API trava.
    client.release();
  }

  return listByProfessional(professionalId);
}
