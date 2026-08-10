import express from "express";
import { checkDatabaseConnection } from "./database/pool.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { servicesRoutes } from "./modules/services/services.routes.js";
import { workingHoursRoutes } from "./modules/working-hours/working-hours.routes.js";
import { publicRoutes } from "./modules/public/public.routes.js";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes.js";

export const app = express();

app.use(express.json());

app.get("/health", async (_request, response) => {
  const databaseOk = await checkDatabaseConnection();

  response.status(databaseOk ? 200 : 503).json({
    status: databaseOk ? "ok" : "degraded",
    database: databaseOk ? "up" : "down",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/services", servicesRoutes);
app.use("/working-hours", workingHoursRoutes);
app.use("/public", publicRoutes);
app.use("/appointments", appointmentsRoutes);

// Rota não encontrada
app.use((_request, response) => {
  response.status(404).json({ message: "Rota não encontrada." });
});

// Tratamento de erro SEMPRE por último — ele captura o que
// os middlewares acima jogaram para o next().
app.use(errorHandler);
