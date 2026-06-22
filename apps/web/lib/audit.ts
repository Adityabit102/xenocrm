import { db } from "./db";

/** Best-effort audit trail — never throws into the calling request path. */
export async function logAudit(actorEmail: string, action: string, detail?: string): Promise<void> {
  try {
    await db.auditLog.create({ data: { actorEmail: actorEmail || "system", action, detail: detail || null } });
  } catch (e) {
    console.error("[audit] failed to record", action, e);
  }
}
