import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeScores, OrderLite } from "@/lib/scores";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Recompute CLV + churn-propensity for every customer from their order history.
export async function POST() {
  try {
    const [customers, orders] = await Promise.all([
      db.customer.findMany({ select: { id: true } }),
      db.order.findMany({ select: { customerId: true, orderDate: true, amountInr: true } }),
    ]);

    const byCustomer = new Map<string, OrderLite[]>();
    for (const o of orders) {
      const arr = byCustomer.get(o.customerId) || [];
      arr.push(o);
      byCustomer.set(o.customerId, arr);
    }

    const now = new Date();
    const ops = customers.map((c) => {
      const { clv, churn } = computeScores(byCustomer.get(c.id) || [], now);
      return db.customer.update({ where: { id: c.id }, data: { clvScore: clv, churnScore: churn } });
    });

    const BATCH = 50;
    let updated = 0;
    for (let i = 0; i < ops.length; i += BATCH) {
      await db.$transaction(ops.slice(i, i + BATCH));
      updated += Math.min(BATCH, ops.length - i);
    }

    return NextResponse.json({ updated });
  } catch (error: any) {
    console.error("POST /api/customers/recompute-scores error:", error);
    return NextResponse.json({ error: "Failed to recompute scores" }, { status: 500 });
  }
}
