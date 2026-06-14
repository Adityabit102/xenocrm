import { Queue, Worker, Job } from "bullmq";
import { db } from "../db";
import { processCampaignDispatch } from "./jobs/dispatch-campaign";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const QUEUE_NAME = "campaign-dispatch";


const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null
});


export const campaignQueue = new Queue(QUEUE_NAME, {
  connection
});





export async function addDispatchJob(campaignId: string): Promise<Job> {
  console.log(`[Queue] Adding dispatch job for campaign: ${campaignId}`);
  
  return await campaignQueue.add(
    `dispatch_${campaignId}`, 
    { campaignId }, 
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000 
      }
    }
  );
}









export const campaignWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { campaignId } = job.data;
    console.log(`[Worker] Processing job ${job.id} for campaign: ${campaignId}`);
    
    const startTime = Date.now();
    await processCampaignDispatch(campaignId);
    const duration = Date.now() - startTime;

    return { campaignId, duration };
  },
  {
    connection,
    concurrency: 3 
  }
);


campaignWorker.on("completed", (job, result) => {
  console.log(`[Worker] Job ${job.id} completed for campaign ${result?.campaignId} in ${result?.duration}ms`);
});


campaignWorker.on("failed", async (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
  
  if (job?.data?.campaignId) {
    const campaignId = job.data.campaignId;
    try {
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: "failed" }
      });
      console.log(`[Worker] Updated campaign ${campaignId} status to "failed" in database`);
    } catch (dbErr: any) {
      console.error(`[Worker] Error marking campaign ${campaignId} status as failed:`, dbErr.message);
    }
  }
});
export { connection as redisConnection };
