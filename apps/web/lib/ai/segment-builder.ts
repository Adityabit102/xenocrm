import { z } from "zod";
import { generateStructuredOutput } from "./groq";


const filterConditionSchema = z.object({
  field: z.enum([
    "recency_days",
    "frequency",
    "monetary",
    "city",
    "gender",
    "rfm_tier",
    "category",
    "tier"
  ]),
  operator: z.enum(["lt", "gt", "eq", "gte", "lte", "in", "contains"]),
  value: z.any().describe("Comparison value (number, string, or array of strings depending on the field and operator).")
});


export const segmentFilterRulesSchema = z.object({
  logic: z.enum(["AND", "OR"]),
  conditions: z.array(filterConditionSchema)
});


const aiSegmentResponseSchema = z.object({
  rules: segmentFilterRulesSchema,
  insight: z.string().describe("A brief natural language description of what this segment targets (e.g. 'Shoppers in Mumbai who have spent over ₹5,000').")
});

export type FilterCondition = z.infer<typeof filterConditionSchema>;
export type SegmentFilterRules = z.infer<typeof segmentFilterRulesSchema>;
export type AISegmentResponse = z.infer<typeof aiSegmentResponseSchema>;







export async function buildSegmentFromNL(query: string): Promise<AISegmentResponse> {
  const systemPrompt = `You are a CRM segmentation expert for an Indian retail brand.
Convert natural language audience descriptions into structured filter rules.

You MUST respond with this EXACT JSON structure:
{
  "rules": {
    "logic": "AND",
    "conditions": [
      {
        "field": "city",
        "operator": "eq",
        "value": "Mumbai"
      }
    ]
  },
  "insight": "Brief description of what this segment targets"
}

Available field values: recency_days, frequency, monetary, city, gender, rfm_tier, category, tier
Available operator values: lt, gt, eq, gte, lte, in, contains

Examples:
- gender filter: { "field": "gender", "operator": "eq", "value": "female" }
- city filter: { "field": "city", "operator": "eq", "value": "Mumbai" }
- spend filter: { "field": "monetary", "operator": "gt", "value": 5000 }
- tier filter: { "field": "rfm_tier", "operator": "in", "value": ["champion", "loyal"] }

IMPORTANT: Use only the exact field names and operator values listed above. No other values allowed.`;

  return generateStructuredOutput<AISegmentResponse>(
    systemPrompt,
    query,
    aiSegmentResponseSchema
  );
}