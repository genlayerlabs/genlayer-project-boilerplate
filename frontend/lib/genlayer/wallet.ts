"use client";

/**
 * Re-export wallet functionality from WalletProvider
 */
export { useWallet, WalletProvider } from "./WalletProvider";
export type { WalletState } from "./WalletProvider";

/**
 * Utility function to format address for display
 * @param address - The address to format
 * @param maxLength - Maximum length before truncation (default: 12)
 */
export function formatAddress(
  address: string | null,
  maxLength: number = 12
): string {
  if (!address) return "";
  if (address.length <= maxLength) return address;

  const prefixLength = Math.floor((maxLength - 3) / 2);
  const suffixLength = Math.ceil((maxLength - 3) / 2);

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}
