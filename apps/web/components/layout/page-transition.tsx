"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/* ============================================================
   Cove — Route transition
   On every in-app navigation a branded panel sweeps across the
   viewport (left → right), carrying the Cove logo. The content
   underneath fades/slides in via the dashboard `template.tsx`.
   ============================================================ */
export function RouteLogoTransition() {
  const pathname = usePathname();
  const [run, setRun] = React.useState(0);
  const first = React.useRef(true);

  React.useEffect(() => {
    // skip the very first mount (initial load / arriving from login)
    if (first.current) {
      first.current = false;
      return;
    }
    setRun((r) => r + 1);
  }, [pathname]);

  if (run === 0) return null;

  return (
    <motion.div
      key={run}
      aria-hidden
      className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
      initial={{ x: "-100%" }}
      animate={{ x: ["-100%", "0%", "0%", "100%"] }}
      transition={{ duration: 0.78, times: [0, 0.42, 0.5, 1], ease: [0.76, 0, 0.24, 1] }}
      style={{
        background: "linear-gradient(120deg,#13202B 0%,#1b3a44 60%,#13202B 100%)",
        boxShadow: "0 0 80px rgba(0,0,0,0.4)",
      }}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.92, 1, 1, 1.06] }}
        transition={{ duration: 0.78, times: [0, 0.36, 0.56, 1], ease: "easeInOut" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cove-logo.svg" alt="" style={{ width: 46, height: 46 }} />
        <span
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 800,
            fontSize: "1.9rem",
            color: "#F4EEDF",
            letterSpacing: "-0.01em",
          }}
        >
          Cove
        </span>
      </motion.div>
    </motion.div>
  );
}
