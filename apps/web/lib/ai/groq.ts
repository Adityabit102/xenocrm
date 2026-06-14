import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          systemPrompt +
          "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no preamble, no explanation. Just raw JSON.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "";

  console.log("[Groq] Raw response:", raw);

  
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("[Groq] JSON parse failed. Raw output:", raw);
    throw new Error(`Groq returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  try {
    return schema.parse(parsed);
  } catch (e) {
    console.error("[Groq] Schema validation failed. Parsed:", parsed);
    throw new Error(`Groq response failed schema validation: ${JSON.stringify(e)}`);
  }
}

export async function generateText(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.5,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  return completion.choices[0]?.message?.content || "";
}