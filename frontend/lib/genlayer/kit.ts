"use client";

import { useMemo } from "react";
import { createTransactionKit, type TransactionKit } from "@genlayer/transaction-kit";
import { studionet } from "genlayer-js/chains";
import { getEthereumProvider } from "./client";

export function useTransactionKit(address: string | null): TransactionKit | null {
  return useMemo(() => {
    const provider = getEthereumProvider();

    if (!provider || !address?.startsWith("0x")) {
      return null;
    }

    return createTransactionKit({
      chain: studionet,
      provider,
      account: address as `0x${string}`,
    });
  }, [address]);
}
