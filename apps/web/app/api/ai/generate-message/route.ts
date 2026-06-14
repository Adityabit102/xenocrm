import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateMessageVariants } from "@/lib/ai/message-generator";
import { Channel } from "@/types";
import { auth } from "@/lib/auth";


const generateMessageSchema = z.object({
  goal: z.string().min(5, "Campaign goal description must be at least 5 characters"),
  channel: z.nativeEnum(Channel, {
    errorMap: () => ({ message: "Delivery channel must be WhatsApp, SMS, Email, or RCS" })
  }),
  segmentId: z.string().optional().nullable()
});


const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = 10;
  const windowMs = 60 * 1000; 

  let timestamps = rateLimitStore.get(key) || [];
  
  timestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (timestamps.length >= limit) {
    rateLimitStore.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    
    const session = await auth();
    const sessionKey = session?.user?.email || "anonymous";

    
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitKey = `${sessionKey}:${clientIp}`;

    
    if (checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many message generation requests. Please wait a minute." },
        { status: 429 }
      );
    }

    
    const bodyJson = await request.json();
    const result = generateMessageSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { goal, channel, segmentId } = result.data;

    
    let segmentInsight = "";
    if (segmentId) {
      const segment = await db.segment.findUnique({
        where: { id: segmentId }
      });
      if (segment) {
        segmentInsight = segment.naturalLanguageQuery || segment.description || "";
      }
    }

    
    const variants = await generateMessageVariants(goal, channel, segmentInsight);

    return NextResponse.json({ variants });
  } catch (error: any) {
    console.error("POST /api/ai/generate-message error:", error);
    return NextResponse.json(
      { error: "Failed to generate message variations" },
      { status: 500 }
    );
  }
}
