"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { GENLAYER_CHAIN_ID } from "@/lib/wagmi/config";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  isOnCorrectNetwork: boolean;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => void;
  disconnectWallet: () => void;
  openAccountModal: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/**
 * WalletProvider component that wraps wagmi/RainbowKit hooks
 * Provides a simplified interface for wallet interactions
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();

  const isLoading = isConnecting || isReconnecting;
  const isOnCorrectNetwork = chainId === GENLAYER_CHAIN_ID;

  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const handleOpenAccountModal = () => {
    if (openAccountModal) {
      openAccountModal();
    }
  };

  const value: WalletContextValue = {
    address: address ?? null,
    chainId: chainId ?? null,
    isConnected,
    isLoading,
    isOnCorrectNetwork,
    connectWallet,
    disconnectWallet,
    openAccountModal: handleOpenAccountModal,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

/**
 * Custom hook to use wallet context
 * Must be used within a WalletProvider
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
