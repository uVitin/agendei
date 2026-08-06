import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./database/pool.js";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API do Agendei em http://localhost:${env.PORT}`);
  console.log(`   Ambiente: ${env.NODE_ENV}`);
});

/**
 * Graceful shutdown: ao receber o sinal de parada, para de aceitar
 * novas requisições, espera as em andamento terminarem e só então
 * fecha o pool. Sem isso, um deploy derruba requisições no meio.
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} recebido, encerrando...`);

  server.close(async () => {
    await pool.end();
    console.log("Conexões encerradas com segurança.");
    process.exit(0);
  });

  // Se algo travar, não fica pendurado para sempre.
  setTimeout(() => {
    console.error("Encerramento forçado após 10s.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
