"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/lib/wagmi/config";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";

import "@rainbow-me/rainbowkit/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use useState to ensure QueryClient is only created once per component lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#9B6AF6", // GenLayer brand purple
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          modalSize="compact"
          locale="en-US"
        >
          <WalletProvider>
            {children}
          </WalletProvider>
        </RainbowKitProvider>
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          offset="80px"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
              boxShadow: "0 8px 32px hsl(var(--background) / 0.8)",
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
