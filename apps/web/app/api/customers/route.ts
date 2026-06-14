import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateRFM } from "@/lib/rfm/scorer";
import { z } from "zod";


const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().nullable().optional(),
  email: z
    .string()
    .email("Invalid email format")
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  city: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  tier: z.string().nullable().optional()
});






export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "50", 10));
    const search = searchParams.get("search") || "";
    const rfmTier = searchParams.get("rfmTier") || "";

    const where: any = {};

    
    if (search) {
      const parts = search.trim().split(/\s+/);
      if (parts.length > 1) {
        where.AND = [
          { firstName: { contains: parts[0], mode: "insensitive" } },
          { lastName: { contains: parts[1], mode: "insensitive" } }
        ];
      } else {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } }
        ];
      }
    }

    
    if (rfmTier && rfmTier !== "all") {
      where.rfmTier = rfmTier;
    }

    const skip = (page - 1) * limit;

    const [total, customers] = await Promise.all([
      db.customer.count({ where }),
      db.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { orders: true }
          },
          orders: {
            select: {
              amountInr: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    
    const mappedCustomers = customers.map((customer: any) => {
      const orderCount = customer._count.orders;
      const totalSpend = customer.orders.reduce((sum: number, order: any) => sum + order.amountInr, 0);
      const { orders, _count, ...rest } = customer;
      
      return {
        ...rest,
        orderCount,
        totalSpend
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      customers: mappedCustomers,
      total,
      page,
      totalPages
    });
  } catch (error: any) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}






export async function POST(request: Request) {
  try {
    const bodyJson = await request.json();
    
    
    const result = createCustomerSchema.safeParse(bodyJson);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    
    const initialRfm = calculateRFM([]);

    
    const newCustomer = await db.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        city: data.city || null,
        gender: data.gender || null,
        tier: data.tier || null,
        rfmRecency: initialRfm.recency,
        rfmFrequency: initialRfm.frequency,
        rfmMonetary: initialRfm.monetary,
        rfmTier: initialRfm.rfmTier
      }
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
