"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Search, Bell, ChevronDown, User, Settings, LogOut, Download, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const NAV_TABS = [
  { label: "Analytics", href: "/dashboard" },
  { label: "Performance", href: "/campaigns" },
  { label: "Reports", href: "/segments" },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: "Campaign Completed", body: "AutoReach AI campaign delivered to 338 shoppers.", time: "2 min ago", read: false },
  { id: 2, title: "Segment Created", body: "AI built segment: Women in Mumbai > ₹5,000", time: "15 min ago", read: false },
  { id: 3, title: "New Customers Imported", body: "500 customers successfully seeded with RFM scores.", time: "1 hour ago", read: true },
  { id: 4, title: "Delivery Rate Alert", body: "Campaign delivery rate dropped below 50%.", time: "2 hours ago", read: true },
];

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || "Demo Marketer";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "DM";

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);

  const profileRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Lock dark mode permanently
  React.useEffect(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    localStorage.removeItem("theme");
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(p => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeTab = NAV_TABS.find(t => pathname.startsWith(t.href))?.label || "Analytics";

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      page: pathname,
      data: "XenoCRM Export - " + pathname,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xenocrm-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="topbar-root" style={{
        position: "sticky", top: 0, zIndex: 40, height: 64,
        background: "rgba(13,16,23,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1A2035",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: 16,
      }}>

        {/* Search */}
        <button
          onClick={() => { setSearchQuery(""); setIsSearchOpen(true); }}
          className="topbar-search"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #1A2035", borderRadius: 8,
            cursor: "pointer", width: 220, minWidth: 160,
          }}
        >
          <Search style={{ width: 14, height: 14, color: "#7B82A0", flexShrink: 0 }} />
          <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem", color: "#7B82A0", flex: 1, textAlign: "left" }}>
            Command Intelligence...
          </span>
          <kbd style={{
            fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#464555",
            background: "#1A2035", border: "1px solid #252D48", borderRadius: 4,
            padding: "1px 5px", flexShrink: 0,
          }}>⌘K</kbd>
        </button>

        {/* Center nav tabs */}
        <nav style={{ flex: 1, display: "flex", justifyContent: "center", gap: 4 }}>
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.label;
            return (
              <Link key={tab.label} href={tab.href} style={{ textDecoration: "none" }}>
                <div
                  className={active ? "topbar-tab topbar-tab-active" : "topbar-tab"}
                  style={{
                    padding: "6px 18px", borderRadius: "6px 6px 0 0", cursor: "pointer",
                    fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem",
                    fontWeight: active ? 700 : 400,
                    color: active ? "#EDF0FF" : "#7B82A0",
                    borderBottom: active ? "2px solid #c0c1ff" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = "#EDF0FF"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = "#7B82A0"; }}
                >
                  {tab.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="topbar-icon-btn"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035",
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem",
              color: "#7B82A0", fontWeight: 600,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#EDF0FF";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(91,95,239,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#7B82A0";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A2035";
            }}
          >
            <Download style={{ width: 13, height: 13 }} />
            <span>Export</span>
          </button>

          {/* Bell — Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsNotifOpen(p => !p)}
              className="topbar-icon-btn"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#7B82A0", cursor: "pointer", position: "relative",
              }}
            >
              <Bell style={{ width: 15, height: 15 }} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 7, right: 7,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#00e293", border: "1.5px solid #0D1017",
                }} />
              )}
            </button>

            {isNotifOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                background: "#13151F", border: "1px solid #1A2035",
                borderRadius: 12, width: 320, overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 60,
              }}>
                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderBottom: "1px solid #1A2035"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#EDF0FF" }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span style={{
                        padding: "1px 7px", borderRadius: 20,
                        background: "rgba(0,226,147,0.1)", border: "1px solid rgba(0,226,147,0.2)",
                        fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#00e293"
                      }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#5B5FEF"
                    }}
                  >
                    Mark all read
                  </button>
                </div>

                {/* Notification items */}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(26,32,53,0.6)",
                      background: n.read ? "transparent" : "rgba(91,95,239,0.04)",
                      cursor: "pointer", transition: "background 0.15s"
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "#1A2035")}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : "rgba(91,95,239,0.04)")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                        background: n.read ? "#464555" : "#00e293"
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#EDF0FF" }}>
                          {n.title}
                        </div>
                        <div style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#7B82A0", marginTop: 2 }}>
                          {n.body}
                        </div>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#464555", marginTop: 4 }}>
                          {n.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", color: "#5B5FEF"
                  }}>
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="topbar-profile-btn"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 8px 4px 4px", borderRadius: 20,
                background: "rgba(255,255,255,0.04)", border: "1px solid #1A2035",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(91,95,239,0.2)", border: "1px solid rgba(192,193,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.65rem", color: "#c0c1ff",
              }}>{userInitials}</div>
              <ChevronDown style={{
                width: 12, height: 12, color: "#7B82A0",
                transform: isProfileOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }} />
            </button>

            {isProfileOpen && (
              <div className="topbar-dropdown" style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                background: "#13151F", border: "1px solid #1A2035",
                borderRadius: 10, width: 200, overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 60,
              }}>
                <div className="topbar-dropdown-item" style={{ padding: "12px 14px", borderBottom: "1px solid #1A2035" }}>
                  <div className="topbar-dropdown-text" style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#EDF0FF" }}>{userName}</div>
                  <div className="topbar-dropdown-subtext" style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", color: "#7B82A0", marginTop: 2 }}>{session?.user?.email || "demo@xenocrm.com"}</div>
                </div>
                {[
                  { icon: User, label: "My Profile", href: "/profile" },
                  { icon: Settings, label: "Settings", href: "/settings" },
                  { icon: HelpCircle, label: "Help Center", href: "/help" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link key={href} href={href} style={{ textDecoration: "none" }} onClick={() => setIsProfileOpen(false)}>
                    <div
                      className="topbar-dropdown-item"
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "#1A2035")}
                      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                    >
                      <Icon style={{ width: 14, height: 14, color: "#7B82A0" }} />
                      <span className="topbar-dropdown-text" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#c6c5d7" }}>{label}</span>
                    </div>
                  </Link>
                ))}
                <div style={{ borderTop: "1px solid #1A2035" }}>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: "none", border: "none",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.08)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
                  >
                    <LogOut style={{ width: 14, height: 14, color: "#FF4D6A" }} />
                    <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.78rem", color: "#FF4D6A" }}>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden rounded-2xl" style={{ background: "#13151F", border: "1px solid #1A2035" }}>
          <DialogHeader className="sr-only">
            <DialogTitle>Command Search</DialogTitle>
            <DialogDescription>Navigate quickly</DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1A2035", padding: "12px 16px", gap: 10 }}>
            <Search style={{ width: 15, height: 15, color: "#7B82A0", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Command Intelligence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "JetBrains Mono,monospace", fontSize: "0.82rem", color: "#EDF0FF",
              }}
            />
          </div>
          <div style={{ padding: 8 }}>
            {[
              { label: "Go to Dashboard", href: "/dashboard" },
              { label: "Go to Customers", href: "/customers" },
              { label: "Go to Segments", href: "/segments" },
              { label: "Go to Campaigns", href: "/campaigns" },
              { label: "Go to AutoReach Agent", href: "/agent" },
              { label: "Go to Profile", href: "/profile" },
              { label: "Go to Settings", href: "/settings" },
              { label: "Go to Help Center", href: "/help" },
            ]
              .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((cmd) => (
                <button
                  key={cmd.href}
                  onClick={() => { setIsSearchOpen(false); window.location.href = cmd.href; }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    padding: "10px 12px", background: "none", border: "none",
                    borderRadius: 8, cursor: "pointer",
                    fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem",
                    color: "#c6c5d7", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#1A2035")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
                >
                  {cmd.label}
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}