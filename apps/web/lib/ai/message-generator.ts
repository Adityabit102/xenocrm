import { z } from "zod";
import { generateStructuredOutput } from "./groq";
import { Channel } from "@/types";

export interface MessageVariant {
  label: string;
  template: string;
  tone: "Friendly" | "Direct" | "Urgent";
  estimatedLength: number;
}

const messageVariantSchema = z.object({
  label: z.string().describe("Descriptive label of the variant (e.g. 'Casual Invite', 'Direct Discount')"),
  template: z.string().describe("Message text template incorporating personalisation tokens like {{first_name}}, {{favourite_category}}, {{last_order_date}}, {{total_spend}}"),
  tone: z.enum(["Friendly", "Direct", "Urgent"]).describe("Tone classification of the message copywriting"),
  estimatedLength: z.number().int().describe("Estimated character count of the template")
});

const messageGeneratorResponseSchema = z.object({
  variants: z.array(messageVariantSchema).length(3)
});





export async function generateMessageVariants(
  goal: string,
  channel: Channel,
  segmentInsight?: string
): Promise<MessageVariant[]> {
  const systemPrompt = `You are a CRM copywriter for Indian retail brands. Generate 3 distinct WhatsApp/SMS/Email/RCS message variants for a campaign. 
Each variant should be: personalised (use {{first_name}} etc.), concise (under 160 chars for SMS, under 300 for WhatsApp), in a different tone (Friendly, Direct, Urgent). 
Include relevant personalisation tokens: {{first_name}}, {{favourite_category}}, {{last_order_date}}, {{total_spend}}.
Return JSON array of 3 variants.`;

  const userMessage = `Campaign Goal: ${goal}
Delivery Channel: ${channel}
${segmentInsight ? `Target Segment Demographics / Insights: ${segmentInsight}` : ""}`;

  try {
    const result = await generateStructuredOutput(
      systemPrompt,
      userMessage,
      messageGeneratorResponseSchema
    );

    return result.variants as MessageVariant[];
  } catch (error: any) {
    console.error("generateMessageVariants error:", error);
    throw new Error(`Failed to generate message variants: ${error.message || error}`);
  }
}
