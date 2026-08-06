import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome precisa ter ao menos 3 caracteres")
    .max(120, "Nome muito longo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "Senha precisa ter ao menos 8 caracteres")
    .max(72, "Senha muito longa"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
