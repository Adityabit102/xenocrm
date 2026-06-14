import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";


const patchCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name cannot be empty").optional(),
  messageTemplate: z.string().min(1, "Message template cannot be empty").optional(),
  scheduledAt: z.preprocess(
    (val) => (val === "" || val === null ? null : val),
    z.string().datetime().optional().nullable()
  ),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "paused"]).optional()
});




function extractTemplateTokens(templateText: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(templateText)) !== null) {
    tokens.push(match[1].trim());
  }
  return Array.from(new Set(tokens));
}






export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        segment: {
          select: {
            name: true,
            customerCount: true,
            filterRules: true
          }
        },
        stats: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const tokens = extractTemplateTokens(campaign.messageTemplate);

    return NextResponse.json({
      ...campaign,
      tokens
    });
  } catch (error: any) {
    console.error("GET /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve campaign details" }, { status: 500 });
  }
}






export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bodyJson = await request.json();

    
    const result = patchCampaignSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    
    const existingCampaign = await db.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    
    if (existingCampaign.status !== "draft") {
      return NextResponse.json(
        { error: "Campaign settings can only be modified while in 'draft' status" },
        { status: 400 }
      );
    }

    
    const updatedCampaign = await db.campaign.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        messageTemplate: data.messageTemplate !== undefined ? data.messageTemplate : undefined,
        scheduledAt: data.scheduledAt !== undefined 
          ? (data.scheduledAt ? new Date(data.scheduledAt) : null) 
          : undefined,
        status: data.status !== undefined ? data.status : undefined
      },
      include: {
        segment: {
          select: {
            name: true,
            customerCount: true,
            filterRules: true
          }
        },
        stats: true
      }
    });

    const tokens = extractTemplateTokens(updatedCampaign.messageTemplate);

    return NextResponse.json({
      ...updatedCampaign,
      tokens
    });
  } catch (error: any) {
    console.error("PATCH /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Failed to update campaign configurations" }, { status: 500 });
  }
}





export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    
    const existingCampaign = await db.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    
    if (existingCampaign.status !== "draft") {
      return NextResponse.json(
        { error: "Campaigns can only be deleted while in 'draft' status" },
        { status: 400 }
      );
    }

    
    await db.campaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete campaign record" }, { status: 500 });
  }
}
