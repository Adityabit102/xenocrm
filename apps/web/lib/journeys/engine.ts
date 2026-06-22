import axios from "axios";
import { db } from "../db";
import { getSegmentCustomerIds } from "../segment-engine/executor";
import { personaliseMessage } from "../utils/personalise";

/* ============================================================
   Journeys — multi-step automation engine + behavioural triggers
   Journeys are self-contained: each "message" step sends through
   the channel simulator (best-effort) and the journey tracks its
   own sentCount, so the campaign receipts pipeline is untouched.
   ============================================================ */

const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";
const apiSecret = process.env.CRM_RECEIPT_SECRET || "dev-secret-change-in-production";

/** Idempotent bulk enrolment (skips customers already in the journey). */
export async function enrollCustomers(journeyId: string, customerIds: string[]): Promise<number> {
  if (!customerIds.length) return 0;
  const res = await db.journeyEnrollment.createMany({
    data: customerIds.map((customerId) => ({ journeyId, customerId })),
    skipDuplicates: true,
  });
  return res.count;
}

/** Which customers a journey's trigger should pull in right now. */
export async function resolveTriggerCustomerIds(journey: {
  triggerType: string;
  segmentId: string | null;
  eventType: string | null;
}): Promise<string[]> {
  if (journey.triggerType === "segment" && journey.segmentId) {
    const seg = await db.segment.findUnique({ where: { id: journey.segmentId } });
    if (!seg) return [];
    return getSegmentCustomerIds(seg.filterRules);
  }
  if (journey.triggerType === "event" && journey.eventType) {
    return resolveEventCustomerIds(journey.eventType);
  }
  return [];
}

/** Behavioural triggers, derived from existing data (no cart table yet). */
async function resolveEventCustomerIds(eventType: string): Promise<string[]> {
  if (eventType === "churn_risk") {
    const rows = await db.customer.findMany({
      where: { rfmTier: { in: ["At Risk", "Lapsed"] } },
      select: { id: true },
      take: 2000,
    });
    return rows.map((r) => r.id);
  }
  if (eventType === "first_purchase") {
    const grouped = await db.order.groupBy({ by: ["customerId"], _count: { _all: true } });
    return grouped.filter((g) => g._count._all === 1).map((g) => g.customerId);
  }
  if (eventType === "cart_abandoned") {
    // Proxy until a cart model exists: recently-engaged buyers who may have lapsed mid-funnel.
    const rows = await db.customer.findMany({
      where: { rfmTier: { in: ["Promising", "At Risk"] } },
      select: { id: true },
      take: 1000,
    });
    return rows.map((r) => r.id);
  }
  return [];
}

async function sendJourneyMessage(
  journeyId: string,
  step: { channel: string | null; template: string | null },
  customer: { id: string; phone: string | null; email: string | null; firstName: string; lastName: string }
): Promise<void> {
  const content = personaliseMessage(step.template || "", customer as any);
  try {
    await axios.post(
      `${channelServiceUrl}/send`,
      {
        campaignId: `journey_${journeyId}`,
        messages: [
          {
            id: `j_${journeyId}_${customer.id}_${Date.now()}`,
            customerId: customer.id,
            channel: (step.channel || "whatsapp") as "whatsapp" | "sms" | "email" | "rcs",
            content,
            recipientPhone: customer.phone || undefined,
            recipientEmail: customer.email || undefined,
          },
        ],
      },
      { headers: { "Content-Type": "application/json", "x-api-secret": apiSecret }, timeout: 5000 }
    );
  } catch {
    // Simulator may be offline locally — the step still counts as queued.
  }
}

/**
 * One scheduler tick: auto-enrol trigger audiences, then advance every due
 * enrolment through its steps (sending messages, pausing at waits).
 */
export async function processJourneyTick(): Promise<{ enrolled: number; advanced: number; sent: number }> {
  const now = new Date();
  let enrolled = 0;
  let advanced = 0;
  let sentTotal = 0;

  const activeJourneys = await db.journey.findMany({
    where: { status: "active" },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  for (const journey of activeJourneys) {
    // 1) auto-enrol segment / event trigger audiences
    if (journey.triggerType !== "manual") {
      const ids = await resolveTriggerCustomerIds(journey);
      enrolled += await enrollCustomers(journey.id, ids);
    }

    if (!journey.steps.length) continue;

    // 2) advance due enrolments
    const due = await db.journeyEnrollment.findMany({
      where: {
        journeyId: journey.id,
        status: "active",
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
      include: { customer: true },
      take: 500,
    });

    let journeySent = 0;
    for (const e of due) {
      let step = e.currentStep;
      let paused = false;
      while (step < journey.steps.length) {
        const s = journey.steps[step];
        if (s.type === "message") {
          await sendJourneyMessage(journey.id, s, e.customer);
          journeySent++;
          step++;
        } else if (s.type === "wait") {
          const next = new Date(now.getTime() + (s.waitHours || 0) * 3_600_000);
          await db.journeyEnrollment.update({
            where: { id: e.id },
            data: { currentStep: step + 1, nextRunAt: next },
          });
          paused = true;
          break;
        } else {
          step++;
        }
      }
      if (!paused) {
        await db.journeyEnrollment.update({
          where: { id: e.id },
          data: { currentStep: journey.steps.length, status: "completed", nextRunAt: null },
        });
      }
      advanced++;
    }

    if (journeySent > 0) {
      await db.journey.update({ where: { id: journey.id }, data: { sentCount: { increment: journeySent } } });
      sentTotal += journeySent;
    }
  }

  return { enrolled, advanced, sent: sentTotal };
}
