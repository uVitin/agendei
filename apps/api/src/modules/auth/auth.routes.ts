import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { validateBody } from "../../shared/middlewares/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), controller.register);
authRoutes.post("/login", validateBody(loginSchema), controller.login);
authRoutes.get("/me", authenticate, controller.me);
