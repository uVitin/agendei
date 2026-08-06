import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

/**
 * Lê o token do header Authorization, valida a assinatura
 * e disponibiliza o ID do profissional para as rotas seguintes.
 */
export const authenticate: RequestHandler = (request, _response, next) => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Token não informado.", 401, "TOKEN_MISSING"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new Error("Payload do token em formato inesperado.");
    }

    request.professionalId = payload.sub;
    next();
  } catch {
    next(new AppError("Token inválido ou expirado.", 401, "TOKEN_INVALID"));
  }
};
