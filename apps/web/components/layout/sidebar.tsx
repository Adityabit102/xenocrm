"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Filter, Send, Sparkles,
  Settings, ChevronLeft, ChevronRight, Zap, Menu, X, HelpCircle,
  CalendarClock, GitBranch, FileText,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMounted: boolean;
}

export function Sidebar({ isCollapsed, onToggle, isMounted }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => setMobileOpen(false), [pathname]);

  if (!isMounted) return (
    <>
      <div className="lg:hidden fixed top-4 left-4 h-9 w-9 z-50" />
      <div className="hidden lg:block flex-shrink-0 h-screen" style={{ width: 260, background: "#F4EEDF", borderRight: "1px solid #E5DBC9" }} />
    </>
  );

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" || pathname === "/" : pathname.startsWith(href);

  const coreItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Segments", href: "/segments", icon: Filter },
    { name: "Campaigns", href: "/campaigns", icon: Send },
    { name: "Journeys", href: "/journeys", icon: GitBranch },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Scheduler", href: "/scheduler", icon: CalendarClock },
  ];
  const aiItems = [{ name: "AutoReach Agent", href: "/agent", icon: Sparkles }];

  const SidebarInner = ({ mobile = false }: { mobile?: boolean }) => {
    const collapsed = !mobile && isCollapsed;
    const { data: session } = useSession();
    const userEmail = session?.user?.email || "demo@cove.io";
    const userName = session?.user?.name || "Demo Marketer";
    const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "DM";

    return (
      <div
        className="sidebar-root"
        style={{
          height: "100%", display: "flex", flexDirection: "column",
          background: "#F4EEDF", borderRight: "1px solid #E5DBC9",
          width: mobile ? 260 : collapsed ? 68 : 260,
          transition: "width 0.3s ease", overflow: "hidden", flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          className="sidebar-divider"
          style={{
            height: 64, display: "flex", alignItems: "center",
            gap: 10, padding: collapsed ? "0 18px" : "0 20px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderBottom: "1px solid #E5DBC9", flexShrink: 0,
          }}
        >
          <img src="/cove-logo.svg" alt="Cove" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
          {!collapsed && (
            <div>
              <div className="sidebar-brand-text" style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#2C6A7B", lineHeight: 1.1 }}>Cove</div>
              <div className="sidebar-label" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8A7F76", marginTop: 1 }}>Intelligence</div>
            </div>
          )}
          {mobile && (
            <button onClick={() => setMobileOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#8A7F76", cursor: "pointer", padding: 4 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 10px" }}>

          {!collapsed && (
            <div className="sidebar-label" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", padding: "4px 10px 8px" }}>Core</div>
          )}

          {coreItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            /* Scheduler gets a warm amber accent to distinguish from Campaigns */
            const accentColor = item.href === "/scheduler" ? "#C9954E" : "#2C6A7B";
            const glowColor = item.href === "/scheduler" ? "rgba(201, 149, 78,0.15)" : "rgba(62, 138, 158,0.15)";

            return (
              <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
                <div
                  className={active ? "sidebar-active-bg" : "sidebar-nav-hover"}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: collapsed ? "10px 0" : "9px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 8, marginBottom: 2, cursor: "pointer",
                    background: active ? glowColor : "transparent",
                    transition: "background 0.15s", position: "relative",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(56, 50, 46,0.04)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <Icon style={{ width: 17, height: 17, color: active ? accentColor : "#8A7F76", flexShrink: 0 }} />
                  {!collapsed && (
                    <span
                      className={active ? "sidebar-active-text" : "sidebar-nav-text"}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", fontWeight: active ? 700 : 400, color: active ? "#38322E" : "#8A7F76", whiteSpace: "nowrap" }}
                    >
                      {item.name}
                    </span>
                  )}
                  {/* Active indicator */}
                  {active && !collapsed && (
                    <div style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 18,
                      background: item.href === "/scheduler" ? "#C9954E" : "#4E9B8A",
                      borderRadius: "0 2px 2px 0",
                    }} />
                  )}
                </div>
              </Link>
            );
          })}

          {/* AI Engine section */}
          <div style={{ marginTop: 16 }}>
            {!collapsed && (
              <div className="sidebar-label" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9BFB0", padding: "4px 10px 8px" }}>AI Engine</div>
            )}
            {aiItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    className={active ? "sidebar-active-bg" : "sidebar-nav-hover"}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: collapsed ? "10px 0" : "9px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 8, marginBottom: 2, cursor: "pointer",
                      background: active ? "rgba(62, 138, 158,0.15)" : "transparent",
                      transition: "background 0.15s", position: "relative",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(56, 50, 46,0.04)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <Icon style={{ width: 17, height: 17, color: active ? "#4E9B8A" : "#C98E83", flexShrink: 0 }} />
                    {!collapsed && (
                      <span
                        className={active ? "sidebar-active-text" : "sidebar-nav-text"}
                        style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", fontWeight: active ? 700 : 400, color: active ? "#38322E" : "#8A7F76", whiteSpace: "nowrap" }}
                      >
                        {item.name}
                      </span>
                    )}
                    {active && !collapsed && (
                      <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: "#4E9B8A", borderRadius: "0 2px 2px 0" }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className="sidebar-divider" style={{ borderTop: "1px solid #E5DBC9", padding: "12px 10px", flexShrink: 0 }}>

          {!collapsed && (
            <button
              onClick={() => router.push("/agent")}
              style={{
                width: "100%", padding: "10px 0", marginBottom: 10,
                background: "linear-gradient(135deg,#3E8A9E,#2C6A7B)",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontFamily: "Syne,sans-serif", fontSize: "0.85rem", fontWeight: 700,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Zap style={{ width: 14, height: 14 }} />
              Run Cove
            </button>
          )}

          <Link href="/settings" style={{ textDecoration: "none" }}>
            <div
              className="sidebar-nav-hover"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "9px 0" : "9px 12px", justifyContent: collapsed ? "center" : "flex-start", borderRadius: 8, cursor: "pointer", marginBottom: 2, transition: "background 0.15s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(56, 50, 46,0.04)")}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              <Settings style={{ width: 17, height: 17, color: "#8A7F76", flexShrink: 0 }} />
              {!collapsed && <span className="sidebar-settings-text" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#8A7F76" }}>Settings</span>}
            </div>
          </Link>

          {!collapsed && (
            <Link href="/help" style={{ textDecoration: "none" }}>
              <div
                className="sidebar-nav-hover"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, transition: "background 0.15s" }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(56, 50, 46,0.04)")}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
              >
                <HelpCircle style={{ width: 17, height: 17, color: "#8A7F76", flexShrink: 0 }} />
                <span className="sidebar-settings-text" style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.875rem", color: "#8A7F76" }}>Help Center</span>
              </div>
            </Link>
          )}

          {/* User chip */}
          {!collapsed && (
            <div
              className="sidebar-profile-chip"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(56, 50, 46,0.03)", border: "1px solid #E5DBC9", marginBottom: 6 }}
            >
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(62, 138, 158,0.2)", border: "1px solid rgba(62, 138, 158,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "0.7rem", color: "#2C6A7B", flexShrink: 0 }}>
                {userInitials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sidebar-profile-name" style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#38322E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </div>
                <div className="sidebar-profile-email" style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#8A7F76", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </div>
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className="sidebar-collapse-btn"
            style={{ width: "100%", height: 32, background: "none", border: "none", color: "#C9BFB0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "color 0.15s, background 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(56, 50, 46,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#38322E"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#C9BFB0"; }}
          >
            {collapsed ? <ChevronRight style={{ width: 15, height: 15 }} /> : <ChevronLeft style={{ width: 15, height: 15 }} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(99, 86, 70,0.6)", backdropFilter: "blur(4px)", zIndex: 40 }}
          className="lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <div
        style={{ position: "fixed", left: 0, top: 0, height: "100vh", zIndex: 50, transform: mobileOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s ease" }}
        className="lg:hidden"
      >
        <SidebarInner mobile />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block" style={{ flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
        <SidebarInner />
      </div>

      <style>{`
        .light .sidebar-root            { background: #FFFFFF !important; border-right-color: #E2E8F0 !important; }
        .light .sidebar-divider         { border-color: #E2E8F0 !important; }
        .light .sidebar-brand-text      { color: #3E8A9E !important; }
        .light .sidebar-label           { color: #94A3B8 !important; }
        .light .sidebar-nav-text        { color: #475569 !important; }
        .light .sidebar-nav-hover:hover { background: rgba(99, 86, 70,0.04) !important; }
        .light .sidebar-active-bg       { background: rgba(62, 138, 158,0.08) !important; }
        .light .sidebar-active-text     { color: #0F172A !important; }
        .light .sidebar-settings-text   { color: #64748B !important; }
        .light .sidebar-profile-chip    { background: #F8FAFC !important; border-color: #E2E8F0 !important; }
        .light .sidebar-profile-name    { color: #0F172A !important; }
        .light .sidebar-profile-email   { color: #94A3B8 !important; }
        .light .sidebar-collapse-btn    { color: #94A3B8 !important; }
        .light .sidebar-collapse-btn:hover { background: #F1F5F9 !important; color: #0F172A !important; }
      `}</style>
    </>
  );
}
