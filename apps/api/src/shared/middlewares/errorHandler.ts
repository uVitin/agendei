import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

/**
 * Ponto único de tratamento de erro da API.
 * Precisa ter os 4 parâmetros — é assim que o Express identifica
 * um middleware de erro, mesmo que o último não seja usado.
 */
export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      message: "Dados inválidos.",
      issues: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
    return;
  }

  // Erro não previsto: loga completo no servidor, mas nunca vaza
  // stack trace nem detalhe interno para o cliente.
  console.error("Erro não tratado:", error);
  response.status(500).json({ message: "Erro interno do servidor." });
};
