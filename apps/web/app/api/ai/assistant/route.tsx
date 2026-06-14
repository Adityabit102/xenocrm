import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const { query, history } = await request.json();

        const systemPrompt = `You are Xeno Intelligence, an AI assistant embedded in XenoCRM — an Indian D2C retail CRM.

You help marketers with:
- Answering questions about campaigns, segments, customers, and analytics
- Navigating to pages (dashboard, campaigns, segments, customers, agent, settings)
- Explaining CRM concepts and Indian retail best practices

IMPORTANT — what you do NOT do:
- Do NOT give instructions on how to create segments or campaigns manually
- Do NOT say "go to the segment builder and set filters to..."
- Do NOT explain steps the user should take in the UI

Instead:
- If asked to create a segment or campaign, say "I'm creating that for you now..." (the frontend handles the actual creation)
- If asked how many customers match a criteria, say "Let me check that for you..." (frontend handles the lookup)
- For navigation: respond with "Navigating to [page]..." and include the exact path

Available pages: /dashboard, /campaigns, /campaigns/new, /segments, /segments/new, /customers, /agent, /settings

Keep responses concise — 1-2 sentences max.
Use plain text. No markdown. No bullet points.
Currency is INR (₹). Channels are WhatsApp, SMS, Email, RCS.
Be direct and action-oriented, not instructional.`;

        const historyText = history?.length
            ? history.map((m: { role: string; text: string }) =>
                `${m.role === "user" ? "User" : "Xeno"}: ${m.text}`
            ).join("\n")
            : "";

        const userMessage = historyText
            ? `Previous conversation:\n${historyText}\n\nUser: ${query}`
            : query;

        const reply = await generateText(systemPrompt, userMessage, 150);
        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("assistant error:", error);
        return NextResponse.json({ reply: "Sorry, I couldn't process that right now." });
    }
}
