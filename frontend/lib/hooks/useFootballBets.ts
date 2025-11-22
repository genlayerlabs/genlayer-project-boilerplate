"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import FootballBets from "../contracts/FootballBets";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Bet, LeaderboardEntry } from "../contracts/types";

/**
 * Hook to get the FootballBets contract instance
 *
 * Returns null if contract address is not configured.
 * The contract instance is recreated whenever the wallet address changes.
 * Read-only operations (getBets, getLeaderboard, etc.) work without a connected wallet.
 * Write operations (createBet, resolveBet) require a connected wallet and will fail
 * if the address is null. Defensive validation is added in the mutation hooks.
 */
export function useFootballBetsContract(): FootballBets | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

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
    return new FootballBets(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

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

/**
 * Hook to create a new bet
 */
export function useCreateBet() {
  const contract = useFootballBetsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      gameDate,
      team1,
      team2,
      predictedWinner,
    }: {
      gameDate: string;
      team1: string;
      team2: string;
      predictedWinner: string;
    }) => {
      if (!contract) {
        throw new Error("Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to create a bet.");
      }
      setIsCreating(true);
      return contract.createBet(gameDate, team1, team2, predictedWinner);
    },
    onSuccess: () => {
      // Invalidate and refetch bets and points after successful creation
      queryClient.invalidateQueries({ queryKey: ["bets"] });
      queryClient.invalidateQueries({ queryKey: ["playerPoints"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsCreating(false);
      success("Bet created successfully!", {
        description: "Your prediction has been recorded on the blockchain."
      });
    },
    onError: (err: any) => {
      console.error("Error creating bet:", err);
      setIsCreating(false);
      error("Failed to create bet", {
        description: err?.message || "Please try again."
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createBet: mutation.mutate,
    createBetAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to resolve a bet
 */
export function useResolveBet() {
  const contract = useFootballBetsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingBetId, setResolvingBetId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (betId: string) => {
      if (!contract) {
        throw new Error("Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to resolve a bet.");
      }
      setIsResolving(true);
      setResolvingBetId(betId);
      return contract.resolveBet(betId);
    },
    onSuccess: () => {
      // Invalidate and refetch all data after successful resolution
      queryClient.invalidateQueries({ queryKey: ["bets"] });
      queryClient.invalidateQueries({ queryKey: ["playerPoints"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsResolving(false);
      setResolvingBetId(null);
      success("Bet resolved successfully!", {
        description: "The winner has been determined."
      });
    },
    onError: (err: any) => {
      console.error("Error resolving bet:", err);
      setIsResolving(false);
      setResolvingBetId(null);
      error("Failed to resolve bet", {
        description: err?.message || "Please try again."
      });
    },
  });

  return {
    ...mutation,
    isResolving,
    resolvingBetId,
    resolveBet: mutation.mutate,
    resolveBetAsync: mutation.mutateAsync,
  };
}
