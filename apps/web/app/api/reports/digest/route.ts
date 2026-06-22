import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignCost, campaignRoi } from "@/lib/utils/channel-cost";

export const dynamic = "force-dynamic";

// Compiles a point-in-time performance digest — the payload a scheduled
// weekly email/report would carry.
export async function GET() {
  try {
    const [customers, campaignCount, statsAgg, campaigns, journeysActive, journeyAgg] = await Promise.all([
      db.customer.count(),
      db.campaign.count(),
      db.campaignStats.aggregate({
        _sum: { attributedRevenueInr: true, totalSent: true, totalDelivered: true, totalClicked: true },
      }),
      db.campaign.findMany({ include: { stats: true }, orderBy: { createdAt: "desc" }, take: 100 }),
      db.journey.count({ where: { status: "active" } }),
      db.journey.aggregate({ _sum: { sentCount: true } }),
    ]);

    const revenue = statsAgg._sum.attributedRevenueInr || 0;
    const sent = statsAgg._sum.totalSent || 0;
    const delivered = statsAgg._sum.totalDelivered || 0;
    const clicked = statsAgg._sum.totalClicked || 0;

    const topCampaigns = campaigns
      .map((c) => {
        const rev = c.stats?.attributedRevenueInr || 0;
        const st = c.stats?.totalSent || 0;
        return { id: c.id, name: c.name, channel: c.channel, sent: st, revenue: rev, roi: campaignRoi(rev, campaignCost(c.channel, st)) };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const chMap: Record<string, { channel: string; sent: number; revenue: number }> = {};
    for (const c of campaigns) {
      const ch = c.channel;
      chMap[ch] ||= { channel: ch, sent: 0, revenue: 0 };
      chMap[ch].sent += c.stats?.totalSent || 0;
      chMap[ch].revenue += c.stats?.attributedRevenueInr || 0;
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totals: {
        customers,
        campaigns: campaignCount,
        revenue,
        sent,
        delivered,
        clicked,
        ctr: delivered ? +((clicked / delivered) * 100).toFixed(1) : 0,
      },
      journeys: { active: journeysActive, sent: journeyAgg._sum.sentCount || 0 },
      topCampaigns,
      channels: Object.values(chMap),
    });
  } catch (error: any) {
    console.error("GET /api/reports/digest error:", error);
    return NextResponse.json({ error: "Failed to compile digest" }, { status: 500 });
  }
}
