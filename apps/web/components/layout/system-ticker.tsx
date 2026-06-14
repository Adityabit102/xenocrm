"use client";

interface TickerItem { dot: "mint" | "indigo" | "warn" | "info"; label: string; }

interface SystemTickerProps {
  items?: TickerItem[];
  
  offset?: boolean;
}

const DEFAULT_ITEMS: TickerItem[] = [
  { dot:"mint",   label:"SYSTEM: NOMINAL" },
  { dot:"indigo", label:"API_THROUGHPUT: 1.2M req/sec" },
  { dot:"mint",   label:"AUTH_AGENTS: ACTIVE (12)" },
  { dot:"warn",   label:"LATENCY: 42ms" },
  { dot:"mint",   label:"NEURAL ENGINE: LOAD BALANCING 0.4%" },
  { dot:"info",   label:"CAMPAIGN OUTREACH: 84,291 DELIVERED" },
];

const DOT_COLORS: Record<string,string> = {
  mint:   "bg-secondary-fixed-dim",
  indigo: "bg-primary",
  warn:   "bg-status-warn",
  info:   "bg-status-info",
};

export function SystemTicker({ items = DEFAULT_ITEMS, offset = true }: SystemTickerProps) {
  
  const all = [...items, ...items];

  return (
    <footer
      className={`fixed bottom-0 h-8 bg-bg-base/90 backdrop-blur-md border-t border-border-subtle z-50 flex items-center overflow-hidden transition-colors ${
        offset ? "right-0 left-[260px]" : "right-0 left-0"
      }`}
    >
      <div className="flex items-center gap-xl whitespace-nowrap px-lg animate-marquee">
        {all.map((item, i) => (
          <div key={i} className="flex items-center gap-sm">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[item.dot]}`}/>
            <span className="font-data-mono text-[10px] text-text-secondary uppercase tracking-wider">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </footer>
  );
}
