"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import FootballBets from "../contracts/FootballBets";
import { getContractAddress, getStudioUrl, getCurrentAccount } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import type { Bet, LeaderboardEntry } from "../contracts/types";

/**
 * Hook to get the FootballBets contract instance
 */
export function useFootballBetsContract() {
  const { account } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    return new FootballBets(contractAddress, account, studioUrl);
  }, [contractAddress, account, studioUrl]);

  return contract;
}

/**
 * Hook to fetch all bets
 * Refetches on window focus and after mutations
 */
export function useBets() {
  const contract = useFootballBetsContract();

  return useQuery<Bet[], Error>({
    queryKey: ["bets"],
    queryFn: () => contract.getBets(),
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });
}

/**
 * Hook to fetch player points
 * Refetches on window focus and after mutations
 */
export function usePlayerPoints(address: string | null) {
  const contract = useFootballBetsContract();

  return useQuery<number, Error>({
    queryKey: ["playerPoints", address],
    queryFn: () => contract.getPlayerPoints(address),
    refetchOnWindowFocus: true,
    enabled: !!address,
    staleTime: 2000,
  });
}

/**
 * Hook to fetch the leaderboard
 * Refetches on window focus and after mutations
 */
export function useLeaderboard() {
  const contract = useFootballBetsContract();

  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => contract.getLeaderboard(),
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });
}

/**
 * Hook to create a new bet
 */
export function useCreateBet() {
  const contract = useFootballBetsContract();
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
      setIsCreating(true);
      return contract.createBet(gameDate, team1, team2, predictedWinner);
    },
    onSuccess: () => {
      // Invalidate and refetch bets and points after successful creation
      queryClient.invalidateQueries({ queryKey: ["bets"] });
      queryClient.invalidateQueries({ queryKey: ["playerPoints"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsCreating(false);
    },
    onError: (error) => {
      console.error("Error creating bet:", error);
      setIsCreating(false);
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
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingBetId, setResolvingBetId] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (betId: number) => {
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
    },
    onError: (error) => {
      console.error("Error resolving bet:", error);
      setIsResolving(false);
      setResolvingBetId(null);
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
