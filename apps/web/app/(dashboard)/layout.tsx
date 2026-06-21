"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SystemTicker } from "@/components/layout/system-ticker";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { RouteLogoTransition } from "@/components/layout/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
    setIsMounted(true);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  
  React.useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  
  if (status === "loading" || !isMounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-base">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-border-subtle" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary-container animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">

      {}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleCollapse}
        isMounted={isMounted}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
          {children}
        </main>
      </div>
      <AIAssistant />
      <RouteLogoTransition />
    </div>
  );
}