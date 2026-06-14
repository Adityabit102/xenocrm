import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { messageQueue } from "../simulator/queue";




export default async function healthRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      queueSize: messageQueue.size()
    };
  });
}
