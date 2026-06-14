import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ai/groq";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        segment: { select: { name: true, customerCount: true } },
        stats: true
      }
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    const stats = campaign.stats || {
      totalSent: 0, totalDelivered: 0, totalFailed: 0,
      totalOpened: 0, totalClicked: 0, totalOrdersAttributed: 0, attributedRevenueInr: 0
    };
    const deliveryRate = stats.totalSent > 0 ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : "0.0";
    const openRate = stats.totalDelivered > 0 ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1) : "0.0";
    const clickRate = stats.totalOpened > 0 ? ((stats.totalClicked / stats.totalOpened) * 100).toFixed(1) : "0.0";

    const systemPrompt = `You are an expert retail marketing analyst. Analyze campaign performance and write a concise 2-3 sentence summary in plain text. No markdown, no bold, no bullet points.`;

    const userPrompt = `Campaign: ${campaign.name}, Channel: ${campaign.channel}, Segment: ${campaign.segment?.name || "All"} (${campaign.segment?.customerCount || 0} customers), Sent: ${stats.totalSent}, Delivery: ${deliveryRate}%, Open: ${openRate}%, Click: ${clickRate}%, Orders: ${stats.totalOrdersAttributed}, Revenue: ₹${stats.attributedRevenueInr.toLocaleString()}. Write the insight summary.`;

    const insight = await generateText(systemPrompt, userPrompt, 200);
    return NextResponse.json({ insight: insight.trim() });
  } catch (error: any) {
    console.error("GET /api/ai/campaign-insight error:", error);
    return NextResponse.json({ error: "Failed to generate campaign insight" }, { status: 500 });
  }
}
