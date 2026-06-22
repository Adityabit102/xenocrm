import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const EVENT_TYPES = ["product_viewed", "cart_created", "cart_updated", "checkout_started", "cart_abandoned"];

/* ============================================================
   Storefront event ingestion
   POST behavioural events (cart/browse) so journey triggers can
   act on real activity instead of an RFM proxy. Resolves the
   customer by externalId when provided.
   ============================================================ */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body.type || "");
    if (!EVENT_TYPES.includes(type)) {
      return NextResponse.json({ error: `type must be one of ${EVENT_TYPES.join(", ")}` }, { status: 400 });
    }

    let customerId: string | null = body.customerId || null;
    if (!customerId && body.externalId) {
      const c = await db.customer.findUnique({ where: { externalId: String(body.externalId) }, select: { id: true } });
      customerId = c?.id || null;
    }

    const event = await db.event.create({
      data: {
        type,
        customerId,
        externalId: body.externalId ? String(body.externalId) : null,
        value: body.value != null ? Number(body.value) : null,
        metadata: body.metadata ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: event.id, resolvedCustomer: !!customerId }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const where: any = {};
    if (type) where.type = type;
    const events = await db.event.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json(events);
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
