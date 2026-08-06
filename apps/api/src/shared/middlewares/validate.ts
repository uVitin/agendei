import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Valida o corpo da requisição contra um schema Zod.
 * Se passar, substitui request.body pelos dados já tratados
 * (com trim, lowercase e coerções aplicados).
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    request.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      next(result.error);
      return;
    }

    next();
  };
}
