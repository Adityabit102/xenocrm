import { describe, it, expect } from "vitest";
import { calculateRFM } from "./scorer";

describe("RFM Scorer Unit Tests", () => {
  
  const referenceDate = new Date("2026-06-11T12:00:00.000Z");

  const getYesterdayDate = () => {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  };

  const getDaysAgoDate = (days: number) => {
    const targetDate = new Date(referenceDate);
    targetDate.setDate(targetDate.getDate() - days);
    return targetDate;
  };

  
  it("should assign a recency score of 5 for a customer with an order yesterday", () => {
    const orders = [
      { orderDate: getYesterdayDate(), amountInr: 1000 }
    ];
    const result = calculateRFM(orders, referenceDate);
    expect(result.recency).toBe(1); 
    expect(result.recencyScore).toBe(5); 
  });

  
  it("should assign scores of 1 and tier 'Lapsed' for a customer with 0 orders", () => {
    const result = calculateRFM([], referenceDate);
    expect(result.recency).toBe(999);
    expect(result.frequency).toBe(0);
    expect(result.monetary).toBe(0);
    expect(result.recencyScore).toBe(1);
    expect(result.frequencyScore).toBe(1);
    expect(result.monetaryScore).toBe(1);
    expect(result.rfmTier).toBe("Lapsed");
  });

  
  it("should assign 'Champions' tier for a customer with 15 orders totaling > ₹80,000 with a recent purchase", () => {
    const orders = Array.from({ length: 15 }, (_, i) => ({
      orderDate: getYesterdayDate(),
      amountInr: 6000 
    }));

    const result = calculateRFM(orders, referenceDate);
    expect(result.frequency).toBe(15);
    expect(result.monetary).toBe(90000);
    expect(result.recencyScore).toBe(5);
    expect(result.frequencyScore).toBe(5); 
    expect(result.monetaryScore).toBe(5); 
    expect(result.rfmTier).toBe("Champions");
  });

  
  it("should assign 'Lapsed' tier for a customer whose last order was 100 days ago", () => {
    const orders = [
      { orderDate: getDaysAgoDate(100), amountInr: 5000 }
    ];
    const result = calculateRFM(orders, referenceDate);
    expect(result.recency).toBe(100);
    expect(result.recencyScore).toBe(1); 
    expect(result.rfmTier).toBe("Lapsed");
  });

  
  it("should assign 'New' tier for a customer with exactly 1 order placed yesterday", () => {
    const orders = [
      { orderDate: getYesterdayDate(), amountInr: 1000 }
    ];
    const result = calculateRFM(orders, referenceDate);
    expect(result.frequency).toBe(1);
    expect(result.recencyScore).toBe(5); 
    expect(result.rfmTier).toBe("New");
  });

  
  
  
  
  
  
  it("should assign 'Loyal' tier for a customer with last purchase 45 days ago and 5 orders", () => {
    const orders = Array.from({ length: 5 }, (_, i) => ({
      orderDate: getDaysAgoDate(45),
      amountInr: 1000
    }));
    const result = calculateRFM(orders, referenceDate);
    expect(result.recencyScore).toBe(3);
    expect(result.frequencyScore).toBe(3);
    expect(result.rfmTier).toBe("Loyal");
  });

  it("should assign 'At Risk' tier for a customer with last purchase 75 days ago and 5 orders", () => {
    const orders = Array.from({ length: 5 }, (_, i) => ({
      orderDate: getDaysAgoDate(75),
      amountInr: 1000
    }));
    const result = calculateRFM(orders, referenceDate);
    expect(result.recencyScore).toBe(2); 
    expect(result.frequencyScore).toBe(3); 
    expect(result.rfmTier).toBe("At Risk");
  });

  
  it("should mathematically sum the exact order amountInr values in the monetary output", () => {
    const orders = [
      { orderDate: getYesterdayDate(), amountInr: 12450.50 },
      { orderDate: getYesterdayDate(), amountInr: 8550.25 },
      { orderDate: getYesterdayDate(), amountInr: 1500.00 }
    ];
    const result = calculateRFM(orders, referenceDate);
    expect(result.monetary).toBe(22500.75); 
  });

  
  it("should correctly reach all 7 defined RFM classification tiers", () => {
    
    const championsResult = calculateRFM(
      Array.from({ length: 8 }, () => ({ orderDate: getYesterdayDate(), amountInr: 10000 })), 
      referenceDate
    );
    expect(championsResult.rfmTier).toBe("Champions");

    
    const loyalResult = calculateRFM(
      Array.from({ length: 5 }, () => ({ orderDate: getDaysAgoDate(45), amountInr: 1000 })), 
      referenceDate
    );
    expect(loyalResult.rfmTier).toBe("Loyal");

    
    const newResult = calculateRFM(
      [{ orderDate: getYesterdayDate(), amountInr: 1000 }], 
      referenceDate
    );
    expect(newResult.rfmTier).toBe("New");

    
    const promisingResult = calculateRFM(
      [
        { orderDate: getYesterdayDate(), amountInr: 1000 },
        { orderDate: getYesterdayDate(), amountInr: 1000 }
      ], 
      referenceDate
    );
    expect(promisingResult.rfmTier).toBe("Promising");

    
    const atRiskResult = calculateRFM(
      Array.from({ length: 4 }, () => ({ orderDate: getDaysAgoDate(75), amountInr: 1000 })), 
      referenceDate
    );
    expect(atRiskResult.rfmTier).toBe("At Risk");

    
    const lapsedResult = calculateRFM(
      [{ orderDate: getDaysAgoDate(100), amountInr: 1000 }], 
      referenceDate
    );
    expect(lapsedResult.rfmTier).toBe("Lapsed");

    
    const generalResult = calculateRFM(
      [{ orderDate: getDaysAgoDate(45), amountInr: 1000 }], 
      referenceDate
    );
    expect(generalResult.rfmTier).toBe("general");
  });
});
