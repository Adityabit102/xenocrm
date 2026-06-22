import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Per-step funnel + enrolment breakdown + conversion for one journey.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const journey = await db.journey.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!journey) return NextResponse.json({ error: "Journey not found" }, { status: 404 });

    const enrollments = await db.journeyEnrollment.findMany({
      where: { journeyId: id },
      select: { customerId: true, currentStep: true, status: true, enrolledAt: true },
    });

    const total = enrollments.length;
    const active = enrollments.filter((e) => e.status === "active").length;
    const completed = enrollments.filter((e) => e.status === "completed").length;
    const exited = enrollments.filter((e) => e.status === "exited").length;

    // currentStep points at the NEXT step to run, so an enrolment has executed
    // step i once currentStep > i. "passed" = how many cleared each step.
    const funnel = journey.steps.map((s, i) => ({
      order: s.order,
      type: s.type,
      channel: s.channel,
      waitHours: s.waitHours,
      passed: enrollments.filter((e) => e.currentStep > i).length,
    }));

    // conversion: orders placed by enrolled customers at/after they enrolled
    let converters = 0;
    let revenue = 0;
    if (enrollments.length) {
      const ids = enrollments.map((e) => e.customerId);
      const minEnrolled = new Date(Math.min(...enrollments.map((e) => new Date(e.enrolledAt).getTime())));
      const orders = await db.order.findMany({
        where: { customerId: { in: ids }, orderDate: { gte: minEnrolled } },
        select: { customerId: true, amountInr: true, orderDate: true },
      });
      const enrolledAtMap = new Map(enrollments.map((e) => [e.customerId, new Date(e.enrolledAt).getTime()]));
      const convSet = new Set<string>();
      for (const o of orders) {
        const et = enrolledAtMap.get(o.customerId);
        if (et != null && new Date(o.orderDate).getTime() >= et) {
          convSet.add(o.customerId);
          revenue += o.amountInr;
        }
      }
      converters = convSet.size;
    }

    return NextResponse.json({
      id: journey.id,
      name: journey.name,
      status: journey.status,
      triggerType: journey.triggerType,
      eventType: journey.eventType,
      sentCount: journey.sentCount,
      enrollment: { total, active, completed, exited },
      funnel,
      conversion: { converters, rate: total ? +((converters / total) * 100).toFixed(1) : 0, revenue: Math.round(revenue) },
    });
  } catch (error: any) {
    console.error("GET /api/journeys/[id]/analytics error:", error);
    return NextResponse.json({ error: "Failed to compute journey analytics" }, { status: 500 });
  }
}
