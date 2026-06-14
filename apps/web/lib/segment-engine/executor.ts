import { Prisma } from "@prisma/client";
import { db } from "../db";

export interface FilterCondition {
  field: "recency_days" | "frequency" | "monetary" | "city" | "gender" | "rfm_tier" | "category" | "tier";
  operator: "lt" | "gt" | "eq" | "gte" | "lte" | "in" | "contains";
  value: any;
}

export interface SegmentFilterRules {
  logic: "AND" | "OR";
  conditions: FilterCondition[];
}




function buildConditionClause(cond: any): Prisma.CustomerWhereInput | null {
  if (!cond || !cond.field) return null;
  
  const field = cond.field;
  const validFields = ["recency_days", "frequency", "monetary", "city", "gender", "rfm_tier", "category", "tier"];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid filter dimension: '${field}'. Supported dimensions are: ${validFields.join(", ")}`);
  }
  
  let op = cond.operator;
  let value = cond.value;

  
  if (op === "is" || op === "equals") op = "eq";
  if (op === "is not") op = "not_equals";
  if (op === "is one of") op = "in";
  if (op === "greater than") op = "gt";
  if (op === "less than") op = "lt";

  
  const parseRange = (val: any): [number, number] => {
    if (Array.isArray(val)) {
      return [Number(val[0]) || 0, Number(val[1]) || 0];
    }
    const num = Number(val) || 0;
    return [num, num];
  };

  
  if (field === "recency_days") {
    if (op === "lt") return { rfmRecency: { lt: Number(value) } };
    if (op === "gt") return { rfmRecency: { gt: Number(value) } };
    if (op === "eq") return { rfmRecency: { equals: Number(value) } };
    if (op === "not_equals") return { rfmRecency: { not: Number(value) } };
    if (op === "between") {
      const [min, max] = parseRange(value);
      return { rfmRecency: { gte: min, lte: max } };
    }
  }

  
  if (field === "frequency") {
    if (op === "lt") return { rfmFrequency: { lt: Number(value) } };
    if (op === "gt") return { rfmFrequency: { gt: Number(value) } };
    if (op === "gte") return { rfmFrequency: { gte: Number(value) } };
    if (op === "lte") return { rfmFrequency: { lte: Number(value) } };
    if (op === "eq") return { rfmFrequency: { equals: Number(value) } };
    if (op === "not_equals") return { rfmFrequency: { not: Number(value) } };
    if (op === "between") {
      const [min, max] = parseRange(value);
      return { rfmFrequency: { gte: min, lte: max } };
    }
  }

  
  if (field === "monetary") {
    if (op === "lt") return { rfmMonetary: { lt: Number(value) } };
    if (op === "gt") return { rfmMonetary: { gt: Number(value) } };
    if (op === "gte") return { rfmMonetary: { gte: Number(value) } };
    if (op === "lte") return { rfmMonetary: { lte: Number(value) } };
    if (op === "eq") return { rfmMonetary: { equals: Number(value) } };
    if (op === "not_equals") return { rfmMonetary: { not: Number(value) } };
    if (op === "between") {
      const [min, max] = parseRange(value);
      return { rfmMonetary: { gte: min, lte: max } };
    }
  }

  
  if (field === "city") {
    if (op === "eq") {
      return { city: { equals: String(value), mode: "insensitive" } };
    }
    if (op === "not_equals") {
      return { NOT: { city: { equals: String(value), mode: "insensitive" } } };
    }
    if (op === "in") {
      const list = Array.isArray(value) ? value : [value];
      return {
        OR: list.map(v => ({ city: { equals: String(v), mode: "insensitive" } }))
      };
    }
  }

  
  if (field === "gender") {
    if (op === "eq") {
      return { gender: { equals: String(value), mode: "insensitive" } };
    }
    if (op === "not_equals") {
      return { NOT: { gender: { equals: String(value), mode: "insensitive" } } };
    }
  }

  
  if (field === "rfm_tier") {
    if (op === "eq") {
      return { rfmTier: { equals: String(value), mode: "insensitive" } };
    }
    if (op === "not_equals") {
      return { NOT: { rfmTier: { equals: String(value), mode: "insensitive" } } };
    }
    if (op === "in") {
      const list = Array.isArray(value) ? value : [value];
      return {
        OR: list.map(v => ({ rfmTier: { equals: String(v), mode: "insensitive" } }))
      };
    }
  }

  
  if (field === "category") {
    if (op === "contains" || op === "eq") {
      return {
        orders: {
          some: {
            category: {
              contains: String(value),
              mode: "insensitive"
            }
          }
        }
      };
    }
    if (op === "not_equals") {
      return {
        orders: {
          none: {
            category: {
              contains: String(value),
              mode: "insensitive"
            }
          }
        }
      };
    }
  }

  
  if (field === "tier") {
    if (op === "eq") {
      return { tier: { equals: String(value), mode: "insensitive" } };
    }
    if (op === "not_equals") {
      return { NOT: { tier: { equals: String(value), mode: "insensitive" } } };
    }
    if (op === "in") {
      const list = Array.isArray(value) ? value : [value];
      return {
        OR: list.map(v => ({ tier: { equals: String(v), mode: "insensitive" } }))
      };
    }
  }

  return null;
}





export function executeSegmentRules(rules: any): Prisma.CustomerWhereInput {
  let parsedRules = rules;
  if (typeof rules === "string") {
    try {
      parsedRules = JSON.parse(rules);
    } catch {
      return {};
    }
  }

  if (!parsedRules || !parsedRules.conditions || !Array.isArray(parsedRules.conditions) || parsedRules.conditions.length === 0) {
    return {};
  }

  const logic = parsedRules.logic === "OR" ? "OR" : "AND";
  const clauses = parsedRules.conditions
    .map((cond: any) => buildConditionClause(cond))
    .filter(Boolean) as Prisma.CustomerWhereInput[];

  if (clauses.length === 0) {
    return {};
  }

  if (logic === "OR") {
    return { OR: clauses };
  } else {
    return { AND: clauses };
  }
}





export async function getSegmentCustomerIds(rules: any): Promise<string[]> {
  const where = executeSegmentRules(rules);
  const customers = await db.customer.findMany({
    where,
    select: { id: true }
  });
  return customers.map((c: any) => c.id);
}




export async function getSegmentCount(rules: any): Promise<number> {
  const where = executeSegmentRules(rules);
  return db.customer.count({
    where
  });
}
