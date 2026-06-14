import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeSegmentRules } from "@/lib/segment-engine/executor";

interface CacheEntry {
  data: any;
  expiresAt: number;
}


const previewCache = new Map<string, CacheEntry>();




function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of previewCache.entries()) {
    if (entry.expiresAt < now) {
      previewCache.delete(key);
    }
  }
}







export async function POST(request: Request) {
  try {
    const bodyJson = await request.json();
    const { rules } = bodyJson;

    if (!rules) {
      return NextResponse.json({ error: "Missing required field 'rules' in request body" }, { status: 400 });
    }

    cleanExpiredCache();

    
    const cacheKey = JSON.stringify(rules);
    const cached = previewCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[SegmentPreview] Returning cached preview results.");
      }
      return NextResponse.json(cached.data);
    }

    
    const where = executeSegmentRules(rules);

    
    const [count, sampleCustomers, cityGroups, genderGroups] = await Promise.all([
      db.customer.count({ where }),
      db.customer.findMany({
        where,
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          rfmTier: true,
          rfmMonetary: true
        }
      }),
      db.customer.groupBy({
        by: ["city"],
        where,
        _count: {
          city: true
        },
        orderBy: {
          _count: {
            city: "desc"
          }
        },
        take: 3
      }),
      db.customer.groupBy({
        by: ["gender"],
        where,
        _count: {
          gender: true
        }
      })
    ]);

    
    const mappedSample = sampleCustomers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      city: c.city,
      rfmTier: c.rfmTier,
      totalSpend: c.rfmMonetary || 0
    }));

    const topCities = cityGroups.map((g) => ({
      city: g.city || "Other",
      count: g._count.city
    }));

    const genderSplit = genderGroups.map((g) => ({
      gender: g.gender || "Other",
      count: g._count.gender
    }));

    const responseData = {
      count,
      sample: mappedSample,
      topCities,
      genderSplit
    };

    
    previewCache.set(cacheKey, {
      data: responseData,
      expiresAt: now + 30 * 1000
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("POST /api/segments/preview error:", error);
    return NextResponse.json({ error: "Failed to fetch segment preview data" }, { status: 500 });
  }
}
