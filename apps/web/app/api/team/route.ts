import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const DEMO_TEAM = [
  { email: "demo@cove.io", name: "Demo Marketer", role: "admin" },
  { email: "priya@cove.io", name: "Priya Sharma", role: "marketer" },
  { email: "rohan@cove.io", name: "Rohan Verma", role: "viewer" },
];

export async function GET() {
  try {
    // Ensure a baseline team exists so the page is populated in the demo.
    for (const m of DEMO_TEAM) {
      await db.user.upsert({
        where: { email: m.email },
        create: { email: m.email, name: m.name, role: m.role, password: "demo-disabled" },
        update: {},
      });
    }
    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("GET /api/team error:", error);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, role } = await request.json();
    if (!id || !["admin", "marketer", "viewer"].includes(role)) {
      return NextResponse.json({ error: "id and a valid role are required" }, { status: 400 });
    }
    const user = await db.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true } });
    await logAudit("demo@cove.io", "role.updated", `${user.email} → ${role}`);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("PATCH /api/team error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
