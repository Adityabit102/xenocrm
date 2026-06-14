


export enum RFMTier {
  CHAMPION = "champion",
  LOYAL = "loyal",
  PROMISING = "promising",
  AT_RISK = "at_risk",
  LAPSED = "lapsed",
  NEW = "new",
  GENERAL = "general"
}




export enum CampaignStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  PAUSED = "paused"
}




export enum CommunicationStatus {
  QUEUED = "queued",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  OPENED = "opened",
  READ = "read",
  CLICKED = "clicked",
  ORDER_PLACED = "order_placed"
}




export enum Channel {
  WHATSAPP = "whatsapp",
  SMS = "sms",
  EMAIL = "email",
  RCS = "rcs"
}




export type FilterField = 
  | "recency_days" 
  | "frequency" 
  | "monetary" 
  | "city" 
  | "gender" 
  | "rfm_tier" 
  | "category" 
  | "tier";




export type FilterOperator = 
  | "lt" 
  | "gt" 
  | "eq" 
  | "gte" 
  | "lte" 
  | "in" 
  | "contains"
  | "is" 
  | "is not" 
  | "is one of" 
  | "greater than" 
  | "less than" 
  | "between" 
  | "equals";




export interface FilterCondition {
  field: FilterField;
  operator: FilterOperator;
  value?: any;
}




export interface SegmentFilterRules {
  logic: "AND" | "OR";
  conditions: FilterCondition[];
}




export interface ReceiptPayload {
  messageId: string;
  eventType: string;
  eventId: string;
  timestamp: string;
  campaignId: string;
  customerId: string;
  metadata?: {
    channel?: string;
    amountInr?: number;
    category?: string;
    orderChannel?: string;
    failureReason?: string;
    [key: string]: any;
  };
}




export interface AgentPlan {
  segmentId?: string;
  newSegmentRules?: SegmentFilterRules;
  newSegmentName?: string;
  channel: Channel;
  messageTemplate: string;
  scheduledAt?: string;
  reasoning: string[];
  estimatedReach: number;
  expectedClickRate: number;
}
