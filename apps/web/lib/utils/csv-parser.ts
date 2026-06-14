import Papa from "papaparse";

export interface ParsedCustomer {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  city?: string;
  gender?: string;
  tier?: string;
}

export interface ParsedOrder {
  customerId?: string;
  customerEmail?: string;
  orderDate: Date;
  amountInr: number;
  category?: string;
  channel?: string;
}




const transformHeader = (header: string): string => {
  const clean = header.trim().toLowerCase().replace(/[\s_-]/g, "");
  
  if (clean === "firstname" || clean === "first") return "firstName";
  if (clean === "lastname" || clean === "last") return "lastName";
  if (clean === "phone" || clean === "phonenumber") return "phone";
  if (clean === "email" || clean === "emailaddress") return "email";
  if (clean === "city") return "city";
  if (clean === "gender") return "gender";
  if (clean === "tier" || clean === "loyaltytier") return "tier";
  
  if (clean === "customerid" || clean === "custid") return "customerId";
  if (clean === "customeremail" || clean === "custemail") return "customerEmail";
  if (clean === "orderdate" || clean === "date") return "orderDate";
  if (clean === "amount" || clean === "amountinr" || clean === "price") return "amountInr";
  if (clean === "category") return "category";
  if (clean === "channel") return "channel";
  
  return header.trim();
};





export function parseCustomerCSV(input: any): Promise<{ data: ParsedCustomer[]; errors: any[] }> {
  return new Promise((resolve) => {
    const results: ParsedCustomer[] = [];
    const parseErrors: any[] = [];

    const handleComplete = (parseResult: Papa.ParseResult<any>) => {
      parseErrors.push(...parseResult.errors);

      for (const row of parseResult.data) {
        
        const cleanRow: any = {};
        for (const key of Object.keys(row)) {
          cleanRow[key] = typeof row[key] === "string" ? row[key].trim() : row[key];
        }

        
        if (!cleanRow.firstName) {
          parseErrors.push({
            type: "Validation",
            message: "Skipped row: missing required 'first_name' column value",
            row
          });
          continue;
        }

        results.push({
          firstName: cleanRow.firstName,
          lastName: cleanRow.lastName || undefined,
          phone: cleanRow.phone || undefined,
          email: cleanRow.email || undefined,
          city: cleanRow.city || undefined,
          gender: cleanRow.gender || undefined,
          tier: cleanRow.tier || undefined
        });
      }

      resolve({ data: results, errors: parseErrors });
    };

    const config: any = {
      header: true,
      skipEmptyLines: true,
      transformHeader,
      complete: handleComplete,
      error: (error: any) => {
        resolve({ data: [], errors: [error] });
      }
    };

    if (typeof input === "string") {
      Papa.parse(input, config);
    } else {
      Papa.parse(input, config);
    }
  });
}





export function parseOrderCSV(input: any): Promise<{ data: ParsedOrder[]; errors: any[] }> {
  return new Promise((resolve) => {
    const results: ParsedOrder[] = [];
    const parseErrors: any[] = [];

    const handleComplete = (parseResult: Papa.ParseResult<any>) => {
      parseErrors.push(...parseResult.errors);

      for (const row of parseResult.data) {
        
        const cleanRow: any = {};
        for (const key of Object.keys(row)) {
          cleanRow[key] = typeof row[key] === "string" ? row[key].trim() : row[key];
        }

        
        if (!cleanRow.customerId && !cleanRow.customerEmail) {
          parseErrors.push({
            type: "Validation",
            message: "Skipped row: missing customer identifier ('customer_id' or 'customer_email')",
            row
          });
          continue;
        }

        
        const amount = parseFloat(cleanRow.amountInr);
        if (isNaN(amount) || amount < 0) {
          parseErrors.push({
            type: "Validation",
            message: "Skipped row: invalid or missing transaction amount ('amount_inr')",
            row
          });
          continue;
        }

        
        let orderDate = new Date();
        if (cleanRow.orderDate) {
          const parsedDate = new Date(cleanRow.orderDate);
          if (!isNaN(parsedDate.getTime())) {
            orderDate = parsedDate;
          } else {
            parseErrors.push({
              type: "Validation",
              message: `Warning: invalid order date format "${cleanRow.orderDate}". Defaulting to current timestamp.`,
              row
            });
          }
        }

        results.push({
          customerId: cleanRow.customerId || undefined,
          customerEmail: cleanRow.customerEmail || undefined,
          orderDate,
          amountInr: amount,
          category: cleanRow.category || undefined,
          channel: cleanRow.channel || undefined
        });
      }

      resolve({ data: results, errors: parseErrors });
    };

    const config: any = {
      header: true,
      skipEmptyLines: true,
      transformHeader,
      complete: handleComplete,
      error: (error: any) => {
        resolve({ data: [], errors: [error] });
      }
    };

    if (typeof input === "string") {
      Papa.parse(input, config);
    } else {
      Papa.parse(input, config);
    }
  });
}
