import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { messageQueue, MessageJob } from "../simulator/queue";

interface SendRequestBody {
  campaignId: string;
  messages: Array<{
    id: string;
    customerId: string;
    channel: "whatsapp" | "sms" | "email" | "rcs";
    content: string;
    recipientPhone?: string;
    recipientEmail?: string;
  }>;
}




export default async function sendRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.post("/send", async (request: FastifyRequest, reply: FastifyReply) => {
    
    const apiSecret = request.headers["x-api-secret"];
    const expectedSecret = process.env.CRM_RECEIPT_SECRET || "dev-secret-change-in-production";

    if (!apiSecret || apiSecret !== expectedSecret) {
      return reply.status(401).send({ error: "Unauthorized: Missing or invalid x-api-secret" });
    }

    
    const body = request.body as SendRequestBody;
    if (!body || typeof body !== "object" || !body.campaignId || !Array.isArray(body.messages)) {
      return reply.status(400).send({ error: "Invalid request body structure" });
    }

    const { campaignId, messages } = body;

    
    for (const msg of messages) {
      if (!msg.id || !msg.customerId || !msg.channel || !msg.content) {
        return reply.status(400).send({ error: "Missing required fields in one or more messages" });
      }
      if (!["whatsapp", "sms", "email", "rcs"].includes(msg.channel)) {
        return reply.status(400).send({ error: `Invalid channel: "${msg.channel}". Allowed: whatsapp, sms, email, rcs` });
      }
    }

    
    const jobId = `job_${randomUUID()}`;

    
    const messageJobs: MessageJob[] = messages.map(msg => ({
      id: msg.id,
      campaignId,
      customerId: msg.customerId,
      channel: msg.channel,
      content: msg.content,
      recipientPhone: msg.recipientPhone,
      recipientEmail: msg.recipientEmail
    }));

    messageQueue.enqueue(messageJobs);

    
    return reply.status(202).send({
      jobId,
      accepted: messages.length,
      status: "queued"
    });
  });
}
