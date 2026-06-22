import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
  }
}
