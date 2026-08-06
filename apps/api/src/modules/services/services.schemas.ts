import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  durationMinutes: z.coerce
    .number()
    .int("Duração precisa ser um número inteiro de minutos")
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 8 horas"),
  priceCents: z.coerce
    .number()
    .int("Preço deve ser informado em centavos")
    .min(0, "Preço não pode ser negativo"),
});

export const updateServiceSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
    priceCents: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
