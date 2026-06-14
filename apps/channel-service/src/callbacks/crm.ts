import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export interface CallbackPayload {
  eventId: string;
  messageId: string;
  eventType: string;
  timestamp: string;
  campaignId?: string;
  customerId?: string;
  metadata?: any;
}

const CRM_RECEIPTS_URL = process.env.CRM_RECEIPTS_URL || "http://localhost:3000/api/receipts";
const CRM_RECEIPT_SECRET = process.env.CRM_RECEIPT_SECRET || "dev-secret-change-in-production";






export async function sendCallback(payload: CallbackPayload): Promise<void> {
  const maxRetries = 3;
  const backoffs = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(CRM_RECEIPTS_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": CRM_RECEIPT_SECRET,
          "x-event-id": payload.eventId
        },
        timeout: 5000 
      });

      console.log(`[CallbackClient] [${new Date().toISOString()}] Successfully delivered event "${payload.eventType}" (eventId: ${payload.eventId}) to CRM. Status: ${response.status}`);
      return;
    } catch (err: any) {
      const isNetworkError = !err.response || err.code === "ECONNABORTED" || (err.response.status >= 500 && err.response.status <= 599);
      
      console.warn(`[CallbackClient] [${new Date().toISOString()}] Failed sending event "${payload.eventType}" (eventId: ${payload.eventId}). Attempt ${attempt + 1}/${maxRetries + 1}. Error: ${err.message}`);

      if (attempt === maxRetries || !isNetworkError) {
        console.error(`[CallbackClient] [${new Date().toISOString()}] Max retries reached or non-retryable error for event ${payload.eventId}. Swallowing error.`);
        return;
      }

      const delayMs = backoffs[attempt];
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
