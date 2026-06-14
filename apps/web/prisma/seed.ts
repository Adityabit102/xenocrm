import { PrismaClient } from "@prisma/client";
import { calculateRFM } from "../lib/rfm/scorer";

const prisma = new PrismaClient();

const CITIES = [
  { name: "Mumbai", weight: 0.2 },
  { name: "Delhi", weight: 0.2 },
  { name: "Bangalore", weight: 0.15 },
  { name: "Chennai", weight: 0.1 },
  { name: "Hyderabad", weight: 0.1 },
  { name: "Pune", weight: 0.08 },
  { name: "Kolkata", weight: 0.07 },
  { name: "Ahmedabad", weight: 0.04 },
  { name: "Jaipur", weight: 0.03 },
  { name: "Surat", weight: 0.03 }
];

const CATEGORIES = ["Womenswear", "Menswear", "Footwear", "Accessories", "Beauty", "Home Decor", "Sportswear"];
const CHANNELS = ["online", "offline"];
const TIERS = ["gold", "silver", "bronze"];

const FEMALE_FIRST_NAMES = [
  "Aaradhya", "Aditi", "Ananya", "Diya", "Ishita", "Kavya", "Meera", "Neha",
  "Pooja", "Priyanka", "Riya", "Shreya", "Tanvi", "Sneha", "Shruti", "Deepika",
  "Kiara", "Aliyah", "Tanya", "Roshni", "Kajol", "Karishma", "Sonam", "Preity", "Kiran"
];

const MALE_FIRST_NAMES = [
  "Aarav", "Aditya", "Arjun", "Dev", "Ishaan", "Kabir", "Krishna", "Rohan",
  "Rahul", "Rajesh", "Sanjay", "Vikram", "Yash", "Amit", "Gaurav", "Kunal",
  "Manish", "Nitin", "Rohit", "Sandeep", "Saurabh", "Sumit", "Varun", "Vikas", "Vivek"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Mehta", "Shah", "Joshi", "Rao",
  "Nair", "Pillai", "Iyer", "Iyengar", "Reddy", "Chaudhary", "Singh", "Das",
  "Chatterjee", "Banerjee", "Mukherjee", "Sen", "Ghosh", "Kapoor", "Khan", "Malhotra", "Roy"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeightedCity(): string {
  const r = Math.random();
  let sum = 0;
  for (const city of CITIES) {
    sum += city.weight;
    if (r <= sum) return city.name;
  }
  return CITIES[0].name;
}

function getRandomDate(monthsAgo: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - monthsAgo * 30 * 24 * 60 * 60 * 1000);
  return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime()));
}

async function main() {
  console.log("Cleaning database...");
  await prisma.campaignStats.deleteMany({});
  await prisma.communicationLog.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.segmentMembership.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log("Database clean completed.");

  
  const customerOrderCounts: number[] = [];
  let totalAssignedOrders = 0;

  for (let i = 0; i < 500; i++) {
    const r = Math.random();
    let count = 0;
    if (r < 0.20) {
      count = Math.random() < 0.3 ? 0 : 1; 
    } else if (r < 0.85) {
      count = Math.floor(Math.random() * 4) + 2; 
    } else {
      count = Math.floor(Math.random() * 7) + 6; 
    }
    customerOrderCounts.push(count);
    totalAssignedOrders += count;
  }

  
  while (totalAssignedOrders < 2000) {
    const idx = Math.floor(Math.random() * 500);
    customerOrderCounts[idx]++;
    totalAssignedOrders++;
  }
  while (totalAssignedOrders > 2000) {
    const idx = Math.floor(Math.random() * 500);
    if (customerOrderCounts[idx] > 0) {
      customerOrderCounts[idx]--;
      totalAssignedOrders--;
    }
  }

  console.log(`Generating 500 customers and ${totalAssignedOrders} orders...`);

  
  const customersData = [];
  const generatedPhones = new Set<string>();

  for (let i = 0; i < 500; i++) {
    const isFemale = Math.random() < 0.55;
    const firstName = getRandomItem(isFemale ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);

    
    let phone = "";
    do {
      const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      phone = `+91${randomDigits}`;
    } while (generatedPhones.has(phone));
    generatedPhones.add(phone);

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@example.com`;
    const city = getWeightedCity();
    const gender = isFemale ? "Female" : "Male";

    
    const tierRand = Math.random();
    const tier = tierRand < 0.20 ? "gold" : tierRand < 0.70 ? "silver" : "bronze";

    customersData.push({
      externalId: `EXT${1000 + i}`,
      firstName,
      lastName,
      phone,
      email,
      city,
      gender,
      tier,
      rfmRecency: null,
      rfmFrequency: null,
      rfmMonetary: null,
      rfmTier: null
    });
  }

  
  console.log("Saving customers to database...");
  const createdCustomers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({ data: c });
    createdCustomers.push(customer);
  }

  
  console.log("Saving orders to database...");
  const ordersData = [];
  for (let i = 0; i < 500; i++) {
    const customer = createdCustomers[i];
    const orderCount = customerOrderCounts[i];

    for (let o = 0; o < orderCount; o++) {
      const orderDate = getRandomDate(18); 
      const amountInr = Math.floor(500 + Math.random() * 24500); 
      const category = getRandomItem(CATEGORIES);
      const channel = getRandomItem(CHANNELS);

      ordersData.push({
        customerId: customer.id,
        orderDate,
        amountInr,
        category,
        channel,
        status: "completed"
      });
    }
  }

  
  await prisma.order.createMany({
    data: ordersData
  });

  
  console.log("Calculating RFM scores for all customers...");
  const referenceDate = new Date();

  for (const customer of createdCustomers) {
    
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id }
    });

    const rfm = calculateRFM(
      orders.map((o: any) => ({ orderDate: o.orderDate, amountInr: o.amountInr })),
      referenceDate
    );

    
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        rfmRecency: rfm.recency,
        rfmFrequency: rfm.frequency,
        rfmMonetary: rfm.monetary,
        rfmTier: rfm.rfmTier
      }
    });
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
