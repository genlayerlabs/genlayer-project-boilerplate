import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Account } from "../genlayer/client";
import type { Bet, LeaderboardEntry, TransactionReceipt } from "./types";

/**
 * FootballBets contract class for interacting with the GenLayer Football Betting contract
 */
class FootballBets {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, account?: Account | null, studioUrl?: string) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (account) {
      config.account = account;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  /**
   * Update the account used for transactions
   */
  updateAccount(account: Account): void {
    this.client = createClient({
      chain: studionet,
      account,
    });
  }

  /**
   * Get all bets from the contract
   * @returns Array of bets with their details
   */
  async getBets(): Promise<Bet[]> {
    try {
      const bets: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_bets",
        args: [],
      });

      // Convert GenLayer Map structure to typed array
      if (bets instanceof Map) {
        return Array.from(bets.entries()).flatMap(
          ([owner, betMap]) => {
            return Array.from((betMap as any).entries()).map(([id, betData]: any) => {
              const betObj = Array.from((betData as any).entries()).reduce(
                (obj: any, [key, value]: any) => {
                  obj[key] = value;
                  return obj;
                },
                {} as Record<string, any>
              ) as Record<string, any>;

              return {
                id,
                ...betObj,
                owner,
              } as Bet;
            });
          }
        );
      }

      return [];
    } catch (error) {
      console.error("Error fetching bets:", error);
      throw new Error("Failed to fetch bets from contract");
    }
  }

  /**
   * Get points for a specific player
   * @param address - Player's address
   * @returns Number of points
   */
  async getPlayerPoints(address: string | null): Promise<number> {
    if (!address) {
      return 0;
    }

    try {
      const points = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_player_points",
        args: [address],
      });

      return Number(points) || 0;
    } catch (error) {
      console.error("Error fetching player points:", error);
      return 0;
    }
  }

  /**
   * Get the leaderboard with all players and their points
   * @returns Sorted array of leaderboard entries (highest to lowest)
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const points: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_points",
        args: [],
      });

      if (points instanceof Map) {
        return Array.from(points.entries())
          .map(([address, points]: any) => ({
            address,
            points: Number(points),
          }))
          .sort((a, b) => b.points - a.points);
      }

      return [];
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw new Error("Failed to fetch leaderboard from contract");
    }
  }

  /**
   * Create a new bet
   * @param gameDate - Date of the game
   * @param team1 - First team name
   * @param team2 - Second team name
   * @param predictedWinner - Predicted winner (team1 or team2)
   * @returns Transaction receipt
   */
  async createBet(
    gameDate: string,
    team1: string,
    team2: string,
    predictedWinner: string
  ): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_bet",
        args: [gameDate, team1, team2, predictedWinner],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "FINALIZED" as any,
        interval: 10000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating bet:", error);
      throw new Error("Failed to create bet");
    }
  }

  /**
   * Resolve a bet using AI-powered data fetching
   * @param betId - ID of the bet to resolve
   * @returns Transaction receipt
   */
  async resolveBet(betId: string | number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "resolve_bet",
        args: [betId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "FINALIZED" as any,
        interval: 10000,
        retries: 20,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error resolving bet:", error);
      throw new Error("Failed to resolve bet");
    }
  }
}

export default FootballBets;
