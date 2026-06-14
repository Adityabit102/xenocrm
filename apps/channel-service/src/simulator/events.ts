import { MessageJob } from "./queue";
import { sendCallback } from "../callbacks/crm";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;




function generateEventId(messageId: string, eventType: string): string {
  return `${messageId}_${eventType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}




async function dispatchCallback(message: MessageJob, eventType: string, metadata: any = {}) {
  const eventId = generateEventId(message.id, eventType);
  const payload = {
    eventId,
    messageId: message.id,
    eventType,
    timestamp: new Date().toISOString(),
    campaignId: message.campaignId,
    customerId: message.customerId,
    metadata: {
      channel: message.channel,
      ...metadata
    }
  };
  
  console.log(`[EventSimulator] Triggering ${eventType} callback for message ${message.id}`);
  await sendCallback(payload);
}




export async function simulateDelivery(message: MessageJob): Promise<void> {
  try {
    
    await dispatchCallback(message, "sent");

    
    await delay(randomRange(500, 2000));

    const isDelivered = Math.random() < 0.85;

    if (isDelivered) {
      await handleDeliveredPath(message);
    } else {
      await handleFailedPath(message);
    }
  } catch (err) {
    console.error(`[EventSimulator] Error simulating delivery for message ${message.id}:`, err);
  }
}




async function handleDeliveredPath(message: MessageJob): Promise<void> {
  
  await dispatchCallback(message, "delivered");

  
  const isOpened = Math.random() < 0.60;
  if (!isOpened) return;

  
  await delay(randomRange(2000, 8000));
  await dispatchCallback(message, "opened");

  
  const isRead = Math.random() < 0.45;
  if (!isRead) return;

  
  await delay(randomRange(1000, 4000));
  await dispatchCallback(message, "read");

  
  const isClicked = Math.random() < 0.20;
  if (!isClicked) return;

  
  await delay(randomRange(500, 3000));
  await dispatchCallback(message, "clicked");

  
  const isOrderPlaced = Math.random() < 0.08;
  if (!isOrderPlaced) return;

  
  await delay(randomRange(5000, 15000));
  const amountInr = randomRange(800, 15000); 
  await dispatchCallback(message, "order_placed", {
    amountInr,
    category: getRandomCategory(),
    orderChannel: Math.random() < 0.7 ? "online" : "offline"
  });
}




async function handleFailedPath(message: MessageJob): Promise<void> {
  
  await dispatchCallback(message, "failed", { failureReason: "network_error" });

  
  console.log(`[EventSimulator] Message ${message.id} failed delivery. Retrying in 3000ms...`);
  await delay(3000);

  const isRetrySuccess = Math.random() < 0.70;

  if (isRetrySuccess) {
    console.log(`[EventSimulator] Retry succeeded for message ${message.id}. Proceeding with delivery...`);
    await handleDeliveredPath(message);
  } else {
    console.log(`[EventSimulator] Retry failed for message ${message.id}.`);
    await dispatchCallback(message, "failed", { failureReason: "retry_failed" });
  }
}

function getRandomCategory(): string {
  const categories = ["Womenswear", "Menswear", "Footwear", "Accessories", "Beauty", "Home Decor", "Sportswear"];
  return categories[Math.floor(Math.random() * categories.length)];
}


export const simulateMessageEvents = simulateDelivery;
