import * as repository from "./working-hours.repository.js";
import type { ReplaceWorkingHoursInput } from "./working-hours.schemas.js";

/** O Postgres devolve TIME como "09:00:00"; a API entrega "09:00". */
function toResponse(row: repository.WorkingHourRow) {
  return {
    id: row.id,
    weekday: row.weekday,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

export async function list(professionalId: string) {
  const rows = await repository.listByProfessional(professionalId);
  return rows.map(toResponse);
}

export async function replaceAll(
  professionalId: string,
  input: ReplaceWorkingHoursInput,
) {
  const rows = await repository.replaceAll(professionalId, input.blocks);
  return rows.map(toResponse);
}
