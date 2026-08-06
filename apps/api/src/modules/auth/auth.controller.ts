import type { NextFunction, Request, Response } from "express";
import * as service from "./auth.service.js";

export async function register(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.register(request.body);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.login(request.body);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.me(request.professionalId!);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
