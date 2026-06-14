import { NextResponse } from "next/server";
import { db } from "@/lib/db";






export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;
    const skip = (page - 1) * limit;

    
    const campaign = await db.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const where: any = { campaignId: id };
    if (status) {
      where.status = status;
    }

    
    const [logs, total] = await Promise.all([
      db.communicationLog.findMany({
        where,
        orderBy: {
          queuedAt: "desc"
        },
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        }
      }),
      db.communicationLog.count({ where })
    ]);

    return NextResponse.json({
      messages: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("GET /api/campaigns/[id]/messages error:", error);
    return NextResponse.json({ error: "Failed to retrieve campaign message logs" }, { status: 500 });
  }
}
