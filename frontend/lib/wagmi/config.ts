"use client";

import { getDefaultConfig, type Chain as RainbowKitChain } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

// GenLayer Network Configuration (from environment variables with fallbacks)
const GENLAYER_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "61999");
const GENLAYER_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const GENLAYER_CHAIN_NAME = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || "GenLayer Studio";
const GENLAYER_SYMBOL = process.env.NEXT_PUBLIC_GENLAYER_SYMBOL || "GEN";

// Define GenLayer as a custom chain for RainbowKit
export const genlayerChain = {
  id: GENLAYER_CHAIN_ID,
  name: GENLAYER_CHAIN_NAME,
  nativeCurrency: {
    name: GENLAYER_SYMBOL,
    symbol: GENLAYER_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [GENLAYER_RPC_URL],
    },
  },
  iconUrl: "/genlayer-icon.svg",
  iconBackground: "#9B6AF6",
  testnet: true,
} as const satisfies RainbowKitChain;

// RainbowKit configuration with GenLayer chain
// Note: Get your projectId from https://cloud.walletconnect.com (free)
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";

export const wagmiConfig = getDefaultConfig({
  appName: "GenLayer Football Betting",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [genlayerChain],
  transports: {
    [GENLAYER_CHAIN_ID]: http(GENLAYER_RPC_URL),
  },
  ssr: true,
});

// Export chain ID for use in other parts of the app
export { GENLAYER_CHAIN_ID, GENLAYER_RPC_URL };
