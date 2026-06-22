import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public, token-light preference center API (customer id acts as the token).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const c = await db.customer.findUnique({ where: { id }, select: { id: true, firstName: true, marketingConsent: true } });
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(c);
  } catch (error: any) {
    console.error("GET /api/preferences/[id] error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { marketingConsent } = await request.json();
    if (typeof marketingConsent !== "boolean") return NextResponse.json({ error: "marketingConsent required" }, { status: 400 });
    const c = await db.customer.update({
      where: { id },
      data: { marketingConsent, optOutAt: marketingConsent ? null : new Date() },
      select: { id: true, marketingConsent: true },
    });
    return NextResponse.json(c);
  } catch (error: any) {
    console.error("PATCH /api/preferences/[id] error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
