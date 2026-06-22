import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: any = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.channel === "string") data.channel = body.channel;
    if (typeof body.body === "string") data.body = body.body;
    const template = await db.messageTemplate.update({ where: { id }, data });
    return NextResponse.json(template);
  } catch (error: any) {
    console.error("PATCH /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.messageTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
