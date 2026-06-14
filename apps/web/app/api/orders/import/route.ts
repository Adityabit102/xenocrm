import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseOrderCSV } from "@/lib/utils/csv-parser";
import { calculateRFM } from "@/lib/rfm/scorer";









export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing uploaded file in field 'file'" }, { status: 400 });
    }

    const text = await file.text();
    const { data: parsedOrders, errors: parseErrors } = await parseOrderCSV(text);

    if (parsedOrders.length === 0 && parseErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details: parseErrors
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const affectedCustomerIds = new Set<string>();

    const batchSize = 500;

    
    for (let i = 0; i < parsedOrders.length; i += batchSize) {
      const chunk = parsedOrders.slice(i, i + batchSize);

      
      const customerIds = chunk.map((o) => o.customerId).filter(Boolean) as string[];
      const customerEmails = chunk.map((o) => o.customerEmail).filter(Boolean) as string[];

      
      const matchedCustomers = await db.customer.findMany({
        where: {
          OR: [
            { id: { in: customerIds } },
            { externalId: { in: customerIds } },
            { email: { in: customerEmails } }
          ]
        },
        select: { id: true, externalId: true, email: true }
      });

      
      const customerMap = new Map<string, string>();
      for (const c of matchedCustomers) {
        customerMap.set(c.id, c.id);
        if (c.externalId) {
          customerMap.set(c.externalId, c.id);
        }
        if (c.email) {
          customerMap.set(c.email.toLowerCase(), c.id);
        }
      }

      
      const resolvedCustomerIds = Array.from(
        new Set(
          chunk
            .map((o) => {
              const lookupKey = o.customerId || (o.customerEmail ? o.customerEmail.toLowerCase() : "");
              return customerMap.get(lookupKey);
            })
            .filter(Boolean) as string[]
        )
      );

      
      const existingOrders = await db.order.findMany({
        where: {
          customerId: { in: resolvedCustomerIds }
        },
        select: { customerId: true, orderDate: true, amountInr: true }
      });

      
      const makeOrderKey = (cid: string, oDate: Date, amt: number) => {
        return `${cid}_${oDate.getTime()}_${amt.toFixed(2)}`;
      };

      const existingOrderKeys = new Set<string>();
      for (const order of existingOrders) {
        existingOrderKeys.add(makeOrderKey(order.customerId, order.orderDate, order.amountInr));
      }

      const operations = [];
      const batchAffectedIds: string[] = [];

      for (const row of chunk) {
        const lookupKey = row.customerId || (row.customerEmail ? row.customerEmail.toLowerCase() : "");
        const resolvedId = customerMap.get(lookupKey);

        if (!resolvedId) {
          skipped++;
          errors.push(
            `Row skipped: Customer not found for identifier "${row.customerId || row.customerEmail}"`
          );
          continue;
        }

        const duplicateKey = makeOrderKey(resolvedId, row.orderDate, row.amountInr);

        if (existingOrderKeys.has(duplicateKey)) {
          skipped++;
          continue;
        }

        
        operations.push(
          db.order.create({
            data: {
              customerId: resolvedId,
              orderDate: row.orderDate,
              amountInr: row.amountInr,
              category: row.category || null,
              channel: row.channel || null,
              status: "completed"
            }
          })
        );
        batchAffectedIds.push(resolvedId);
      }

      
      try {
        if (operations.length > 0) {
          await db.$transaction(operations);
          
          
          imported += operations.length;
          for (const id of batchAffectedIds) {
            affectedCustomerIds.add(id);
          }
        }
      } catch (err: any) {
        console.error(`Orders batch error (rows ${i} to ${i + chunk.length}):`, err);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${err.message || err}`);
        skipped += chunk.length;
      }
    }

    
    const affectedIdsArray = Array.from(affectedCustomerIds);
    let customersUpdated = 0;

    if (affectedIdsArray.length > 0) {
      
      const allOrders = await db.order.findMany({
        where: {
          customerId: { in: affectedIdsArray }
        },
        select: { customerId: true, orderDate: true, amountInr: true }
      });

      
      const ordersByCustomer = new Map<string, { orderDate: Date; amountInr: number }[]>();
      for (const order of allOrders) {
        if (!ordersByCustomer.has(order.customerId)) {
          ordersByCustomer.set(order.customerId, []);
        }
        ordersByCustomer.get(order.customerId)!.push({
          orderDate: order.orderDate,
          amountInr: order.amountInr
        });
      }

      
      const rfmUpdateOps = [];
      const referenceDate = new Date();

      for (const cid of affectedIdsArray) {
        const customerOrders = ordersByCustomer.get(cid) || [];
        const rfm = calculateRFM(customerOrders, referenceDate);

        rfmUpdateOps.push(
          db.customer.update({
            where: { id: cid },
            data: {
              rfmRecency: rfm.recency,
              rfmFrequency: rfm.frequency,
              rfmMonetary: rfm.monetary,
              rfmTier: rfm.rfmTier
            }
          })
        );
      }

      
      for (let j = 0; j < rfmUpdateOps.length; j += batchSize) {
        const chunkUpdates = rfmUpdateOps.slice(j, j + batchSize);
        try {
          await db.$transaction(chunkUpdates);
          customersUpdated += chunkUpdates.length;
        } catch (rfmErr: any) {
          console.error("Failed to commit RFM updates batch:", rfmErr);
          errors.push(`Failed to update RFM scores for a batch: ${rfmErr.message || rfmErr}`);
        }
      }
    }

    
    const allErrors = [...errors];
    if (parseErrors.length > 0) {
      allErrors.push(...parseErrors.map((e) => `CSV Parse warning: row ${e.row || "unknown"}: ${e.message}`));
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: allErrors,
      customersUpdated
    });
  } catch (error: any) {
    console.error("POST /api/orders/import error:", error);
    return NextResponse.json({ error: "Failed to import orders list" }, { status: 500 });
  }
}
