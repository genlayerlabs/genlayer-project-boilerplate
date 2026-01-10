"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// Re-export chain ID from wagmi config
export { GENLAYER_CHAIN_ID } from "@/lib/wagmi/config";

/**
 * Get the GenLayer RPC URL from environment variables
 */
export function getStudioUrl(): string {
  return (
    process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api"
  );
}

/**
 * Get the contract address from environment variables
 */
export function getContractAddress(): string {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    return "";
  }
  return address;
}

/**
 * Create a GenLayer client with optional account
 */
export function createGenLayerClient(address?: string) {
  const config: any = {
    chain: studionet,
  };

  if (address) {
    config.account = address as `0x${string}`;
  }

  try {
    return createClient(config);
  } catch (error) {
    console.error("Error creating GenLayer client:", error);
    return createClient({
      chain: studionet,
    });
  }
}
