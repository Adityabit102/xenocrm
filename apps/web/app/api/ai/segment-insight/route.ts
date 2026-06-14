import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { executeSegmentRules } from "@/lib/segment-engine/executor";
import { generateText } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

interface SegmentStats {
  count: number;
  topCities: Array<{ city: string; count: number }>;
  genderSplit: Record<string, number>;
  avgSpend: number;
  topCategories: Array<{ category: string; count: number }>;
}







export async function POST(request: Request) {
  try {
    
    const session = process.env.BYPASS_AUTH === "true"
      ? { user: { name: "Test User", email: "test@example.com" } }
      : await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    
    if (body.campaignName) {
      const {
        campaignName, segmentName, channel,
        totalSent, deliveryRate, openRate, clickRate, revenue, status,
      } = body;

      const systemPrompt = `You are AutoReach, an AI marketing analyst for XenoCRM, an Indian retail CRM.
Analyze campaign performance data and provide clear, actionable insights in plain text.
Write 3-4 short paragraphs: performance summary, what worked well, what needs improvement, and one concrete recommendation.
No markdown, no bullet points, no headers. Plain conversational text only.`;

      const userMessage = `Campaign: "${campaignName}"
Segment: ${segmentName}
Channel: ${channel}
Status: ${status}
Total Sent: ${Number(totalSent || 0).toLocaleString()}
Delivery Rate: ${deliveryRate}%
Open Rate: ${openRate}%
Click Rate: ${clickRate}%
Revenue Attributed: ₹${Number(revenue || 0).toLocaleString("en-IN")}

Provide a concise performance analysis with actionable recommendations for this Indian retail campaign.`;

      const insight = await generateText(systemPrompt, userMessage, 512);
      return NextResponse.json({ insight, stats: null });
    }

    
    const { segmentId, rules: requestRules } = body;
    let rules: any = null;

    if (segmentId) {
      const segment = await db.segment.findUnique({ where: { id: segmentId } });
      if (!segment) {
        return NextResponse.json({ error: "Segment not found" }, { status: 404 });
      }
      rules = segment.filterRules;
    } else if (requestRules) {
      rules = requestRules;
    } else {
      return NextResponse.json(
        { error: "Payload must contain segmentId, rules, or campaignName" },
        { status: 400 }
      );
    }

    
    const where = executeSegmentRules(rules);

    
    const count = await db.customer.count({ where });

    const citiesGroup = await db.customer.groupBy({
      by: ["city"],
      where,
      _count: { id: true },
    });

    const topCities = citiesGroup
      .map((c) => ({ city: c.city || "Unknown", count: c._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const gendersGroup = await db.customer.groupBy({
      by: ["gender"],
      where,
      _count: { id: true },
    });

    const genderSplit = gendersGroup.reduce((acc, g) => {
      const label = g.gender ? g.gender.toLowerCase() : "unknown";
      acc[label] = g._count.id;
      return acc;
    }, {} as Record<string, number>);

    const orders = await db.order.findMany({
      where: { customer: where },
      select: { amountInr: true, category: true },
    });

    const totalOrders = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + o.amountInr, 0);
    const avgSpend = totalOrders > 0 ? parseFloat((totalSpend / totalOrders).toFixed(2)) : 0;

    const categoryMap: Record<string, number> = {};
    for (const o of orders) {
      if (o.category) categoryMap[o.category] = (categoryMap[o.category] || 0) + 1;
    }

    const topCategories = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stats: SegmentStats = { count, topCities, genderSplit, avgSpend, topCategories };

    
    const categoriesStr = topCategories.length > 0
      ? topCategories.slice(0, 3).map((c) => c.category).join(", ")
      : "our product catalog";

    const citiesStr = topCities.length > 0
      ? topCities.slice(0, 3).map((c) => c.city).join(", ")
      : "various locations";

    const formattedAvgSpend = Math.round(avgSpend).toLocaleString("en-IN");
    const fallbackInsight = `This segment of ${count.toLocaleString()} customers averages ₹${formattedAvgSpend} spend per order, predominantly shops in ${categoriesStr}, and is most active in ${citiesStr}.`;

    
    let insight = fallbackInsight;

    const hasGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "";

    if (hasGroqKey) {
      try {
        const systemPrompt = `You are an expert CRM retail marketing analyst for an Indian brand.
Analyze the target segment demographics provided and generate a concise 2-3 sentence performance summary.
Ensure the insight contains a statement structured exactly like:
"This segment of {count} customers averages ₹{avgSpend} spend per order, predominantly shops in {categories}, and is most active in {cities}."
Do not use markdown formatting. Keep it plain text.`;

        const userMessage = `Segment Size: ${count} customers
Average Spend per Order: INR ${avgSpend.toFixed(2)}
Gender Breakdown: ${JSON.stringify(genderSplit)}
Top Cities: ${topCities.map((c) => `${c.city} (${c.count})`).join(", ")}
Top Categories: ${topCategories.map((c) => `${c.category} (${c.count})`).join(", ")}`;

        insight = await generateText(systemPrompt, userMessage, 256);
        if (!insight.trim()) insight = fallbackInsight;
      } catch (err) {
        console.error("Groq segment insight error:", err);
        insight = fallbackInsight;
      }
    }

    
    return NextResponse.json({ insight, stats });

  } catch (error: any) {
    console.error("POST /api/ai/segment-insight error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}