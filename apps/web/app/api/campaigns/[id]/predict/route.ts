import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const campaign = await db.campaign.findUnique({
            where: { id },
            include: { segment: true, stats: true },
        });
        if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

        // Pull historical campaigns on same channel to build baseline
        const historicalCampaigns = await db.campaign.findMany({
            where: {
                channel: campaign.channel,
                status: "completed",
                id: { not: id },
            },
            include: { stats: true },
            take: 20,
            orderBy: { createdAt: "desc" },
        });

        const withStats = historicalCampaigns.filter((c) => c.stats && c.stats.totalSent > 0);

        let avgDelivery = 0, avgOpen = 0, avgClick = 0, avgRevenue = 0;

        if (withStats.length > 0) {
            avgDelivery = withStats.reduce((sum, c) => {
                const s = c.stats!;
                return sum + (s.totalSent > 0 ? (s.totalDelivered / s.totalSent) * 100 : 0);
            }, 0) / withStats.length;

            avgOpen = withStats.reduce((sum, c) => {
                const s = c.stats!;
                return sum + (s.totalDelivered > 0 ? (s.totalOpened / s.totalDelivered) * 100 : 0);
            }, 0) / withStats.length;

            avgClick = withStats.reduce((sum, c) => {
                const s = c.stats!;
                return sum + (s.totalRead > 0 ? (s.totalClicked / s.totalRead) * 100 : 0);
            }, 0) / withStats.length;

            avgRevenue = withStats.reduce((sum, c) => sum + (c.stats!.attributedRevenueInr || 0), 0) / withStats.length;
        } else {
            // Channel-based defaults when no history
            avgDelivery = campaign.channel === "whatsapp" ? 94 : campaign.channel === "sms" ? 88 : 72;
            avgOpen = campaign.channel === "whatsapp" ? 47 : campaign.channel === "sms" ? 28 : 22;
            avgClick = campaign.channel === "whatsapp" ? 34 : campaign.channel === "sms" ? 18 : 14;
            avgRevenue = 0;
        }

        const segmentSize = campaign.segment.customerCount || 0;
        const estimatedDelivered = Math.floor(segmentSize * (avgDelivery / 100));
        const estimatedClicks = Math.floor(estimatedDelivered * (avgClick / 100));
        const estimatedRevenue = avgRevenue > 0
            ? Math.floor((estimatedClicks / Math.max(withStats[0]?.stats?.totalClicked || 1, 1)) * avgRevenue)
            : Math.floor(estimatedClicks * 450);

        // ── Best send time: analyse click timestamps from completed campaigns ──
        const completedCampaigns = await db.campaign.findMany({
            where: { channel: campaign.channel, status: "completed" },
            include: { communications: { select: { clickedAt: true } } },
            take: 30,
        });

        const hourClicks: Record<number, number> = {};
        const dayClicks: Record<number, number> = {};

        for (const c of completedCampaigns) {
            for (const log of c.communications) {
                if (log.clickedAt) {
                    const h = new Date(log.clickedAt).getHours();
                    const d = new Date(log.clickedAt).getDay();
                    hourClicks[h] = (hourClicks[h] || 0) + 1;
                    dayClicks[d] = (dayClicks[d] || 0) + 1;
                }
            }
        }

        let bestHour = 10, bestHourClicks = 0;
        for (const [h, clicks] of Object.entries(hourClicks)) {
            if (clicks > bestHourClicks) { bestHourClicks = clicks; bestHour = parseInt(h); }
        }

        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let bestDay = 2, bestDayCount = 0;
        for (const [d, count] of Object.entries(dayClicks)) {
            if (count > bestDayCount) { bestDayCount = count; bestDay = parseInt(d); }
        }

        const ampm = bestHour >= 12 ? "PM" : "AM";
        const hr12 = bestHour > 12 ? bestHour - 12 : bestHour || 12;
        const bestSendTime = `${dayNames[bestDay]} at ${hr12}${ampm}`;

        // ── Groq: generate human-readable AI insight ──────────────────────────
        const dataContext = `
Campaign: "${campaign.name}"
Channel: ${campaign.channel.toUpperCase()}
Segment: "${campaign.segment.name}" (${segmentSize.toLocaleString()} customers)
Historical campaigns analysed: ${withStats.length}
Avg delivery rate: ${avgDelivery.toFixed(1)}%
Avg open rate: ${avgOpen.toFixed(1)}%
Avg click rate: ${avgClick.toFixed(1)}%
Estimated deliveries: ${estimatedDelivered.toLocaleString()}
Estimated clicks: ${estimatedClicks.toLocaleString()}
Estimated revenue: ₹${(estimatedRevenue / 100000).toFixed(1)}L
Best send time based on historical engagement: ${bestSendTime}
`.trim();

        const systemPrompt = `You are an AI campaign analyst for an Indian D2C retail CRM.
Given historical performance data, write a concise 2-sentence prediction for this campaign.
Be specific, mention actual numbers, and end with the best send time recommendation.
Write in plain English. No markdown. No bullet points. Under 120 words.`;

        let groqInsight = "";
        try {
            groqInsight = await generateText(systemPrompt, dataContext, 200);
        } catch {
            // Fallback if Groq fails
            groqInsight = `This ${campaign.channel.toUpperCase()} campaign targeting "${campaign.segment.name}" is predicted to achieve ${avgClick.toFixed(1)}% CTR based on ${withStats.length} historical campaigns, delivering to ~${estimatedDelivered.toLocaleString()} customers. For best results, send on ${bestSendTime} — your highest engagement window.`;
        }

        return NextResponse.json({
            channel: campaign.channel,
            segmentSize,
            historicalCampaignsUsed: withStats.length,
            predictions: {
                deliveryRate: parseFloat(avgDelivery.toFixed(1)),
                openRate: parseFloat(avgOpen.toFixed(1)),
                clickRate: parseFloat(avgClick.toFixed(1)),
                estimatedDelivered,
                estimatedClicks,
                estimatedRevenueInr: estimatedRevenue,
            },
            bestSendTime,
            bestHour,
            insight: groqInsight.trim(),
        });
    } catch (error: any) {
        console.error("GET /api/campaigns/[id]/predict error:", error);
        return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
    }
}