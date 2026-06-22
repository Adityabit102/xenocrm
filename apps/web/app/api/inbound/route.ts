import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkWebhookSecret, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const STOP_RE = /\b(stop|unsubscribe|cancel|opt\s?-?out|quit|end|remove)\b/i;

/* Inbound message webhook — a customer replying on any channel. Recognises
   opt-out keywords and auto-suppresses the contact (closes the STOP loop). */
export async function POST(request: Request) {
  try {
    if (!checkWebhookSecret(request)) return unauthorized();
    const body = await request.json();
    const channel = String(body.channel || "whatsapp");
    const from = body.from ? String(body.from) : null;
    const text = String(body.body || "");

    let customerId: string | null = body.customerId || null;
    if (!customerId && from) {
      const c = await db.customer.findFirst({
        where: { OR: [{ phone: from }, { email: from }] },
        select: { id: true },
      });
      customerId = c?.id || null;
    }

    const isStop = STOP_RE.test(text);
    const msg = await db.inboundMessage.create({
      data: { channel, fromAddress: from, body: text, customerId, isStop, handled: isStop },
    });

    let optedOut = false;
    if (isStop && customerId) {
      await db.customer.update({ where: { id: customerId }, data: { marketingConsent: false, optOutAt: new Date() } });
      optedOut = true;
    }

    return NextResponse.json({ ok: true, id: msg.id, optedOut }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inbound error:", error);
    return NextResponse.json({ error: "Failed to record inbound message" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const messages = await db.inboundMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { customer: { select: { firstName: true, lastName: true } } },
    });
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("GET /api/inbound error:", error);
    return NextResponse.json({ error: "Failed to load inbound messages" }, { status: 500 });
  }
}
