import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { validateBody } from "../../shared/middlewares/validate.js";
import * as controller from "./working-hours.controller.js";
import { replaceWorkingHoursSchema } from "./working-hours.schemas.js";

export const workingHoursRoutes = Router();

workingHoursRoutes.use(authenticate);

workingHoursRoutes.get("/", controller.list);
workingHoursRoutes.put(
  "/",
  validateBody(replaceWorkingHoursSchema),
  controller.replaceAll,
);
