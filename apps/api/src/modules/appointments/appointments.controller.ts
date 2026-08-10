import type { NextFunction, Request, Response } from "express";
import * as service from "./appointments.service.js";

export async function list(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.list(request.professionalId!, {
      from: request.query.from as string | undefined,
      to: request.query.to as string | undefined,
      status: request.query.status as string | undefined,
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancel(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.cancel(
      String(request.params.id),
      request.professionalId!,
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
