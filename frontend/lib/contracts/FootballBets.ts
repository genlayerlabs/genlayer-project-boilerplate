import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "../genlayer/client";
import type { Bet, LeaderboardEntry } from "./types";

/**
 * FootballBets contract class for interacting with the GenLayer Football Betting contract
 */
class FootballBets {
  private contractAddress: `0x${string}`;
  private client: any;

  constructor(contractAddress: string, address?: string | null) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: GENLAYER_CHAIN,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    this.client = createClient(config);
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    const config: any = {
      chain: GENLAYER_CHAIN,
      account: address as `0x${string}`,
    };

    this.client = createClient(config);
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
        return Array.from(bets.entries()).flatMap(([owner, betMap]) => {
          return Array.from((betMap as any).entries()).map(
            ([id, betData]: any) => {
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
            }
          );
        });
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

}

export default FootballBets;
