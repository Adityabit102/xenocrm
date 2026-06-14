export interface MinimalOrder {
  orderDate: Date | string;
  amountInr: number;
}

export interface RFMResult {
  recency: number;
  frequency: number;
  monetary: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmTier: string;
}







export function calculateRFM(orders: MinimalOrder[], referenceDate: Date = new Date()): RFMResult {
  if (!orders || orders.length === 0) {
    return {
      recency: 999,
      frequency: 0,
      monetary: 0,
      recencyScore: 1,
      frequencyScore: 1,
      monetaryScore: 1,
      rfmTier: "Lapsed"
    };
  }

  
  const parsedOrders = orders.map(o => ({
    orderDate: typeof o.orderDate === "string" ? new Date(o.orderDate) : o.orderDate,
    amountInr: o.amountInr
  }));

  
  const frequency = parsedOrders.length;

  
  const monetary = parsedOrders.reduce((sum, o) => sum + o.amountInr, 0);

  
  const orderDates = parsedOrders.map(o => o.orderDate.getTime());
  const mostRecentOrderTimestamp = Math.max(...orderDates);
  const mostRecentOrderDate = new Date(mostRecentOrderTimestamp);
  
  const diffTimeMs = referenceDate.getTime() - mostRecentOrderDate.getTime();
  
  const recency = Math.max(0, Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)));

  

  
  let recencyScore = 1;
  if (recency <= 7) recencyScore = 5;
  else if (recency <= 30) recencyScore = 4;
  else if (recency <= 60) recencyScore = 3;
  else if (recencyScore <= 90) recencyScore = 2; 
  
  
  let recencyValScore = 1;
  if (recency <= 7) recencyValScore = 5;
  else if (recency <= 30) recencyValScore = 4;
  else if (recency <= 60) recencyValScore = 3;
  else if (recency <= 90) recencyValScore = 2;
  else recencyValScore = 1;

  
  let frequencyScore = 1;
  if (frequency >= 10) frequencyScore = 5;
  else if (frequency >= 6) frequencyScore = 4;
  else if (frequency >= 4) frequencyScore = 3;
  else if (frequency >= 2) frequencyScore = 2;
  else frequencyScore = 1;

  
  let monetaryScore = 1;
  if (monetary >= 50000) monetaryScore = 5;
  else if (monetary >= 20000) monetaryScore = 4;
  else if (monetary >= 10000) monetaryScore = 3;
  else if (monetary >= 5000) monetaryScore = 2;
  else monetaryScore = 1;

  
  
  
  
  
  
  
  
  let rfmTier = "general";
  if (recencyValScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
    rfmTier = "Champions";
  } else if (recencyValScore >= 3 && frequencyScore >= 3) {
    rfmTier = "Loyal";
  } else if (frequency === 1 && recencyValScore >= 4) {
    
    rfmTier = "New";
  } else if (recencyValScore >= 4 && frequencyScore <= 2) {
    rfmTier = "Promising";
  } else if (recencyValScore === 2 && frequencyScore >= 3) {
    rfmTier = "At Risk";
  } else if (recencyValScore === 1) {
    rfmTier = "Lapsed";
  }

  return {
    recency,
    frequency,
    monetary,
    recencyScore: recencyValScore,
    frequencyScore,
    monetaryScore,
    rfmTier
  };
}
