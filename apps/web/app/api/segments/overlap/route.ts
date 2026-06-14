import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Get all segments with their memberships
        const segments = await db.segment.findMany({
            include: {
                memberships: { select: { customerId: true } },
            },
            orderBy: { customerCount: "desc" },
            take: 10, // top 10 segments for overlap analysis
        });

        if (segments.length < 2) {
            return NextResponse.json({ segments: [], overlaps: [], message: "Need at least 2 segments for overlap analysis" });
        }

        // Build overlap matrix
        const overlaps: Array<{
            segA: string; segAName: string; sizeA: number;
            segB: string; segBName: string; sizeB: number;
            overlap: number; overlapPct: number;
            customerIds: string[];
        }> = [];

        for (let i = 0; i < segments.length; i++) {
            for (let j = i + 1; j < segments.length; j++) {
                const setA = new Set(segments[i].memberships.map((m) => m.customerId));
                const setB = new Set(segments[j].memberships.map((m) => m.customerId));
                const intersection = [...setA].filter((id) => setB.has(id));

                if (intersection.length > 0) {
                    const smaller = Math.min(setA.size, setB.size);
                    overlaps.push({
                        segA: segments[i].id,
                        segAName: segments[i].name,
                        sizeA: setA.size,
                        segB: segments[j].id,
                        segBName: segments[j].name,
                        sizeB: setB.size,
                        overlap: intersection.length,
                        overlapPct: smaller > 0 ? parseFloat(((intersection.length / smaller) * 100).toFixed(1)) : 0,
                        customerIds: intersection.slice(0, 10), // sample only
                    });
                }
            }
        }

        // Sort by overlap count desc
        overlaps.sort((a, b) => b.overlap - a.overlap);

        return NextResponse.json({
            segments: segments.map((s) => ({
                id: s.id,
                name: s.name,
                size: s.customerCount,
            })),
            overlaps: overlaps.slice(0, 20), // top 20 overlapping pairs
            totalCustomersInMultipleSegments: (() => {
                const allSets = segments.map((s) => new Set(s.memberships.map((m) => m.customerId)));
                const inMultiple = new Set<string>();
                const seen = new Set<string>();
                for (const set of allSets) {
                    for (const id of set) {
                        if (seen.has(id)) inMultiple.add(id);
                        seen.add(id);
                    }
                }
                return inMultiple.size;
            })(),
        });
    } catch (error: any) {
        console.error("GET /api/segments/overlap error:", error);
        return NextResponse.json({ error: "Overlap analysis failed" }, { status: 500 });
    }
}