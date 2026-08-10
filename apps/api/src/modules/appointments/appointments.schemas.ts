import { z } from "zod";

export const appointmentIdParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD");

export const listAppointmentsQuerySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  status: z.enum(["confirmed", "cancelled", "all"]).optional(),
});
