import { simulateMessageEvents } from "./events";

export interface MessageJob {
  id: string;
  campaignId: string;
  customerId: string;
  channel: string;
  content: string;
  recipientPhone?: string;
  recipientEmail?: string;
}

class MessageQueue {
  private queue: MessageJob[] = [];

  constructor() {
    this.startLoop();
  }

  


  public enqueue(messages: MessageJob[]): void {
    this.queue.push(...messages);
    console.log(`[Queue] Enqueued ${messages.length} messages. Total pending in queue: ${this.queue.length}`);
  }

  


  private startLoop(): void {
    setInterval(() => {
      this.processBatch();
    }, 500);
  }

  


  private processBatch(): void {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, 10);
    console.log(`[Queue] Dispatching batch of ${batch.length} messages. Remaining in queue: ${this.queue.length}`);

    for (const msg of batch) {
      this.processMessage(msg);
    }
  }

  


  private async processMessage(msg: MessageJob): Promise<void> {
    const delay = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await simulateMessageEvents(msg);
    } catch (err) {
      console.error(`[Queue] Exception thrown during event simulation for message ${msg.id}:`, err);
    }
  }

  


  public getLength(): number {
    return this.queue.length;
  }

  


  public size(): number {
    return this.queue.length;
  }
}

export const messageQueue = new MessageQueue();
