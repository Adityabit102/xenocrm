import { NextResponse } from "next/server";

/**
 * Optional shared-secret guard for external ingestion endpoints
 * (inbound replies, storefront events, score recompute).
 * If COVE_WEBHOOK_SECRET is unset the request is allowed, so local/demo
 * works without config; set it in production to require the header.
 */
export function checkWebhookSecret(request: Request): boolean {
  const secret = process.env.COVE_WEBHOOK_SECRET;
  if (!secret) return true;
  return request.headers.get("x-cove-webhook-secret") === secret;
}

/**
 * Cron guard — Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * Allowed when CRON_SECRET is unset (dev) or the header matches.
 */
export function checkCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
