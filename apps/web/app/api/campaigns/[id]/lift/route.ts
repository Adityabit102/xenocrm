import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Incremental lift: compares post-send conversion of the treated group vs the
// withheld control (holdout) group over a 7-day window.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const logs = await db.communicationLog.findMany({
      where: { campaignId: id },
      select: { customerId: true, status: true },
    });
    const controlIds = logs.filter((l) => l.status === "holdout").map((l) => l.customerId);
    const treatmentIds = logs.filter((l) => l.status !== "holdout").map((l) => l.customerId);

    const start = campaign.createdAt;
    const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);

    const ordersFor = async (ids: string[]) =>
      ids.length
        ? db.order.findMany({
            where: { customerId: { in: ids }, orderDate: { gte: start, lte: end } },
            select: { customerId: true, amountInr: true },
          })
        : [];

    const [tOrders, cOrders] = await Promise.all([ordersFor(treatmentIds), ordersFor(controlIds)]);
    const tConverters = new Set(tOrders.map((o) => o.customerId)).size;
    const cConverters = new Set(cOrders.map((o) => o.customerId)).size;
    const tRate = treatmentIds.length ? tConverters / treatmentIds.length : 0;
    const cRate = controlIds.length ? cConverters / controlIds.length : 0;
    const liftPct = (tRate - cRate) * 100;

    const tRevenue = tOrders.reduce((s, o) => s + o.amountInr, 0);
    const avgOrder = tOrders.length ? tRevenue / tOrders.length : 0;
    const incrementalRevenue = Math.round((tRate - cRate) * treatmentIds.length * avgOrder);

    return NextResponse.json({
      holdoutPct: campaign.holdoutPct,
      hasControl: controlIds.length > 0,
      treatment: { size: treatmentIds.length, converters: tConverters, rate: +(tRate * 100).toFixed(2) },
      control: { size: controlIds.length, converters: cConverters, rate: +(cRate * 100).toFixed(2) },
      liftPct: +liftPct.toFixed(2),
      incrementalRevenue,
    });
  } catch (error: any) {
    console.error("GET /api/campaigns/[id]/lift error:", error);
    return NextResponse.json({ error: "Failed to compute lift" }, { status: 500 });
  }
}
