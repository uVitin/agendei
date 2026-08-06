import { AppError } from "../../shared/errors/AppError.js";
import * as repository from "./services.repository.js";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "./services.schemas.js";

/** Converte a linha do banco (snake_case) para o contrato da API (camelCase). */
function toResponse(row: repository.ServiceRow) {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function list(professionalId: string) {
  const rows = await repository.listByProfessional(professionalId);
  return rows.map(toResponse);
}

export async function create(
  professionalId: string,
  input: CreateServiceInput,
) {
  const row = await repository.create({ professionalId, ...input });
  return toResponse(row);
}

export async function update(
  id: string,
  professionalId: string,
  input: UpdateServiceInput,
) {
  const row = await repository.update(id, professionalId, input);

  if (!row) {
    throw new AppError("Serviço não encontrado.", 404, "SERVICE_NOT_FOUND");
  }

  return toResponse(row);
}

export async function deactivate(id: string, professionalId: string) {
  const row = await repository.deactivate(id, professionalId);

  if (!row) {
    throw new AppError("Serviço não encontrado.", 404, "SERVICE_NOT_FOUND");
  }

  return toResponse(row);
}
