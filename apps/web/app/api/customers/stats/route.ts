import { NextResponse } from "next/server";
import { db } from "@/lib/db";










export async function GET() {
  try {
    
    const [totalCustomers, rfmGroup] = await Promise.all([
      db.customer.count(),
      db.customer.groupBy({
        by: ["rfmTier"],
        _count: {
          _all: true
        }
      })
    ]);

    
    const rfmDistribution = {
      champion: 0,
      loyal: 0,
      promising: 0,
      at_risk: 0,
      lapsed: 0,
      new: 0,
      general: 0
    };

    
    for (const group of rfmGroup) {
      const count = group._count._all;
      const tier = group.rfmTier;
      if (!tier) continue;

      const tierLower = tier.toLowerCase();
      if (tierLower === "champions") {
        rfmDistribution.champion = count;
      } else if (tierLower === "loyal") {
        rfmDistribution.loyal = count;
      } else if (tierLower === "promising") {
        rfmDistribution.promising = count;
      } else if (tierLower === "at risk" || tierLower === "at_risk") {
        rfmDistribution.at_risk = count;
      } else if (tierLower === "lapsed") {
        rfmDistribution.lapsed = count;
      } else if (tierLower === "new") {
        rfmDistribution.new = count;
      } else if (tierLower === "general") {
        rfmDistribution.general = count;
      }
    }

    
    const orderAgg = await db.order.aggregate({
      _sum: {
        amountInr: true
      },
      _avg: {
        amountInr: true
      },
      _count: {
        _all: true
      }
    });

    const totalRevenue = orderAgg._sum.amountInr || 0;
    const avgOrderValue = orderAgg._avg.amountInr || 0;
    const totalOrders = orderAgg._count._all || 0;

    const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

    return NextResponse.json({
      totalCustomers,
      rfmDistribution,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrdersPerCustomer: Math.round(avgOrdersPerCustomer * 100) / 100
    });
  } catch (error: any) {
    console.error("GET /api/customers/stats error:", error);
    return NextResponse.json({ error: "Failed to load customer stats" }, { status: 500 });
  }
}
