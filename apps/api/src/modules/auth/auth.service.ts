import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { slugify } from "../../shared/utils/slugify.js";
import * as repository from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const SALT_ROUNDS = 10;

export interface AuthResult {
  token: string;
  professional: {
    id: string;
    name: string;
    email: string;
    slug: string;
  };
}

/** Garante slug único: "joao", "joao-2", "joao-3"... */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "profissional";
  let candidate = base;
  let suffix = 1;

  while (await repository.slugExists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

function signToken(professionalId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: professionalId }, env.JWT_SECRET, options);
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await repository.findByEmail(input.email);
  if (existing) {
    throw new AppError(
      "Já existe uma conta com este e-mail.",
      409,
      "EMAIL_IN_USE",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const slug = await generateUniqueSlug(input.name);

  const professional = await repository.create({
    name: input.name,
    email: input.email,
    passwordHash,
    slug,
  });

  return {
    token: signToken(professional.id),
    professional: {
      id: professional.id,
      name: professional.name,
      email: professional.email,
      slug: professional.slug,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const professional = await repository.findByEmail(input.email);

  const passwordMatches = professional
    ? await bcrypt.compare(input.password, professional.password_hash)
    : false;

  // Mesma mensagem para e-mail inexistente e senha errada — de propósito.
  if (!professional || !passwordMatches) {
    throw new AppError(
      "E-mail ou senha inválidos.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  return {
    token: signToken(professional.id),
    professional: {
      id: professional.id,
      name: professional.name,
      email: professional.email,
      slug: professional.slug,
    },
  };
}
