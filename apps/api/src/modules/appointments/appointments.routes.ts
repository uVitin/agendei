import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import {
  validateParams,
  validateQuery,
} from "../../shared/middlewares/validate.js";
import * as controller from "./appointments.controller.js";
import {
  appointmentIdParamSchema,
  listAppointmentsQuerySchema,
} from "./appointments.schemas.js";

export const appointmentsRoutes = Router();

appointmentsRoutes.use(authenticate);

appointmentsRoutes.get(
  "/",
  validateQuery(listAppointmentsQuerySchema),
  controller.list,
);

appointmentsRoutes.patch(
  "/:id/cancel",
  validateParams(appointmentIdParamSchema),
  controller.cancel,
);
