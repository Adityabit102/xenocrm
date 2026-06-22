import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const where: any = {};
    if (channel) where.channel = channel;
    const templates = await db.messageTemplate.findMany({ where, orderBy: { updatedAt: "desc" } });
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("GET /api/templates error:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, channel, body } = await request.json();
    if (!name || !channel || !body) {
      return NextResponse.json({ error: "name, channel and body are required" }, { status: 400 });
    }
    const template = await db.messageTemplate.create({ data: { name, channel, body } });
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/templates error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
