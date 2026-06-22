export type OrderLite = { orderDate: Date | string; amountInr: number };

/**
 * Lightweight predictive scores from order history:
 *  - clv: spend-to-date projected by purchase frequency, discounted by recency (INR)
 *  - churn: 0..100 propensity, rising with days-since-last-order, easing with frequency
 */
export function computeScores(orders: OrderLite[], now = new Date()): { clv: number; churn: number } {
  if (!orders.length) return { clv: 0, churn: 90 };

  const total = orders.reduce((s, o) => s + o.amountInr, 0);
  const count = orders.length;
  const last = Math.max(...orders.map((o) => new Date(o.orderDate).getTime()));
  const daysSince = Math.max(0, Math.floor((now.getTime() - last) / 86_400_000));

  const freqFactor = 1 + Math.min(count, 10) * 0.12;
  const recencyDiscount = daysSince > 180 ? 0.6 : daysSince > 90 ? 0.8 : 1;
  const clv = Math.round(total * freqFactor * recencyDiscount);

  let churn = Math.min(100, Math.round(daysSince / 1.8));
  churn = Math.max(0, churn - Math.min(count, 8) * 3);

  return { clv, churn };
}
