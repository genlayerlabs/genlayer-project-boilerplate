"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import FactChecker from "../contracts/FactChecker";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import type { FeePresetLevel } from "../genlayer/fees";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Claim } from "../contracts/types";

/**
 * Hook to get the FactChecker contract instance
 *
 * Returns null if contract address is not configured.
 * Recreated whenever the wallet address changes.
 */
export function useFactCheckerContract(): FactChecker | null {
  const { address } = useWallet();
  // Allow a separate contract address for FactChecker, fallback to default contract address
  const contractAddress =
    process.env.NEXT_PUBLIC_FACT_CHECKER_CONTRACT_ADDRESS ||
    getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "FactChecker Contract address not configured. Please set NEXT_PUBLIC_FACT_CHECKER_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }

    return new FactChecker(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

/**
 * Hook to fetch all claims
 */
export function useClaims() {
  const contract = useFactCheckerContract();

  return useQuery<Claim[], Error>({
    queryKey: ["claims"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getClaims();
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch a user's stake on a specific claim
 */
export function usePlayerStake(claimId: string, playerAddress: string | null) {
  const contract = useFactCheckerContract();

  return useQuery<{ trueStake: bigint; falseStake: bigint }, Error>({
    queryKey: ["playerStake", claimId, playerAddress],
    queryFn: async () => {
      if (!contract || !playerAddress) {
        return { trueStake: BigInt(0), falseStake: BigInt(0) };
      }
      const [trueStake, falseStake] = await Promise.all([
        contract.getPlayerTrueStake(claimId, playerAddress),
        contract.getPlayerFalseStake(claimId, playerAddress),
      ]);
      return { trueStake, falseStake };
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled: !!contract && !!playerAddress && !!claimId,
  });
}

/**
 * Hook to create a new claim with initial stake
 */
export function useCreateClaim() {
  const contract = useFactCheckerContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      claimText,
      sourceUrl,
      initialVote,
      stakeAmountWei,
      feePresetLevel,
    }: {
      claimText: string;
      sourceUrl: string;
      initialVote: boolean;
      stakeAmountWei: bigint;
      feePresetLevel?: FeePresetLevel;
    }) => {
      if (!contract) {
        throw new Error("Contract not configured. Please set NEXT_PUBLIC_FACT_CHECKER_CONTRACT_ADDRESS in your env.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to create a claim.");
      }
      setIsCreating(true);
      const feePreset = await contract.estimateCreateClaimFees(
        claimText,
        sourceUrl,
        initialVote,
        feePresetLevel ?? "standard"
      );
      return contract.createClaim(
        claimText,
        sourceUrl,
        initialVote,
        stakeAmountWei,
        feePreset
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setIsCreating(false);
      success("Claim created successfully!", {
        description: "Your prediction market claim has been registered.",
      });
    },
    onError: (err: any) => {
      console.error("Error creating claim:", err);
      setIsCreating(false);
      error("Failed to create claim", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createClaim: mutation.mutate,
    createClaimAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to place a stake on an unresolved claim
 */
export function usePlaceStake() {
  const contract = useFactCheckerContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isStaking, setIsStaking] = useState(false);
  const [stakingClaimId, setStakingClaimId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      claimId,
      vote,
      stakeAmountWei,
      feePresetLevel,
    }: {
      claimId: string;
      vote: boolean;
      stakeAmountWei: bigint;
      feePresetLevel?: FeePresetLevel;
    }) => {
      if (!contract) {
        throw new Error("Contract not configured.");
      }
      if (!address) {
        throw new Error("Wallet not connected.");
      }
      setIsStaking(true);
      setStakingClaimId(claimId);
      const feePreset = await contract.estimatePlaceStakeFees(
        claimId,
        vote,
        feePresetLevel ?? "standard"
      );
      return contract.placeStake(claimId, vote, stakeAmountWei, feePreset);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["playerStake", variables.claimId] });
      setIsStaking(false);
      setStakingClaimId(null);
      success("Stake placed successfully!", {
        description: "Your prediction vote has been added.",
      });
    },
    onError: (err: any) => {
      console.error("Error placing stake:", err);
      setIsStaking(false);
      setStakingClaimId(null);
      error("Failed to place stake", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isStaking,
    stakingClaimId,
    placeStake: mutation.mutate,
    placeStakeAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to resolve a claim using AI/web rendering
 */
export function useResolveClaim() {
  const contract = useFactCheckerContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingClaimId, setResolvingClaimId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (claimId: string) => {
      if (!contract) {
        throw new Error("Contract not configured.");
      }
      if (!address) {
        throw new Error("Wallet not connected.");
      }
      setIsResolving(true);
      setResolvingClaimId(claimId);
      const feePreset = await contract.estimateResolveClaimFees(claimId);
      return contract.resolveClaim(claimId, feePreset);
    },
    onSuccess: (_, claimId) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["playerStake", claimId] });
      setIsResolving(false);
      setResolvingClaimId(null);
      success("Claim resolved successfully!", {
        description: "The AI agent has verified the statement outcome.",
      });
    },
    onError: (err: any) => {
      console.error("Error resolving claim:", err);
      setIsResolving(false);
      setResolvingClaimId(null);
      error("Failed to resolve claim", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isResolving,
    resolvingClaimId,
    resolveClaim: mutation.mutate,
    resolveClaimAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to claim reward for a resolved claim
 */
export function useClaimReward() {
  const contract = useFactCheckerContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimingClaimId, setClaimingClaimId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (claimId: string) => {
      if (!contract) {
        throw new Error("Contract not configured.");
      }
      if (!address) {
        throw new Error("Wallet not connected.");
      }
      setIsClaiming(true);
      setClaimingClaimId(claimId);
      const feePreset = await contract.estimateClaimRewardFees(claimId);
      return contract.claimReward(claimId, feePreset);
    },
    onSuccess: (_, claimId) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["playerStake", claimId] });
      setIsClaiming(false);
      setClaimingClaimId(null);
      success("Reward claimed successfully!", {
        description: "Your funds have been transferred to your wallet.",
      });
    },
    onError: (err: any) => {
      console.error("Error claiming reward:", err);
      setIsClaiming(false);
      setClaimingClaimId(null);
      error("Failed to claim reward", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isClaiming,
    claimingClaimId,
    claimReward: mutation.mutate,
    claimRewardAsync: mutation.mutateAsync,
  };
}
