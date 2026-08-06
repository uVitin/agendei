import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import {
  validateBody,
  validateParams,
} from "../../shared/middlewares/validate.js";
import * as controller from "./services.controller.js";
import {
  createServiceSchema,
  idParamSchema,
  updateServiceSchema,
} from "./services.schemas.js";

export const servicesRoutes = Router();

// Todas as rotas deste módulo exigem autenticação.
servicesRoutes.use(authenticate);

servicesRoutes.get("/", controller.list);
servicesRoutes.post("/", validateBody(createServiceSchema), controller.create);
servicesRoutes.patch(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateServiceSchema),
  controller.update,
);
servicesRoutes.delete(
  "/:id",
  validateParams(idParamSchema),
  controller.deactivate,
);
