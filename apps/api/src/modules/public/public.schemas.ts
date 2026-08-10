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

export const createAppointmentSchema = z
  .object({
    serviceId: z.string().uuid("serviceId inválido"),
    startsAt: z.string().datetime({
      offset: true,
      message:
        "startsAt deve ser uma data ISO-8601 com fuso (ex.: 2026-08-17T12:00:00.000Z)",
    }),
    clientName: z.string().trim().min(2, "Informe seu nome").max(120),
    clientEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email("E-mail inválido")
      .optional(),
    clientPhone: z
      .string()
      .trim()
      .min(8, "Telefone inválido")
      .max(20)
      .optional(),
  })
  .refine((data) => Boolean(data.clientEmail || data.clientPhone), {
    message: "Informe e-mail ou telefone para contato",
    path: ["clientPhone"],
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
