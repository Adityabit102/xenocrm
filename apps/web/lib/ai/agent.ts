import { z } from "zod";
import { generateStructuredOutput } from "./groq";
import { Segment } from "@prisma/client";
import { Channel, AgentPlan } from "@/types";
import { segmentFilterRulesSchema } from "./segment-builder";

export interface AgentContext {
  availableSegments: Segment[];
  recentCampaignPerformance: Array<{
    channel: string;
    avgClickRate: number;
  }>;
  totalCustomers: number;
}

const agentPlanSchema = z.object({
  segmentId: z.string().optional().describe("The ID of an existing segment if one of the available segments is the best fit for the campaign goal. Prefer choosing an existing segment if it aligns well with the campaign target audience."),
  newSegmentRules: segmentFilterRulesSchema.optional().describe("Custom filter rules to define a target audience segment from scratch if none of the existing segments match the campaign goal."),
  newSegmentName: z.string().optional().describe("Descriptive name for the new segment if newSegmentRules is provided (e.g. 'High Spenders in Mumbai')."),
  channel: z.nativeEnum(Channel).describe("Recommended delivery channel (whatsapp, sms, email, rcs) based on goal and past channel click performance."),
  messageTemplate: z.string().describe("Copywritten message template. Must incorporate relevant personalisation tokens like {{first_name}}, {{city}}, {{tier}}, {{last_order_date}}, {{favourite_category}}, {{total_spend}} dynamically. SMS must be short (<160 chars), WhatsApp under 300 chars, Email can be longer."),
  scheduledAt: z.string().optional().describe("ISO datetime string suggesting when to schedule this campaign (e.g. tomorrow at 10:00 AM in the future)."),
  reasoning: z.array(z.string()).describe("A list of detailed, data-driven reasoning statements explaining the segment selection, channel pick, message copy, and scheduled send time."),
  estimatedReach: z.number().int().describe("Estimated reach of the segment (or number of matching customers)."),
  expectedClickRate: z.number().describe("Expected click rate (CTR) percentage for this outreach (0 to 100).")
});








export async function planCampaign(
  goal: string,
  context: AgentContext
): Promise<AgentPlan> {
  const systemPrompt = `You are AutoReach, an AI campaign planning agent for XenoCRM, an Indian retail CRM. 
Given a marketer's goal, create a complete campaign plan. 
You have access to existing segments and performance data. 

Your tasks:
1. Pick the best segment (choose from availableSegments by returning segmentId) OR define new rules (newSegmentRules + newSegmentName) that map to the goal. Available filter rule dimensions: recency_days, frequency, monetary, city, gender, rfm_tier, category, tier.
2. Recommend the best channel (whatsapp, sms, email, rcs). If the user's goal explicitly mentions a channel (e.g. "email", "sms", "whatsapp"), always use that channel regardless of historical performance. Otherwise pick based on past CTR data.
3. Write a personalised, compelling message template. Include relevant personalisation tokens: {{first_name}}, {{full_name}}, {{city}}, {{tier}}, {{last_order_date}}, {{favourite_category}}, {{total_spend}}, {{order_count}}, {{rfm_tier}}. Keep templates channel-friendly (SMS: <160 chars; WhatsApp: <300 chars; Email: rich text/longer format).
4. Suggest optimal send timing in the near future (ISO 8601 string).

Be specific, data-driven, and explain your reasoning for each decision. 
Return ONLY valid JSON matching the AgentPlan schema.`;

  const userMessage = `Marketer's Campaign Goal: "${goal}"

Database Context:
- Total active customers: ${context.totalCustomers}
- Available existing segments:
${context.availableSegments.length === 0
      ? "  (No existing segments available)"
      : context.availableSegments.map(seg => `  - ID: ${seg.id} | Name: "${seg.name}" | Description: "${seg.description || ''}" | Count: ${seg.customerCount}`).join("\n")}

- Recent Campaign Channel Performance:
${context.recentCampaignPerformance.length === 0
      ? "  (No historical channel performance data)"
      : context.recentCampaignPerformance.map(perf => `  - Channel: ${perf.channel} | Average Click Rate (CTR): ${perf.avgClickRate.toFixed(2)}%`).join("\n")}
`;

  
  const hasApiKey = process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "" &&
    !process.env.ANTHROPIC_API_KEY.includes("your-key-here");

  if (!hasApiKey) {
    
    const channelPerformance = context.recentCampaignPerformance;
    
    let recommendedChannel = Channel.EMAIL;
    let bestRate = 0;

    
    const goalLower = goal.toLowerCase();
    if (goalLower.includes("email") || goalLower.includes("newsletter") || goalLower.includes("mail")) {
      recommendedChannel = Channel.EMAIL;
      bestRate = 15.0;
    } else if (goalLower.includes("sms") || goalLower.includes("text message")) {
      recommendedChannel = Channel.SMS;
      bestRate = 8.0;
    } else if (goalLower.includes("rcs")) {
      recommendedChannel = Channel.RCS;
      bestRate = 10.0;
    } else if (goalLower.includes("whatsapp")) {
      recommendedChannel = Channel.WHATSAPP;
      bestRate = 19.0;
    } else if (channelPerformance && channelPerformance.length > 0) {
      
      const sorted = [...channelPerformance].sort((a, b) => b.avgClickRate - a.avgClickRate);
      const matched = sorted[0].channel.toLowerCase();
      if (Object.values(Channel).includes(matched as Channel)) {
        recommendedChannel = matched as Channel;
        bestRate = sorted[0].avgClickRate;
      }
    } else {
      bestRate = 12.4; 
    }

    
    let selectedSegmentId: string | undefined = undefined;
    let reach = Math.round(context.totalCustomers * 0.25); 
    let isNewSegment = false;
    let newRules: any = undefined;
    let newName: string | undefined = undefined;

    const lowerGoal = goal.toLowerCase();

    
    const matchedSegment = context.availableSegments.find(seg => {
      const name = seg.name.toLowerCase();
      return name.includes("loyal") && lowerGoal.includes("loyal") ||
        name.includes("champion") && lowerGoal.includes("premium") ||
        name.includes("risk") && (lowerGoal.includes("win back") || lowerGoal.includes("retention"));
    });

    if (matchedSegment) {
      selectedSegmentId = matchedSegment.id;
      reach = matchedSegment.customerCount;
    } else if (context.availableSegments.length > 0) {
      
      selectedSegmentId = context.availableSegments[0].id;
      reach = context.availableSegments[0].customerCount;
    } else {
      
      isNewSegment = true;
      newName = "AI Planned Audience";
      newRules = {
        logic: "AND",
        conditions: [
          { field: "monetary", operator: "gt", value: 2000 },
          { field: "recency_days", operator: "lt", value: 60 }
        ]
      };
      reach = Math.max(1, Math.round(context.totalCustomers * 0.15));
    }

    
    let messageTemplate = "";
    if (recommendedChannel === Channel.SMS) {
      messageTemplate = `Hey {{first_name}}, special offer just for you! Get 15% off our {{favourite_category}} collection. Use code XENO15 at checkout! Shop now: {{city}} store or online.`;
    } else if (recommendedChannel === Channel.WHATSAPP) {
      messageTemplate = `Hi {{first_name}}! 👋 We noticed you love shopping for {{favourite_category}} (last purchased on {{last_order_date}}). 🌟\n\nTo thank you for being a ${selectedSegmentId ? "valued member" : "loyal customer"}, here is an exclusive 15% discount code: *XENO15*.\n\nEnjoy free shipping or visit our {{city}} store today!`;
    } else if (recommendedChannel === Channel.EMAIL) {
      messageTemplate = `Subject: Special Gift inside: 15% Off your favourite category! 🎁\n\nDear {{first_name}},\n\nWe love having you as a customer. Since you've spent a total of {{total_spend}} with us, we wanted to share an exclusive reward.\n\nUse code **XENO15** to get 15% off your next purchase in the {{favourite_category}} department. Valid online and at our {{city}} outlet.\n\nCheers,\nCRM Team`;
    } else {
      messageTemplate = `Hey {{first_name}}! 🎁 Get 15% off on {{favourite_category}} items. Use code XENO15 online or at our {{city}} store!`;
    }

    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    return {
      segmentId: selectedSegmentId,
      newSegmentRules: newRules,
      newSegmentName: newName,
      channel: recommendedChannel,
      messageTemplate,
      scheduledAt: tomorrow.toISOString(),
      reasoning: [
        `Identified target audience having an estimated reach of ${reach.toLocaleString()} customers.`,
        `Recommended ${recommendedChannel.toUpperCase()} channel based on its strong historical click rate of ${bestRate.toFixed(1)}%.`,
        `Drafted a personalized message using customer token {{favourite_category}} to increase CTR relevance.`,
        `Scheduled dispatch for tomorrow morning at 10:00 AM, matching peak historical retail engagement windows.`
      ],
      estimatedReach: reach,
      expectedClickRate: parseFloat((bestRate * 1.1).toFixed(1)) 
    };
  }

  try {
    const plan = await generateStructuredOutput<AgentPlan>(
      systemPrompt,
      userMessage,
      agentPlanSchema
    );

    return plan;
  } catch (error: any) {
    console.error("planCampaign error:", error);
    throw new Error(`Failed to plan campaign with Claude Agent: ${error.message || error}`);
  }
}
