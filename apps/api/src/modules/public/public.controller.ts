import type { NextFunction, Request, Response } from "express";
import * as service from "./public.service.js";

export async function profile(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.getProfile(String(request.params.slug));
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function availability(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.getAvailability(
      String(request.params.slug),
      String(request.query.serviceId),
      String(request.query.date),
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAppointment(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.createAppointment(
      String(request.params.slug),
      request.body,
    );
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
