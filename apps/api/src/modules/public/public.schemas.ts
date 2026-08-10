import { z } from "zod";

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1, "Slug obrigatório"),
});

export const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid("serviceId inválido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});
