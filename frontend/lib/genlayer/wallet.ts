"use client";

import { useState, useEffect, useCallback } from "react";
import type { Account } from "./client";
import {
  getCurrentAccount,
  getCurrentAddress,
  getCurrentPrivateKey,
  createAccount as createNewAccount,
  importAccount as importExistingAccount,
  removeAccount as deleteAccount,
  hasAccount as checkHasAccount,
} from "./client";

export interface WalletState {
  account: Account | null;
  address: string | null;
  privateKey: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

/**
 * Custom hook for managing GenLayer wallet state
 * Provides methods for creating, importing, and removing accounts
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    account: null,
    address: null,
    privateKey: null,
    isConnected: false,
    isLoading: true,
  });

  // Load account on mount
  useEffect(() => {
    const loadAccount = () => {
      try {
        const account = getCurrentAccount();
        const address = getCurrentAddress();
        const privateKey = getCurrentPrivateKey();

        setState({
          account,
          address,
          privateKey,
          isConnected: !!account,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading account:", error);
        setState({
          account: null,
          address: null,
          privateKey: null,
          isConnected: false,
          isLoading: false,
        });
      }
    };

    loadAccount();
  }, []);

  /**
   * Create a new account
   */
  const createAccount = useCallback(() => {
    try {
      const account = createNewAccount();
      const address = account.address;
      const privateKey = getCurrentPrivateKey();

      setState({
        account,
        address,
        privateKey,
        isConnected: true,
        isLoading: false,
      });

      return account;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }, []);

  /**
   * Import an existing account from private key
   */
  const importAccount = useCallback((privateKey: string) => {
    try {
      const account = importExistingAccount(privateKey);
      const address = account.address;

      setState({
        account,
        address,
        privateKey,
        isConnected: true,
        isLoading: false,
      });

      return account;
    } catch (error) {
      console.error("Error importing account:", error);
      throw error;
    }
  }, []);

  /**
   * Remove/disconnect the current account
   */
  const disconnectAccount = useCallback(() => {
    try {
      deleteAccount();
      setState({
        account: null,
        address: null,
        privateKey: null,
        isConnected: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      throw error;
    }
  }, []);

  /**
   * Check if account exists
   */
  const hasAccount = useCallback(() => {
    return checkHasAccount();
  }, []);

  return {
    ...state,
    createAccount,
    importAccount,
    disconnectAccount,
    hasAccount,
  };
}

/**
 * Utility function to format address for display
 * @param address - The address to format
 * @param maxLength - Maximum length before truncation (default: 12)
 */
export function formatAddress(address: string | null, maxLength: number = 12): string {
  if (!address) return "";
  if (address.length <= maxLength) return address;

  const prefixLength = Math.floor((maxLength - 3) / 2);
  const suffixLength = Math.ceil((maxLength - 3) / 2);

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Utility function to copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Utility function to download text as a file
 */
export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
