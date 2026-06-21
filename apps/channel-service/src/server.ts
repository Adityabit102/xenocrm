import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health";
import sendRoutes from "./routes/send";
import { messageQueue } from "./simulator/queue";
dotenv.config();
const PORT = parseInt(process.env.PORT || "3001", 10);
const isDev = process.env.NODE_ENV !== "production";
const fastify = Fastify({
  logger: isDev ? {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname"
      }
    }
  } : true
});
async function start() {
  try {
    await fastify.register(cors, { origin: "*" });
    await fastify.register(healthRoutes, { prefix: "/" });
    await fastify.register(sendRoutes, { prefix: "/" });
    fastify.log.info(`[Queue] In-memory simulator queue initialized and listening.`);
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Cove Channel Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err as any, "Fatal startup error");
    process.exit(1);
  }
}
const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
for (const signal of signals) {
  process.on(signal, async () => {
    fastify.log.warn(`[Server] Received signal ${signal}. Initiating graceful shutdown...`);
    let checks = 0;
    while (messageQueue.getLength() > 0 && checks < 20) {
      fastify.log.info(`[Server] Draining pending queue. Remaining items: ${messageQueue.getLength()}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      checks++;
    }
    if (messageQueue.getLength() > 0) {
      fastify.log.error(`[Server] Queue failed to fully drain before timeout limit. Dropping remaining ${messageQueue.getLength()} messages.`);
    } else {
      fastify.log.info(`[Server] Queue successfully drained.`);
    }
    try {
      await fastify.close();
      fastify.log.info("[Server] Fastify server connection closed.");
      process.exit(0);
    } catch (err) {
      fastify.log.error(err as any, "[Server] Error encountered during socket close");
      process.exit(1);
    }
  });
}
start();
