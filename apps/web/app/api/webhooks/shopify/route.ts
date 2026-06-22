import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateRFM } from "@/lib/rfm/scorer";

export const dynamic = "force-dynamic";

/* ============================================================
   Shopify webhook ingestion
   Accepts customers/create|update and orders/create payloads
   (topic via the X-Shopify-Topic header), upserts into Cove and
   recomputes RFM for affected customers — no CSV needed.
   Set SHOPIFY_WEBHOOK_SECRET to require x-cove-webhook-secret.
   ============================================================ */

function authorized(req: Request): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return true; // open in dev
  return req.headers.get("x-cove-webhook-secret") === secret;
}

async function recomputeRfm(customerId: string) {
  const orders = await db.order.findMany({ where: { customerId }, select: { orderDate: true, amountInr: true } });
  if (!orders.length) return;
  const rfm = calculateRFM(orders as any, new Date());
  await db.customer.update({
    where: { id: customerId },
    data: { rfmRecency: rfm.recency, rfmFrequency: rfm.frequency, rfmMonetary: rfm.monetary, rfmTier: rfm.rfmTier },
  });
}

export async function POST(req: Request) {
  try {
    if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const topic = (req.headers.get("x-shopify-topic") || "").toLowerCase();
    const body = await req.json();
    const t = topic || (body.topic || "");

    // ── customers/create | customers/update ──
    if (t.includes("customer")) {
      const c = body.customer || body;
      const externalId = String(c.id ?? c.external_id ?? "");
      if (!externalId) return NextResponse.json({ error: "Missing customer id" }, { status: 400 });
      const customer = await db.customer.upsert({
        where: { externalId },
        create: {
          externalId,
          firstName: c.first_name || c.firstName || "Shopify",
          lastName: c.last_name || c.lastName || "Customer",
          email: c.email || null,
          phone: c.phone || c.default_address?.phone || null,
          city: c.default_address?.city || c.city || null,
        },
        update: {
          email: c.email || undefined,
          phone: c.phone || undefined,
          city: c.default_address?.city || undefined,
        },
      });
      return NextResponse.json({ ok: true, type: "customer", id: customer.id });
    }

    // ── orders/create ──
    if (t.includes("order")) {
      const o = body.order || body;
      const shopCustomer = o.customer || {};
      const externalId = String(shopCustomer.id ?? o.customer_id ?? "");
      if (!externalId) return NextResponse.json({ error: "Missing customer id on order" }, { status: 400 });

      const customer = await db.customer.upsert({
        where: { externalId },
        create: {
          externalId,
          firstName: shopCustomer.first_name || "Shopify",
          lastName: shopCustomer.last_name || "Customer",
          email: o.email || shopCustomer.email || null,
          phone: shopCustomer.phone || null,
          city: o.shipping_address?.city || null,
        },
        update: {},
      });

      const amount = parseFloat(o.total_price ?? o.amount ?? "0") || 0;
      const category = o.line_items?.[0]?.product_type || o.line_items?.[0]?.title || null;
      await db.order.create({
        data: {
          customerId: customer.id,
          orderDate: o.created_at ? new Date(o.created_at) : new Date(),
          amountInr: amount,
          category,
          channel: "online",
          status: o.financial_status || "paid",
        },
      });
      await recomputeRfm(customer.id);
      return NextResponse.json({ ok: true, type: "order", customerId: customer.id, amount });
    }

    return NextResponse.json({ error: `Unsupported topic '${t}'` }, { status: 400 });
  } catch (error: any) {
    console.error("shopify webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "Cove Shopify webhook. POST orders/create or customers/create payloads with an X-Shopify-Topic header.",
  });
}
