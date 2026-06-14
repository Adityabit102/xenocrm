import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Called by Vercel Cron every hour: vercel.json → { "crons": [{ "path": "/api/cron/attribution", "schedule": "0 * * * *" }] }
export async function GET(request: Request) {
    try {
        // Verify cron secret to prevent unauthorized calls
        const authHeader = request.headers.get("authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find all clicked communication logs within last 7 days that haven't been attributed yet
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const clickedLogs = await db.communicationLog.findMany({
            where: {
                clickedAt: { gte: sevenDaysAgo, not: null },
                orderPlacedAt: null, // not yet attributed
                status: { in: ["clicked", "delivered", "opened", "read"] },
            },
            select: {
                id: true,
                customerId: true,
                campaignId: true,
                clickedAt: true,
            },
        });

        if (clickedLogs.length === 0) {
            return NextResponse.json({ attributed: 0, message: "No unattributed clicks found" });
        }

        let attributedCount = 0;
        let totalRevenue = 0;

        for (const log of clickedLogs) {
            if (!log.clickedAt) continue;

            // Check if customer placed an order within 7 days after clicking
            const order = await db.order.findFirst({
                where: {
                    customerId: log.customerId,
                    orderDate: {
                        gte: log.clickedAt,
                        lte: new Date(log.clickedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { orderDate: "asc" },
            });

            if (order) {
                // Mark the log as attributed
                await db.communicationLog.update({
                    where: { id: log.id },
                    data: { orderPlacedAt: order.orderDate },
                });

                // Update campaign stats
                await db.campaignStats.update({
                    where: { campaignId: log.campaignId },
                    data: {
                        totalOrdersAttributed: { increment: 1 },
                        attributedRevenueInr: { increment: order.amountInr },
                    },
                });

                attributedCount++;
                totalRevenue += order.amountInr;
            }
        }

        console.log(`[Attribution] Attributed ${attributedCount} orders, ₹${totalRevenue.toLocaleString()} revenue`);

        return NextResponse.json({
            success: true,
            attributed: attributedCount,
            totalRevenueAttributed: totalRevenue,
            checkedLogs: clickedLogs.length,
            runAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("[Attribution Cron] Error:", error);
        return NextResponse.json({ error: "Attribution run failed" }, { status: 500 });
    }
}