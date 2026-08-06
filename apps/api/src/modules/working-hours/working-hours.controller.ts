import type { NextFunction, Request, Response } from "express";
import * as service from "./working-hours.service.js";

export async function list(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.status(200).json(await service.list(request.professionalId!));
  } catch (error) {
    next(error);
  }
}

export async function replaceAll(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.replaceAll(
      request.professionalId!,
      request.body,
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
