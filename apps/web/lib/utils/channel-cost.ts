/**
 * Per-message send cost by channel (INR). Indicative India D2C rates —
 * WhatsApp utility/marketing session, transactional SMS, ESP email, RCS.
 * Centralised so cost/ROI is consistent across analytics and campaign views.
 */
export const CHANNEL_COST_INR: Record<string, number> = {
  whatsapp: 0.8,
  sms: 0.18,
  email: 0.05,
  rcs: 0.4,
};

export function costPerMessage(channel: string): number {
  return CHANNEL_COST_INR[channel?.toLowerCase()] ?? 0.2;
}

/** Total spend for a campaign given its channel and messages sent. */
export function campaignCost(channel: string, totalSent: number): number {
  return Math.round(costPerMessage(channel) * (totalSent || 0) * 100) / 100;
}

/**
 * ROI as a return-on-ad-spend multiple (revenue / cost). Returns null when
 * there is no spend yet so callers can show "—" instead of Infinity.
 */
export function campaignRoi(revenue: number, cost: number): number | null {
  if (!cost || cost <= 0) return null;
  return Math.round((revenue / cost) * 10) / 10;
}
