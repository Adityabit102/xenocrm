import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const receiptPayloadSchema = z.object({
  messageId: z.string(),
  eventType: z.string(),
  eventId: z.string().optional(),
  timestamp: z.string().optional(),
  campaignId: z.string().optional(),
  customerId: z.string().optional(),
  metadata: z.any().optional(),
});

const RECEIPT_SECRET = process.env.CRM_RECEIPT_SECRET || "dev-secret-change-in-production";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== RECEIPT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = receiptPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { messageId, eventType, eventId, timestamp, campaignId, customerId, metadata } = parsed.data;

    const log = await db.communicationLog.findUnique({ where: { id: messageId } });
    if (!log) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const now = timestamp ? new Date(timestamp) : new Date();

    // Update log based on event type
    const updateData: any = { status: eventType };
    if (eventType === "sent") updateData.sentAt = now;
    if (eventType === "delivered") updateData.deliveredAt = now;
    if (eventType === "opened") updateData.openedAt = now;
    if (eventType === "read") updateData.readAt = now;
    if (eventType === "clicked") updateData.clickedAt = now;
    if (eventType === "order_placed") updateData.orderPlacedAt = now;
    if (eventType === "failed") updateData.failureReason = metadata?.reason || "Delivery failed";

    await db.communicationLog.update({ where: { id: messageId }, data: updateData });

    // Update campaign stats
    if (log.campaignId) {
      const statsUpdate: any = {};
      if (eventType === "delivered") statsUpdate.totalDelivered = { increment: 1 };
      if (eventType === "failed") statsUpdate.totalFailed = { increment: 1 };
      if (eventType === "opened") statsUpdate.totalOpened = { increment: 1 };
      if (eventType === "read") statsUpdate.totalRead = { increment: 1 };
      if (eventType === "clicked") statsUpdate.totalClicked = { increment: 1 };
      if (eventType === "order_placed") {
        statsUpdate.totalOrdersAttributed = { increment: 1 };
        statsUpdate.attributedRevenueInr = { increment: metadata?.amountInr || 0 };
      }

      if (Object.keys(statsUpdate).length > 0) {
        // Build create data with plain numbers (increment not valid in create)
        const createData: any = {
          campaignId: log.campaignId,
          totalSent: 0, totalDelivered: 0, totalFailed: 0,
          totalOpened: 0, totalRead: 0, totalClicked: 0,
          totalOrdersAttributed: 0, attributedRevenueInr: 0,
        };
        // Convert increment objects to plain numbers for create
        for (const [key, val] of Object.entries(statsUpdate)) {
          if (val && typeof val === "object" && "increment" in val) {
            createData[key] = (val as any).increment;
          } else {
            createData[key] = val;
          }
        }
        await db.campaignStats.upsert({
          where: { campaignId: log.campaignId },
          create: createData,
          update: statsUpdate,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/receipts error:", error);
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
