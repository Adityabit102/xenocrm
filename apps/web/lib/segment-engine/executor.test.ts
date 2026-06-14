import { describe, it, expect } from "vitest";
import { executeSegmentRules } from "./executor";

describe("Segment Engine Rule Executor Unit Tests", () => {
  
  
  it("should generate correct Prisma insensitive equals clause for city filter", () => {
    const rules = {
      logic: "AND" as const,
      conditions: [
        { field: "city" as const, operator: "eq" as const, value: "Mumbai" }
      ]
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({
      AND: [
        { city: { equals: "Mumbai", mode: "insensitive" } }
      ]
    });
  });

  
  it("should map monetary greater than operator to Prisma gt comparison", () => {
    const rules = {
      logic: "AND" as const,
      conditions: [
        { field: "monetary" as const, operator: "gt" as const, value: 5000 }
      ]
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({
      AND: [
        { rfmMonetary: { gt: 5000 } }
      ]
    });
  });

  
  it("should chain multiple conditions under AND selector when logic is AND", () => {
    const rules = {
      logic: "AND" as const,
      conditions: [
        { field: "city" as const, operator: "eq" as const, value: "Bengaluru" },
        { field: "gender" as const, operator: "eq" as const, value: "male" },
        { field: "frequency" as const, operator: "gte" as const, value: 3 }
      ]
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({
      AND: [
        { city: { equals: "Bengaluru", mode: "insensitive" } },
        { gender: { equals: "male", mode: "insensitive" } },
        { rfmFrequency: { gte: 3 } }
      ]
    });
  });

  
  it("should chain multiple conditions under OR selector when logic is OR", () => {
    const rules = {
      logic: "OR" as const,
      conditions: [
        { field: "rfm_tier" as const, operator: "eq" as const, value: "Champions" },
        { field: "rfm_tier" as const, operator: "eq" as const, value: "Loyal" }
      ]
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({
      OR: [
        { rfmTier: { equals: "Champions", mode: "insensitive" } },
        { rfmTier: { equals: "Loyal", mode: "insensitive" } }
      ]
    });
  });

  
  it("should map 'in' operator to an OR sub-array of insensitive equals clauses", () => {
    const rules = {
      logic: "AND" as const,
      conditions: [
        { field: "rfm_tier" as const, operator: "in" as const, value: ["Champions", "Loyal", "New"] }
      ]
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({
      AND: [
        {
          OR: [
            { rfmTier: { equals: "Champions", mode: "insensitive" } },
            { rfmTier: { equals: "Loyal", mode: "insensitive" } },
            { rfmTier: { equals: "New", mode: "insensitive" } }
          ]
        }
      ]
    });
  });

  
  it("should throw a descriptive error when encountering an unsupported dimension field", () => {
    const rules = {
      logic: "AND" as const,
      conditions: [
        { field: "age" as any, operator: "eq" as any, value: 25 }
      ]
    };
    expect(() => executeSegmentRules(rules)).toThrowError(
      /Invalid filter dimension: 'age'. Supported dimensions are: /
    );
  });

  
  it("should return an empty query object if the conditions array is empty", () => {
    const rules = {
      logic: "AND" as const,
      conditions: []
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({});
  });

  
  it("should correctly compile combined rules including city, gender, and monetary constraints", () => {
    const rules = {
      logic: "AND" as const,
      conditions: [
        { field: "city" as const, operator: "eq" as const, value: "Mumbai" },
        { field: "gender" as const, operator: "eq" as const, value: "female" },
        { field: "monetary" as const, operator: "gt" as const, value: 10000 }
      ]
    };
    const result = executeSegmentRules(rules);
    expect(result).toEqual({
      AND: [
        { city: { equals: "Mumbai", mode: "insensitive" } },
        { gender: { equals: "female", mode: "insensitive" } },
        { rfmMonetary: { gt: 10000 } }
      ]
    });
  });
});
