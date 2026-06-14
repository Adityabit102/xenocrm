import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCustomerCSV } from "@/lib/utils/csv-parser";







export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing uploaded file in field 'file'" }, { status: 400 });
    }

    const text = await file.text();
    const { data: parsedCustomers, errors: parseErrors } = await parseCustomerCSV(text);

    if (parsedCustomers.length === 0 && parseErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details: parseErrors
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    const batchSize = 500;

    
    for (let i = 0; i < parsedCustomers.length; i += batchSize) {
      const chunk = parsedCustomers.slice(i, i + batchSize);

      
      const emails = chunk.map((c) => c.email).filter(Boolean) as string[];
      const phones = chunk.map((c) => c.phone).filter(Boolean) as string[];

      
      const existing = await db.customer.findMany({
        where: {
          OR: [
            { email: { in: emails } },
            { phone: { in: phones } }
          ]
        },
        select: { id: true, email: true, phone: true }
      });

      
      const emailMap = new Map<string, string>();
      const phoneMap = new Map<string, string>();

      for (const item of existing) {
        if (item.email) {
          emailMap.set(item.email.toLowerCase(), item.id);
        }
        if (item.phone) {
          phoneMap.set(item.phone, item.id);
        }
      }

      const operations = [];

      for (const row of chunk) {
        let existingId: string | undefined = undefined;

        if (row.email) {
          existingId = emailMap.get(row.email.toLowerCase());
        }
        if (!existingId && row.phone) {
          existingId = phoneMap.get(row.phone);
        }

        if (existingId) {
          
          operations.push(
            db.customer.update({
              where: { id: existingId },
              data: {
                firstName: row.firstName,
                lastName: row.lastName || "",
                phone: row.phone || undefined,
                email: row.email || undefined,
                city: row.city || null,
                gender: row.gender || null,
                tier: row.tier || null
              }
            })
          );
        } else {
          
          operations.push(
            db.customer.create({
              data: {
                firstName: row.firstName,
                lastName: row.lastName || "",
                phone: row.phone || null,
                email: row.email || null,
                city: row.city || null,
                gender: row.gender || null,
                tier: row.tier || null,
                rfmRecency: 999,
                rfmFrequency: 0,
                rfmMonetary: 0,
                rfmTier: "New"
              }
            })
          );
        }
      }

      
      try {
        if (operations.length > 0) {
          await db.$transaction(operations);

          
          for (const row of chunk) {
            let matched = false;
            if (row.email && emailMap.has(row.email.toLowerCase())) matched = true;
            if (row.phone && phoneMap.has(row.phone)) matched = true;
            
            if (matched) {
              updated++;
            } else {
              imported++;
            }
          }
        }
      } catch (err: any) {
        console.error(`Import batch error (rows ${i} to ${i + chunk.length}):`, err);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${err.message || err}`);
        skipped += chunk.length;
      }
    }

    
    const allErrors = [...errors];
    if (parseErrors.length > 0) {
      allErrors.push(...parseErrors.map((e) => `CSV Parse warning: row ${e.row || "unknown"}: ${e.message}`));
    }

    return NextResponse.json({
      imported,
      updated,
      skipped,
      errors: allErrors
    });
  } catch (error: any) {
    console.error("POST /api/customers/import error:", error);
    return NextResponse.json({ error: "Failed to import customers list" }, { status: 500 });
  }
}
