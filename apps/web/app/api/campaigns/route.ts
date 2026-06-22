import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { Channel } from "@/types";
import { logAudit } from "@/lib/audit";


const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  segmentId: z.string().min(1, "Segment ID is required"),
  channel: z.nativeEnum(Channel, {
    errorMap: () => ({ message: "Channel must be whatsapp, sms, email, or rcs" })
  }),
  messageTemplate: z.string().min(1, "Message template is required"),
  scheduledAt: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().datetime().optional().nullable()
  ),
  status: z.enum(["draft", "scheduled"]).optional().default("draft"),  // ← add this line
  holdoutPct: z.number().int().min(0).max(50).optional().default(0),
  requireApproval: z.boolean().optional().default(false),
  createdByAgent: z.boolean().optional().default(false),
  agentReasoningTrace: z.any().optional().nullable()
});






export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit,
        include: {
          segment: {
            select: {
              name: true
            }
          },
          stats: true
        }
      }),
      db.campaign.count({ where })
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("GET /api/campaigns error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns list" }, { status: 500 });
  }
}






export async function POST(request: Request) {
  try {
    const bodyJson = await request.json();


    const result = createCampaignSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;


    const segment = await db.segment.findUnique({
      where: { id: data.segmentId }
    });
    if (!segment) {
      return NextResponse.json({ error: "Selected segment cohort does not exist" }, { status: 404 });
    }


    const createdCampaign = await db.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          name: data.name,
          segmentId: data.segmentId,
          channel: data.channel,
          messageTemplate: data.messageTemplate,
          status: data.status || "draft",
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          holdoutPct: data.holdoutPct || 0,
          approvalStatus: data.requireApproval ? "pending" : "approved",
          createdByAgent: data.createdByAgent || false,
          agentReasoningTrace: data.agentReasoningTrace || null
        }
      });


      await tx.campaignStats.create({
        data: {
          campaignId: campaign.id,
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalOpened: 0,
          totalRead: 0,
          totalClicked: 0,
          totalOrdersAttributed: 0,
          attributedRevenueInr: 0
        }
      });

      return tx.campaign.findUnique({
        where: { id: campaign.id },
        include: {
          segment: {
            select: {
              name: true
            }
          },
          stats: true
        }
      });
    });

    await logAudit("demo@cove.io", "campaign.created", `${data.name} (${data.channel})`);
    return NextResponse.json(createdCampaign, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/campaigns error:", error);
    return NextResponse.json({ error: "Failed to create campaign record" }, { status: 500 });
  }
}
