import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { planCampaign } from "@/lib/ai/agent";

export const dynamic = "force-dynamic";







export async function POST(request: Request) {
  try {
    
    const session = process.env.BYPASS_AUTH === "true" 
      ? { user: { name: "Test User", email: "test@example.com" } }
      : await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    
    const body = await request.json();
    const { goal } = body;

    if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
      return NextResponse.json(
        { error: "Goal description must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          
          sendEvent("status", { message: "Analysing your goal..." });
          await new Promise((r) => setTimeout(r, 600));

          
          sendEvent("status", { message: "Reviewing your customer segments..." });
          const availableSegments = await db.segment.findMany({
            orderBy: { createdAt: "desc" }
          });
          await new Promise((r) => setTimeout(r, 600));

          
          sendEvent("status", { message: "Checking channel performance data..." });
          const totalCustomers = await db.customer.count();

          
          const campaigns = await db.campaign.findMany({
            include: { stats: true }
          });

          const channelStats: Record<
            string,
            { totalClicked: number; totalRead: number; totalOpened: number }
          > = {
            whatsapp: { totalClicked: 0, totalRead: 0, totalOpened: 0 },
            sms: { totalClicked: 0, totalRead: 0, totalOpened: 0 },
            email: { totalClicked: 0, totalRead: 0, totalOpened: 0 },
            rcs: { totalClicked: 0, totalRead: 0, totalOpened: 0 }
          };

          for (const camp of campaigns) {
            const channel = camp.channel.toLowerCase();
            if (channelStats[channel] && camp.stats) {
              channelStats[channel].totalClicked += camp.stats.totalClicked;
              channelStats[channel].totalRead += camp.stats.totalRead;
              channelStats[channel].totalOpened += camp.stats.totalOpened;
            }
          }

          const recentCampaignPerformance = Object.entries(channelStats).map(
            ([channel, stats]) => {
              const avgClickRate =
                stats.totalRead > 0
                  ? (stats.totalClicked / stats.totalRead) * 100
                  : stats.totalOpened > 0
                  ? (stats.totalClicked / stats.totalOpened) * 100
                  : 0.0;
              return { channel, avgClickRate };
            }
          );
          await new Promise((r) => setTimeout(r, 600));

          
          sendEvent("status", { message: "Drafting campaign plan..." });

          const context = {
            availableSegments,
            recentCampaignPerformance,
            totalCustomers
          };

          const plan = await planCampaign(goal, context);
          await new Promise((r) => setTimeout(r, 400));

          
          sendEvent("plan", plan);
          controller.close();
        } catch (err: any) {
          sendEvent("error", { message: err.message || "An error occurred during planning" });
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    console.error("POST /api/ai/agent/plan error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
