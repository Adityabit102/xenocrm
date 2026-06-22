import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const where: any = {};
    if (channel) where.channel = channel;
    const templates = await db.messageTemplate.findMany({ where, orderBy: { updatedAt: "desc" } });

    // Template performance: aggregate stats of campaigns that used this exact copy.
    const campaigns = await db.campaign.findMany({ select: { messageTemplate: true, stats: true } });
    const withPerf = templates.map((t) => {
      const matches = campaigns.filter((c) => c.messageTemplate === t.body);
      let sent = 0, delivered = 0, opened = 0, clicked = 0, revenue = 0;
      for (const m of matches) {
        const s = m.stats;
        if (!s) continue;
        sent += s.totalSent; delivered += s.totalDelivered; opened += s.totalOpened; clicked += s.totalClicked; revenue += s.attributedRevenueInr;
      }
      return {
        ...t,
        perf: {
          uses: matches.length,
          sent,
          openRate: delivered ? +((opened / delivered) * 100).toFixed(1) : 0,
          clickRate: opened ? +((clicked / opened) * 100).toFixed(1) : 0,
          revenue: Math.round(revenue),
        },
      };
    });

    return NextResponse.json(withPerf);
  } catch (error: any) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, channel, body } = await request.json();
    if (!name || !channel || !body) {
      return NextResponse.json({ error: "name, channel and body are required" }, { status: 400 });
    }
    const template = await db.messageTemplate.create({ data: { name, channel, body } });
    await logAudit("demo@cove.io", "template.created", `${name} (${channel})`);
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/templates error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
