"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, 
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#FFFFFF",
              color: "#38322E",
              border: "1px solid #E5DBC9",
              borderRadius: "8px",
              fontSize: "13px",
            },
            success: {
              style: {
                borderLeft: "4px solid #4E9B8A",
              },
            },
            error: {
              style: {
                borderLeft: "4px solid #CC6B6B",
              },
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
