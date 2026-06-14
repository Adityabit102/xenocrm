import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateStructuredOutput } from "@/lib/ai/groq";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SuggestionsSchema = z.object({
    suggestions: z.array(z.object({
        title: z.string(),
        description: z.string(),
        segmentQuery: z.string(),
        channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
        expectedRevenue: z.string(),
        urgency: z.enum(["high", "medium", "low"]),
        customerCount: z.number(),
    })).min(1).max(3),
});

export async function GET() {
    try {
        // Gather live data signals
        const [
            totalCustomers,
            lapsedCustomers,
            atRiskCustomers,
            recentCampaigns,
            topSegments,
        ] = await Promise.all([
            db.customer.count(),
            db.customer.count({ where: { rfmTier: "Lapsed" } }),
            db.customer.count({ where: { rfmTier: "At Risk" } }),
            db.campaign.findMany({
                where: { status: "completed" },
                include: { stats: true },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
            db.segment.findMany({
                orderBy: { customerCount: "desc" },
                take: 5,
            }),
        ]);

        // Calculate avg revenue per completed campaign
        const avgRevenuePerCampaign = recentCampaigns.length > 0
            ? recentCampaigns.reduce((sum, c) => sum + (c.stats?.attributedRevenueInr || 0), 0) / recentCampaigns.length
            : 0;

        // Best performing channel
        const channelPerf: Record<string, { clicks: number; count: number }> = {};
        for (const c of recentCampaigns) {
            const ch = c.channel;
            if (!channelPerf[ch]) channelPerf[ch] = { clicks: 0, count: 0 };
            channelPerf[ch].clicks += c.stats?.totalClicked || 0;
            channelPerf[ch].count += 1;
        }
        const bestChannel = Object.entries(channelPerf)
            .sort((a, b) => (b[1].clicks / Math.max(b[1].count, 1)) - (a[1].clicks / Math.max(a[1].count, 1)))[0]?.[0] || "whatsapp";

        const systemPrompt = `You are an AI CRM strategist for Indian D2C retail brands. 
Analyze customer data and generate exactly 3 autonomous campaign suggestions in JSON.
Each suggestion must be actionable, specific, and reference real data signals.
Currency is INR. Be specific about customer counts and revenue estimates.
Return ONLY valid JSON matching the schema. No markdown, no explanation.`;

        const userMessage = `Customer data signals:
- Total customers: ${totalCustomers.toLocaleString()}
- Lapsed customers (90+ days): ${lapsedCustomers.toLocaleString()}
- At-risk customers: ${atRiskCustomers.toLocaleString()}
- Best performing channel: ${bestChannel}
- Avg revenue per campaign: ₹${Math.floor(avgRevenuePerCampaign).toLocaleString()}
- Top segments: ${topSegments.map(s => `${s.name} (${s.customerCount} customers)`).join(", ")}
- Recent campaigns run: ${recentCampaigns.length}

Generate 3 specific, data-driven campaign suggestions. Mix urgency levels. 
For expectedRevenue, use format like "₹2.4L" or "₹85K".
For segmentQuery, write a natural language segment description like "customers who haven't ordered in 90 days".
customerCount must be a realistic number based on the data provided.`;

        const result = await generateStructuredOutput(systemPrompt, userMessage, SuggestionsSchema);

        return NextResponse.json({
            suggestions: result.suggestions,
            generatedAt: new Date().toISOString(),
            dataSignals: {
                totalCustomers,
                lapsedCustomers,
                atRiskCustomers,
                bestChannel,
                avgRevenuePerCampaign: Math.floor(avgRevenuePerCampaign),
            },
        });
    } catch (error: any) {
        console.error("GET /api/dashboard/suggestions error:", error);

        // Fallback static suggestions if AI fails
        return NextResponse.json({
            suggestions: [
                {
                    title: "Win back lapsed buyers",
                    description: "Customers who haven't purchased in 90+ days. A personalised WhatsApp with a 10% offer historically recovers 18% of this group.",
                    segmentQuery: "customers who haven't ordered in 90 days",
                    channel: "whatsapp",
                    expectedRevenue: "₹2.7L",
                    urgency: "high",
                    customerCount: 273,
                },
                {
                    title: "Upsell to at-risk VIPs",
                    description: "High-spend customers showing declining engagement. A targeted email with new arrivals can re-activate before they fully churn.",
                    segmentQuery: "customers with high spend who haven't ordered in 45 days",
                    channel: "email",
                    expectedRevenue: "₹1.4L",
                    urgency: "medium",
                    customerCount: 89,
                },
                {
                    title: "First repeat purchase nudge",
                    description: "First-time buyers from last 30 days — the critical window for turning one-time buyers into loyal customers.",
                    segmentQuery: "customers who made their first order in the last 30 days",
                    channel: "sms",
                    expectedRevenue: "₹60K",
                    urgency: "low",
                    customerCount: 142,
                },
            ],
            generatedAt: new Date().toISOString(),
            fallback: true,
        });
    }
}