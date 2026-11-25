"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import FootballBets from "../contracts/FootballBets";
import { getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { configError } from "../utils/toast";
import type { Bet, LeaderboardEntry } from "../contracts/types";

/**
 * Hook to get the FootballBets contract instance
 *
 * Returns null if contract address is not configured.
 * The contract instance is recreated whenever the wallet address changes.
 * Read-only operations (getBets, getLeaderboard, etc.) work without a connected wallet.
 */
export function useFootballBetsContract(): FootballBets | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const contract = useMemo(() => {
    // Validate contract address is configured
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank")
        }
      );
      // Return null to indicate contract is not available
      return null;
    }

    // Contract instance is recreated when address changes to ensure
    // the genlayer-js client is properly configured with the current account
    return new FootballBets(contractAddress, address);
  }, [contractAddress, address]);

  return contract;
}

/**
 * Hook to fetch all bets
 * Refetches on window focus and after mutations
 * Returns empty array if contract is not configured
 */
export function useBets() {
  const contract = useFootballBetsContract();

  return useQuery<Bet[], Error>({
    queryKey: ["bets"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getBets();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract, // Only run query if contract is available
  });
}

/**
 * Hook to fetch player points
 * Refetches on window focus and after mutations
 * Returns 0 if contract is not configured
 */
export function usePlayerPoints(address: string | null) {
  const contract = useFootballBetsContract();

  return useQuery<number, Error>({
    queryKey: ["playerPoints", address],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve(0);
      }
      return contract.getPlayerPoints(address);
    },
    refetchOnWindowFocus: true,
    enabled: !!address && !!contract, // Require both address and contract
    staleTime: 2000,
  });
}

/**
 * Hook to fetch the leaderboard
 * Refetches on window focus and after mutations
 * Returns empty array if contract is not configured
 */
export function useLeaderboard() {
  const contract = useFootballBetsContract();

  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getLeaderboard();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract, // Only run query if contract is available
  });
}

export function useInvalidateBetsData() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["bets"] });
    queryClient.invalidateQueries({ queryKey: ["playerPoints"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }, [queryClient]);
}
