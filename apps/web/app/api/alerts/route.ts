import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Derived alerts/anomalies surfaced in the topbar bell.
export async function GET() {
  try {
    const alerts: { id: string; level: "critical" | "warning" | "info"; title: string; body: string }[] = [];

    const campaigns = await db.campaign.findMany({ include: { stats: true } });
    for (const c of campaigns) {
      const s = c.stats;
      if (!s || s.totalSent < 20) continue;
      const dr = (s.totalDelivered / s.totalSent) * 100;
      if (dr < 60) {
        alerts.push({ id: `dr-${c.id}`, level: "critical", title: "Low delivery rate", body: `${c.name} is delivering at ${dr.toFixed(0)}%.` });
      }
    }

    const [pending, highChurn, optouts] = await Promise.all([
      db.campaign.count({ where: { approvalStatus: "pending" } }),
      db.customer.count({ where: { churnScore: { gte: 70 } } }),
      db.customer.count({ where: { optOutAt: { gte: new Date(Date.now() - 7 * 86_400_000) } } }),
    ]);

    if (pending > 0) alerts.push({ id: "approvals", level: "warning", title: "Campaigns awaiting approval", body: `${pending} campaign${pending > 1 ? "s" : ""} need review.` });
    if (highChurn > 0) alerts.push({ id: "churn", level: "warning", title: "High churn risk", body: `${highChurn.toLocaleString()} customers at high risk of churning.` });
    if (optouts > 0) alerts.push({ id: "optouts", level: "info", title: "Recent opt-outs", body: `${optouts} customers opted out in the last 7 days.` });

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
