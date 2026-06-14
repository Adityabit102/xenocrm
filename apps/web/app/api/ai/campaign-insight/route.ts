import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateText } from "ai";
import { claudeClient } from "@/lib/ai/groq";






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
        segment: {
          select: {
            name: true,
            customerCount: true
          }
        },
        stats: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const stats = campaign.stats || {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalOrdersAttributed: 0,
      attributedRevenueInr: 0
    };

    const deliveryRate = stats.totalSent > 0 ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : "0.0";
    const openRate = stats.totalDelivered > 0 ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1) : "0.0";
    const clickRate = stats.totalOpened > 0 ? ((stats.totalClicked / stats.totalOpened) * 100).toFixed(1) : "0.0";

    const prompt = `
Campaign Name: ${campaign.name}
Channel: ${campaign.channel}
Target Segment: ${campaign.segment?.name || "All Users"}
Recipient Count: ${campaign.segment?.customerCount || 0}
Sent: ${stats.totalSent}
Delivered: ${stats.totalDelivered} (${deliveryRate}%)
Failed: ${stats.totalFailed}
Opened: ${stats.totalOpened} (${openRate}%)
Clicked: ${stats.totalClicked} (${clickRate}%)
Orders Attributed: ${stats.totalOrdersAttributed}
Revenue Attributed: INR ${stats.attributedRevenueInr.toLocaleString()}
`;

    const systemPrompt = `
You are an expert retail brand marketing analyst.
Analyze the campaign performance numbers provided and generate a concise 2-3 sentence summary.
Format the summary exactly like:
"Your campaign reached {X} shoppers with {Y}% delivery rate. We observed a {Z}% open rate and {A}% click-through, driving {B} orders and ₹{C} in attributed revenue. Suggestions: [brief recommendation based on channel/rates]."
Keep the tone professional, direct, and action-oriented. Never output markdown formatting (such as **bold** or *italics*), just plain text.
If stats are all zero, write a short preview sentence: "Your campaign targets {X} shoppers via {channel}. Once launched, live conversion metrics, open rates, and attributed revenue will stream here in real-time."
`;

    
    if (!process.env.ANTHROPIC_API_KEY) {
      const fallbackMsg = stats.totalSent > 0
        ? `Your campaign reached ${stats.totalSent.toLocaleString()} shoppers with ${deliveryRate}% delivery rate. We observed a ${openRate}% open rate and ${clickRate}% click-through, driving ${stats.totalOrdersAttributed} orders and ₹${stats.attributedRevenueInr.toLocaleString()} in attributed revenue. Suggestions: Monitor delivery channels for any latency.`
        : `Your campaign targets ${campaign.segment?.customerCount || 0} shoppers via ${campaign.channel.toUpperCase()}. Once launched, live conversion metrics, open rates, and attributed revenue will stream here in real-time.`;
      return NextResponse.json({ insight: fallbackMsg });
    }

    const { text } = await generateText({
      model: claudeClient as any,
      system: systemPrompt,
      prompt: prompt,
    });

    return NextResponse.json({ insight: text.trim() });
  } catch (error: any) {
    console.error("GET /api/ai/campaign-insight error:", error);
    return NextResponse.json({ error: "Failed to generate campaign insight" }, { status: 500 });
  }
}
