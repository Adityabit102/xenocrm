export interface CustomerData {
  firstName: string;
  lastName?: string | null;
  city?: string | null;
  tier?: string | null;
  rfmTier?: string | null;
  orders?: Array<{
    orderDate: Date | string;
    amountInr: number;
    category?: string | null;
  }>;
}




function getFavouriteCategory(orders: Array<{ category?: string | null }>): string | undefined {
  if (!orders || orders.length === 0) return undefined;
  
  const counts: Record<string, number> = {};
  for (const o of orders) {
    if (o.category) {
      counts[o.category] = (counts[o.category] || 0) + 1;
    }
  }
  
  let maxCount = 0;
  let fav: string | undefined = undefined;
  for (const cat of Object.keys(counts)) {
    if (counts[cat] > maxCount) {
      maxCount = counts[cat];
      fav = cat;
    }
  }
  return fav;
}





export function personaliseMessage(template: string, customer: CustomerData): string {
  const orders = customer.orders || [];
  
  
  const firstName = customer.firstName;
  const lastName = customer.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const city = customer.city || "your city";
  const tier = customer.tier 
    ? customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1).toLowerCase()
    : "Valued";
  
  
  let lastOrderDateStr = "your last purchase";
  if (orders.length > 0) {
    const dates = orders.map(o => new Date(o.orderDate).getTime());
    const maxDate = new Date(Math.max(...dates));
    lastOrderDateStr = maxDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  
  const favCategory = getFavouriteCategory(orders) || "our products";

  
  const totalSpend = orders.reduce((sum, o) => sum + o.amountInr, 0);
  const totalSpendStr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(totalSpend);

  const orderCount = orders.length.toString();
  const rfmTier = customer.rfmTier || "Valued Customer";

  
  const tokenMap: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    city: city,
    tier: tier,
    last_order_date: lastOrderDateStr,
    favourite_category: favCategory,
    total_spend: totalSpendStr,
    order_count: orderCount,
    rfm_tier: rfmTier
  };

  
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  return template.replace(regex, (match, tokenName) => {
    return tokenName in tokenMap ? tokenMap[tokenName] : match;
  });
}




export function extractTokens(template: string): string[] {
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const tokens: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!tokens.includes(match[1])) {
      tokens.push(match[1]);
    }
  }
  return tokens;
}
