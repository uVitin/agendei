import type { NextFunction, Request, Response } from "express";
import * as service from "./services.service.js";

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

export async function create(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.create(request.professionalId!, request.body);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function update(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.update(
      request.params.id!,
      request.professionalId!,
      request.body,
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deactivate(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.deactivate(
      request.params.id!,
      request.professionalId!,
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
