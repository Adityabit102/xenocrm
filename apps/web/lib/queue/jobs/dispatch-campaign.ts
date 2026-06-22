import axios from "axios";
import { db } from "../../db";
import { getSegmentCustomerIds } from "../../segment-engine/executor";
import { personaliseMessage } from "../../utils/personalise";
import { filterEligibleCustomerIds } from "../../utils/suppression";










export async function processCampaignDispatch(campaignId: string): Promise<void> {
  console.log(`[CampaignDispatch] Starting campaign dispatch task for ID: ${campaignId}`);

  try {
    
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true }
    });

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "in_progress" }
    });

    
    const rawMatchedIds = await getSegmentCustomerIds(campaign.segment.filterRules);

    // Consent & frequency guard — never message opted-out or over-capped contacts
    const { eligible: matchedCustomerIds, suppressedOptOut, suppressedFrequency } =
      await filterEligibleCustomerIds(rawMatchedIds);
    console.log(`[CampaignDispatch] ${rawMatchedIds.length} matched; suppressed ${suppressedOptOut} opt-out + ${suppressedFrequency} frequency-capped; ${matchedCustomerIds.length} eligible for campaign ${campaignId}`);

    // Holdout / control group — randomly withhold a % as an untouched control
    // so true incremental lift can be measured later.
    let treatmentIds = matchedCustomerIds;
    if (campaign.holdoutPct && campaign.holdoutPct > 0 && matchedCustomerIds.length > 0) {
      const shuffled = [...matchedCustomerIds].sort(() => Math.random() - 0.5);
      const holdoutCount = Math.floor(shuffled.length * (campaign.holdoutPct / 100));
      const controlIds = shuffled.slice(0, holdoutCount);
      treatmentIds = shuffled.slice(holdoutCount);
      if (controlIds.length > 0) {
        await db.communicationLog.createMany({
          data: controlIds.map((cid) => ({
            campaignId,
            customerId: cid,
            channel: campaign.channel,
            renderedMessage: "",
            status: "holdout",
          })),
        });
      }
      console.log(`[CampaignDispatch] Holdout ${campaign.holdoutPct}% → ${controlIds.length} control, ${treatmentIds.length} treatment`);
    }

    if (treatmentIds.length === 0) {
      console.log(`[CampaignDispatch] Segment is empty. Marking campaign as completed.`);
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: "completed" }
      });
      
      await db.campaignStats.upsert({
        where: { campaignId },
        create: {
          campaignId,
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalOpened: 0,
          totalRead: 0,
          totalClicked: 0,
          totalOrdersAttributed: 0,
          attributedRevenueInr: 0
        },
        update: {
          totalSent: 0
        }
      });
      return;
    }

    
    const customers = await db.customer.findMany({
      where: { id: { in: treatmentIds } },
      include: { orders: true }
    });

    
    const createdLogs = [];
    for (const customer of customers) {
      const renderedMessage = personaliseMessage(campaign.messageTemplate, customer);
      
      const log = await db.communicationLog.create({
        data: {
          campaignId,
          customerId: customer.id,
          channel: campaign.channel,
          renderedMessage,
          status: "queued"
        }
      });
      createdLogs.push(log);
    }

    
    await db.campaignStats.upsert({
      where: { campaignId },
      create: {
        campaignId,
        totalSent: createdLogs.length,
        totalDelivered: 0,
        totalFailed: 0,
        totalOpened: 0,
        totalRead: 0,
        totalClicked: 0,
        totalOrdersAttributed: 0,
        attributedRevenueInr: 0
      },
      update: {
        totalSent: createdLogs.length,
        totalDelivered: 0,
        totalFailed: 0,
        totalOpened: 0,
        totalRead: 0,
        totalClicked: 0,
        totalOrdersAttributed: 0,
        attributedRevenueInr: 0
      }
    });

    
    const batchSize = 100;
    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || "http://localhost:3001";
    const apiSecret = process.env.CRM_RECEIPT_SECRET || "dev-secret-change-in-production";

    for (let i = 0; i < createdLogs.length; i += batchSize) {
      const logBatch = createdLogs.slice(i, i + batchSize);
      
      const batchMessages = logBatch.map(log => {
        const customer = customers.find((c: any) => c.id === log.customerId);
        return {
          id: log.id,
          customerId: log.customerId,
          channel: log.channel as "whatsapp" | "sms" | "email" | "rcs",
          content: log.renderedMessage,
          recipientPhone: customer?.phone || undefined,
          recipientEmail: customer?.email || undefined
        };
      });

      
      let attempt = 0;
      let success = false;
      const maxRetries = 3;

      while (attempt < maxRetries && !success) {
        try {
          await axios.post(
            `${channelServiceUrl}/send`,
            {
              campaignId,
              messages: batchMessages
            },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-secret": apiSecret
              },
              timeout: 10000 
            }
          );
          success = true;
          console.log(`[CampaignDispatch] Dispatched batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(createdLogs.length / batchSize)}`);
        } catch (err: any) {
          attempt++;
          console.warn(`[CampaignDispatch] Batch dispatch failed. Attempt ${attempt}/${maxRetries}. Error: ${err.message}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000)); 
          }
        }
      }

      if (!success) {
        throw new Error("Unable to establish connectivity to the Channel Service gateway after 3 retries.");
      }
    }

    
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "completed" }
    });
    console.log(`[CampaignDispatch] Campaign ${campaignId} completed sending successfully.`);

  } catch (error: any) {
    console.error(`[CampaignDispatch] Fatal error occurred during campaign dispatch: ${error.message}`);
    
    
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "failed" }
    }).catch((err: any) => {
      console.error(`[CampaignDispatch] Error updating status to failed for campaign ${campaignId}:`, err.message);
    });

    throw error;
  }
}
