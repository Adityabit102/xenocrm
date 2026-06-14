import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSegmentCustomerIds } from "@/lib/segment-engine/executor";
import { personaliseMessage } from "@/lib/utils/personalise";

export const dynamic = "force-dynamic";

const abTestSchema = z.object({
    messageA: z.string().min(1, "Message A is required"),
    messageB: z.string().min(1, "Message B is required"),
    nameA: z.string().optional().default("Variant A"),
    nameB: z.string().optional().default("Variant B"),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const result = abTestSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
        }
        const { messageA, messageB, nameA, nameB } = result.data;

        const campaign = await db.campaign.findUnique({
            where: { id },
            include: { segment: true },
        });
        if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        if (campaign.status !== "draft") {
            return NextResponse.json({ error: "A/B test can only be set up on draft campaigns" }, { status: 400 });
        }

        // Get all customer IDs for this segment
        const allCustomerIds = await getSegmentCustomerIds(campaign.segment.filterRules);
        if (allCustomerIds.length < 2) {
            return NextResponse.json({ error: "Segment must have at least 2 customers for A/B testing" }, { status: 400 });
        }

        // Shuffle and split 50/50
        const shuffled = [...allCustomerIds].sort(() => Math.random() - 0.5);
        const mid = Math.floor(shuffled.length / 2);
        const groupA = shuffled.slice(0, mid);
        const groupB = shuffled.slice(mid);

        // Fetch customers
        const customers = await db.customer.findMany({
            where: { id: { in: allCustomerIds } },
        });
        const customerMap = new Map(customers.map((c) => [c.id, c]));

        // Create communication logs for group A
        const logsA = [];
        for (const cid of groupA) {
            const customer = customerMap.get(cid);
            if (!customer) continue;
            const log = await db.communicationLog.create({
                data: {
                    campaignId: id,
                    customerId: cid,
                    channel: campaign.channel,
                    renderedMessage: personaliseMessage(messageA, customer),
                    status: "queued",
                },
            });
            logsA.push(log);
        }

        // Create communication logs for group B
        const logsB = [];
        for (const cid of groupB) {
            const customer = customerMap.get(cid);
            if (!customer) continue;
            const log = await db.communicationLog.create({
                data: {
                    campaignId: id,
                    customerId: cid,
                    channel: campaign.channel,
                    renderedMessage: personaliseMessage(messageB, customer),
                    status: "queued",
                },
            });
            logsB.push(log);
        }

        // Update campaign status to in_progress and store A/B meta in agentReasoningTrace
        await db.campaign.update({
            where: { id },
            data: {
                status: "in_progress",
                agentReasoningTrace: {
                    abTest: true,
                    variantA: { name: nameA, message: messageA, size: groupA.length },
                    variantB: { name: nameB, message: messageB, size: groupB.length },
                },
            },
        });

        // Upsert stats
        await db.campaignStats.upsert({
            where: { campaignId: id },
            create: {
                campaignId: id,
                totalSent: logsA.length + logsB.length,
                totalDelivered: 0, totalFailed: 0, totalOpened: 0,
                totalRead: 0, totalClicked: 0, totalOrdersAttributed: 0, attributedRevenueInr: 0,
            },
            update: { totalSent: logsA.length + logsB.length },
        });

        return NextResponse.json({
            success: true,
            abTest: {
                variantA: { name: nameA, size: groupA.length, logsCreated: logsA.length },
                variantB: { name: nameB, size: groupB.length, logsCreated: logsB.length },
                total: logsA.length + logsB.length,
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/campaigns/[id]/abtest error:", error);
        return NextResponse.json({ error: "A/B test setup failed" }, { status: 500 });
    }
}