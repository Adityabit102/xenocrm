# XenoCRM — AI-Native Mini CRM

An AI-native CRM for D2C brands to segment shoppers, generate personalised campaigns, and track communication performance across WhatsApp, SMS, Email, and RCS.

**Live:** https://xenocrm-app.vercel.app

> ⚠️ **Free Tier Notice:** All three services (Vercel, Render, Neon) run on free tiers. The channel service on Render spins down after inactivity and takes **50+ seconds to wake up** on the first request. If a campaign shows "In Progress" for a long time, open https://xenocrm-channel.onrender.com/health first to wake the service, then dispatch again. Campaign stats may take 2-3 minutes to fully populate after dispatch.

---

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind — deployed on Vercel
- **Database:** Neon PostgreSQL + Prisma ORM
- **Channel Service:** Node.js + Fastify (stubbed delivery simulator) — deployed on Render
- **AI:** Groq `llama-3.3-70b-versatile` for all AI features

---

## Features

### Core
- Customer ingestion with RFM scoring (Recency, Frequency, Monetary)
- Visual + AI-powered segment builder
- Campaign creation wizard with 5-step flow
- Campaign dispatch → channel service → callback receipt pipeline
- Real-time delivery funnel (Sent → Delivered → Opened → Read → Clicked → Attributed)

### AI Features (Groq-powered)
1. **Autonomous Campaign Suggestions** — Groq analyses live DB signals and surfaces 3 ready-to-launch campaign ideas on the dashboard
2. **AI Segment Builder** — describe your audience in plain English, AI generates filter rules
3. **AI Message Generator** — generates 3 message variants with different emotional angles
4. **A/B Testing with Groq Challenger** — write Variant A, AI generates a challenger Variant B
5. **AI Performance Prediction** — predicts delivery rate, CTR, revenue, and best send time per channel
6. **AI Best Send Time** — analyses historical click timestamps to recommend optimal dispatch window

### Other
- Segment Overlap Analysis with bubble chart visualisation
- Real attribution tracking (orders within 7 days of click)
- Campaign Scheduler with live countdown timers
- AutoReach AI Agent for natural language campaign creation
- Voice input support

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER CLIENT                       │
│         Next.js 15 App Router (React 19)                │
│                                                          │
│  Pages: Dashboard, Campaigns, Segments,                 │
│         Scheduler, Customers, AutoReach Agent           │
│                                                          │
│  State: TanStack Query (server state)                   │
│  Auth:  NextAuth.js (session management)                │
│  UI:    Tailwind CSS, Recharts, Framer Motion           │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / RSC
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS API LAYER (Vercel)                  │
│                                                          │
│  /api/campaigns        — CRUD + dispatch                │
│  /api/segments         — CRUD + AI build                │
│  /api/customers        — CRUD + import                  │
│  /api/receipts         — callback ingestion             │
│  /api/dashboard        — suggestions (Groq)             │
│  /api/analytics        — overview + performance         │
│  /api/ai/assistant     — Groq text generation           │
│  /api/ai/segment-insight — campaign AI summary          │
│  /api/cron/attribution — revenue attribution            │
└──────┬─────────────────────────┬───────────────────────┘
       │                         │
       ▼                         ▼
┌──────────────┐      ┌─────────────────────────────────┐
│  NEON        │      │         GROQ AI                  │
│  PostgreSQL  │      │   llama-3.3-70b-versatile        │
│              │      │                                  │
│  Tables:     │      │  • Segment rules from NL         │
│  Customer    │      │  • Message generation            │
│  Order       │      │  • A/B challenger variants       │
│  Segment     │      │  • Performance predictions       │
│  Campaign    │      │  • Autonomous suggestions        │
│  CommLog     │      │  • Campaign insights             │
│  CampaignStat│      └─────────────────────────────────┘
│  SegmentMem  │
└──────────────┘
       │
       │ POST /send (batched messages)
       ▼
┌─────────────────────────────────────────────────────────┐
│           CHANNEL SERVICE (Render — Fastify)             │
│                                                          │
│  POST /send                                             │
│    → validates x-api-secret                             │
│    → enqueues MessageJob[] to in-memory queue           │
│    → returns 202 immediately                            │
│                                                          │
│  In-Memory Queue                                        │
│    → dequeues jobs one by one                           │
│    → runs simulateDelivery() per message                │
│                                                          │
│  Event Simulator                                        │
│    → sent (immediate)                                   │
│    → delivered (500ms-2s delay, 85% success rate)      │
│    → opened (2-8s delay, 60% of delivered)             │
│    → read (1-4s delay, 45% of opened)                  │
│    → clicked (0.5-3s delay, 20% of read)               │
│    → order_placed (5-15s delay, 8% of clicked)         │
│    → failed → retry (70% retry success rate)           │
│                                                          │
│  Callback Client                                        │
│    → POST /api/receipts on Vercel                       │
│    → x-webhook-secret header                           │
│    → retries up to 3 times with exponential backoff    │
└─────────────────────────────────────────────────────────┘
       │ POST /api/receipts (event callbacks)
       ▼
┌─────────────────────────────────────────────────────────┐
│              RECEIPTS API (Vercel)                       │
│                                                          │
│  1. Validates x-webhook-secret                          │
│  2. Finds CommunicationLog by messageId                 │
│  3. Updates log status + timestamp                      │
│  4. Increments CampaignStats atomically                 │
│     (totalDelivered, totalOpened, totalClicked etc.)    │
│  5. Updates attributedRevenueInr on order_placed        │
└─────────────────────────────────────────────────────────┘
```

The channel service simulates message delivery and asynchronously calls back into the CRM receipts API with events: `sent`, `delivered`, `opened`, `read`, `clicked`, `order_placed`. The CRM ingests these and updates campaign stats in real time.

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend (Next.js) | Vercel (Hobby) | https://xenocrm-app.vercel.app |
| Database | Neon (Free) | AWS Asia Pacific 1 (Singapore) |
| Channel Service | Render (Free) | https://xenocrm-channel.onrender.com |

### Free Tier Limitations
- **Render** spins down after 15 minutes of inactivity. First request after inactivity takes 50+ seconds. Wake it up by visiting https://xenocrm-channel.onrender.com/health before dispatching a campaign.
- **Neon** scales to zero when inactive. First DB query after inactivity may be slightly slower.
- **Vercel Hobby** has a 60 second function timeout. Large campaigns (500+ customers) may take the full duration to dispatch.
- **Groq free tier** has a 100k token/day limit. AI features may return errors if the daily limit is reached.

### Environment Variables (Vercel)
```
DATABASE_URL=           # Neon PostgreSQL connection string
GROQ_API_KEY=           # Groq API key
NEXTAUTH_SECRET=        # Random base64 string
NEXTAUTH_URL=           # https://xenocrm-app.vercel.app
CRM_RECEIPT_SECRET=     # Shared secret between CRM and channel service
CHANNEL_SERVICE_URL=    # https://xenocrm-channel.onrender.com
```

### Environment Variables (Render — Channel Service)
```
CRM_RECEIPTS_URL=       # https://xenocrm-app.vercel.app/api/receipts
CRM_RECEIPT_SECRET=     # Same secret as above
PORT=3001
```

---

## Local Development

```bash
# Terminal 1 — Frontend
cd apps/web && npm run dev

# Terminal 2 — Channel Service
cd apps/channel-service && npm run dev
```

Runs at `http://localhost:3000` with channel service at `http://localhost:3001`.

---

## Repo Structure

```
xenocrm/
├── apps/
│   ├── web/              # Next.js frontend + API routes
│   │   ├── app/          # App Router pages and API
│   │   ├── components/   # UI components
│   │   ├── lib/          # DB, AI, segment engine, queue
│   │   └── prisma/       # Schema and seed
│   └── channel-service/  # Fastify delivery simulator
└── package.json
```
