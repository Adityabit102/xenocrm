import { db } from "./db";

export type MessagingSettings = {
  quietHoursEnabled: boolean;
  quietHoursStart: number; // hour 0-23 (inclusive)
  quietHoursEnd: number; // hour 0-23 (exclusive)
  frequencyCap: number; // max marketing messages per customer per 7 days
};

export const DEFAULT_MESSAGING: MessagingSettings = {
  quietHoursEnabled: false,
  quietHoursStart: 21,
  quietHoursEnd: 9,
  frequencyCap: 5,
};

export async function getMessagingSettings(): Promise<MessagingSettings> {
  const row = await db.setting.findUnique({ where: { key: "messaging" } });
  return { ...DEFAULT_MESSAGING, ...((row?.value as any) || {}) };
}

export async function setMessagingSettings(patch: Partial<MessagingSettings>): Promise<MessagingSettings> {
  const current = await getMessagingSettings();
  const next = { ...current, ...patch };
  await db.setting.upsert({
    where: { key: "messaging" },
    create: { key: "messaging", value: next },
    update: { value: next },
  });
  return next;
}

/** Whether `date` falls inside the configured quiet-hours window (handles overnight wrap). */
export function inQuietHours(s: MessagingSettings, date = new Date()): boolean {
  if (!s.quietHoursEnabled) return false;
  const h = date.getHours();
  const { quietHoursStart: a, quietHoursEnd: b } = s;
  return a < b ? h >= a && h < b : h >= a || h < b;
}
