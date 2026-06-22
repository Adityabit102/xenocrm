import { NextResponse } from "next/server";
import { db } from "@/lib/db";









export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    
    const [customer, orderStats, categoryGroup] = await Promise.all([
      db.customer.findUnique({
        where: { id },
        include: {
          orders: {
            orderBy: { orderDate: "desc" },
            take: 20
          },
          communications: {
            orderBy: { queuedAt: "desc" },
            take: 30,
            include: {
              campaign: {
                select: {
                  name: true
                }
              }
            }
          },
          segmentMemberships: {
            include: {
              segment: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),

      db.order.aggregate({
        where: { customerId: id },
        _sum: { amountInr: true },
        _count: { _all: true },
        _max: { orderDate: true }
      }),

      db.order.groupBy({
        by: ["category"],
        where: { customerId: id, category: { not: null } },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: "desc"
          }
        },
        take: 1
      })
    ]);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    
    const totalSpend = orderStats._sum.amountInr || 0;
    const orderCount = orderStats._count._all || 0;
    const lastOrderDate = orderStats._max.orderDate;

    let daysSinceLastOrder: number | null = null;
    if (lastOrderDate) {
      const diffMs = new Date().getTime() - new Date(lastOrderDate).getTime();
      daysSinceLastOrder = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const favouriteCategory = categoryGroup.length > 0 ? categoryGroup[0].category : "None";

    
    const responsePayload = {
      ...customer,
      communications: customer.communications.map((c: any) => ({
        id: c.id,
        campaignId: c.campaignId,
        campaignName: c.campaign.name,
        channel: c.channel,
        renderedMessage: c.renderedMessage,
        status: c.status,
        failureReason: c.failureReason,
        queuedAt: c.queuedAt,
        sentAt: c.sentAt,
        deliveredAt: c.deliveredAt,
        openedAt: c.openedAt,
        readAt: c.readAt,
        clickedAt: c.clickedAt,
        orderPlacedAt: c.orderPlacedAt
      })),
      favouriteCategory: favouriteCategory || "None",
      totalSpend: Math.round(totalSpend * 100) / 100,
      orderCount,
      daysSinceLastOrder
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch customer profile details" }, { status: 500 });
  }
}

// Toggle marketing consent (opt-out / opt back in)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: any = {};
    if (typeof body.marketingConsent === "boolean") {
      data.marketingConsent = body.marketingConsent;
      data.optOutAt = body.marketingConsent ? null : new Date();
    }
    const customer = await db.customer.update({ where: { id }, data });
    return NextResponse.json({ id: customer.id, marketingConsent: customer.marketingConsent, optOutAt: customer.optOutAt });
  } catch (error: any) {
    console.error("PATCH /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Failed to update consent" }, { status: 500 });
  }
}
