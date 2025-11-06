"use client";

import { createClient, createAccount as createGenLayerAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// Type for GenLayer account (return type of createAccount)
export type Account = ReturnType<typeof createGenLayerAccount>;

const STORAGE_KEY = "genlayer_account_private_key";

/**
 * Get the GenLayer studio URL from environment variables
 */
export function getStudioUrl(): string {
  return process.env.NEXT_PUBLIC_STUDIO_URL || "https://studio.genlayer.com/api";
}

/**
 * Get the contract address from environment variables
 */
export function getContractAddress(): string {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    // Return empty string during build, error will be shown in UI during runtime
    return "";
  }
  return address;
}

/**
 * Get the current account from localStorage (client-side only)
 */
export function getCurrentAccount(): Account | null {
  if (typeof window === "undefined") return null;

  try {
    const privateKey = localStorage.getItem(STORAGE_KEY);
    if (!privateKey) return null;
    return createGenLayerAccount(privateKey as `0x${string}`);
  } catch (error) {
    console.error("Error getting current account:", error);
    return null;
  }
}

/**
 * Get the current account's address
 */
export function getCurrentAddress(): string | null {
  const account = getCurrentAccount();
  return account?.address || null;
}

/**
 * Get the current account's private key
 */
export function getCurrentPrivateKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Create a new GenLayer account and store it in localStorage
 */
export function createAccount(): Account {
  if (typeof window === "undefined") {
    throw new Error("Cannot create account on server side");
  }

  const privateKey = generatePrivateKey();
  localStorage.setItem(STORAGE_KEY, privateKey);
  return createGenLayerAccount(privateKey as `0x${string}`);
}

/**
 * Import an account from a private key
 */
export function importAccount(privateKey: string): Account {
  if (typeof window === "undefined") {
    throw new Error("Cannot import account on server side");
  }

  try {
    const account = createGenLayerAccount(privateKey as `0x${string}`);
    localStorage.setItem(STORAGE_KEY, privateKey);
    return account;
  } catch (error) {
    throw new Error("Invalid private key");
  }
}

/**
 * Remove the current account from localStorage
 */
export function removeAccount(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if an account exists
 */
export function hasAccount(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(STORAGE_KEY);
}

/**
 * Create a GenLayer client with the current account
 */
export function createGenLayerClient(customAccount?: Account | null) {
  const account = customAccount !== undefined ? customAccount : getCurrentAccount();

  const config: any = {
    chain: studionet,
  };

  if (account) {
    config.account = account;
  }

  return createClient(config);
}

/**
 * Get a client instance with the current account
 */
export function getClient() {
  return createGenLayerClient();
}
