import { db } from "../db";

/** Max marketing messages a customer may receive in a rolling 7-day window. */
export const FREQUENCY_CAP_PER_WEEK = 5;

export type EligibilityResult = {
  eligible: string[];
  suppressedOptOut: number;
  suppressedFrequency: number;
};

/**
 * Narrow a list of customer ids to those who may actually be messaged:
 * drops opted-out contacts and anyone who has already hit the weekly
 * frequency cap. Used as a guard before any campaign/journey send.
 */
export async function filterEligibleCustomerIds(customerIds: string[]): Promise<EligibilityResult> {
  if (!customerIds.length) return { eligible: [], suppressedOptOut: 0, suppressedFrequency: 0 };

  const optedOut = await db.customer.findMany({
    where: { id: { in: customerIds }, marketingConsent: false },
    select: { id: true },
  });
  const optOutSet = new Set(optedOut.map((c) => c.id));

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recent = await db.communicationLog.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customerIds }, queuedAt: { gte: since } },
    _count: { _all: true },
  });
  const cappedSet = new Set(
    recent.filter((r) => r._count._all >= FREQUENCY_CAP_PER_WEEK).map((r) => r.customerId)
  );

  let suppressedFrequency = 0;
  const eligible = customerIds.filter((id) => {
    if (optOutSet.has(id)) return false;
    if (cappedSet.has(id)) {
      suppressedFrequency++;
      return false;
    }
    return true;
  });

  return { eligible, suppressedOptOut: optOutSet.size, suppressedFrequency };
}
