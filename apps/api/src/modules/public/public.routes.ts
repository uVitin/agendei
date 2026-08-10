import { Router } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middlewares/validate.js";
import * as controller from "./public.controller.js";
import {
  availabilityQuerySchema,
  createAppointmentSchema,
  slugParamSchema,
} from "./public.schemas.js";

/** Rotas públicas — SEM autenticação. É o que o cliente final acessa. */
export const publicRoutes = Router();

publicRoutes.get("/:slug", validateParams(slugParamSchema), controller.profile);

publicRoutes.get(
  "/:slug/availability",
  validateParams(slugParamSchema),
  validateQuery(availabilityQuerySchema),
  controller.availability,
);

publicRoutes.post(
  "/:slug/appointments",
  validateParams(slugParamSchema),
  validateBody(createAppointmentSchema),
  controller.createAppointment,
);
