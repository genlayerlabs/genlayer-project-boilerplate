import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Claim, TransactionReceipt } from "./types";
import {
  estimateWriteFeePreset,
  feePresetToTransactionFees,
  type FeePresetEstimate,
  type FeePresetLevel,
} from "../genlayer/fees";

/**
 * FactChecker contract class for interacting with the GenLayer AI Fact-Checker prediction contract
 */
class FactChecker {
  private contractAddress: `0x${string}`;
  private client: any;
  private studioUrl?: string;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.studioUrl = studioUrl;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };

    if (this.studioUrl) {
      config.endpoint = this.studioUrl;
    }

    this.client = createClient(config);
  }

  async estimateCreateClaimFees(
    claimText: string,
    sourceUrl: string,
    initialVote: boolean,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName: "create_claim",
        args: [claimText, sourceUrl, initialVote],
      },
      level
    );
  }

  async estimatePlaceStakeFees(
    claimId: string,
    vote: boolean,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName: "place_stake",
        args: [BigInt(claimId), vote],
      },
      level
    );
  }

  async estimateResolveClaimFees(
    claimId: string,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName: "resolve_claim",
        args: [BigInt(claimId)],
      },
      level
    );
  }

  async estimateClaimRewardFees(
    claimId: string,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName: "claim_reward",
        args: [BigInt(claimId)],
      },
      level
    );
  }

  /**
   * Fetch all claims from the contract
   */
  async getClaims(): Promise<Claim[]> {
    try {
      // 1. Get the claims count
      const countBig: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_claims_count",
        args: [],
      });

      const count = Number(countBig) || 0;
      const claims: Claim[] = [];

      // 2. Fetch each claim individually
      for (let i = 1; i <= count; i++) {
        try {
          const claimData: any = await this.client.readContract({
            address: this.contractAddress,
            functionName: "get_claim",
            args: [BigInt(i)],
          });

          // In GenLayer, user-defined dataclasses are returned either as a Map or an Array.
          // Let's parse it safely depending on structure
          let parsedClaim: Partial<Claim> = {};
          if (claimData instanceof Map) {
            parsedClaim = Array.from(claimData.entries()).reduce(
              (obj: any, [key, value]: any) => {
                obj[key] = value;
                return obj;
              },
              {} as Record<string, any>
            );
          } else if (Array.isArray(claimData)) {
            // Fallback for array positional matching
            parsedClaim = {
              id: claimData[0]?.toString(),
              claim_text: claimData[1],
              source_url: claimData[2],
              is_resolved: claimData[3],
              outcome: claimData[4],
              total_true_stake: claimData[5]?.toString(),
              total_false_stake: claimData[6]?.toString(),
            };
          } else if (typeof claimData === "object" && claimData !== null) {
            parsedClaim = {
              id: claimData.id?.toString(),
              claim_text: claimData.claim_text,
              source_url: claimData.source_url,
              is_resolved: claimData.is_resolved,
              outcome: claimData.outcome,
              total_true_stake: claimData.total_true_stake?.toString(),
              total_false_stake: claimData.total_false_stake?.toString(),
            };
          }

          claims.push({
            id: parsedClaim.id?.toString() || i.toString(),
            claim_text: parsedClaim.claim_text || "",
            source_url: parsedClaim.source_url || "",
            is_resolved: !!parsedClaim.is_resolved,
            outcome: !!parsedClaim.outcome,
            total_true_stake: parsedClaim.total_true_stake?.toString() || "0",
            total_false_stake: parsedClaim.total_false_stake?.toString() || "0",
          });
        } catch (err) {
          console.error(`Error fetching claim ${i}:`, err);
        }
      }

      return claims;
    } catch (error) {
      console.error("Error fetching claims count:", error);
      return [];
    }
  }

  /**
   * Create a new claim with initial stake
   */
  async createClaim(
    claimText: string,
    sourceUrl: string,
    initialVote: boolean,
    stakeAmountWei: bigint,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      const fees = feePresetToTransactionFees(feePreset);
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_claim",
        args: [claimText, sourceUrl, initialVote],
        value: stakeAmountWei,
        ...(fees ? { fees } : {}),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating claim:", error);
      throw new Error("Failed to create claim");
    }
  }

  /**
   * Place stake on an unresolved claim
   */
  async placeStake(
    claimId: string,
    vote: boolean,
    stakeAmountWei: bigint,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      const fees = feePresetToTransactionFees(feePreset);
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "place_stake",
        args: [BigInt(claimId), vote],
        value: stakeAmountWei,
        ...(fees ? { fees } : {}),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error placing stake:", error);
      throw new Error("Failed to place stake");
    }
  }

  /**
   * Trigger AI consensus resolution on a claim
   */
  async resolveClaim(
    claimId: string,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      const fees = feePresetToTransactionFees(feePreset);
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "resolve_claim",
        args: [BigInt(claimId)],
        value: BigInt(0),
        ...(fees ? { fees } : {}),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error resolving claim:", error);
      throw new Error("Failed to resolve claim");
    }
  }

  /**
   * Claim reward for winning stakes (or reclaim for losing stakes if no winning stakes exist)
   */
  async claimReward(
    claimId: string,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      const fees = feePresetToTransactionFees(feePreset);
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "claim_reward",
        args: [BigInt(claimId)],
        value: BigInt(0),
        ...(fees ? { fees } : {}),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error claiming reward:", error);
      throw new Error("Failed to claim reward");
    }
  }

  /**
   * Get total True stake for a player on a claim
   */
  async getPlayerTrueStake(claimId: string, playerAddress: string): Promise<bigint> {
    try {
      const val = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_true_stake",
        args: [BigInt(claimId), playerAddress],
      });
      return BigInt(val?.toString() || "0");
    } catch (error) {
      console.error("Error fetching player true stake:", error);
      return BigInt(0);
    }
  }

  /**
   * Get total False stake for a player on a claim
   */
  async getPlayerFalseStake(claimId: string, playerAddress: string): Promise<bigint> {
    try {
      const val = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_false_stake",
        args: [BigInt(claimId), playerAddress],
      });
      return BigInt(val?.toString() || "0");
    } catch (error) {
      console.error("Error fetching player false stake:", error);
      return BigInt(0);
    }
  }
}

export default FactChecker;
