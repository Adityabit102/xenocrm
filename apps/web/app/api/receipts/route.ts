import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { redisConnection } from "@/lib/queue/worker";
import { broadcastCampaignUpdate } from "@/lib/socket/server";


const receiptPayloadSchema = z.object({
  messageId: z.string(),
  eventType: z.string(), 
  eventId: z.string(),
  timestamp: z.string(),
  campaignId: z.string(),
  customerId: z.string(),
  metadata: z.object({
    amountInr: z.number().optional().nullable(),
    failureReason: z.string().optional().nullable()
  }).optional().nullable()
});






export async function POST(request: Request) {
  try {
    
    const secretHeader = request.headers.get("x-webhook-secret");
    const channelSecret = process.env.CHANNEL_SERVICE_SECRET || "demo-channel-secret";

    if (secretHeader !== channelSecret) {
      console.error("[Webhook] Unauthorized access: secret mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    
    try {
      const bodyJson = await request.json();
      const result = receiptPayloadSchema.safeParse(bodyJson);

      if (!result.success) {
        console.error("[Webhook] Validation failed:", result.error.format());
        return NextResponse.json({ status: "ignored", reason: "validation_failed" });
      }

      const {
        messageId,
        eventType,
        eventId,
        timestamp,
        campaignId,
        metadata
      } = result.data;

      
      const redisKey = `receipt:event:${eventId}`;
      const isDuplicate = await redisConnection.get(redisKey);

      if (isDuplicate) {
        console.log(`[Webhook] Duplicate event skipped: ${eventId}`);
        return NextResponse.json({ status: "skipped", reason: "duplicate" });
      }

      
      await redisConnection.set(redisKey, "1", "EX", 24 * 60 * 60);

      
      const dateVal = new Date(timestamp);
      const updateData: any = {
        status: eventType
      };

      if (eventType === "sent") updateData.sentAt = dateVal;
      else if (eventType === "delivered") updateData.deliveredAt = dateVal;
      else if (eventType === "opened") updateData.openedAt = dateVal;
      else if (eventType === "read") updateData.readAt = dateVal;
      else if (eventType === "clicked") updateData.clickedAt = dateVal;
      else if (eventType === "order_placed") updateData.orderPlacedAt = dateVal;

      if (metadata?.failureReason) {
        updateData.failureReason = metadata.failureReason;
      }

      const statsUpdate: any = {};
      if (eventType === "sent") statsUpdate.totalSent = { increment: 1 };
      else if (eventType === "delivered") statsUpdate.totalDelivered = { increment: 1 };
      else if (eventType === "failed") statsUpdate.totalFailed = { increment: 1 };
      else if (eventType === "opened") statsUpdate.totalOpened = { increment: 1 };
      else if (eventType === "read") statsUpdate.totalRead = { increment: 1 };
      else if (eventType === "clicked") statsUpdate.totalClicked = { increment: 1 };
      else if (eventType === "order_placed") {
        statsUpdate.totalOrdersAttributed = { increment: 1 };
        if (metadata?.amountInr) {
          statsUpdate.attributedRevenueInr = { increment: Number(metadata.amountInr) };
        }
      }

      
      const [_, updatedStats] = await db.$transaction([
        db.communicationLog.update({
          where: { id: messageId },
          data: updateData
        }),
        db.campaignStats.update({
          where: { campaignId },
          data: {
            ...statsUpdate,
            lastUpdated: new Date()
          }
        })
      ]);

      
      const deliveryRate = updatedStats.totalSent > 0 
        ? ((updatedStats.totalDelivered / updatedStats.totalSent) * 100).toFixed(1) 
        : "0.0";

      const openRate = updatedStats.totalDelivered > 0 
        ? ((updatedStats.totalOpened / updatedStats.totalDelivered) * 100).toFixed(1) 
        : "0.0";

      const clickRate = updatedStats.totalRead > 0 
        ? ((updatedStats.totalClicked / updatedStats.totalRead) * 100).toFixed(1) 
        : "0.0";

      const broadcastData = {
        ...updatedStats,
        deliveryRate,
        openRate,
        clickRate
      };

      
      try {
        broadcastCampaignUpdate(campaignId, "stats_updated", broadcastData);
      } catch (socketErr: any) {
        console.error("[Webhook] Socket.io broadcast failed:", socketErr.message);
      }

    } catch (procError: any) {
      console.error("[Webhook] Failed to process receipt data:", procError);
      
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("POST /api/receipts global error:", error);
    return NextResponse.json({ error: "Failed to process receipts" }, { status: 500 });
  }
}
